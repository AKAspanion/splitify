import { Suspense } from "react";
import { AddExpenseFab } from "../_components/add-expense-fab";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupStoreProvider } from "@/lib/store/group-provider";
import { ExpenseStoreProvider } from "@/lib/store/expense-provider";
import { ActivityStoreProvider } from "@/lib/store/activity-provider";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense
        fallback={
          <Skeleton className="rounded-md h-[100px] w-[calc(100vw-48px)] m-6" />
        }
      >
        <GroupStoreProvider>
          <ExpenseStoreProvider>
            <ActivityStoreProvider>{children}</ActivityStoreProvider>
          </ExpenseStoreProvider>
        </GroupStoreProvider>
      </Suspense>
      <Suspense>
        <AddExpenseFab />
      </Suspense>
    </>
  );
}
