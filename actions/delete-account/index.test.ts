import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteUser = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  clerkClient: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { $transaction: vi.fn(), user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/account/anonymise", () => ({ anonymiseUser: vi.fn() }));
vi.mock("@/lib/onesignal", () => ({ deleteOneSignalUser: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  APILogger: { error: vi.fn(), info: vi.fn() },
}));

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { anonymiseUser } from "@/lib/account/anonymise";
import { deleteOneSignalUser } from "@/lib/onesignal";
import { APILogger } from "@/lib/logger";
import { deleteAccount } from "./index";

type Where = { where: { id?: string; email?: string } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ userId: "user_1" } as never);
  vi.mocked(currentUser).mockResolvedValue({
    primaryEmailAddress: { emailAddress: "asha@example.com" },
  } as never);
  vi.mocked(clerkClient).mockResolvedValue({ users: { deleteUser } } as never);
  deleteUser.mockResolvedValue({});
  vi.mocked(db.$transaction).mockImplementation((async (fn: unknown) =>
    (fn as (tx: unknown) => unknown)(db)) as never);
  vi.mocked(db.user.findUnique).mockImplementation((async (args: Where) =>
    args.where.id === "user_1" ? { id: "user_1" } : null) as never);
  vi.mocked(anonymiseUser).mockResolvedValue({ anonymised: true });
  vi.mocked(deleteOneSignalUser).mockResolvedValue({ ok: true });
});

describe("deleteAccount", () => {
  it("refuses without a session and touches nothing", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const result = await deleteAccount({});

    expect(result).toEqual({ error: "Unauthorized" });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("anonymises the row, then deletes the Clerk account and the OneSignal user", async () => {
    const order: string[] = [];
    vi.mocked(anonymiseUser).mockImplementation((async () => {
      order.push("anonymise");
      return { anonymised: true };
    }) as never);
    deleteUser.mockImplementation(async () => {
      order.push("clerk");
    });

    const result = await deleteAccount({});

    expect(anonymiseUser).toHaveBeenCalledWith(db, "user_1");
    expect(deleteUser).toHaveBeenCalledWith("user_1");
    expect(order).toEqual(["anonymise", "clerk"]);
    expect(deleteOneSignalUser).toHaveBeenCalledWith("user_1");
    expect(result).toEqual({ data: { deleted: true } });
  });

  it("finds a merged contact's row by the Clerk primary email", async () => {
    vi.mocked(db.user.findUnique).mockImplementation((async (args: Where) =>
      args.where.email === "asha@example.com"
        ? { id: "spuser_9" }
        : null) as never);

    const result = await deleteAccount({});

    expect(anonymiseUser).toHaveBeenCalledTimes(1);
    expect(anonymiseUser).toHaveBeenCalledWith(db, "spuser_9");
    expect(deleteUser).toHaveBeenCalledWith("user_1");
    expect(result).toEqual({ data: { deleted: true } });
  });

  it("still deletes the Clerk account when no row is found", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null as never);

    const result = await deleteAccount({});

    expect(anonymiseUser).not.toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalledWith("user_1");
    expect(result).toEqual({ data: { deleted: true } });
  });

  it("returns an error and skips OneSignal when Clerk refuses", async () => {
    deleteUser.mockRejectedValue(new Error("clerk down"));

    const result = await deleteAccount({});

    expect(result).toEqual({
      error: "Couldn't delete your account. Try again.",
    });
    expect(deleteOneSignalUser).not.toHaveBeenCalled();
  });

  it("logs a OneSignal failure and still succeeds", async () => {
    vi.mocked(deleteOneSignalUser).mockResolvedValue({ ok: false });

    const result = await deleteAccount({});

    expect(APILogger.error).toHaveBeenCalled();
    expect(result).toEqual({ data: { deleted: true } });
  });

  it("ignores a userId in the input", async () => {
    const result = await deleteAccount({ userId: "user_2" } as never);

    expect(anonymiseUser).toHaveBeenCalledTimes(1);
    expect(anonymiseUser).toHaveBeenCalledWith(db, "user_1");
    expect(deleteUser).toHaveBeenCalledWith("user_1");
    expect(deleteUser).not.toHaveBeenCalledWith("user_2");
    expect(result).toEqual({ data: { deleted: true } });
  });

  it("runs the transaction with a 15 second timeout", async () => {
    await deleteAccount({});

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 15000,
    });
  });
});
