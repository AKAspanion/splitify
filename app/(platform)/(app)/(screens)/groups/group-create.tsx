import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NoData } from "@/components/no-data";
import { UserRoundPlusIcon } from "lucide-react";

export default async function GroupCreate({
  show,
  where,
  searchText,
}: {
  where: any;
  show: boolean;
  searchText: string;
}) {
  const count = await db.group.count({ where });
  const noData = count === 0;

  const showAll = !show && count > 6;

  const noDataTitle = searchText
    ? "No results found"
    : "Groups you create or are added to will show up here";

  return noData ? (
    <NoData title={noDataTitle} action={<CreateButton />} />
  ) : (
    <div className="w-full flex flex-col gap-6 items-center py-8">
      {showAll ? (
        <Link href="/groups?show=all">
          <Button type="button" variant={"secondary"}>
            <div>Show all {count} groups</div>
          </Button>
        </Link>
      ) : (
        <CreateButton />
      )}
    </div>
  );
}

const CreateButton = () => {
  return (
    <Link href="/groups/add">
      <Button type="button" variant={"outline"}>
        <div className="flex gap-4 items-center">
          <div>Create a group</div>
          <UserRoundPlusIcon />
        </div>
      </Button>
    </Link>
  );
};
