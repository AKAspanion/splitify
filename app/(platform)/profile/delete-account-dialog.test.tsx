import { readFileSync } from "node:fs";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DELETE_WORD, DeleteAccountDialog } from "./delete-account-dialog";

// There is no DOM here, so the typed text is fed in through useState, and the handlers are read off the elements the
// component returns and called directly.
const typed = vi.hoisted(() => ({ value: "" }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) =>
      typeof initial === "string"
        ? [typed.value, (next: string) => (typed.value = next)]
        : actual.useState(initial),
  };
});

type AnyProps = {
  children?: ReactNode;
  disabled?: boolean;
  type?: string;
  value?: string;
  variant?: string;
  open?: boolean;
  onClick?: () => void;
  onSubmit?: (event: { preventDefault: () => void }) => void;
  onChange?: (event: { target: { value: string } }) => void;
  onOpenChange?: (open: boolean) => void;
};

function elements(node: ReactNode): ReactElement<AnyProps>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<AnyProps>(node)) return [];
  return [node, ...elements(node.props.children)];
}

const textOf = (node: ReactNode): string =>
  Array.isArray(node)
    ? node.map(textOf).join("")
    : isValidElement<AnyProps>(node)
      ? textOf(node.props.children)
      : typeof node === "string" || typeof node === "number"
        ? String(node)
        : "";

// The elements of an open dialog, with the form's own component expanded one level so its markup shows.
function openTree(props: Partial<Parameters<typeof DeleteAccountDialog>[0]>) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  let tree: ReactNode = null;
  const Capture = () => {
    tree = DeleteAccountDialog({ open: true, onCancel, onConfirm, ...props });
    return null;
  };
  renderToStaticMarkup(<Capture />);
  let els = elements(tree);
  // The form is its own component, so the text it holds lives in state; expand it to read its markup.
  const formElement = els.find(
    (el) =>
      typeof el.type === "function" && el.type.name === "DeleteAccountForm",
  );
  if (formElement) {
    let inner: ReactNode = null;
    const Expand = () => {
      inner = (formElement.type as (p: unknown) => ReactNode)(
        formElement.props,
      );
      return null;
    };
    renderToStaticMarkup(<Expand />);
    els = [...els, ...elements(inner)];
  }
  return { els, onCancel, onConfirm };
}

const confirmButton = (els: ReactElement<AnyProps>[]) =>
  els.find(
    (el) =>
      el.type === Button && textOf(el.props.children) === "Delete account",
  )!;

describe("DeleteAccountDialog", () => {
  beforeEach(() => {
    typed.value = "";
  });

  it("asks to type the word DELETE", () => {
    expect(DELETE_WORD).toBe("DELETE");
  });

  it.each(["", "delete", "DELETE ", " DELETE", "DELET"])(
    "keeps Delete account disabled when the field holds %j",
    (value) => {
      typed.value = value;
      const { els } = openTree({});
      expect(confirmButton(els).props.disabled).toBe(true);
    },
  );

  it("enables Delete account once the field is exactly DELETE", () => {
    typed.value = "DELETE";
    const { els } = openTree({});
    expect(confirmButton(els).props.disabled).toBe(false);
  });

  it("calls onConfirm once when the form is submitted with DELETE (Delete account or Enter)", () => {
    typed.value = "DELETE";
    const { els, onConfirm } = openTree({});
    const form = els.find((el) => el.type === "form")!;
    const preventDefault = vi.fn();
    form.props.onSubmit!({ preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(confirmButton(els).props.type).toBe("submit");
  });

  it("does not call onConfirm when the form is submitted with anything but DELETE", () => {
    typed.value = "delete";
    const { els, onConfirm } = openTree({});
    els.find((el) => el.type === "form")!.props.onSubmit!({
      preventDefault: () => {},
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel and not onConfirm for Cancel", () => {
    typed.value = "DELETE";
    const { els, onCancel, onConfirm } = openTree({});
    const cancel = els.find(
      (el) => el.type === Button && textOf(el.props.children) === "Cancel",
    )!;
    expect(cancel.props.type).toBe("button");
    cancel.props.onClick!();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel and not onConfirm when the dialog asks to close (Escape, close button, overlay)", () => {
    typed.value = "DELETE";
    const { els, onCancel, onConfirm } = openTree({});
    const dialog = els.find((el) => el.type === Dialog)!;
    dialog.props.onOpenChange!(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders nothing while closed, so the typed text starts empty on the next open", () => {
    const html = renderToStaticMarkup(
      <DeleteAccountDialog
        open={false}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(html).toBe("");
    const { els } = openTree({ open: false });
    expect(els.find((el) => el.type === Dialog)!.props.open).toBe(false);
  });

  it("shows the title, text, label and both buttons", () => {
    const { els } = openTree({});
    const text = els.map((el) => textOf(el.props.children)).join("|");
    expect(text).toContain("Delete your account?");
    expect(text).toContain(
      "Your shared expenses stay, shown as Deleted user. This can't be undone.",
    );
    expect(text).toContain("Type DELETE to confirm");
    expect(confirmButton(els).props.variant).toBe("destructive");
    expect(
      els.some(
        (el) => el.type === Button && textOf(el.props.children) === "Cancel",
      ),
    ).toBe(true);
  });
});

describe("DialogContent", () => {
  it("fades and zooms only, with no slide from the left or top", () => {
    const source = readFileSync("components/ui/dialog.tsx", "utf8");
    expect(source).not.toContain("slide-in-from-left");
    expect(source).not.toContain("slide-out-to-left");
    expect(source).not.toMatch(/slide-(in|out)-/);
    expect(source).toContain("zoom-in-95");
    expect(source).toContain("zoom-out-95");
  });
});
