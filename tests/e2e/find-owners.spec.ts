import { test, expect, Page } from '@playwright/test';

test.describe('Find Owners Screen — As-Is Behavior', () => {

  // Legacy JSP: label lacks for-attribute and div#lastName duplicates input#lastName.
  // Use input[name="lastName"] for reliable targeting.
  const lastNameInput = (page: Page) => page.locator('input[name="lastName"]');

  test.beforeEach(async ({ page }) => {
    await page.goto('/owners/find');
  });

  test.describe('P0: Core Search Functions', () => {

    test('should display search form with last name field and Find Owner button', async ({ page }, testInfo) => {
      await expect(page.getByRole('heading', { name: 'Find Owners' })).toBeVisible();
      await expect(page.getByText('Last name')).toBeVisible();
      await expect(lastNameInput(page)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Find Owner' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Add Owner' })).toBeVisible();

      await page.screenshot({
        path: testInfo.outputPath('screenshots/default-state.png'),
        fullPage: true,
      });
    });

    test('should show all owners when searching with empty last name', async ({ page }, testInfo) => {
      await page.getByRole('button', { name: 'Find Owner' }).click();

      await expect(page).toHaveURL(/\/owners\?lastName=$/);
      await expect(page.getByRole('heading', { name: 'Owners' })).toBeVisible();
      await expect(page.getByRole('table')).toBeVisible();

      // Verify table columns
      await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Address' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'City' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Telephone' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Pets' })).toBeVisible();

      // Seeded data has 10 owners
      const rows = page.locator('table tbody tr');
      await expect(rows).toHaveCount(10);

      await page.screenshot({
        path: testInfo.outputPath('screenshots/all-owners.png'),
        fullPage: true,
      });
    });

    test('should find single owner by exact last name and redirect to details', async ({ page }) => {
      await lastNameInput(page).fill('Franklin');
      await page.getByRole('button', { name: 'Find Owner' }).click();

      // Single result redirects directly to owner details — [CONFIRMED]
      await expect(page).toHaveURL(/\/owners\/\d+$/);
      await expect(page.getByRole('heading', { name: 'Owner Information' })).toBeVisible();
      await expect(page.getByText('George Franklin')).toBeVisible();
    });

    test('should show filtered results table when multiple owners match', async ({ page }, testInfo) => {
      await lastNameInput(page).fill('Davis');
      await page.getByRole('button', { name: 'Find Owner' }).click();

      await expect(page).toHaveURL(/\/owners\?lastName=Davis$/);
      await expect(page.getByRole('heading', { name: 'Owners' })).toBeVisible();

      const rows = page.locator('table tbody tr');
      await expect(rows).toHaveCount(2);
      await expect(page.getByRole('link', { name: 'Betty Davis' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Harold Davis' })).toBeVisible();

      await page.screenshot({
        path: testInfo.outputPath('screenshots/multiple-results.png'),
        fullPage: true,
      });
    });

    test('should perform prefix matching on last name search', async ({ page }) => {
      // Searching "D" should match Davis (Betty & Harold)
      await lastNameInput(page).fill('D');
      await page.getByRole('button', { name: 'Find Owner' }).click();

      // Should show at least Davis entries (prefix LIKE 'D%')
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(2);
      await expect(page.getByText('Davis').first()).toBeVisible();
    });
  });

  test.describe('P1: Results Table Data Display', () => {

    test('should display owner details in table with correct columns', async ({ page }) => {
      await page.getByRole('button', { name: 'Find Owner' }).click();

      // Verify known seeded data for George Franklin
      const franklinRow = page.getByRole('row').filter({ hasText: 'George Franklin' });
      await expect(franklinRow).toBeVisible();
      await expect(franklinRow).toContainText('110 W. Liberty St.');
      await expect(franklinRow).toContainText('Madison');
      await expect(franklinRow).toContainText('6085551023');
      await expect(franklinRow).toContainText('Leo');
    });

    test('should display pet names for owners with multiple pets', async ({ page }) => {
      await page.getByRole('button', { name: 'Find Owner' }).click();

      // Jean Coleman has pets Max and Samantha
      const colemanRow = page.getByRole('row').filter({ hasText: 'Jean Coleman' });
      await expect(colemanRow).toContainText('Max');
      await expect(colemanRow).toContainText('Samantha');

      // Carlos Estaban has pets Lucky and Sly
      const estabanRow = page.getByRole('row').filter({ hasText: 'Carlos Estaban' });
      await expect(estabanRow).toContainText('Lucky');
      await expect(estabanRow).toContainText('Sly');
    });

    test('should link owner names to their detail pages', async ({ page }) => {
      await page.getByRole('button', { name: 'Find Owner' }).click();

      const franklinLink = page.getByRole('link', { name: 'George Franklin' });
      await expect(franklinLink).toBeVisible();
      await expect(franklinLink).toHaveAttribute('href', /\/owners\/1$/);
    });

    test('should navigate to owner details when clicking owner name in results', async ({ page }) => {
      await page.getByRole('button', { name: 'Find Owner' }).click();
      await page.getByRole('link', { name: 'George Franklin' }).click();

      await expect(page).toHaveURL(/\/owners\/1$/);
      await expect(page.getByRole('heading', { name: 'Owner Information' })).toBeVisible();
    });
  });

  test.describe('P2: Validation and Error Handling', () => {

    test('should show "has not been found" for non-existent owner', async ({ page }, testInfo) => {
      await lastNameInput(page).fill('ZZZNonExistentOwner');
      await page.getByRole('button', { name: 'Find Owner' }).click();

      // Stays on find form with error — [CONFIRMED]
      await expect(page.getByRole('heading', { name: 'Find Owners' })).toBeVisible();
      await expect(page.getByText('has not been found')).toBeVisible();
      // Input retains the searched value
      await expect(lastNameInput(page)).toHaveValue('ZZZNonExistentOwner');

      await page.screenshot({
        path: testInfo.outputPath('screenshots/not-found-error.png'),
        fullPage: true,
      });
    });

    test('should preserve search term in input after not-found error', async ({ page }) => {
      const searchTerm = 'NonExistentName';
      await lastNameInput(page).fill(searchTerm);
      await page.getByRole('button', { name: 'Find Owner' }).click();

      await expect(lastNameInput(page)).toHaveValue(searchTerm);
    });
  });

  test.describe('P3: Navigation', () => {

    test('should navigate to Add Owner form via link', async ({ page }) => {
      await page.getByRole('link', { name: 'Add Owner' }).click();

      await expect(page).toHaveURL(/\/owners\/new$/);
    });

    test('should be accessible from top navigation', async ({ page }) => {
      // Navigate away first, then use nav to come back
      await page.goto('/');
      // Open hamburger menu if needed (responsive)
      const menuButton = page.locator('button.navbar-toggler');
      if (await menuButton.isVisible()) {
        await menuButton.click();
      }
      await page.getByRole('link', { name: /find owners/i }).click();
      await expect(page).toHaveURL(/\/owners\/find$/);
    });

    test('should use GET method for search form', async ({ page }) => {
      await lastNameInput(page).fill('Davis');
      await page.getByRole('button', { name: 'Find Owner' }).click();

      // GET method means lastName appears in URL query string
      await expect(page).toHaveURL(/\?lastName=Davis/);
    });
  });

  test.describe('P5: Page Meta and Layout', () => {

    test('should have correct page title', async ({ page }) => {
      await expect(page).toHaveTitle(/PetClinic/);
    });

    test('should show last name input with maxlength 80', async ({ page }) => {
      await expect(lastNameInput(page)).toHaveAttribute('maxlength', '80');
    });
  });
});
