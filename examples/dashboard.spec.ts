import { expect, test } from "@playwright/test";

for (const width of [375, 1280]) {
  test(`simulation, room replacement, and reconnect at ${width}px`, async ({
    page,
  }, testInfo) => {
    const isNative = testInfo.project.name === "expo";
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Room", exact: true })
      .fill("review");
    const room = page.locator('[aria-label="rooms:review"]');
    await expect(
      room.getByText("No messages yet", { exact: true }),
    ).toBeVisible();
    const messageButton = page.getByRole("button", {
      name: isNative ? "Message" : "Send message",
      exact: true,
    });
    await messageButton.click();
    await expect(room.getByText("just now", { exact: true })).toHaveCount(1);

    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    await expect(page.getByText("Disconnected", { exact: true })).toBeVisible();
    await messageButton.click();
    await expect(room.getByText("just now", { exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(page.getByText("Connected", { exact: true })).toBeVisible();
    await messageButton.click();
    await expect(room.getByText("just now", { exact: true })).toHaveCount(2);

    await page
      .getByRole("button", {
        name: isNative ? "Metrics" : "Report metrics",
        exact: true,
      })
      .click();
    await expect(page.getByText(/\d+ rps/)).toBeVisible();
    await page
      .getByRole("button", {
        name: isNative ? "Alert" : "Raise alert",
        exact: true,
      })
      .click();
    await expect(page.getByText("1 open", { exact: true })).toBeVisible();
    await page
      .getByRole("button", {
        name: isNative ? "Deploy" : "Advance deploy",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Nothing shipping", { exact: true }),
    ).toHaveCount(0);

    // Clearing the field must keep the non-room channels visible in every binding.
    await page.getByRole("textbox", { name: "Room", exact: true }).fill("");
    await expect(
      page.getByText("Nothing shipping", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator('[aria-label="rooms:"]')
        .getByText("No messages yet", { exact: true }),
    ).toBeVisible();
    const source = page.getByRole(isNative ? "radio" : "button", {
      name: "Centrifugo",
      exact: true,
    });
    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    await source.click();
    await expect(
      page.getByRole("textbox", { name: "WebSocket endpoint", exact: true }),
    ).toBeEditable();
    await page
      .getByRole(isNative ? "radio" : "button", {
        name: "Simulation",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await messageButton.click();
    await expect(
      page
        .locator('[aria-label="rooms:"]')
        .getByText("just now", { exact: true }),
    ).toHaveCount(1);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    expect(errors).toEqual([]);
  });
}
