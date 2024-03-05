import { Suspense } from "react";
import { AddExpenseFab } from "../_components/add-expense-fab";
import { Skeleton } from "@/components/ui/skeleton";

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
        {children}
      </Suspense>
      <Suspense>
        <AddExpenseFab />
      </Suspense>
    </>
  );
}
