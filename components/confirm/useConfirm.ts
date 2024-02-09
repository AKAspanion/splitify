import { useCallback, useContext } from "react";
import { ConfirmContext } from "./ConfirmContext";

const useConfirm = (): {
  getConfirmation: (options: {
    title?: string;
    subtitle?: string;
    showDismiss?: boolean;
  }) => Promise<boolean>;
} => {
  const { openDialog } = useContext(ConfirmContext);

  const getConfirmation = useCallback(({ ...options }) => {
    return new Promise<boolean>((res) => {
      openDialog &&
        openDialog({
          actionCallback: res,
          title: options.title,
          subtitle: options.subtitle,
          showDismiss: options.showDismiss,
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { getConfirmation };
};

export default useConfirm;
