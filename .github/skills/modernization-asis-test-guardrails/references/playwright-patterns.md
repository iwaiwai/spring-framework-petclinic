# Playwright Patterns for Legacy Screen Testing

Patterns, practices, and anti-patterns for writing Playwright E2E tests
as modernization guardrails for legacy screens.

---

## Table of Contents

1. [Locator Strategy](#locator-strategy)
2. [Assertion Patterns](#assertion-patterns)
3. [Test Structure](#test-structure)
4. [Form Testing](#form-testing)
5. [Table and Data Display Testing](#table-and-data-display-testing)
6. [Navigation Testing](#navigation-testing)
7. [Screenshot Capture](#screenshot-capture)
8. [Handling Legacy Quirks](#handling-legacy-quirks)
9. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Locator Strategy

Legacy screens often lack modern `data-testid` attributes. Use this preference order
for stable locators:

### Preferred (Most Stable)

```typescript
// 1. Role-based (most resilient to DOM changes)
page.getByRole('button', { name: 'Find Owner' })
page.getByRole('link', { name: 'Add Owner' })
page.getByRole('heading', { name: 'Find Owners' })
page.getByRole('textbox', { name: 'Last name' })
page.getByRole('table')

// 2. Label-based (stable for form fields)
page.getByLabel('Last name')
page.getByLabel('Birth Date')

// 3. Text-based (stable for visible content)
page.getByText('Owner Information')
page.getByText('No matching owner found')

// 4. Placeholder-based
page.getByPlaceholder('Last name')
```

### Acceptable (When Preferred Options Fail)

```typescript
// 5. CSS selectors for structural patterns (not implementation-specific)
page.locator('form').first()
page.locator('table tbody tr')
page.locator('.has-error .help-inline')  // Bootstrap error class

// 6. Combined locators for precision
page.getByRole('row').filter({ hasText: 'George Franklin' })
page.locator('form').getByRole('button', { name: 'Add Owner' })
```

### Avoid (Fragile)

```typescript
// ❌ XPath (brittle, hard to read)
page.locator('//div[@id="main"]/form/div[3]/input')

// ❌ Deep CSS nesting (tied to DOM structure)
page.locator('#main > div.container > div.row > div.col-md-12 > form > button')

// ❌ Auto-generated IDs or framework-specific classes
page.locator('#j_id_42')
page.locator('.ui-datepicker-trigger')
```

### Dealing with Forms Without Proper Label Associations

**This is extremely common in legacy JSP/Spring MVC applications.** The `<label>` element
exists but lacks a `for` attribute linking it to the input. This means `getByLabel()` will
fail even though a label is visually present.

**Always verify label associations at runtime before writing tests.** Check in the browser
console or via Playwright:

```typescript
// Check if getByLabel works
const input = page.getByLabel('Last name');
// If this times out, the label lacks a for-attribute → fall back

// Inspect the actual HTML
await page.evaluate(() => {
  const labels = document.querySelectorAll('label');
  labels.forEach(l => console.log(l.textContent, 'for:', l.getAttribute('for')));
});
```

**Fallback strategies for legacy forms without label associations:**

```typescript
// 1. By input id (Spring form tags generate predictable ids from path names)
page.locator('#lastName')
page.locator('#firstName')
page.locator('#telephone')

// 2. By input name attribute
page.locator('input[name="lastName"]')

// 3. By role (if there's only one textbox)
page.getByRole('textbox')

// 4. By nearby label text (structural relationship)
page.locator('.control-group:has-text("Last name") input')

// 5. Build a reusable helper for Spring MVC forms
function springField(page: Page, fieldName: string) {
  return page.locator(`#${fieldName}`);
}
// Usage: await springField(page, 'lastName').fill('Franklin');

// 6. For select fields (Spring form:select)
page.locator('#type')  // pet type dropdown
page.locator('select[name="type"]')
```

**Important:** In Spring MVC apps, the `<form:input path="fieldName"/>` tag generates
`<input id="fieldName">`. However, some JSP templates also put `id="fieldName"` on a
wrapper `<div>`, creating **duplicate IDs** on the page. When this happens, `#fieldName`
matches multiple elements and Playwright's strict mode throws an error.

**If you encounter duplicate IDs, use these alternatives:**

```typescript
// Use input[name="..."] instead of #id — name is always unique on the input
page.locator('input[name="lastName"]')

// Or use the role selector if there's only one textbox
page.getByRole('textbox')

// Or scope by element type
page.locator('input#lastName')
```

**Always verify locators at runtime.** Run a quick test, check for strict mode violations,
and adjust accordingly. This is one of the most common failure modes in legacy app testing.

---

## Assertion Patterns

Focus on user-observable outcomes, not internal state.

### Good Assertions (Behavior-Focused)

```typescript
// Page content
await expect(page).toHaveTitle(/PetClinic/);
await expect(page).toHaveURL(/\/owners\/\d+/);

// Visible text and elements
await expect(page.getByRole('heading')).toHaveText('Owners');
await expect(page.getByText('George Franklin')).toBeVisible();

// Form validation messages
await expect(page.locator('.help-inline')).toHaveText('must not be blank');
await expect(page.getByText('must not be blank')).toBeVisible();

// Table data
const rows = page.locator('table tbody tr');
await expect(rows).toHaveCount(10);  // expected result count
await expect(rows.first()).toContainText('Franklin');

// Element state
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible();

// Navigation outcome
await expect(page).toHaveURL('/owners/1');
```

### Poor Assertions (Implementation-Coupled)

```typescript
// ❌ Asserting DOM structure
await expect(page.locator('div.col-md-12')).toHaveCount(3);

// ❌ Asserting CSS classes (implementation detail)
await expect(page.locator('form')).toHaveClass(/form-horizontal/);

// ❌ Asserting attribute values not visible to users
await expect(page.locator('input')).toHaveAttribute('maxlength', '20');

// ❌ Asserting internal JavaScript state
await expect(page.evaluate(() => window.__state)).toBeDefined();
```

---

## Test Structure

### Recommended Organization

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Find Owners Screen — As-Is Behavior', () => {

  // Legacy JSP forms often have broken label associations or duplicate IDs.
  // Always verify locators against the running page and define helpers upfront.
  const lastNameInput = (page: Page) => page.locator('input[name="lastName"]');

  test.beforeEach(async ({ page }) => {
    await page.goto('/owners/find');
  });

  test.describe('P0: Core Search Function', () => {

    test('should display search form with last name field and Find Owner button', async ({ page }) => {
      await expect(page.getByText('Last name')).toBeVisible();
      await expect(lastNameInput(page)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Find Owner' })).toBeVisible();
    });

    test('should find owner by exact last name and navigate to details', async ({ page }) => {
      await lastNameInput(page).fill('Franklin');
      await page.getByRole('button', { name: 'Find Owner' }).click();

      // Single result navigates directly to owner details — [CONFIRMED]
      await expect(page).toHaveURL(/\/owners\/\d+/);
      await expect(page.getByText('George Franklin')).toBeVisible();
    });

    test('should show all owners when searching with empty last name', async ({ page }) => {
      await page.getByRole('button', { name: 'Find Owner' }).click();

      await expect(page.getByRole('table')).toBeVisible();
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });
  });

  test.describe('P2: Validation', () => {

    test('should show not-found message for non-existent owner', async ({ page }) => {
      await lastNameInput(page).fill('ZZZNonExistentOwner');
      await page.getByRole('button', { name: 'Find Owner' }).click();

      await expect(page.getByText('has not been found')).toBeVisible();
    });
  });

  test.describe('P3: Navigation', () => {

    test('should navigate to add owner form', async ({ page }) => {
      await page.getByRole('link', { name: 'Add Owner' }).click();
      await expect(page).toHaveURL('/owners/new');
    });
  });
});
```

### Naming Conventions

Test names should read as behavior specifications:

```typescript
// ✅ Good: describes observable behavior
test('should show validation error when submitting empty required field')
test('should navigate to owner details after successful search with one result')
test('should display all owners in a table when searching with empty name')

// ❌ Bad: describes implementation
test('should trigger form validation')
test('should call the search API')
test('should render the results component')
```

---

## Form Testing

### Complete Form Submission Flow

```typescript
test('should create a new owner with all required fields', async ({ page }, testInfo) => {
  await page.goto('/owners/new');

  // Legacy JSP: labels lack for-attribute, and wrapper divs may share the input's id.
  // Use input[name="..."] for reliable field targeting.
  await page.locator('input[name="firstName"]').fill('John');
  await page.locator('input[name="lastName"]').fill('Doe');
  await page.locator('input[name="address"]').fill('123 Main St');
  await page.locator('input[name="city"]').fill('Springfield');
  await page.locator('input[name="telephone"]').fill('1234567890');

  // Take screenshot before submission
  await page.screenshot({
    path: testInfo.outputPath('screenshots/form-filled.png'),
    fullPage: true
  });

  // Submit
  await page.getByRole('button', { name: 'Add Owner' }).click();

  // Verify outcome: should redirect to owner details
  await expect(page).toHaveURL(/\/owners\/\d+/);
  await expect(page.getByText('John Doe')).toBeVisible();
});
```

### Validation Testing Pattern

```typescript
test('should show validation errors for empty required fields', async ({ page }, testInfo) => {
  await page.goto('/owners/new');

  // Submit with no input
  await page.getByRole('button', { name: 'Add Owner' }).click();

  // Capture validation state
  await page.screenshot({
    path: testInfo.outputPath('screenshots/validation-errors.png'),
    fullPage: true
  });

  // Assert specific error messages
  // Note: Record the exact error text from the running application
  await expect(page.getByText('must not be blank')).toBeVisible();
});

test('should show field-level validation for invalid telephone', async ({ page }) => {
  await page.goto('/owners/new');

  // Legacy JSP forms: use input[name="..."] instead of getByLabel()
  await page.locator('input[name="firstName"]').fill('John');
  await page.locator('input[name="lastName"]').fill('Doe');
  await page.locator('input[name="address"]').fill('123 Main St');
  await page.locator('input[name="city"]').fill('Springfield');
  await page.locator('input[name="telephone"]').fill('not-a-number');

  await page.getByRole('button', { name: 'Add Owner' }).click();

  // Assert validation message for telephone
  await expect(page.getByText(/numeric|digits|number/i)).toBeVisible();
});
```

---

## Table and Data Display Testing

### Table Content Verification

```typescript
test('should display owner list with expected columns', async ({ page }) => {
  await page.goto('/owners');

  const table = page.getByRole('table');
  await expect(table).toBeVisible();

  // Verify column headers exist
  await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Address' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'City' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Telephone' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Pets' })).toBeVisible();
});

test('should display known test data in owner list', async ({ page }) => {
  await page.goto('/owners?lastName=');

  // Verify specific known data from the seeded database
  const franklinRow = page.getByRole('row').filter({ hasText: 'Franklin' });
  await expect(franklinRow).toBeVisible();
  await expect(franklinRow).toContainText('Madison');  // city
});
```

### Empty State Testing

```typescript
test('should display appropriate message when no results found', async ({ page }) => {
  await page.goto('/owners/find');
  await page.getByLabel('Last name').fill('ZZZNoMatchZZZ');
  await page.getByRole('button', { name: 'Find Owner' }).click();

  // Verify empty state handling
  await expect(page.getByText(/not been found|no results|not found/i)).toBeVisible();
});
```

---

## Navigation Testing

```typescript
test('should navigate between related screens', async ({ page }) => {
  // Start at owner details
  await page.goto('/owners/1');

  // Navigate to add pet
  await page.getByRole('link', { name: 'Add New Pet' }).click();
  await expect(page).toHaveURL(/\/owners\/1\/pets\/new/);

  // Navigate back or to another related screen
  // Record the actual navigation flow from the legacy app
});
```

---

## Screenshot Capture

### Systematic Screenshot Helper

```typescript
async function captureScreenState(
  page: Page,
  testInfo: TestInfo,
  stateName: string
): Promise<void> {
  await page.screenshot({
    path: testInfo.outputPath(`screenshots/${stateName}.png`),
    fullPage: true
  });
}

// Usage in tests
test('should capture key states for documentation', async ({ page }, testInfo) => {
  await page.goto('/owners/find');
  await captureScreenState(page, testInfo, '01-default-state');

  await page.getByLabel('Last name').fill('Franklin');
  await captureScreenState(page, testInfo, '02-search-filled');

  await page.getByRole('button', { name: 'Find Owner' }).click();
  await captureScreenState(page, testInfo, '03-search-result');
});
```

---

## Handling Legacy Quirks

### Page Reloads After Form Submit

Legacy MPA apps reload the page on form submit. Playwright handles this naturally,
but be aware:

```typescript
// Playwright auto-waits for navigation after click
await page.getByRole('button', { name: 'Add Owner' }).click();
// At this point, navigation is complete — safe to assert
await expect(page).toHaveURL(/\/owners\/\d+/);
```

### Slow Legacy Applications

```typescript
// Increase timeout for slow legacy apps
test.setTimeout(30000);

// Wait for specific content rather than arbitrary timeouts
await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

// ❌ Never use fixed sleep
// await page.waitForTimeout(5000);
```

### Server-Side Rendering

JSP and similar server-rendered pages are fully loaded when the HTML arrives.
No need to wait for client-side hydration:

```typescript
// For SSR pages, content is available immediately after navigation
await page.goto('/owners/find');
// No need for waitForLoadState or waitForSelector in most cases
await expect(page.getByRole('heading', { name: 'Find Owners' })).toBeVisible();
```

### Date Pickers

Legacy date pickers (jQuery UI, flatpickr) can be tricky. Prefer filling
the underlying input directly:

```typescript
// Instead of interacting with the date picker widget:
await page.getByLabel('Birth Date').fill('2020-01-15');

// If the picker intercepts input, try:
await page.getByLabel('Birth Date').evaluate(
  (el: HTMLInputElement, val: string) => {
    el.value = val;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },
  '2020-01-15'
);
```

---

## Anti-Patterns to Avoid

### 1. Testing DOM Structure Instead of Behavior

```typescript
// ❌ Tied to implementation
await expect(page.locator('div.container > div.row > div.col-md-12')).toBeVisible();

// ✅ Tests observable content
await expect(page.getByRole('heading', { name: 'Owners' })).toBeVisible();
```

### 2. Excessive Waits

```typescript
// ❌ Arbitrary sleep
await page.waitForTimeout(3000);

// ✅ Wait for specific condition
await expect(page.getByRole('table')).toBeVisible();
```

### 3. Testing Framework Internals

```typescript
// ❌ Testing JSP-specific behavior
await expect(page.locator('jsp\\:include')).toHaveCount(2);

// ✅ Testing the rendered result
await expect(page.getByRole('navigation')).toBeVisible();
```

### 4. Non-Deterministic Assertions

```typescript
// ❌ Fragile: exact count depends on test data state
await expect(page.locator('tr')).toHaveCount(47);

// ✅ Robust: verify data exists without exact count
const rows = page.locator('table tbody tr');
await expect(rows.first()).toBeVisible();
expect(await rows.count()).toBeGreaterThan(0);
```

### 5. Over-Asserting Visual Layout

```typescript
// ❌ Visual layout assertion (will break in any redesign)
await expect(page.locator('.sidebar')).toHaveCSS('width', '250px');

// ✅ Functional assertion (the content is accessible)
await expect(page.getByRole('navigation')).toBeVisible();
```

### 6. Ignoring Test Independence

```typescript
// ❌ Tests depend on execution order
test('step 1: create owner', ...);
test('step 2: verify owner was created', ...);  // fails if step 1 didn't run

// ✅ Each test sets up its own state
test('should display created owner on details page', async ({ page }) => {
  // Create owner first, then verify
  await page.goto('/owners/new');
  // ... fill and submit ...
  await expect(page.getByText('John Doe')).toBeVisible();
});
```
