"use client";

import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";

export default function NotificationAction() {
  const [permission, setPermission] = useState("");
  const [isOptedIn, setIsOptedIn] = useState(false);

  const isDenied = permission === "denied";

  function notifyStatus() {
    const Notification = window.Notification;

    setPermission(Notification.permission);

    let was_questioned = false;
    if (Notification.permission == "default") {
      was_questioned = true;
    }

    Notification.requestPermission(function (permission) {
      if (was_questioned) {
        setPermission(permission);
      }
      if ("permissions" in navigator) {
        navigator.permissions
          .query({ name: "notifications" })
          .then(function (notificationPerm) {
            notificationPerm.onchange = function () {
              setPermission(notificationPerm.state);
            };
          });
      }
    });
  }

  function getUserInfo() {
    Promise.all([
      OneSignal.Notifications.permission,
      OneSignal.User.PushSubscription.optedIn,
    ])
      .then(([isSubscribed, optedIn]) => {
        setIsOptedIn(!!optedIn);
      })
      .catch((e) => {
        console.error("Issue determining subscription status", e);
      });
  }

  const handleSubscribe = (set: boolean) => {
    if (set) {
      OneSignal.Notifications.requestPermission()
        .then(() => {
          OneSignal.User.PushSubscription.optIn().then(() => {
            //
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      OneSignal.Notifications.requestPermission()
        .then(() => {
          OneSignal.User.PushSubscription.optOut().then(() => {
            //
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  useEffect(() => {
    getUserInfo();
    notifyStatus();

    const statusChange = (v: any) => {
      setIsOptedIn(v?.current?.optedIn as boolean);
    };

    OneSignal.User.PushSubscription.addEventListener("change", statusChange);
    return () => {
      OneSignal.User.PushSubscription.removeEventListener(
        "change",
        statusChange,
      );
    };
  }, []);

  return (
    <>
      <Button disabled={isDenied} onClick={() => handleSubscribe(!isOptedIn)}>
        {isOptedIn ? <Bell /> : <BellOff />}
        {isDenied ? (
          <div>blocked</div>
        ) : (
          <div>Turn {!isOptedIn ? "on " : "off"}</div>
        )}
      </Button>
    </>
  );
}
