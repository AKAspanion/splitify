import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const ExpensesList = dynamic(() => import("./expenses-list"), {
  loading: () => (
    <div className="pt-6">
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
  loading: () => (
    <div className="pt-6">
      <div className="flex gap-6 justify-between">
        <Skeleton className="h-6 mb-3 w-[90px]" />
        <Skeleton className="h-6 mb-3 w-[60px]" />
      </div>
      <div className="pb-8 grid grid-cols-1 gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-5 mt-1 w-[180px]" />
        ))}
      </div>
    </div>
  ),
});

const ExpensesTabs = ({ id }: { id: string }) => {
  return (
    <>
      <Tabs defaultValue="Expenses" className="w-full py-6">
        <TabsList className="w-full">
          <TabsTrigger value={"Expenses"} className="w-full">
            Expenses
          </TabsTrigger>
          <TabsTrigger value={"Balances"} className="w-full">
            Balances
          </TabsTrigger>
          {/* <TabsTrigger value={"Totals"} className="w-full">
            Totals
          </TabsTrigger> */}
        </TabsList>
        <TabsContent value={"Expenses"}>
          <ExpensesList id={id} />
        </TabsContent>
        <TabsContent value={"Balances"}>
          <Balances id={id} />
        </TabsContent>
        {/* <TabsContent value={"Totals"}>
          Totals
        </TabsContent> */}
      </Tabs>
    </>
  );
};

export default ExpensesTabs;
