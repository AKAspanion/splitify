"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Balances from "./balances";
import ExpensesList from "./expenses-list";
import Totals from "./totals";

const ExpensesTabs = ({
  id,
  tab,
  backUrl,
}: {
  id: string;
  tab: string;
  backUrl: string;
}) => {
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
