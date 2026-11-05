// The group and friend searches are regular-expression matches on the server, so text typed by a person is
// capped and escaped first, and can only ever match itself.

const MAX_SEARCH_LENGTH = 100;

export function escapeSearch(text: string): string {
  return text
    .slice(0, MAX_SEARCH_LENGTH)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
