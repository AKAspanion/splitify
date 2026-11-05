"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

const FriendsPaginate = ({
  page,
  count,
  total,
}: {
  page: number;
  count: number;
  total: number;
}) => {
  return total > count ? (
    <div className="flex w-full items-center justify-center">
      <Link href={`/friends?page=${page + 1}`}>
        <Button type="button" variant={"secondary"}>
          <div>Show more</div>
        </Button>
      </Link>
    </div>
  ) : null;
};

export default FriendsPaginate;
