import {
  useInfiniteQuery,
  useQuery,
  type UseInfiniteQueryResult,
  type UseQueryResult,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  getActivity,
  listMyActivity,
  type ListMyActivityData,
} from "@dataconnect/app";
import { activityText } from "@/functions/src/activity-text";
import { dc, FRESH, queryKeys } from "./client";

export type ActivityItem = {
  id: string;
  type: Parameters<typeof activityText>[0]["type"];
  title: string;
  amount: number | null;
  expenseId: string | null;
  groupId: string | null;
  createdAt: string;
  actorId: string;
  actorName: string | null;
  subjectId: string | null;
  subjectName: string | null;
};

/** One page of the feed: `nextOffset` is where the next page starts, or `null` after the last one. */
export type ActivityPage = { items: ActivityItem[]; nextOffset: number | null };

/** The feed shows ten entries at a time. */
export const ACTIVITY_PAGE_SIZE = 10;
// A group's feed is the person's feed filtered here, so it reads the feed in larger chunks...
const GROUP_CHUNK_SIZE = 50;
// ...and gives up after this many chunks, so a quiet group never reads the whole feed in one go.
const GROUP_MAX_CHUNKS = 10;

type Row = ListMyActivityData["activities"][number];

const toItem = (row: Row): ActivityItem => ({
  id: row.id,
  type: row.type,
  title: row.title,
  amount: row.amount ?? null,
  expenseId: row.expenseId ?? null,
  groupId: row.groupId ?? null,
  createdAt: row.createdAt,
  actorId: row.actor.id,
  actorName: row.actor.name ?? null,
  subjectId: row.subject?.id ?? null,
  subjectName: row.subject?.name ?? null,
});

/** What the feed says for an activity, with "You" in place of the viewer's own name. */
export function activityLine(
  item: ActivityItem,
  viewerId: string,
): { title: string; body: string; link: string } {
  const text = activityText(item, {
    actor: item.actorId === viewerId ? "You" : item.actorName,
    subject: item.subjectId === viewerId ? "You" : item.subjectName,
  });
  if (item.subjectId === viewerId && item.type === "MEMBER_PLUS")
    return { ...text, body: `You were added to group "${item.title}"` };
  if (item.subjectId === viewerId && item.type === "MEMBER_MINUS")
    return { ...text, body: `You were removed from group "${item.title}"` };
  if (item.type === "USER" && item.actorId === viewerId)
    return {
      ...text,
      body: `You added ${item.subjectName ?? "someone"} as a friend`,
    };
  return text;
}

async function fetchMyPage(offset: number): Promise<ActivityPage> {
  const { data } = await listMyActivity(
    dc(),
    { limit: ACTIVITY_PAGE_SIZE, offset },
    FRESH,
  );
  const items = data.activities.map(toItem);
  return {
    items,
    nextOffset:
      items.length < ACTIVITY_PAGE_SIZE ? null : offset + ACTIVITY_PAGE_SIZE,
  };
}

/** A group's page: the feed from `offset`, keeping the entries of that group, until a page is full. */
export async function fetchGroupPage(
  groupId: string,
  offset: number,
  fetchChunk: (
    limit: number,
    offset: number,
  ) => Promise<ActivityItem[]> = async (limit, from) => {
    const { data } = await listMyActivity(dc(), { limit, offset: from }, FRESH);
    return data.activities.map(toItem);
  },
): Promise<ActivityPage> {
  // SQL Connect writes UUIDs without dashes; the address bar may carry either form.
  const same = (id: string | null) =>
    id !== null && id.replaceAll("-", "").toLowerCase() === wanted;
  const wanted = groupId.replaceAll("-", "").toLowerCase();
  const items: ActivityItem[] = [];
  let next = offset;
  for (let chunk = 0; chunk < GROUP_MAX_CHUNKS; chunk++) {
    const rows = await fetchChunk(GROUP_CHUNK_SIZE, next);
    for (let i = 0; i < rows.length; i++) {
      if (!same(rows[i].groupId)) continue;
      items.push(rows[i]);
      if (items.length === ACTIVITY_PAGE_SIZE)
        return { items, nextOffset: next + i + 1 };
    }
    next += rows.length;
    if (rows.length < GROUP_CHUNK_SIZE) return { items, nextOffset: null };
  }
  return { items, nextOffset: next };
}

const nextOffset = (last: ActivityPage) => last.nextOffset ?? undefined;

/** The signed-in person's feed, ten at a time. */
export function useMyActivity(): UseInfiniteQueryResult<
  InfiniteData<ActivityPage, number>,
  Error
> {
  return useInfiniteQuery({
    queryKey: queryKeys.ListMyActivity({ limit: ACTIVITY_PAGE_SIZE }),
    queryFn: ({ pageParam }) => fetchMyPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: nextOffset,
  });
}

/** One activity, or `null` when it doesn't exist or isn't the person's to see. */
export function useActivity(
  activityId: string | null,
): UseQueryResult<ActivityItem | null, Error> {
  return useQuery({
    queryKey: queryKeys.GetActivity({ id: activityId }),
    enabled: activityId !== null,
    queryFn: async () => {
      const { data } = await getActivity(
        dc(),
        { id: activityId as string },
        FRESH,
      );
      return data.activity ? toItem(data.activity as Row) : null;
    },
  });
}

/** Only one group's entries of the feed, ten at a time. */
export function useGroupActivity(
  groupId: string | null,
): UseInfiniteQueryResult<InfiniteData<ActivityPage, number>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.ListMyActivity({ groupId, limit: ACTIVITY_PAGE_SIZE }),
    enabled: groupId !== null,
    queryFn: ({ pageParam }) => fetchGroupPage(groupId as string, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextOffset,
  });
}
