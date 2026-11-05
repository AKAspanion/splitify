"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export const UPDATE_MESSAGE = "A new version of Splitify is ready.";

/** Asks the waiting worker to take over, and reloads once it controls the page (once: the event can fire again). */
function reloadOnNewWorker(waiting: ServiceWorker) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  waiting.postMessage({ type: "SKIP_WAITING" });
}

/** Shows a toast with "Reload" when a new service worker is waiting. Renders nothing itself. */
export function UpdateToast() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let shown = false;
    const announce = (waiting: ServiceWorker | null) => {
      // No controller means this is the first worker, not an update: nothing to reload for.
      if (!waiting || !navigator.serviceWorker.controller || shown) return;
      shown = true;
      toast(UPDATE_MESSAGE, {
        duration: Infinity,
        action: { label: "Reload", onClick: () => reloadOnNewWorker(waiting) },
      });
    };
    const watch = (registration: ServiceWorkerRegistration) => {
      announce(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed") announce(registration.waiting);
        });
      });
    };
    let cancelled = false;
    // `ready` waits for the page's own registration (made in `Launch`, which may run after this effect).
    navigator.serviceWorker.ready.then((registration) => {
      if (!cancelled) watch(registration);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
