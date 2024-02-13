import { toast } from "sonner";

export const notification = <T>(options: {
  title: string;
  subtitle?: string;
  data?: T;
  onClick?: (n: Notification, e: Event) => void;
}) => {
  const { data, title, subtitle, onClick } = options;
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(title, {
      data,
      body: subtitle,
      icon: "/images/logo-96x96.png",
      badge: "/images/logo-96x96.png",
    });

    notification.onclick = function (ev: Event) {
      onClick && onClick(this, ev);
    };
  }
};

export const successToast = (msg: string, notify = true) => {
  toast.success(msg);
  if (notify) {
    notification({ title: msg });
  }
};

export const errorToast = (msg: string, notify = true) => {
  toast.error(msg);
  if (notify) {
    notification({ title: msg });
  }
};

export const infoToast = (msg: string, notify = true) => {
  toast.info(msg);
  if (notify) {
    notification({ title: msg });
  }
};

export const warningToast = (msg: string, notify = true) => {
  toast.warning(msg);
  if (notify) {
    notification({ title: msg });
  }
};
