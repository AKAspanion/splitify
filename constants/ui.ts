import {
  Clapperboard,
  Heart,
  Home,
  LucideIcon,
  NotepadText,
  PlaneTakeoff,
  Receipt,
  ReceiptIndianRupee,
  ReceiptText,
  Star,
  Store,
  Train,
  Utensils,
} from "lucide-react";

export const GROUP_TYPES = ["trip", "home", "couple", "other"] as const;

export type GroupType = (typeof GROUP_TYPES)[number];

export const GROUP_CATEGORY_ICONS: Record<GroupType, LucideIcon> = {
  ["trip"]: PlaneTakeoff,
  ["home"]: Home,
  ["couple"]: Heart,
  ["other"]: NotepadText,
};

export const EXPENSE_CATEGORY_TYPES = [
  "entertainment",
  "food & drink",
  "home",
  "lifestyle",
  "transportation",
  "utilities",
  "general",
] as const;

export type ExpenseCategoryType = (typeof EXPENSE_CATEGORY_TYPES)[number];

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategoryType, LucideIcon> = {
  ["entertainment"]: Clapperboard,
  ["food & drink"]: Utensils,
  ["home"]: Home,
  ["lifestyle"]: Star,
  ["transportation"]: Train,
  ["utilities"]: Store,
  ["general"]: ReceiptText,
};

export const RUPPEE_SYMBOL = "₹";
