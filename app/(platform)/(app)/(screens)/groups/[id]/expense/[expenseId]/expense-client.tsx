"use client";

import type { ExpenseDetail } from "@/lib/data/expenses";
import { BanknoteIcon } from "lucide-react";

const ExpenseClient = ({ expense }: { expense: ExpenseDetail }) => {
  return expense.tag === "SETTLEMENT" ? (
    <div className="flex items-center gap-6">
      <BanknoteIcon className="w-10 h-10 text-green-500" />
      <div>{expense.description}</div>
    </div>
  ) : null;
};

export default ExpenseClient;
