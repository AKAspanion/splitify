"use client";

import { relativeFormatDate } from "@/utils/date";

type ExpenseDateProps = {
  date: Date | string;
};

export const ExpenseDate = (props: ExpenseDateProps) => {
  const date = props.date ? new Date(props.date).toString() : "";
  return <>{relativeFormatDate(date)}</>;
};
