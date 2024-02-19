import { ExpenseType, User } from "@prisma/client";

export type SplitDrawerProps = {
  users?: User[];
  total?: number;
  disabled?: boolean;
  currUserId?: string;
  equalSplit?: Record<string, boolean>;
  onEqualSplitChange?: (value: Record<string, boolean>) => void;
  exactSplit?: Record<string, number>;
  onExactSplitChange?: (value: Record<string, number>) => void;
  splitType: ExpenseType;
  onSplitTypeChange: (value: ExpenseType) => void;
};
