import { db } from "@/lib/db";

/** The name an action quotes in its activity and pushes: first name, then name, or "" when there is neither. */
export async function getActorName(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { firstName: true, name: true },
  });
  return user?.firstName || user?.name || "";
}
