import { ConfirmProps } from "./Confirm.types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
const Confirm: React.FC<ConfirmProps> = ({
  title,
  subtitle,
  open,
  showDismiss,
  onDismiss,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onDismiss}>
      <DialogContent className="max-w-[90vw] min-w-[90vw] sm:min-w-fit w-fit">
        <DialogHeader>
          <DialogTitle>
            <div className="py-1">{title}</div>
          </DialogTitle>
          {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          {showDismiss ? (
            <Button
              variant="secondary"
              type="button"
              onClick={() => onDismiss && onDismiss(false)}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            title=""
            type="button"
            onClick={() => onConfirm && onConfirm(true)}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Confirm;
