const DEFAULT_PATH = "/groups";

/** `raw` only when it is a same-site path: one leading `/`, not `//` and no backslash, which browsers read as `/`. */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/")) return DEFAULT_PATH;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_PATH;
  if (/[\u0000-\u001f]/.test(raw)) return DEFAULT_PATH;
  return raw;
}
