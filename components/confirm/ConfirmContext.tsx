import React, { useCallback } from "react";

import Confirm from "./Confirm";
import { ConfirmContextType, OpenDialogType } from "./Confirm.types";

export const ConfirmContext = React.createContext<ConfirmContextType>({});

const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState<OpenDialogType>({});

  const openDialog = useCallback(
    ({ title, subtitle, showDismiss, actionCallback }: OpenDialogType) => {
      setDialogOpen(true);
      setDialogConfig({
        title,
        subtitle,
        showDismiss,
        actionCallback,
      });
    },
    [],
  );

  const resetDialog = useCallback(() => {
    setDialogOpen(false);
    setDialogConfig({});
  }, []);

  const onConfirm = useCallback(() => {
    resetDialog();

    if (dialogConfig?.actionCallback) {
      dialogConfig.actionCallback(true);
    }
  }, [dialogConfig, resetDialog]);

  const onDismiss = useCallback(() => {
    resetDialog();

    if (dialogConfig?.actionCallback) {
      dialogConfig.actionCallback(false);
    }
  }, [dialogConfig, resetDialog]);

  return (
    <ConfirmContext.Provider value={{ openDialog }}>
      <Confirm
        open={dialogOpen}
        title={dialogConfig?.title}
        subtitle={dialogConfig?.subtitle}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
      {children}
    </ConfirmContext.Provider>
  );
};

export default ConfirmProvider;
