import { AutoContainer } from "@/components/container/auto-container";

const FriendsPage = async () => {
  return (
    <AutoContainer
      header={
        <div className="flex w-full justify-between items-center">
          <div className="font-semibold text-lg">Friends</div>
          <div className="flex gap-4"></div>
        </div>
      }
    >
      FriendsPage
    </AutoContainer>
  );
};

export default FriendsPage;
