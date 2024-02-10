import { Suspense } from "react";
import { AddExpenseFab } from "../_components/add-expense-fab";
import { ScreenSkeleton } from "../_components/screen-skeleton";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<ScreenSkeleton />}>{children}</Suspense>
      <Suspense>
        <AddExpenseFab />
      </Suspense>
    </>
  );
}
