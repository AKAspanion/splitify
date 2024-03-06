import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { NoData } from "@/components/no-data";

const ActivityDetailsPage = () => {
  return (
    <AutoContainer
      header={<Header title="Activity Details" backTo="/activity" />}
    >
      <NoData title="Activity not found" />
    </AutoContainer>
  );
};

export default ActivityDetailsPage;
