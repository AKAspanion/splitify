import { ACTION_PATH } from "@/lib/auth/action-link";

/** The action page's path without its trailing slash, so a pathname matches with or without one. */
const ACTION_PAGE = ACTION_PATH.replace(/\/$/, "");

/** False for pages whose URL can carry a one-time code (`/auth/action`, with or without its trailing slash). */
export function adsAllowedOn(pathname: string): boolean {
  return !(pathname === ACTION_PAGE || pathname.startsWith(ACTION_PAGE + "/"));
}
