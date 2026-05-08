# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Navigate to Home -> Enter Trip -> Wait for Dashboard to load
- Location: e2e/app.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /plan your perfect trip/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /plan your perfect trip/i })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - img "Adobe Logo" [ref=e5]
    - heading "CPE Intelligence" [level=1] [ref=e6]
    - paragraph [ref=e7]:
      - text: Infra Support & Operations Platform
      - text: Powered by AI
  - generic [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]: Email Address
      - textbox "Email Address" [active] [ref=e11]:
        - /placeholder: Enter your email
    - generic [ref=e12]:
      - generic [ref=e13]: Password
      - generic [ref=e14]:
        - textbox "Password" [ref=e15]:
          - /placeholder: Enter your password
        - generic [ref=e16] [cursor=pointer]: 
    - button "Sign In" [ref=e17] [cursor=pointer]
  - generic [ref=e18]:
    - generic [ref=e19]: Or continue with
    - button " Okta SSO" [ref=e20] [cursor=pointer]:
      - generic [ref=e21]: 
      - generic [ref=e22]: Okta SSO
  - paragraph [ref=e24]: © 2024 Adobe CPE Infrastructure Intelligence. All rights reserved.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Navigate to Home -> Enter Trip -> Wait for Dashboard to load', async ({ page }) => {
  4  |   // Go to home page
  5  |   await page.goto('/');
  6  |   
  7  |   // Wait for the hero section to be visible
> 8  |   await expect(page.getByRole('heading', { name: /plan your perfect trip/i })).toBeVisible();
     |                                                                                ^ Error: expect(locator).toBeVisible() failed
  9  | 
  10 |   // Fill in the destination or natural language input
  11 |   const input = page.getByRole('textbox', { name: /describe your dream trip/i });
  12 |   await input.fill('3-day trip to Tokyo under $1500');
  13 | 
  14 |   // Submit the form
  15 |   const generateButton = page.locator('#plan-trip-btn');
  16 |   await generateButton.click();
  17 | 
  18 |   // Wait for navigation to dashboard (URL should contain /dashboard)
  19 |   await expect(page).toHaveURL(/\/dashboard/);
  20 | 
  21 |   // We should see either the generating state or the dashboard view.
  22 |   // Wait for at least "My Trips" or the Destination name header to appear.
  23 |   await expect(page.getByRole('complementary', { name: /Trip navigation sidebar/i })).toBeVisible();
  24 | });
  25 | 
```