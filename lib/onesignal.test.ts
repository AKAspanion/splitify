import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteOneSignalUser } from "./onesignal";

const fetchMock = vi.fn();

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function stubFetch(impl: () => Promise<unknown>) {
  fetchMock.mockImplementation(impl);
  vi.stubGlobal("fetch", fetchMock);
}

describe("deleteOneSignalUser", () => {
  it("sends a DELETE by external id and resolves ok on 200", async () => {
    stubFetch(async () => ({ status: 200, ok: true }));
    const result = await deleteOneSignalUser("user_1");
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(
      /^https:\/\/api\.onesignal\.com\/apps\/[^/]*\/users\/by\/external_id\/user_1$/,
    );
    expect(init.method).toBe("DELETE");
    expect(init.headers.Authorization).toMatch(/^Basic /);
  });

  it("treats 404 as ok", async () => {
    stubFetch(async () => ({ status: 404, ok: false }));
    expect(await deleteOneSignalUser("user_1")).toEqual({ ok: true });
  });

  it("resolves not ok on 500", async () => {
    stubFetch(async () => ({ status: 500, ok: false }));
    expect(await deleteOneSignalUser("user_1")).toEqual({ ok: false });
  });

  it("resolves not ok, without throwing, when fetch rejects", async () => {
    stubFetch(async () => {
      throw new Error("network");
    });
    expect(await deleteOneSignalUser("user_1")).toEqual({ ok: false });
  });

  it("URL-encodes the external id", async () => {
    stubFetch(async () => ({ status: 200, ok: true }));
    await deleteOneSignalUser("a/b");
    expect(fetchMock.mock.calls[0][0]).toMatch(/external_id\/a%2Fb$/);
  });
});
