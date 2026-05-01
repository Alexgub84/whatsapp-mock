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
