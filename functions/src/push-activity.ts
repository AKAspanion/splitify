import { getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";
import { getMessaging } from "firebase-admin/messaging";
import { onMutationExecuted } from "firebase-functions/dataconnect";
import * as logger from "firebase-functions/logger";
import {
  activityText,
  type ActivityForText,
  type ActivityType,
  type PushText,
} from "./activity-text";

const REGION = "asia-south1";
const SERVICE = "splitify";
const ADMIN_APP = "push-activity";

/** Every FCM call gives up after this long. */
const FCM_DEADLINE_MS = 10_000;
/** `sendEachForMulticast` takes at most this many tokens. */
const MULTICAST_LIMIT = 500;
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

/** Mutations whose activity row is pushed: SQL Connect cannot filter a trigger on a list, so handlers check. */
const APP_OPERATIONS = new Set([
  "CreateGroup",
  "UpdateGroup",
  "AddGroupMember",
  "AddFriend",
  "UpdateExpense",
  "DeleteExpense",
]);
const EXPENSE_OPERATIONS = new Set(["CreateExpense", "CreateSettlement"]);

export type Messaging = {
  sendEachForMulticast(message: {
    tokens: string[];
    notification: { title: string; body: string };
    webpush: { fcmOptions: { link: string } };
    data: Record<string, string>;
  }): Promise<{ responses: { success: boolean; error?: { code: string } }[] }>;
};

type PushResult = { sent: number; removed: number };

function adminApp(): App {
  return getApps().some((a) => a.name === ADMIN_APP)
    ? getApp(ADMIN_APP)
    : initializeApp({}, ADMIN_APP);
}

// Only `admin` connector access runs here: it bypasses `@auth`, so every read below is keyed by what the
// trigger's event carries (the caller's uid and the activity id), never by anything else.
function adminConnector() {
  return getDataConnect(
    { serviceId: SERVICE, location: REGION, connector: "admin" },
    adminApp(),
  );
}

/** The class of an error, for logs: never its message, which can hold a token or a message's text. */
function causeClass(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string"
      ? `${error.constructor.name}:${code}`
      : error.constructor.name;
  }
  return typeof error;
}

