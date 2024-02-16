"use client";
import { deleteExpense } from "@/actions/delete-expense";
import { FullExpense } from "@/app/(platform)/(app)/_components/expense-card";
import useConfirm from "@/components/confirm/useConfirm";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { useAction } from "@/hooks/use-action";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const Actions = ({ expense }: { expense: FullExpense }) => {
  const { getConfirmation } = useConfirm();
  const router = useRouter();
  const { execute, loading } = useAction(deleteExpense, {
    onSuccess: (data) => {
      toast.success("Expense deleted successfully");
      router.push(`/groups/${data?.groupId}`);
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
