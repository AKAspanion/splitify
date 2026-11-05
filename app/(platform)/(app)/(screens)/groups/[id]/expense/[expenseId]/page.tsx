"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ExpenseDetails from "./expense-details";

const ExpenseDetailsPage = () => (
  <Suspense
    fallback={
      <div className="flex flex-col gap-6 py-6 px-8">
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="w-[100px] h-8 rounded-md" />
          <div className="flex justify-between gap-4">
            <Skeleton className="w-10 h-10 rounded-md" />
            <Skeleton className="w-10 h-10 rounded-md" />
          </div>
        </div>
        <Skeleton className="w-[60px] h-6 mb-1" />
      </div>
    }
  >
    <ExpenseDetails />
  </Suspense>
);

export default ExpenseDetailsPage;
