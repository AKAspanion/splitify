import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { GroupCard } from "../../../_components/group-card";

const SharedGroups = async ({ id }: { id: string }) => {
  const { userId } = auth();
  const groups = await db.group.findMany({
    where: {
      AND: [
        { users: { some: { id: id || "null" } } },
        { users: { some: { id: userId || "null" } } },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const noData = !groups || groups?.length === 0;

  return noData ? null : (
    <div>
      <div className="font-semibold text-normal pb-3">Shared groups</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups?.map((g) => <GroupCard group={g} key={g.id} compact />)}
      </div>
    </div>
  );
};

export default SharedGroups;
