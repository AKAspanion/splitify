"use client";

import { Suspense } from "react";
import ExpenseFormLoading from "@/app/(platform)/(app)/_components/expense-form-loading";
import EditExpense from "./edit-expense";

const EditExpenseFormPage = () => (
  <Suspense fallback={<ExpenseFormLoading />}>
    <EditExpense />
  </Suspense>
);

export default EditExpenseFormPage;
