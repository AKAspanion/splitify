"use client";

import { DarkModeToggle } from "@/components/theme/dark-mode-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import OneSignal from "react-onesignal";
import {
  ClerkLoaded,
  ClerkLoading,
  UserProfile,
  useClerk,
} from "@clerk/nextjs";
import { ArrowLeftIcon, Bell, BellDot, FingerprintIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ProfilePage = () => {
  const { signOut } = useClerk();
  const router = useRouter();
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
      OneSignal.Notifications.permissionNative,
    ])
      .then(([isSubscribed, optedIn, lol]) => {
        setIsOptedIn(!!optedIn);
      })
      .catch((e) => {
        console.error("Issue determining subscription status", e);
      });
  }

  const handleSubscribe = (set: boolean) => {
    if (set) {
      OneSignal.Notifications.requestPermission()
        .then((v) => {
          OneSignal.User.PushSubscription.optIn().then(() => {
            console.log("Opted in");
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      OneSignal.Notifications.requestPermission()
        .then((v) => {
          OneSignal.User.PushSubscription.optOut().then(() => {
            console.log("Opted out");
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
    <div className="flex items-start justify-center md:max-w-screen-2xl mx-auto">
      <div className="w-full px-0 pt-6 flex flex-col items-center gap-6 overflow-x-hidden -mb-12">
        <ClerkLoading>
          <div className="w-full flex flex-col gap-6 px-8">
            <div className="w-full flex gap-4 justify-between">
              <Skeleton className="w-10 h-10 rounded-md" />
              <div className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-md" />
                <Skeleton className="w-[88px] h-10 rounded-md" />
              </div>
            </div>
            <div className="w-full flex gap-4 justify-end">
              <Skeleton className="w-[135px] h-10 rounded-md" />
            </div>
            <hr />
            <Skeleton className="w-16 h-6" />
            <div className="w-full flex flex-col gap-4">
              <Skeleton className="w-[135px] h-12" />
              <Skeleton className="w-[200px] h-5" />
            </div>
            <Skeleton className="w-16 h-8" />
            <hr />
            <Skeleton className="w-[200px] h-5" />
            <Skeleton className="w-[200px] h-5" />
            <Skeleton className="w-[200px] h-5" />
            <Skeleton className="w-[200px] h-5" />
            <Skeleton className="w-[200px] h-5" />
            <Skeleton className="w-[200px] h-5" />
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <div className="w-full px-8 md:px-12 sticky top-0 flex items-center justify-between gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeftIcon />
              <span className="sr-only">Back</span>
            </Button>
            <div className="flex-1" />
            <DarkModeToggle />
            <Button
              variant="secondary"
              onClick={() => signOut(() => router.push("/"))}
            >
              Sign out
            </Button>
          </div>

          <div className="w-full">
            <div className="w-full px-8 md:px-12 flex gap-6 justify-end items-center">
              <Link href="/webauthn/register">
                <Button>
                  <FingerprintIcon />
                  <div>Biometrics</div>
                </Button>
              </Link>

              <Button
                disabled={isDenied}
                onClick={() => handleSubscribe(!isOptedIn)}
              >
                <Bell />
                {isDenied ? (
                  <div>You have blocked notifications</div>
                ) : (
                  <div>Turn {!isOptedIn ? "on" : "off"} notifications</div>
                )}
              </Button>
            </div>
          </div>
          <div className="w-full">
            <hr />
            <div className="w-full pt-6 h-[calc(100vh-153px)] overflow-y-auto overflow-x-hidden">
              <UserProfile
                appearance={{
                  elements: {
                    rootBox: {
                      padding: "0px 20px 24px 24px",
                      boxShadow: "none",
                      width: "100vw",
                    },
                    card: {
                      width: "100%",
                      maxWidth: "100%",
                      boxShadow: "none",
                      background: "transparent",
                    },
                    navbar: {
                      border: "none",
                    },
                    pageScrollBox: {
                      padding: "0px 12px 24px 6px",
                    },
                  },
                }}
              />
            </div>
          </div>
        </ClerkLoaded>
      </div>
    </div>
  );
};

export default ProfilePage;
