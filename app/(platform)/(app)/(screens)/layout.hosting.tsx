import { Suspense } from "react";
import { AddExpenseFab } from "../_components/add-expense-fab";

// The hosting build's screens layout: the stores of the Clerk build's layout are not used (screens read SQL Connect
// through TanStack Query), so it only adds the "Add Expense" button the screens share.
export default function ScreensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Suspense>
        <AddExpenseFab />
      </Suspense>
    </>
  );
}
