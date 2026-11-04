import { describe, expect, it, vi } from "vitest";
import { billingKillSwitch } from "./index";
import {
  enforceBudget,
  parseNotification,
  type BillingClient,
  type BudgetNotification,
} from "./kill-switch";

const encode = (value: unknown) =>
  Buffer.from(
    value === "not json" ? value : JSON.stringify(value),
  ).toString("base64");

describe("parseNotification", () => {
  it("returns null for no data", () => {
    expect(parseNotification(undefined)).toBeNull();
    expect(parseNotification("")).toBeNull();
  });

  it("returns null for bodies that are not objects", () => {
    expect(parseNotification(encode("not json"))).toBeNull();
    expect(parseNotification(encode("just a string"))).toBeNull();
    expect(parseNotification(encode(null))).toBeNull();
  });

  it("returns null when an amount is missing or not a number", () => {
    expect(parseNotification(encode({ budgetAmount: 5 }))).toBeNull();
    expect(parseNotification(encode({ costAmount: 1 }))).toBeNull();
    expect(
      parseNotification(encode({ costAmount: "1", budgetAmount: 5 })),
    ).toBeNull();
  });

  it("returns null for a budget that is zero or negative", () => {
    expect(
      parseNotification(encode({ costAmount: 1, budgetAmount: 0 })),
    ).toBeNull();
    expect(
      parseNotification(encode({ costAmount: 1, budgetAmount: -5 })),
    ).toBeNull();
  });

  it("returns the four fields of a notification", () => {
    const body = {
      budgetDisplayName: "Splitify monthly",
      costAmount: 4.2,
      budgetAmount: 5,
      currencyCode: "USD",
    };
    expect(parseNotification(encode(body))).toEqual(body);
  });

  it("defaults a missing name and currency to an empty string", () => {
    expect(
      parseNotification(encode({ costAmount: 4.2, budgetAmount: 5 })),
    ).toEqual({
      budgetDisplayName: "",
      costAmount: 4.2,
      budgetAmount: 5,
      currencyCode: "",
    });
  });
});

const notification = (
  costAmount: number,
  budgetAmount: number,
): BudgetNotification => ({
  budgetDisplayName: "Splitify monthly",
  costAmount,
  budgetAmount,
  currencyCode: "USD",
});

function fakeClient(billingEnabled: boolean | null | Error) {
  return {
    getProjectBillingInfo: vi.fn(async () => {
      if (billingEnabled instanceof Error) throw billingEnabled;
      return [{ billingEnabled }] as [{ billingEnabled: boolean | null }];
    }),
    updateProjectBillingInfo: vi.fn(async () => [{}]),
  } satisfies BillingClient;
}

describe("enforceBudget", () => {
  it("stays under budget without calling the client", async () => {
    const client = fakeClient(true);
    await expect(
      enforceBudget(notification(4.99, 5), "splitify-416321", client),
    ).resolves.toBe("under-budget");
    expect(client.getProjectBillingInfo).not.toHaveBeenCalled();
    expect(client.updateProjectBillingInfo).not.toHaveBeenCalled();
  });

  it("unlinks billing once spend reaches the budget", async () => {
    const client = fakeClient(true);
    await expect(
      enforceBudget(notification(5, 5), "splitify-416321", client),
    ).resolves.toBe("disabled");
    expect(client.getProjectBillingInfo).toHaveBeenCalledWith({
      name: "projects/splitify-416321",
    });
    expect(client.updateProjectBillingInfo).toHaveBeenCalledWith({
      name: "projects/splitify-416321",
      projectBillingInfo: { billingAccountName: "" },
    });
    expect(
      client.getProjectBillingInfo.mock.invocationCallOrder[0],
    ).toBeLessThan(client.updateProjectBillingInfo.mock.invocationCallOrder[0]);
  });

  it.each([false, null])(
    "does nothing when billing is already off (%s)",
    async (enabled) => {
      const client = fakeClient(enabled);
      await expect(
        enforceBudget(notification(7, 5), "splitify-416321", client),
      ).resolves.toBe("already-disabled");
      expect(client.updateProjectBillingInfo).not.toHaveBeenCalled();
    },
  );

  it("rejects when the billing lookup fails, so Pub/Sub retries", async () => {
    const failure = new Error("billing api down");
    const client = fakeClient(failure);
    await expect(
      enforceBudget(notification(7, 5), "splitify-416321", client),
    ).rejects.toBe(failure);
    expect(client.updateProjectBillingInfo).not.toHaveBeenCalled();
  });
});

describe("billingKillSwitch", () => {
  it("listens on budget-alerts in asia-south1 as the kill-switch account, one instance", () => {
    const endpoint = (
      billingKillSwitch as unknown as {
        __endpoint: {
          region: string[];
          maxInstances: number;
          serviceAccountEmail: string;
          eventTrigger: { eventType: string; eventFilters: { topic?: string } };
        };
      }
    ).__endpoint;
    expect(endpoint.region).toEqual(["asia-south1"]);
    expect(endpoint.eventTrigger.eventType).toContain("messagePublished");
    expect(endpoint.eventTrigger.eventFilters.topic).toBe("budget-alerts");
    expect(endpoint.serviceAccountEmail).toBe("billing-kill-switch@");
    expect(endpoint.maxInstances).toBe(1);
  });
});
