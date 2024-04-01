import {
  Clapperboard,
  Folders,
  Heart,
  Home,
  LucideIcon,
  NotepadText,
  PlaneTakeoff,
  ReceiptText,
  Star,
  Store,
  Ticket,
  Train,
  Utensils,
} from "lucide-react";

export const GROUP_TYPES = [
  "trip",
  "home",
  "couple",
  "project",
  "event",
  "other",
] as const;

export type GroupType = (typeof GROUP_TYPES)[number];

export const GROUP_CATEGORY_ICONS: Record<GroupType, LucideIcon> = {
  ["trip"]: PlaneTakeoff,
  ["home"]: Home,
  ["couple"]: Heart,
  ["project"]: Folders,
  ["event"]: Ticket,
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
