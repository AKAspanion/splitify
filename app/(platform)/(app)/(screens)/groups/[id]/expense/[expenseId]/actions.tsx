"use client";
import { deleteExpense } from "@/actions/delete-expense";
import useConfirm from "@/components/confirm/useConfirm";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { useAction } from "@/hooks/use-action";
import { NotificationService } from "@/lib/notification/service";
import { ExpenseWithUserWithPaymentWithSplit } from "@/types/shared";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const Actions = ({
  expense,
}: {
  expense: ExpenseWithUserWithPaymentWithSplit | null;
}) => {
  const { getConfirmation } = useConfirm();
  const router = useRouter();
  const { execute, loading } = useAction(deleteExpense, {
    onSuccess: ({ userId, groupId, expenseDesc }) => {
      toast.success("Expense deleted successfully");
      NotificationService.deleteExpense(userId, expenseDesc, groupId);
      router.push(`/groups/${groupId}`);
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });
  const handleDelete = async () => {
    const confirm = await getConfirmation({
      title: "Delete expense?",
      subtitle:
        "This will remove expense for ALL people involved, not just you.",
    });

    if (!confirm) {
      return;
    }

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
        <div className="text-red-500">
          {loading ? <Spinner size="sm" /> : <TrashIcon width={20} />}
        </div>
      </Button>
    </>
  ) : null;
};
