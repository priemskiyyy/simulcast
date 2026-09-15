import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";

// Every fixture renders the same controls, so one spec proves the bindings behave alike.
const fixtures = [
  { name: "react", origin: "http://127.0.0.1:4173" },
  { name: "vue", origin: "http://127.0.0.1:4176" },
  { name: "solid", origin: "http://127.0.0.1:4177" },
  { name: "svelte", origin: "http://127.0.0.1:4178" },
];

const post = async (
  request: APIRequestContext,
  endpoint: string,
  data: object,
) => {
  const response = await request.post(`/test-api/${endpoint}`, { data });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
};
const presence = async (request: APIRequestContext, channel: string) =>
  Object.keys((await post(request, "presence", { channel })).presence);
const subscribed = async (page: Page) => {
  await expect(page.getByTestId("connection")).toHaveText("connected");
  await expect(page.getByTestId("channel")).toHaveText("subscribed");
};
const inspect = async (page: Page) => {
  await page.getByRole("button", { name: "Inspect resources" }).click();
  return JSON.parse(await page.getByTestId("diagnostics").innerText());
};

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

for (const fixture of fixtures) {
  test.describe(fixture.name, () => {
    const open = async (page: Page) => {
      const user = randomUUID();
      await page.goto(`${fixture.origin}/?user=${user}`);
      return user;
    };

    test("shares an authenticated subscription and releases it after the last consumer", async ({
      page,
      request,
    }) => {
      const user = await open(page);
      await subscribed(page);
      expect(await inspect(page)).toMatchObject({
        sockets: 1,
        clients: 1,
        subscriptions: 1,
        publicationListeners: 1,
      });
      await post(request, "publish", {
        channel: `private:${user}`,
        data: { text: "hello" },
      });
      await expect(page.getByTestId("first")).toHaveText('["hello"]');
      await expect(page.getByTestId("second")).toHaveText('["hello"]');
      await page.getByLabel("First consumer").uncheck();
      await post(request, "publish", {
        channel: `private:${user}`,
        data: { text: "second" },
      });
      await expect(page.getByTestId("second")).toHaveText('["hello","second"]');
      await page.getByLabel("Second consumer").uncheck();
      await expect(page.getByTestId("channel")).toHaveText("detached");
      expect(await inspect(page)).toMatchObject({
        subscriptions: 0,
        publicationListeners: 0,
      });
      await expect.poll(() => presence(request, `private:${user}`)).toEqual([]);
      await page.getByLabel("Session enabled").uncheck();
      await expect
        .poll(() => inspect(page))
        .toMatchObject({ sockets: 0, clients: 0 });
    });

    test("account replacement removes old subscriptions and delivers only the new account's messages", async ({
      page,
      request,
    }) => {
      const previous = await open(page);
      await subscribed(page);
      const next = randomUUID();
      await page.getByLabel("User", { exact: true }).fill(next);
      await subscribed(page);
      await expect
        .poll(() => presence(request, `private:${previous}`))
        .toEqual([]);
      await post(request, "publish", {
        channel: `private:${previous}`,
        data: { text: "obsolete" },
      });
      await post(request, "publish", {
        channel: `private:${next}`,
        data: { text: "current" },
      });
      await expect(page.getByTestId("first")).toHaveText('["current"]');
      await expect
        .poll(() => inspect(page))
        .toMatchObject({ sockets: 1, clients: 1, subscriptions: 1 });
    });

    test("repeated consumer and provider lifecycles return resources to baseline", async ({
      page,
    }) => {
      await open(page);
      for (const iteration of Array.from({ length: 5 }, (_, index) => index)) {
        await subscribed(page);
        await page.getByLabel("First consumer").uncheck();
        await page.getByLabel("Second consumer").uncheck();
        await expect(page.getByTestId("channel")).toHaveText("detached");
        expect((await inspect(page)).subscriptions).toBe(0);
        await page.getByLabel("Provider mounted").uncheck();
        await expect.poll(async () => (await inspect(page)).sockets).toBe(0);
        await page
          .getByLabel("User", { exact: true })
          .fill(`cycle-${iteration}-${randomUUID()}`);
        await page.getByLabel("Provider mounted").check();
      }
      await page.getByLabel("Provider mounted").uncheck();
      await expect
        .poll(() => inspect(page))
        .toMatchObject({
          sockets: 0,
          clients: 0,
          subscriptions: 0,
          publicationListeners: 0,
        });
    });
  });
}
