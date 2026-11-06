import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnlineOnly } from "@/components/offline/online-only";
import DeleteAccountAction from "./delete-account-action";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { SIGN_IN_AGAIN_PATH } from "./delete-account-failure";

// There is no DOM here, so the component is called as a function with React's state and ref hooks kept in plain
// arrays between calls, and the handlers are read off the elements it returns and called directly.
const hooks = vi.hoisted(() => ({
  states: [] as unknown[],
  refs: [] as { current: unknown }[],
  state: 0,
  ref: 0,
}));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const at = hooks.state++;
      if (!(at in hooks.states)) hooks.states[at] = initial;
      return [
        hooks.states[at],
        (next: unknown) =>
          (hooks.states[at] =
            typeof next === "function" ? next(hooks.states[at]) : next),
      ];
    },
    useRef: (initial: unknown) => {
      const at = hooks.ref++;
      hooks.refs[at] ??= { current: initial };
      return hooks.refs[at];
    },
  };
});

const mocks = vi.hoisted(() => ({
  callable: vi.fn(),
  toastError: vi.fn(),
  replace: vi.fn(),
  signOut: vi.fn(),
  firebaseSignOut: vi.fn(),
  leaveForSignIn: vi.fn(),
  markSignOutIntended: vi.fn(),
}));
vi.mock("firebase/functions", () => ({
  getFunctions: () => ({}),
  connectFunctionsEmulator: () => {},
  httpsCallable: () => mocks.callable,
}));
vi.mock("firebase/auth", () => ({ signOut: mocks.firebaseSignOut }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/lib/firebase/app", () => ({
  getFirebaseApp: () => ({}),
  getFirebaseAuth: () => ({}),
}));
vi.mock("@/lib/firebase/auth", () => ({ signOut: mocks.signOut }));
vi.mock("@/lib/auth-redirect", () => ({
  leaveForSignIn: mocks.leaveForSignIn,
  markSignOutIntended: mocks.markSignOutIntended,
}));

type AnyProps = {
  children?: ReactNode | ((disabled: boolean) => ReactNode);
  disabled?: boolean;
  onConfirm?: () => Promise<void>;
};

function elements(node: unknown): ReactElement<AnyProps>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<AnyProps>(node)) return [];
  const { children } = node.props;
  return [node, ...(typeof children === "function" ? [] : elements(children))];
}

function render() {
  hooks.state = 0;
  hooks.ref = 0;
  return elements(DeleteAccountAction());
}

const confirm = () =>
  render().find((el) => el.type === DeleteAccountDialog)!.props.onConfirm!();

// The Delete account button, as an online person sees it.
const deleteButton = () => {
  const online = render().find((el) => el.type === OnlineOnly)!;
  const children = online.props.children as (disabled: boolean) => ReactNode;
  return elements(children(false))[0];
};

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const failedDeletion = Object.assign(
  new Error("Couldn't delete your account. Try again."),
  { code: "functions/internal" },
);
const staleSignIn = Object.assign(
  new Error("Sign in again to delete your account."),
  { code: "functions/unauthenticated" },
);

describe("DeleteAccountAction", () => {
  beforeEach(() => {
    hooks.states = [];
    hooks.refs = [];
    vi.clearAllMocks();
    mocks.signOut.mockResolvedValue(undefined);
    mocks.firebaseSignOut.mockResolvedValue(undefined);
  });

  it("calls deleteMyAccount once when the dialog confirms again while a delete is in flight", async () => {
    const call = deferred();
    mocks.callable.mockReturnValue(call.promise);
    const first = confirm();
    const second = confirm();
    call.resolve({ data: { ok: true } });
    await Promise.all([first, second]);
    expect(mocks.callable).toHaveBeenCalledTimes(1);
    expect(mocks.firebaseSignOut).toHaveBeenCalledTimes(1);
    expect(mocks.leaveForSignIn).toHaveBeenCalledTimes(1);
  });

  it("signs out before leaving for sign-in once the account is deleted", async () => {
    mocks.callable.mockResolvedValue({ data: { ok: true } });
    await confirm();
    expect(mocks.markSignOutIntended).toHaveBeenCalledWith(true);
    expect(mocks.firebaseSignOut.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.leaveForSignIn.mock.invocationCallOrder[0],
    );
  });

  it("toasts another failure once, enables the button again, and lets a later confirm delete again", async () => {
    const call = deferred();
    mocks.callable.mockReturnValueOnce(call.promise);
    const first = confirm();
    const second = confirm();
    expect(deleteButton().props.disabled).toBe(true);
    call.reject(failedDeletion);
    await Promise.all([first, second]);
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Something went wrong. Try again.",
    );
    expect(deleteButton().props.disabled).toBe(false);
    expect(mocks.leaveForSignIn).not.toHaveBeenCalled();

    mocks.callable.mockResolvedValueOnce({ data: { ok: true } });
    await confirm();
    expect(mocks.callable).toHaveBeenCalledTimes(2);
    expect(mocks.leaveForSignIn).toHaveBeenCalledTimes(1);
  });

  it("signs out and sends someone whose sign-in is too old to sign in again, once", async () => {
    const call = deferred();
    mocks.callable.mockReturnValueOnce(call.promise);
    const first = confirm();
    const second = confirm();
    call.reject(staleSignIn);
    await Promise.all([first, second]);
    expect(mocks.callable).toHaveBeenCalledTimes(1);
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Sign in again to delete your account.",
    );
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).toHaveBeenCalledWith({ toSignIn: true });
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith(SIGN_IN_AGAIN_PATH);
    expect(mocks.signOut.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.replace.mock.invocationCallOrder[0],
    );
  });

  it("lets a later confirm delete again when signing out to sign in again fails", async () => {
    mocks.callable.mockRejectedValueOnce(staleSignIn);
    mocks.signOut.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await confirm();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(deleteButton().props.disabled).toBe(false);

    mocks.callable.mockResolvedValueOnce({ data: { ok: true } });
    await confirm();
    expect(mocks.callable).toHaveBeenCalledTimes(2);
  });
});
