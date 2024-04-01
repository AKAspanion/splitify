import { useActivityStore } from "@/store/activity-provider";
import { useMemo } from "react";

const useActivities = () => {
  const {
    addActivities,
    pageLoading,
    page: pageStore,
    count: countStore,
    activities: activitiesStore,
  } = useActivityStore((s) => s);

  const activities = useMemo(() => {
    return activitiesStore || [];
  }, [activitiesStore]);

  const count = useMemo(() => {
    return countStore;
  }, [countStore]);

  const page = useMemo(() => {
    return pageStore || 1;
  }, [pageStore]);

  const loading = useMemo(() => {
    return pageLoading || false;
  }, [pageLoading]);

  return { count, page, loading, activities, addActivities };
};

export default useActivities;
