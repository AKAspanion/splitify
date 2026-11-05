"use client";

import { Suspense } from "react";
import ExpenseFormLoading from "@/app/(platform)/(app)/_components/expense-form-loading";
import AddExpense from "./add-expense";

const ExpenseFormPage = () => (
  <Suspense fallback={<ExpenseFormLoading add />}>
    <AddExpense />
  </Suspense>
);

export default ExpenseFormPage;
