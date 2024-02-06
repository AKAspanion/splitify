import { AddExpenseFab } from "../_components/add-expense-fab";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AddExpenseFab />
    </>
  );
}
