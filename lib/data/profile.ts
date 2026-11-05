import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getMe } from "@dataconnect/app";
import { dc, FRESH, queryKeys } from "./client";

export type Me = {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
};

/** The signed-in person's own row, or `null` when it hasn't been written yet. */
export function useMe(): UseQueryResult<Me | null, Error> {
  return useQuery({
    queryKey: queryKeys.GetMe(),
    queryFn: async () => {
      const { data } = await getMe(dc(), FRESH);
      if (!data.user) return null;
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || null,
        imageUrl: data.user.imageUrl ?? null,
      };
    },
  });
}
