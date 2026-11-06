// The main flow (knowledge/decisions/e2e-playwright-main-flow.md): sign in, create a group, add an expense split
// equally with a contact, and see the balance. Runs with `pnpm test:e2e` on the emulators.
import { randomUUID } from "node:crypto";
import {
  createTestUser,
  emulatorHosts,
  expect,
  test,
  waitForEmulators,
} from "./fixtures";

// A group's page: /groups/<uuid>/, the uuid with or without its dashes.
const GROUP_URL = /\/groups\/([0-9a-f]{32}|[0-9a-f-]{36})\/?$/i;

test("signs in, creates a group, adds a contact and an equal expense, and shows the contact's balance", async ({
  page,
  testUser,
}) => {
  // Contacts are people with an email, and an email belongs to one person, so each run adds its own Asha.
  const ashaEmail = `asha-${randomUUID()}@example.test`;

  await test.step("sign in", async () => {
    await page.goto("/sign-in/");
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/groups\/?$/);
  });

  const groupId = await test.step("create the group E2E Trip", async () => {
    // A new user's /groups has two buttons named "Create a group": the header icon (aria-label only) and the empty
    // state's button (visible text, group-create.tsx). Both go to /groups/add; the flow means the empty state's, and
    // getByText sees only its visible text, so it resolves to that one element.
    await page.getByText("Create a group", { exact: true }).click();
    await page.getByLabel("Group name", { exact: true }).fill("E2E Trip");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL(GROUP_URL);
    // The group card is the only place the group's name is shown (the header title is empty).
    await expect(page.getByText("E2E Trip", { exact: true })).toBeVisible();
    return GROUP_URL.exec(new URL(page.url()).pathname)![1];
  });

  await test.step("add the contact Asha to the group", async () => {
    // The empty group page has two buttons named "Add members": the members row's icon (aria-label only) and the
    // empty expenses list's button (visible text, expenses-list.tsx). Both go to the add-member page; the visible
    // text belongs to the second only, so getByText resolves to that one element.
    await page.getByText("Add members", { exact: true }).click();
    await page.getByRole("link", { name: "Add a friend" }).click();
    await page.getByLabel("Friend's email").fill(ashaEmail);
    await page.getByRole("button", { name: "Find", exact: true }).click();
    await page.getByRole("link", { name: "Add as a contact" }).click();

    await page.getByLabel("Name", { exact: true }).fill("Asha");
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
      ashaEmail,
    );
    await page.getByRole("button", { name: "Add", exact: true }).click();
    // Once the contact is saved, the form goes back to the search, which finds her.
    await expect(page).toHaveURL(/\/friends\/add\/?\?/);

    await page.goto(`/groups/${groupId}/add-member/`);
    // Asha is the only friend not yet in the group.
    await page.getByRole("button", { name: "Add to group" }).click();
    await expect(page.getByText("Added in group")).toBeVisible();
    await expect(page.getByText("Asha", { exact: true })).toBeVisible();
  });

  await test.step("add Dinner, 600 paid by me, split equally", async () => {
    await page.goto(`/groups/${groupId}/`);
    await page.getByRole("button", { name: "Add Expense" }).click();
    await expect(page).toHaveURL(/\/expense\/add\/?\?groupId=/);

    await page.getByLabel("Description").fill("Dinner");
    // The amount becomes the signed-in person's payment only once the group's members have loaded, so type it until
    // the form says I paid.
    const amount = page.getByLabel(/^Amount/);
    const paidByMe = page.getByRole("button", { name: /You\s*Paid/ });
    await expect(async () => {
      await amount.fill("");
      await amount.fill("600");
      await expect(paidByMe).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: /Split\s*Equally/ }),
    ).toBeVisible();

    // The payment drawer opens from its trigger and closes with Done, the way a person uses it.
    await paidByMe.click();
    const drawer = page.getByRole("dialog", { name: "Paid amount" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Done", exact: true }).click();
    await expect(drawer).toBeHidden();

    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page).toHaveURL(GROUP_URL);
    await expect(page.getByText("Dinner", { exact: true })).toBeVisible();
  });

  await test.step("see that Asha owes 300", async () => {
    await page.getByRole("tab", { name: "Balances" }).click();
    await expect(
      page.getByText("Asha owes You ₹300", { exact: true }),
    ).toBeVisible();
  });
});

