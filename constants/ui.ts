export const GROUP_TYPES = ["Trip", "Home", "Couple", "Other"] as const;

export type GroupType = (typeof GROUP_TYPES)[number];

export const EXPENSE_CATEGORY_TYPES = [
  "Games",
  "Movies",
  "Music",
  "Other",
] as const;

export type ExpenseCategoryType = (typeof GROUP_TYPES)[number];


export const RUPPEE_SYMBOL = "₹";