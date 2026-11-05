import Page from "./page";

export const metadata = { title: "Expense details" };

// Static export builds one placeholder page; firebase.json rewrites every id to it, and the screen reads the
// real ids from the address.
export const generateStaticParams = () => [{ id: "_", expenseId: "_" }];

export default function Hosted() {
  return <Page />;
}
