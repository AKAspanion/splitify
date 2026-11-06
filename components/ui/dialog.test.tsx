import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Radix renders a portal only once it has mounted in a document, and there is no DOM here, so the portal renders its
// content in place and the server markup shows what the dialog holds.
vi.mock("@radix-ui/react-dialog", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@radix-ui/react-dialog")>();
  return {
    ...actual,
    Portal: ({ children }: { children?: ReactNode }) => <>{children}</>,
  };
});

import { Dialog, DialogContent, DialogTitle } from "./dialog";

function openDialog(closable?: boolean) {
  return renderToStaticMarkup(
    <Dialog open>
      <DialogContent closable={closable}>
        <DialogTitle>Title</DialogTitle>
        <p>Body</p>
      </DialogContent>
    </Dialog>,
  );
}

/** Each `<button …>…</button>` in the markup, with what it holds, assuming none is nested (which the test checks). */
const buttonsIn = (html: string) =>
  [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map(
    ([whole, inner]) => ({ whole, inner }),
  );

describe("DialogContent's close control", () => {
  it("is one button named Close, with no button inside it", () => {
    const html = openDialog();
    expect(html).toContain("Body");
    expect(html.match(/<button\b/g)).toHaveLength(1);
    const [close] = buttonsIn(html);
    expect(close.inner).not.toMatch(/<button\b/);
    expect(close.inner).toMatch(/<span class="sr-only">Close<\/span>/);
    expect(close.whole).toMatch(/^<button[^>]*type="button"/);
  });

  it("does not render when the dialog isn't closable", () => {
    const html = openDialog(false);
    expect(html).toContain("Body");
    expect(html).not.toMatch(/<button\b/);
    expect(html).not.toContain("Close");
  });
});
