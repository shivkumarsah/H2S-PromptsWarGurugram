import { test, expect } from '@playwright/test';

test('Navigate to Home -> Enter Trip -> Wait for Dashboard to load', async ({ page }) => {
  // Go to home page
  await page.goto('/');
  
  // Wait for the hero section to be visible
  await expect(page.locator('h1')).toContainText('Plan your perfect trip');

  // Fill in the destination or natural language input
  const input = page.getByRole('textbox', { name: /describe your dream trip/i });
  await input.fill('3-day trip to Tokyo under $1500');

  // Submit the form
  const generateButton = page.locator('#plan-trip-btn');
  await generateButton.click();

  // Wait for navigation to dashboard (URL should contain /dashboard)
  await expect(page).toHaveURL(/\/dashboard/);

  // We should see either the generating state or the dashboard view.
  // Wait for at least "My Trips" or the Destination name header to appear.
  await expect(page.getByRole('complementary', { name: /Trip navigation sidebar/i })).toBeVisible();
});
