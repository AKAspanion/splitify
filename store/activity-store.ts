import { Activity } from "@prisma/client";
import { createStore } from "zustand/vanilla";
// import { persist, createJSONStorage } from "zustand/middleware";
import { getActivities } from "@/actions/get-activities";

export type ActivityState = {
  activities: Activity[];
  pageLoading: boolean;
  page: number;
  count: number | undefined;
};

export type ActivityActions = {
  addActivities: () => void;
  clearActivities: () => void;
  // setPage: (groupId: string, val: number) => void;
};

export type ActivityStore = ActivityState & ActivityActions;

export const defaultInitState: ActivityState = {
  activities: [],
  pageLoading: false,
  page: 0,
  count: Infinity,
};

export const createActivityStore = (
  propState: Partial<ActivityState> = defaultInitState,
) => {
  const initState = { ...defaultInitState, ...propState };
  return createStore<ActivityStore>()(
    // persist(
    (set, get) => ({
      ...initState,
      addActivities: async () => {
        const page = get().page || 0;
        const tCount = get().count;
        const totalCount = tCount === undefined ? Infinity : tCount;
        const activitiesCount = get().activities?.length || 0;

        console.log({ activitiesCount, totalCount });

        const canLoad = activitiesCount < totalCount;
        if (!canLoad) {
          return;
        }
        set(() => ({ pageLoading: true }));

        const nextPage = page + 1;
        const { data, error } = await getActivities(nextPage);
        if (!error) {
          set((state) => ({
            page: nextPage,
            count: data?.count,
            activities: [
              ...(state?.activities || []),
              ...(data?.activities || []),
            ],
          }));
        }
        set(() => ({ pageLoading: false }));
      },
      clearActivities: () => set(() => ({ activities: [] })),
      // setPage: (grp, v) =>
      //   set((state) => ({
      //     activities: { ...(state?.page || {}), [grp]: v },
      //   })),
    }),
    //   {
    //     name: "activity-storage",
    //     storage: createJSONStorage(() => sessionStorage),
    //   },
    // ),
  );
};
