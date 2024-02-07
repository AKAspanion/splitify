import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";

const FriendsPage = async () => {
  return (
    <AutoContainer
      header={
        <div className="flex w-full justify-between items-center">
          <div className="font-semibold text-lg">Friends</div>
          <div className="flex gap-4">
            <Link href="/friends/add">
              <Button variant="ghost" size="icon">
                <UserPlusIcon />
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      FriendsPage
    </AutoContainer>
  );
};

export default FriendsPage;
