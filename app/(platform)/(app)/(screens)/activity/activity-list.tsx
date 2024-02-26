import { AutoContainer } from "@/components/container/auto-container";
import { auth } from "@clerk/nextjs";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";

const ActivityList = async (props: ServerSideComponentProp) => {
  return (
    <AutoContainer header={<Header title={"Activity"} />}>
      <NoData title="Coming soon.." />
    </AutoContainer>
  );
};

export default ActivityList;
