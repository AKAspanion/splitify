"use client";
import useConfirm from "@/components/confirm/useConfirm";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { OFFLINE_NEEDS_CONNECTION } from "@/components/offline/online-only";
import { useOnline } from "@/hooks/use-online";
import { toUserMessage } from "@/lib/data/errors";
import { useDeleteExpense, type ExpenseDetail } from "@/lib/data/expenses";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ExpenseActions = ({ expense }: { expense: ExpenseDetail }) => {
  const { getConfirmation } = useConfirm();
  const router = useRouter();
  const remove = useDeleteExpense();
  const online = useOnline();

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
    <div className="relative">
      <Button
        disabled={remove.isPending || !online}
        variant="ghost"
        size="icon"
        aria-label="Delete expense"
        onClick={handleDelete}
      >
        <div className="text-red-500">
          {remove.isPending ? <Spinner size="sm" /> : <TrashIcon width={20} />}
        </div>
      </Button>
      {!online && (
        <p
          role="status"
          className="absolute right-0 top-full z-10 mt-1 w-max max-w-[14rem] rounded-md border bg-popover px-2 py-1 text-xs text-muted-foreground shadow-sm"
        >
          {OFFLINE_NEEDS_CONNECTION}
        </p>
      )}
    </div>
  );
};

export default ExpenseActions;
