"use client";

import { formateDate, relativeFormatDate } from "@/utils/date";

type ExpenseDateProps = {
  date: Date;
};

export const ExpenseDate = (props: ExpenseDateProps) => {
  const date = props.date ? new Date(props.date).toString() : "";
  return <>{relativeFormatDate(date)}</>;
};
