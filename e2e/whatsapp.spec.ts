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

  // Recording studio renders, starting with the branded intro card.
  await expect(page.getByTestId("recording-studio")).toBeVisible();
  await expect(page.getByTestId("intro-frame")).toBeVisible();
  await expect(page.getByTestId("contact-name")).toHaveText("מספרת קינגס");

  // Manually flip through the scenes until the calendar shows its new booking.
  const newEvent = page.getByTestId("calendar-event-new");
  const flipBtn = page.getByTestId("studio-flip");
  for (let i = 0; i < 6 && !(await newEvent.isVisible()); i++) {
    await flipBtn.click();
    await page.waitForTimeout(800);
  }

  const calendar = page.getByTestId("calendar-view");
  await expect(calendar).toBeVisible();

  // Pre-seeded bookings + the new event that pops in.
  await expect(page.getByTestId("calendar-event")).toHaveCount(5);
  await expect(newEvent).toBeVisible();
  await expect(newEvent).toContainText("דוד כהן");
  await expect(newEvent).toContainText("חדש");
});

test("barber-shop runs the full montage: reminder, then staff roster", async ({
  page,
}) => {
  test.setTimeout(150_000);

  await page.goto("/");
  await page.getByTestId("scenario-select").selectOption("barber-shop");

  await expect(page.getByTestId("recording-studio")).toBeVisible();

  // Opens on the branded intro title card (logo + Hebrew leading line).
  await expect(page.getByTestId("intro-frame")).toBeVisible();
  await expect(page.getByTestId("intro-tagline")).toHaveText(
    "עסק שמתנהל חכם מרוויח יותר",
  );

  // Then a branded chapter caption announces the chat scene.
  await expect(page.getByText("מענה ללקוח בוואטסאפ")).toBeVisible({
    timeout: 15_000,
  });

  // Intro/caption fade → chat → caption → calendar → caption → reminder.
  await expect(page.getByText("תזכורת לתור שלך מחר:")).toBeVisible({
    timeout: 80_000,
  });

  // A date-separator chip makes the reminder read as a different day.
  await expect(page.getByTestId("date-separator")).toHaveText("היום");

  // The payment URL renders as a blue WhatsApp-style link.
  const link = page.getByRole("link", {
    name: "https://pay.kings-barber.co.il/d4k2",
  });
  await expect(link).toBeVisible();
  await expect(link).toHaveCSS("color", "rgb(2, 126, 181)");

  // The booking conversation is still shown beneath the reminder.
  await expect(page.getByTestId("message-bubble")).toHaveCount(9);

  // Finally the screen flips to the staff roster and assigns the whole team.
  await expect(page.getByTestId("staff-view")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("staff-shift")).toHaveCount(5);
  await expect(page.getByTestId("staff-assignee").first()).toContainText(
    "יוסי לוי",
    { timeout: 15_000 },
  );
  await expect(page.getByTestId("staff-progress")).toHaveText("5/5", {
    timeout: 15_000,
  });
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