/** SQL Connect returns a UUID as 32 hex digits: the app's routes use the dashed form. */
function dashed(id: string | null): string | null {
  if (id === null) return null;
  return /^[0-9a-f]{32}$/i.test(id)
    ? `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
    : id;
}

type UserRow = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
};

function displayName(user: UserRow | null): string | null {
  if (!user) return null;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return user.name || full || null;
}

const USER_FIELDS = "id name firstName lastName";

type ActivityRow = {
  type: ActivityType;
  title: string;
  amount: number | null;
  groupId: string | null;
  expenseId: string | null;
  actor: UserRow;
  subject: UserRow | null;
  group: { mute: boolean; members: { userId: string }[] } | null;
};

async function readActivity(activityId: string): Promise<ActivityRow | null> {
  const result = await adminConnector().executeGraphql<
    { activity: ActivityRow | null },
    { id: string }
  >(
    `query ($id: UUID!) {
      activity(key: { id: $id }) {
        type title amount groupId expenseId
        actor { ${USER_FIELDS} }
        subject { ${USER_FIELDS} }
        group { mute members: groupMembers_on_group { userId } }
      }
    }`,
    { variables: { id: activityId } },
  );
  return result.data.activity;
}

async function readUser(id: string): Promise<UserRow | null> {
  const result = await adminConnector().executeGraphql<
    { user: UserRow | null },
    { id: string }
  >(`query ($id: String!) { user(key: { id: $id }) { ${USER_FIELDS} } }`, {
    variables: { id },
  });
  return result.data.user;
}

async function listTokens(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const result = await adminConnector().executeQuery<
    { pushTokens: { token: string }[] },
    { userIds: string[] }
  >("ListPushTokens", { userIds });
  return [...new Set(result.data.pushTokens.map((t) => t.token))];
}

async function deleteTokens(tokens: string[]): Promise<number> {
  if (tokens.length === 0) return 0;
  try {
    await adminConnector().executeMutation("DeletePushTokens", { tokens });
    return tokens.length;
  } catch (error) {
    logger.error("push token cleanup failed", {
      operation: "DeletePushTokens",
      count: tokens.length,
      cause: causeClass(error),
    });
    return 0;
  }
}

function withDeadline<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("FCM deadline exceeded")), ms);
  });
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}

/**
 * Sends `text` to every token, 500 at a time, and deletes the tokens FCM says are dead. A failure or a call past the
 * deadline is logged (operation, activity type and token count only) and ends the sending: it never throws, and a
 * push already sent is not retried.
 */
async function sendToTokens(
  tokens: string[],
  text: PushText,
  type: ActivityType,
  operation: string,
  messaging: Messaging,
  deadlineMs: number,
): Promise<PushResult> {
  let sent = 0;
  const dead: string[] = [];
  for (let i = 0; i < tokens.length; i += MULTICAST_LIMIT) {
    const chunk = tokens.slice(i, i + MULTICAST_LIMIT);
    try {
      const batch = await withDeadline(
        messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title: text.title, body: text.body },
          webpush: { fcmOptions: { link: text.link } },
          data: { type, link: text.link },
        }),
        deadlineMs,
      );
      batch.responses.forEach((response, index) => {
        if (response.success) sent += 1;
        else if (response.error && DEAD_TOKEN_CODES.has(response.error.code))
          dead.push(chunk[index]);
      });
    } catch (error) {
      logger.error("push send failed", {
        operation,
        activityType: type,
        count: chunk.length,
        cause: causeClass(error),
      });
      break;
    }
  }
  return { sent, removed: await deleteTokens(dead) };
}

/**
 * Pushes the activity a mutation just recorded to the group's members, or the friend it names, never to the actor.
 * Stops unless the activity's actor is `authId`, so a caller can only push for a change that is theirs.
 */
export async function pushForActivity(
  activityId: string,
  authId: string,
  messaging: Messaging,
  deadlineMs: number = FCM_DEADLINE_MS,
): Promise<
  PushResult & { skipped?: "actor-mismatch" | "muted" | "no-recipients" }
> {
  const activity = await readActivity(activityId);
  if (!activity || activity.actor.id !== authId)
    return { sent: 0, removed: 0, skipped: "actor-mismatch" };
  if (activity.group?.mute) return { sent: 0, removed: 0, skipped: "muted" };

  const candidates = activity.group
    ? activity.group.members.map((m) => m.userId)
    : activity.subject
      ? [activity.subject.id]
      : [];
  const recipients = [...new Set(candidates)].filter((id) => id !== authId);
  const tokens = await listTokens(recipients);
  if (tokens.length === 0)
    return { sent: 0, removed: 0, skipped: "no-recipients" };

  const forText: ActivityForText = {
    type: activity.type,
    title: activity.title,
    amount: activity.amount,
    groupId: dashed(activity.groupId),
    expenseId: dashed(activity.expenseId),
    actorId: activity.actor.id,
    subjectId: activity.subject?.id ?? null,
  };
  const text = activityText(forText, {
    actor: displayName(activity.actor),
    subject: displayName(activity.subject),
  });
  return sendToTokens(
    tokens,
    text,
    activity.type,
    "sendActivityPush",
    messaging,
    deadlineMs,
  );
}

/** Pushes "deleted group" to the members `DeleteGroup` returned, except the person who deleted it. */
export async function pushForDeletedGroup(
  title: string,
  memberIds: string[],
  authId: string,
  messaging: Messaging,
  deadlineMs: number = FCM_DEADLINE_MS,
): Promise<PushResult> {
  const recipients = [...new Set(memberIds)].filter((id) => id !== authId);
  const tokens = await listTokens(recipients);
  if (tokens.length === 0) return { sent: 0, removed: 0 };

  const text = activityText(
    {
      type: "GROUP_MINUS",
      title,
      amount: null,
      groupId: null,
      expenseId: null,
      actorId: authId,
      subjectId: null,
    },
    { actor: displayName(await readUser(authId)), subject: null },
  );
  return sendToTokens(
    tokens,
    text,
    "GROUP_MINUS",
    "sendGroupDeletedPush",
    messaging,
    deadlineMs,
  );
}

type EventLike = {
  authId?: string;
  params: unknown;
  data: { payload: { variables: unknown; data: unknown; errors?: unknown[] } };
};

/** The trigger body for the mutations that record an activity. Never throws: a failure is logged and dropped. */
function activityHandler(operations: Set<string>) {
  return async (event: EventLike) => {
    const operation = (event.params as Record<string, string>).operation;
    if (!operations.has(operation) || !event.authId) return;
    const payload = event.data.payload;
    if (payload.errors?.length) return;
    const activityId = (payload.variables as { activityId?: unknown } | null)
      ?.activityId;
    if (typeof activityId !== "string") return;
    try {
      const result = await pushForActivity(
        activityId,
        event.authId,
        getMessaging(adminApp()),
      );
      logger.info("sendActivityPush finished", { operation, ...result });
    } catch (error) {
      logger.error("sendActivityPush failed", {
        operation,
        cause: causeClass(error),
      });
    }
  };
}

export const sendActivityPushApp = onMutationExecuted(
  {
    service: SERVICE,
    connector: "app",
    operation: "{operation}",
    region: REGION,
  },
  activityHandler(APP_OPERATIONS),
);

export const sendActivityPushExpense = onMutationExecuted(
  {
    service: SERVICE,
    connector: "expense",
    operation: "{operation}",
    region: REGION,
  },
  activityHandler(EXPENSE_OPERATIONS),
);

type DeleteGroupData = {
  query?: {
    group?: { title?: string } | null;
    memberIds?: { userId: string }[];
  };
};

export const sendGroupDeletedPush = onMutationExecuted(
  {
    service: SERVICE,
    connector: "app",
    operation: "DeleteGroup",
    region: REGION,
  },
  async (event) => {
    const payload = event.data.payload;
    if (!event.authId || payload.errors?.length) return;
    const returned = (payload.data as DeleteGroupData | null)?.query;
    const title = returned?.group?.title;
    if (typeof title !== "string" || !returned?.memberIds) return;
    try {
      const result = await pushForDeletedGroup(
        title,
        returned.memberIds.map((m) => m.userId),
        event.authId,
        getMessaging(adminApp()),
      );
      logger.info("sendGroupDeletedPush finished", {
        operation: "DeleteGroup",
        ...result,
      });
    } catch (error) {
      logger.error("sendGroupDeletedPush failed", {
        operation: "DeleteGroup",
        cause: causeClass(error),
      });
    }
  },
);
