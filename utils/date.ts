import { formatRelative } from "date-fns";

export const relativeDate = (date: string) => {
  return formatRelative(date, new Date());
};
