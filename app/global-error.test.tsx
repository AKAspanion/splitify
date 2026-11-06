import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlobalError from "./global-error";

type Props = { children?: ReactNode; onClick?: () => void };

// The elements GlobalError returns, depth first, without rendering them: the Try again button's handler is on one.
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Props>(node)) return [];
  return [node, ...elements(node.props.children)];
}

const textOf = (node: ReactNode): string =>
  Array.isArray(node)
    ? node.map(textOf).join("")
    : isValidElement<Props>(node)
      ? textOf(node.props.children)
      : typeof node === "string" || typeof node === "number"
        ? String(node)
        : "";

describe("global error page", () => {
  const error = Object.assign(new Error("secret detail"), {
    digest: "abc123",
  });

  it("says something went wrong and shows the digest, never the error's message", () => {
    const html = renderToStaticMarkup(
      <GlobalError error={error} reset={() => {}} />,
    );

    expect(html).toContain("Something went wrong.");
    expect(html).toContain("abc123");
    expect(html).not.toContain("secret detail");
  });

  it("has a Try again button that calls reset", () => {
    const reset = vi.fn();
    const tree = GlobalError({ error, reset });

    const button = elements(tree).find(
      (el) => textOf(el) === "Try again" && el.props.onClick,
    );
    expect(button).toBeDefined();
    button?.props.onClick?.();

    expect(reset).toHaveBeenCalledOnce();
  });

  it("shows no digest line when the error has none", () => {
    const html = renderToStaticMarkup(
      <GlobalError error={new Error("secret detail")} reset={() => {}} />,
    );

    expect(html).toContain("Something went wrong.");
    expect(html).not.toContain("secret detail");
    expect(html).not.toContain("Reference");
  });
});
