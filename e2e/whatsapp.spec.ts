import { test, expect } from "@playwright/test";

// Scenario: Hebrew cleaning-agency conversation (5 messages, RTL, heart reaction)
test("cleaning agency demo plays back correctly", async ({ page }) => {
  await page.goto("/");

  // Phone frame is visible
  await expect(page.getByTestId("phone-frame")).toBeVisible();

  // Header shows the contact name
  await expect(page.getByTestId("contact-name")).toHaveText("ניקיון פלוס");

  // No messages shown yet
  await expect(page.getByTestId("message-bubble")).toHaveCount(0);

  // Play button is visible outside the frame
  const playButton = page.getByTestId("play-button");
  await expect(playButton).toBeVisible();

  // Start playback
  await playButton.click();

  // Typing indicator appears for first incoming message
  await expect(page.getByTestId("typing-indicator")).toBeVisible({
    timeout: 3000,
  });

  // All 5 messages eventually appear
  await expect(page.getByTestId("message-bubble")).toHaveCount(5, {
    timeout: 25_000,
  });

  // Heart reaction is visible on the last message
  const reactionBubble = page.getByTestId("reaction-bubble");
  await expect(reactionBubble).toBeVisible();
  await expect(reactionBubble).toContainText("❤️");

  // Reset clears all messages
  const resetButton = page.getByTestId("reset-button");
  await expect(resetButton).toBeVisible();
  await resetButton.click();
  await expect(page.getByTestId("message-bubble")).toHaveCount(0);
});
