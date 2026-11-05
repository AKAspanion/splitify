"use client";

import { Suspense } from "react";
import { UISpinner } from "@/components/ui-spinner";
import SettleExpense from "./settle-expense";

const SettlePage = () => (
  <Suspense fallback={<UISpinner />}>
    <SettleExpense />
  </Suspense>
);

export default SettlePage;