test("shows the form's error for a wrong password and stays on sign-in", async ({
  page,
  testUser,
}) => {
  await page.goto("/sign-in/");
  await page.getByLabel("Email").fill(testUser.email);
  await page.getByLabel("Password").fill(`${testUser.password}-wrong`);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  // Filtered by its text: Next's route announcer is an alert too.
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "That email and password don't match." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in\/$/);
});

test.describe("the test user fixture", () => {
  // Each address that must stop the fixture before it sends anything: unset, empty, a real host, a path, and a
  // loopback host with someone else's host after it as user info.
  const refused: [string, Record<string, string | undefined>][] = [
    ["unset", {}],
    ["empty", { FIREBASE_AUTH_EMULATOR_HOST: "" }],
    [
      "a real host",
      { FIREBASE_AUTH_EMULATOR_HOST: "identitytoolkit.googleapis.com:443" },
    ],
    ["a path", { FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:2142/x" }],
    [
      "user info before a real host",
      { FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:2142@example.com" },
    ],
    ["no port", { FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1" }],
  ];

  for (const [name, env] of refused) {
    test(`refuses to create a user when the Auth emulator host is ${name}`, async () => {
      const withDataConnect = {
        DATA_CONNECT_EMULATOR_HOST: "127.0.0.1:2143",
        ...env,
      };
      const calls: string[] = [];
      const fetchSpy: typeof fetch = async (input) => {
        calls.push(String(input));
        return new Response(null, { status: 200 });
      };

      await expect(createTestUser(withDataConnect, fetchSpy)).rejects.toThrow(
        /FIREBASE_AUTH_EMULATOR_HOST/,
      );
      expect(calls).toEqual([]);
    });
  }

  test("refuses a SQL Connect emulator host that is not local", () => {
    expect(() =>
      emulatorHosts({
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:2142",
        DATA_CONNECT_EMULATOR_HOST: "firebasedataconnect.googleapis.com:443",
      }),
    ).toThrow(/DATA_CONNECT_EMULATOR_HOST/);
  });

  test("waits until SQL Connect has loaded the splitify schema, not just until its port answers", async () => {
    // The emulator answers its port as soon as Postgres is up, and its GraphQL endpoint 404s "no schema found for
    // service" until the schema has loaded; the first CI run started the tests in that window.
    const graphql: string[] = [];
    let schemaLoaded = false;
    const fetchStub: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes(":executeGraphql")) {
        graphql.push(`${init?.method ?? "GET"} ${url}`);
        if (graphql.length >= 3) schemaLoaded = true;
        return new Response(null, { status: schemaLoaded ? 200 : 404 });
      }
      // The Auth emulator, and SQL Connect's bare port, answer at once.
      return new Response(null, { status: 200 });
    };

    await waitForEmulators(
      { auth: "127.0.0.1:2142", dataConnect: "127.0.0.1:2143" },
      fetchStub,
    );

    expect(schemaLoaded).toBe(true);
    expect(graphql).toHaveLength(3);
    expect(graphql[0]).toBe(
      "POST http://127.0.0.1:2143/v1/projects/demo-splitify/locations/asia-south1/services/splitify:executeGraphql",
    );
  });

  test("keeps a local Auth emulator host as given", () => {
    expect(
      emulatorHosts({
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:2142",
        DATA_CONNECT_EMULATOR_HOST: "localhost:2143",
      }),
    ).toEqual({ auth: "127.0.0.1:2142", dataConnect: "localhost:2143" });
  });
});
