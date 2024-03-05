import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { BalancesLoader } from "./balances-loader";

const ExpensesList = dynamic(() => import("./expenses-list"), {
  loading: () => (
    <div className="py-6">
      <div className="pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="rounded-full w-10 h-10" />
            <div>
              <Skeleton className="h-4 mt-0.5 w-[90px]" />
              <Skeleton className="h-3 mt-1 w-[120px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
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

const ExpensesTabs = ({ id, backUrl }: { id: string; backUrl: string }) => {
  return (
    <>
      <Tabs defaultValue="Expenses" className="w-full pb-6">
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
          <ExpensesList groupId={id} backUrl={backUrl} />
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
