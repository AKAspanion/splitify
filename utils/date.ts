import { format, formatRelative } from "date-fns";

export const relativeDate = (date: string) => {
  try {
    return formatRelative(indiaDate(date), indiaDate(new Date()));
  } catch (error) {
    return "";
  }
};

export const relativeFormatDate = (date: string) => {
  try {
    return formatRelative(date, new Date());
  } catch (error) {
    return "";
  }
};

export const indiaDate = (date: string | number | Date) => {
  try {
    return new Date(date).toLocaleString(undefined, {
      timeZone: "Asia/Kolkata",
    });
  } catch (error) {
    return "";
  }
};

export const formateDate = (
  date: string | number | Date,
  formatStr: string,
) => {
  try {
    return format(date, formatStr);
  } catch (error) {
    return "";
  }
};
