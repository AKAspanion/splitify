import { ACTION_PATH } from "@/lib/auth/action-link";

/** The action page's path without its trailing slash, so a pathname matches with or without one. */
const ACTION_PAGE = ACTION_PATH.replace(/\/$/, "");

/** False for pages whose URL can carry a one-time code (`/auth/action`, with or without its trailing slash). */
export function adsAllowedOn(pathname: string): boolean {
  return !(pathname === ACTION_PAGE || pathname.startsWith(ACTION_PAGE + "/"));
}

/**
 * False when either the page the document first loaded or the page it is on now can carry a one-time code. A
 * document that arrived with a code keeps it in its navigation entry (`performance`) after a client-side navigation
 * away, so it never gets the ad script, wherever it goes.
 */
export function adsAllowedFor(firstPath: string, currentPath: string): boolean {
  return adsAllowedOn(firstPath) && adsAllowedOn(currentPath);
}
