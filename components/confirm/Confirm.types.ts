export declare type ConfirmProps = {
  open: boolean;
  title?: string;
  subtitle?: string;
  showDismiss?: boolean;
  onConfirm: (v: boolean) => void;
  onDismiss: (v: boolean) => void;
};

export declare type OpenDialogType = {
  title?: string;
  subtitle?: string;
  showDismiss?: boolean;
  actionCallback?: (v: boolean) => void;
};

export declare type ConfirmContextType = {
  openDialog?: (a: OpenDialogType) => void;
};
