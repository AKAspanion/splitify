import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { BalancesLoader } from "./balances-loader";
import { Suspense } from "react";
import { ExpenseListLoader } from "./expenses-list";

const ExpensesList = dynamic(() => import("./expenses-list"), {
  loading: () => <ExpenseListLoader />,
});

const Balances = dynamic(() => import("./balances"), {
  loading: () => <BalancesLoader />,
});

const Totals = dynamic(() => import("./totals"), {
  loading: () => (
    <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-6 w-[180px]" />
          <Skeleton className="h-6 w-[90px]" />
        </div>
      ))}
    </div>
  ),
});

const ExpensesTabs = ({
  id,
  tab,
  page,
  backUrl,
}: {
  id: string;
  tab: string;
  page: number;
  backUrl: string;
}) => {
  const keyString = `page=${page}`;
  return (
    <>
      <Tabs defaultValue={tab} className="w-full pb-6">
        <TabsList className="w-full">
          <TabsTrigger value={"Expenses"} className="w-full">
            Expenses
          </TabsTrigger>
          <TabsTrigger value={"Balances"} className="w-full">
            Balances
          </TabsTrigger>
          <TabsTrigger value={"Totals"} className="w-full">
            Totals
          </TabsTrigger>
        </TabsList>
        <TabsContent value={"Expenses"}>
          <Suspense key={keyString} fallback={<ExpenseListLoader />}>
            <ExpensesList
              key={keyString}
              page={page}
              groupId={id}
              backUrl={backUrl}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value={"Balances"}>
          <div className="py-6">
            <Balances id={id} />
          </div>
        </TabsContent>
        <TabsContent value={"Totals"}>
          <Totals id={id} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ExpensesTabs;
