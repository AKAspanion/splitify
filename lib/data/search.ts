// The group and friend searches are regular-expression matches on the server, so text typed by a person is
// escaped first, and can only ever match itself.

/** The server's bound on a search, checked on the escaped text (`vars.search.size() <= 100` in dataconnect/app). */
const MAX_SEARCH_LENGTH = 100;

const REGEX_CHARACTER = /[.*+?^${}()|[\]\\]/;

/**
 * `text` with every regular-expression character backslash-escaped, cut to at most 100 characters after escaping, so
 * the server never refuses it. The cut falls between whole characters: never inside an escape or a surrogate pair.
 */
export function escapeSearch(text: string): string {
  let escaped = "";
  for (const character of text) {
    const piece = REGEX_CHARACTER.test(character)
      ? `\\${character}`
      : character;
    if (escaped.length + piece.length > MAX_SEARCH_LENGTH) break;
    escaped += piece;
  }
  return escaped;
}
