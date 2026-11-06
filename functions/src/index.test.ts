import { describe, expect, it } from "vitest";
import * as functions from "./index";

type Deployed = { __endpoint?: { maxInstances?: number } };

const endpoints = Object.entries(functions as Record<string, Deployed>)
  .filter(([, fn]) => fn?.__endpoint)
  .map(([name, fn]) => [name, fn.__endpoint!.maxInstances] as const);

describe("functions/src/index.ts", () => {
  it("exports the deployed functions", () => {
    expect(endpoints.map(([name]) => name)).toEqual(
      expect.arrayContaining([
        "deleteMyAccount",
        "reports",
        "webauthn",
        "billingKillSwitch",
      ]),
    );
  });

  it("caps every function at 10 instances, and the kill switch at its own 1", () => {
    for (const [name, maxInstances] of endpoints)
      expect([name, maxInstances]).toEqual([
        name,
        name === "billingKillSwitch" ? 1 : 10,
      ]);
  });
});
