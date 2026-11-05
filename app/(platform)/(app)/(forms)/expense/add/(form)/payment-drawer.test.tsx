import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { DrawerClose, DrawerTrigger } from "@/components/ui/drawer";
import type { User } from "@/types/shared";
import { PaymentDrawer } from "./payment-drawer";

const users = [
  { id: "u1", name: "Asha Rao", firstName: "Asha" },
  { id: "u2", name: "Ben Lee", firstName: "Ben" },
] as User[];

type Props = Parameters<typeof PaymentDrawer>[0];

const props = (overrides: Partial<Props> = {}): Props => ({
  users,
  total: 100,
  currUserId: "u1",
  payment: { u1: 100 },
  onChange: () => {},
  ...overrides,
});

// The deepest `<button>` nesting in the markup: 1 means no button sits inside another.
function buttonDepth(html: string): number {
  let depth = 0;
  let deepest = 0;
  for (const [tag] of html.matchAll(/<\/?button\b/g)) {
    depth += tag.startsWith("</") ? -1 : 1;
    deepest = Math.max(deepest, depth);
  }
  return deepest;
}

// What PaymentDrawer returns, unrendered, so the drawer's closed content can be read too. It is called inside a
// component render because it uses hooks.
function drawerTree(p: Props): ReactNode {
  let tree: ReactNode = null;
  const Capture = () => {
    tree = PaymentDrawer(p);
    return null;
  };
  renderToStaticMarkup(<Capture />);
  return tree;
}

type AnyProps = { children?: ReactNode; asChild?: boolean };

function elements(node: ReactNode): ReactElement<AnyProps>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<AnyProps>(node)) return [];
  return [node, ...elements(node.props.children)];
}

describe("PaymentDrawer", () => {
  it("renders its trigger as one button, not a button inside a button", () => {
    const html = renderToStaticMarkup(<PaymentDrawer {...props()} />);

    expect(html).toContain("Paid");
    expect(buttonDepth(html)).toBe(1);
  });

  it("makes the Paid button itself the drawer's trigger, closed until clicked", () => {
    const html = renderToStaticMarkup(<PaymentDrawer {...props()} />);
    const trigger = html.match(/<button\b[^>]*>/)?.[0] ?? "";

    expect(trigger).toContain('aria-haspopup="dialog"');
    expect(trigger).toContain('aria-expanded="false"');
    expect(trigger).toContain('data-state="closed"');
    expect(trigger).not.toMatch(/\sdisabled=""/);
  });

  it("disables the trigger button when disabled, so it can't open the drawer", () => {
    const html = renderToStaticMarkup(
      <PaymentDrawer {...props({ disabled: true })} />,
    );
    const trigger = html.match(/<button\b[^>]*>/)?.[0] ?? "";

    expect(buttonDepth(html)).toBe(1);
    expect(trigger).toContain('aria-haspopup="dialog"');
    expect(trigger).toMatch(/\sdisabled=""/);
  });

  it("passes each trigger and close its Button as the child, so the drawer's content has no nested buttons", () => {
    const parts = elements(drawerTree(props())).filter(
      (el) => el.type === DrawerTrigger || el.type === DrawerClose,
    );

    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part.props.asChild).toBe(true);
      expect(isValidElement(part.props.children)).toBe(true);
      expect((part.props.children as ReactElement).type).toBe(Button);
    }
  });
});
