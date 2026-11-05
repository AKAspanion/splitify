"use client";
import useConfirm from "@/components/confirm/useConfirm";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { toUserMessage } from "@/lib/data/errors";
import { useDeleteExpense, type ExpenseDetail } from "@/lib/data/expenses";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ExpenseActions = ({ expense }: { expense: ExpenseDetail }) => {
  const { getConfirmation } = useConfirm();
  const router = useRouter();
  const remove = useDeleteExpense();

  const handleDelete = async () => {
    const confirm = await getConfirmation({
      title: "Delete expense?",
      subtitle:
        "This will remove expense for ALL people involved, not just you.",
    });

    if (!confirm) {
      return;
    }

    try {
      await remove.mutateAsync({ id: expense.id, groupId: expense.groupId });
    } catch (error) {
      toast.error(toUserMessage(error));
      return;
    }
    toast.success("Expense deleted successfully");
    router.push(`/groups/${expense.groupId}`);
  };

  return (
    <Button
      disabled={remove.isPending}
      variant="ghost"
      size="icon"
      aria-label="Delete expense"
      onClick={handleDelete}
    >
      <div className="text-red-500">
        {remove.isPending ? <Spinner size="sm" /> : <TrashIcon width={20} />}
      </div>
    </Button>
  );
};

export default ExpenseActions;
