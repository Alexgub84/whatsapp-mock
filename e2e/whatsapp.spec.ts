import { test, expect } from "@playwright/test";

test("default scenario plays back correctly", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await expect(page.getByTestId("phone-frame")).toBeVisible();

  await expect(page.getByTestId("contact-name")).toHaveText("סטודיו פלואו");

  await expect(page.getByTestId("message-bubble")).toHaveCount(0);

  const playButton = page.getByTestId("play-button");
  await expect(playButton).toBeVisible();

  await playButton.click();

  await expect(page.getByTestId("typing-indicator")).toBeVisible({
    timeout: 3000,
  });

  await expect(page.getByTestId("message-bubble")).toHaveCount(13, {
    timeout: 110_000,
  });

  const reactionBubble = page.getByTestId("reaction-bubble");
  await expect(reactionBubble).toBeVisible();
  await expect(reactionBubble).toContainText("❤️");

  // Reset clears all messages
  const resetButton = page.getByTestId("reset-button");
  await expect(resetButton).toBeVisible();
  await resetButton.click();
  await expect(page.getByTestId("message-bubble")).toHaveCount(0);
});

test("barber-shop scenario flips to the calendar with the new booking", async ({
  page,
}) => {
  test.setTimeout(60_000);

  await page.goto("/");

  await page.getByTestId("scenario-select").selectOption("barber-shop");

  // Recording studio renders (chat autoplays inside it).
  await expect(page.getByTestId("recording-studio")).toBeVisible();
  await expect(page.getByTestId("contact-name")).toHaveText("מספרת קינגס");

  // Manually flip to the calendar (no need to wait for full playback).
  await page.getByTestId("studio-flip").click();

  const calendar = page.getByTestId("calendar-view");
  await expect(calendar).toBeVisible();

  // Pre-seeded bookings + the new event that pops in.
  await expect(page.getByTestId("calendar-event")).toHaveCount(5);
  const newEvent = page.getByTestId("calendar-event-new");
  await expect(newEvent).toBeVisible();
  await expect(newEvent).toContainText("דוד כהן");
  await expect(newEvent).toContainText("חדש");
});

test("image-test scenario renders image messages", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/");

  await page.getByTestId("scenario-select").selectOption("image-test");

  await expect(page.getByTestId("contact-name")).toHaveText("Image Test");

  await expect(page.getByTestId("message-bubble")).toHaveCount(0);

  await page.getByTestId("play-button").click();

  await expect(page.getByTestId("message-bubble")).toHaveCount(3, {
    timeout: 30_000,
  });

  const images = page.getByTestId("message-image");
  await expect(images).toHaveCount(2);

  for (let i = 0; i < 2; i++) {
    await expect(images.nth(i)).toBeVisible();
    await expect(images.nth(i)).toHaveJSProperty("naturalWidth", 1);
    await expect(images.nth(i)).toHaveJSProperty("naturalHeight", 1);
  }

  await expect(page.getByText("Studio floor")).toBeVisible();
  await expect(page.getByText("Does this help?")).toBeVisible();
});
