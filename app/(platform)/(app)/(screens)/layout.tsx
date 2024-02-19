import { Suspense } from "react";
import { AddExpenseFab } from "../_components/add-expense-fab";
import { ScreenSkeleton } from "../_components/screen-skeleton";
import { UISpinner } from "@/components/ui-spinner";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<UISpinner />}>{children}</Suspense>
      <Suspense>
        <AddExpenseFab />
      </Suspense>
    </>
  );
}
