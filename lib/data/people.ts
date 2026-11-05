"use client";

// Friends and contacts over SQL Connect: the friend list, one friend, the groups you share with them, the
// email search, and adding a friend or a contact. The caller is always the signed-in user (the connector reads
// auth.uid), so nothing here passes a user id for "me".
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  addFriend,
  createContact,
  getFriend,
  listFriends,
  listGroupMembers,
  listMyGroups,
  searchUserByEmail,
  updateContact,
  type AddFriendVariables,
  type GetFriendData,
  type ListMyGroupsData,
} from "@dataconnect/app";
import "@/lib/zod-config";
import { z } from "zod";
import { dc, FRESH, queryKeys } from "./client";

export type Friend = NonNullable<GetFriendData["friendship"]>["friend"];
export type GroupSummary = ListMyGroupsData["groups"][number];
export type FoundUser = {
  id: string;
  name: string | null;
  imageUrl: string | null;
  email: string;
};

/** The form of an email as it is searched and stored: trimmed and lower-cased. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A contact's id: `spuser_` plus a random id made in the browser (the connector requires the prefix). */
export function contactId(): string {
  return `spuser_${crypto.randomUUID().replaceAll("-", "")}`;
}

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Minimum 3 chars required")
    .max(100, "Maximum 100 chars allowed"),
  email: z
    .string()
    .transform(normaliseEmail)
    .pipe(
      z.email("Please enter valid email").max(254, "Please enter valid email"),
    ),
});

export type ContactFieldErrors = { name?: string; email?: string };

/** Checks a contact form's values; returns the values to store, or the message for each field that is wrong. */
export function validateContact(input: {
  name: string;
  email: string;
}):
  | { ok: true; value: { name: string; email: string } }
  | { ok: false; errors: ContactFieldErrors } {
  const parsed = contactSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  const errors: ContactFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if ((field === "name" || field === "email") && !errors[field])
      errors[field] = issue.message;
  }
  return { ok: false, errors };
}

/** A person with no picture: a grey disc, as a data URI so no request is made. */
export const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#9ca3af"/><circle cx="20" cy="16" r="7" fill="#f3f4f6"/><path d="M6 40c2-10 8-13 14-13s12 3 14 13z" fill="#f3f4f6"/></svg>',
  );

/** A path with the given query values, left out when empty, encoded so an email's `+` survives. */
export function peopleHref(
  path: string,
  query: Record<string, string | null | undefined> = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value) params.set(key, value);
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

/** Shapes a friend like the `User` the shared `UserCard` reads. */
export function toCardUser(friend: {
  id: string;
  name?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  signedUp?: boolean;
}) {
  return {
    id: friend.id,
    name: friend.name ?? null,
    email: friend.email ?? "",
    profile_image_url: friend.imageUrl || DEFAULT_AVATAR,
    fromClerk: friend.signedUp ?? true,
  };
}

export function useFriends(): UseQueryResult<Friend[]> {
  return useQuery({
    queryKey: queryKeys.ListFriends!(),
    queryFn: async () => {
      const { data } = await listFriends(dc(), undefined, FRESH);
      return data.friendships.map((f) => f.friend);
    },
  });
}

export function useFriend(
  friendId: string | null,
): UseQueryResult<Friend | null> {
  return useQuery({
    queryKey: queryKeys.GetFriend!({ id: friendId }),
    enabled: friendId !== null,
    queryFn: async () => {
      const { data } = await getFriend(dc(), { id: friendId as string }, FRESH);
      return data.friendship?.friend ?? null;
    },
  });
}

/** The groups both you and the friend are in: your groups, kept when the friend is one of the members. */
export function useSharedGroups(
  friendId: string | null,
): UseQueryResult<GroupSummary[]> {
  return useQuery({
    queryKey: queryKeys.ListMyGroups!({ sharedWith: friendId }),
    enabled: friendId !== null,
    queryFn: async () => {
      const { data } = await listMyGroups(dc(), undefined, FRESH);
      const members = await Promise.all(
        data.groups.map((g) =>
          listGroupMembers(dc(), { groupId: g.id }, FRESH),
        ),
      );
      return data.groups.filter((_, i) =>
        members[i]!.data.groupMembers.some((m) => m.user.id === friendId),
      );
    },
  });
}

/** Finds a signed-up person by exact email; `null` when nobody has it. Idle while the email is empty. */
export function useSearchUser(email: string): UseQueryResult<FoundUser | null> {
  const normalised = normaliseEmail(email);
  return useQuery({
    queryKey: queryKeys.SearchUserByEmail!({ email: normalised }),
    enabled: normalised !== "",
    queryFn: async () => {
      const { data } = await searchUserByEmail(
        dc(),
        { email: normalised },
        FRESH,
      );
      const user = data.users[0];
      return user
        ? {
            id: user.id,
            name: user.name ?? null,
            imageUrl: user.imageUrl ?? null,
            email: normalised,
          }
        : null;
    },
  });
}

/** The variables for `AddFriend`: `withGroup` always says whether a group is set, as the connector requires. */
export function addFriendVariables(input: {
  friendId: string;
  groupId?: string | null;
}): AddFriendVariables {
  const withGroup = input.groupId != null;
  return {
    friendId: input.friendId,
    ...(withGroup ? { groupId: input.groupId } : {}),
    withGroup,
    activityId: crypto.randomUUID(),
  };
}

export async function addFriendRequest(input: {
  friendId: string;
  groupId?: string | null;
}): Promise<void> {
  await addFriend(dc(), addFriendVariables(input));
}

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return (...names: string[]) =>
    Promise.all(
      names.map((name) => queryClient.invalidateQueries({ queryKey: [name] })),
    );
};

export function useAddFriend(): UseMutationResult<
  void,
  Error,
  { friendId: string; groupId?: string | null }
> {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: addFriendRequest,
    onSuccess: () =>
      invalidate(
        "ListFriends",
        "GetFriend",
        "ListMyGroups",
        "ListGroupMembers",
        "ListMyActivity",
      ),
  });
}

export function useCreateContact(): UseMutationResult<
  { id: string },
  Error,
  { name: string; email: string }
> {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ name, email }) => {
      const id = contactId();
      await createContact(dc(), {
        id,
        name: name.trim(),
        email: normaliseEmail(email),
      });
      return { id };
    },
    onSuccess: () => invalidate("ListFriends", "SearchUserByEmail"),
  });
}

export function useUpdateContact(): UseMutationResult<
  void,
  Error,
  { id: string; name: string; email: string }
> {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, name, email }) => {
      await updateContact(dc(), {
        id,
        name: name.trim(),
        email: normaliseEmail(email),
      });
    },
    onSuccess: () => invalidate("ListFriends", "GetFriend"),
  });
}
