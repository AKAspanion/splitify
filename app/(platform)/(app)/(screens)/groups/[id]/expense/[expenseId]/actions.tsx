"use client";
import { deleteExpense } from "@/actions/delete-expense";
import { FullExpense } from "@/app/(platform)/(app)/_components/expense-card";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const Actions = ({ expense }: { expense: FullExpense }) => {
  const router = useRouter();
  const { execute, loading } = useAction(deleteExpense, {
    onSuccess: (data) => {
      toast.success("Expense deleted successfully");
      router.push(`/groups/${data?.groupId}`);
    },
    onError: () => {
      toast.error("Failed to delete expense");
    },
  });
  const handleDelete = () => {
    if (expense?.id) {
      execute({ expenseId: expense?.id, groupId: expense?.groupId || "" });
    }
  };

  return expense ? (
    <>
      <Button
        disabled={loading}
        variant="ghost"
        size="icon"
        onClick={handleDelete}
      >
        <TrashIcon width={20} />
      </Button>
      <Button disabled variant="ghost" size="icon">
        <PencilIcon width={20} />
      </Button>
    </>
  ) : null;
};
