"use client";
import useConfirm from "@/components/confirm/useConfirm";
import { ListItem } from "@/components/list-item";
import { OnlineOnly } from "@/components/offline/online-only";
import Spinner from "@/components/ui/spinner";
import { toUserMessage } from "@/lib/data/errors";
import { useDeleteGroup } from "@/lib/data/groups";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const GroupDelete = ({ id }: { id?: string }) => {
  const { getConfirmation } = useConfirm();
  const router = useRouter();
  const { mutate, isPending } = useDeleteGroup();

  const handleDelete = async () => {
    const confirm = await getConfirmation({
      title: "Delete group?",
      subtitle: "This will remove group for ALL people involved, not just you.",
    });

    if (!confirm || !id) {
      return;
    }

    mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Group deleted successfully");
          router.push(`/groups`);
        },
        onError: (error) => toast.error(toUserMessage(error)),
      },
    );
  };

  return !id ? null : isPending ? (
    <div className="text-red-500">
      <ListItem title="Deleting group" icon={<Spinner />} />
    </div>
  ) : (
    <OnlineOnly>
      {(offline) => (
        <div
          className={
            offline
              ? "text-red-500 opacity-50 cursor-not-allowed"
              : "text-red-500 cursor-pointer"
          }
          role="button"
          aria-disabled={offline}
          onClick={offline ? undefined : handleDelete}
        >
          <ListItem title="Delete group" icon={<TrashIcon width={20} />} />
        </div>
      )}
    </OnlineOnly>
  );
};

export default GroupDelete;
