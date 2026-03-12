# Workflow Guide

Detailed step-by-step instructions for analyzing a legacy screen and producing As-Is
modernization guardrails.

---

## Table of Contents

1. [Understand the Target Screen](#step-1-understand-the-target-screen)
2. [Run the Legacy Application](#step-2-run-the-legacy-application)
3. [Inspect the Running Screen](#step-3-inspect-the-running-screen)
4. [Map User-Visible Functions](#step-4-map-user-visible-functions)
5. [Identify Business Behavior](#step-5-identify-business-behavior)
6. [Separate Confirmed from Inferred](#step-6-separate-confirmed-from-inferred)
7. [Define Playwright Test Scenarios](#step-7-define-playwright-test-scenarios)
8. [Generate Playwright E2E Tests](#step-8-generate-playwright-e2e-tests)
9. [Create Supporting Artifacts](#step-9-create-supporting-artifacts)
10. [Capture Screenshots](#step-10-capture-screenshots)
11. [Surface Uncertainties](#step-11-surface-uncertainties)

---

## Step 1: Understand the Target Screen

**Goal:** Know exactly which screen you are analyzing and its boundaries.

### Actions

1. Identify the screen name and URL path (e.g., "Find Owners" at `/owners/find`)
2. Read the controller(s) that serve this screen:
   - Find route mappings (`@GetMapping`, `@PostMapping`, `@RequestMapping`)
   - Identify all HTTP endpoints related to this screen
   - Note model attributes passed to the view
3. Read the view template(s) (JSP, Thymeleaf, etc.):
   - Identify form fields, tables, links, conditional blocks
   - Note included fragments, tag libraries, or partial templates
4. Check for related resources:
   - JavaScript files loaded by the page
   - CSS specific to this screen
   - AJAX endpoints called by the page
5. Determine screen boundaries:
   - What navigation leads TO this screen?
   - What navigation leads FROM this screen?
   - Is this a standalone page or part of a multi-step flow?

### Checklist

- [ ] Screen name and URL documented
- [ ] All related controller endpoints identified
- [ ] View template(s) read and understood
- [ ] Navigation context (in/out) mapped
- [ ] Related JS/AJAX behavior noted

### Output

A brief scope statement like:
> "Analyzing the 'Find Owners' screen at `/owners/find` (GET) and `/owners` (GET).
> Served by `OwnerController`. Uses `findOwners.jsp` and `ownersList.jsp`.
> Links to: owner details, add owner. Linked from: top navigation menu."

---

## Step 2: Run the Legacy Application

**Goal:** Have the legacy application running and accessible on localhost.

### Actions

1. Check if the application is already running:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ || echo "not running"
   ```

2. If not running, find the build/run commands:
   - Check `README.md` or `readme.md` for instructions
   - Check `pom.xml` (Maven), `build.gradle` (Gradle), `package.json` (Node)
   - Common patterns:
     ```bash
     # Maven + Jetty
     ./mvnw jetty:run-war
     # Maven + Spring Boot
     ./mvnw spring-boot:run
     # Gradle
     ./gradlew bootRun
     ```

3. Start the application and wait for it to be ready:
   ```bash
   # Start in background
   nohup ./mvnw jetty:run-war > /tmp/app.log 2>&1 &
   # Wait for readiness
   for i in $(seq 1 60); do
     curl -s http://localhost:8080/ > /dev/null && break
     sleep 2
   done
   ```

4. Verify the target screen is accessible:
   ```bash
   curl -s http://localhost:8080/owners/find | head -20
   ```

### Important

- Note the port number and context path
- If the app uses a database, ensure it is initialized (H2 in-memory usually auto-populates)
- Record the startup command for reproducibility

---

## Step 3: Inspect the Running Screen

**Goal:** See what the user actually sees. Capture the default state.

### Actions

1. Navigate to the target URL using Playwright:
   ```typescript
   await page.goto('http://localhost:8080/owners/find');
   ```

2. Take a screenshot of the default state:
   ```typescript
   await page.screenshot({
     path: testInfo.outputPath('screenshots/default-state.png'),
     fullPage: true
   });
   ```

3. Use an accessibility snapshot or DOM inspection to catalog visible elements:
   - Headings and labels
   - Form fields and their types (text, select, date, etc.)
   - Buttons and their labels
   - Tables and their columns
   - Links and their destinations
   - Navigation elements
   - Messages or status indicators

4. Note the page title, any breadcrumbs, and the active menu state

5. Check for dynamic content:
   - Does anything load asynchronously?
   - Are there JavaScript-driven interactions?
   - Do any elements appear/disappear based on state?

### Key Observations to Record

- Initial visual layout and major sections
- All interactive elements (forms, buttons, links)
- Data display areas (tables, lists, detail cards)
- Error/message display areas
- Navigation affordances

---

## Step 4: Map User-Visible Functions

**Goal:** List every action a user can take on this screen and what happens.

### Categories to Cover

#### Data Entry
- What fields can the user fill in?
- What are the field types (text, dropdown, date picker, checkbox)?
- Are there any default values?
- Is there autocomplete or suggestion behavior?

#### Actions
- What buttons/links trigger actions?
- What happens when each action is performed?
- Are there confirmation dialogs?
- What is the success outcome? (redirect, message, data update)

#### Data Display
- What data is shown? (tables, lists, cards)
- Are columns sortable or filterable?
- Is there pagination?
- How is empty state handled?

#### Navigation
- What links/buttons navigate to other screens?
- What is the back/cancel behavior?
- Are there breadcrumbs?

#### Conditional Behavior
- Does the screen change based on data state?
- Are elements shown/hidden based on conditions?
- Are actions enabled/disabled based on state?

### Output Format

For each function, record:
```
Function: [name]
Trigger: [user action]
Preconditions: [what must be true]
Outcome: [what happens]
Evidence: [CONFIRMED/INFERRED]
Priority: [P0-P5]
```

---

## Step 5: Identify Business Behavior

**Goal:** Understand the business rules embedded in this screen.

### What to Look For

1. **Validation rules**: Required fields, format constraints, value ranges, custom validators
2. **Error messages**: Exact text of validation errors and system errors
3. **Business logic**: Calculations, derived values, conditional rules
4. **State transitions**: What changes in the system after an action?
5. **Data relationships**: How does this screen relate to other data entities?
6. **Authorization**: Are any actions restricted based on user role or data state?

### How to Discover

1. **Runtime testing** (preferred):
   - Submit forms with valid data → record success behavior
   - Submit forms with empty required fields → record validation messages
   - Submit forms with invalid data → record error handling
   - Test boundary values → record limits

2. **Source code inspection** (supplement):
   - Read validation annotations (`@NotBlank`, `@Size`, `@Pattern`)
   - Read custom validators
   - Read controller logic for conditional behavior
   - Read service layer for business rules

3. **Always mark evidence level**:
   - Runtime observation → `[CONFIRMED]`
   - Source code only → `[INFERRED]`
   - Ambiguous → `[NEEDS-DECISION]`

---

## Step 6: Separate Confirmed from Inferred

**Goal:** Ensure every finding has an honest evidence level.

### Rules

1. **Only mark as CONFIRMED if you:**
   - Saw it happen in the running application
   - Captured a screenshot or test assertion proving it
   - Verified the exact behavior through interaction

2. **Mark as INFERRED if you:**
   - Read it in source code but didn't verify at runtime
   - Saw related behavior but didn't test this specific case
   - Deduced it from naming conventions or patterns

3. **Mark as NEEDS-DECISION if:**
   - Source code suggests one thing but runtime shows another
   - The behavior depends on configuration or environment
   - Multiple interpretations are reasonable
   - The behavior seems like it might be a bug vs. intentional

4. **Mark as ACCEPTABLE-CHANGE if:**
   - The behavior is inherently tied to MPA/page-reload patterns
   - The behavior is a side effect of the legacy framework
   - Changing it would be a UX improvement while preserving the business outcome

### Verification Workflow

For each INFERRED finding, try to confirm it:
```
1. Write a quick Playwright interaction that triggers the behavior
2. Observe the actual outcome
3. If confirmed → upgrade to CONFIRMED
4. If different → record the actual behavior
5. If can't test → keep as INFERRED with a note on why
```

---

## Step 7: Define Playwright Test Scenarios

**Goal:** Create a prioritized list of test scenarios before writing test code.

### Scenario Definition

For each scenario, define:

```markdown
### Scenario: [descriptive name]
- **Priority:** P0/P1/P2/P3/P4/P5
- **Category:** [function/validation/navigation/error/display]
- **Rationale:** Why this scenario matters for migration safety
- **Preconditions:** What state must exist before the test
- **Steps:**
  1. Navigate to [URL]
  2. [action]
  3. [action]
- **Expected outcome:** [what should be observable]
- **Evidence level:** CONFIRMED/INFERRED
```

### Prioritization

Apply the prioritization from SKILL.md:
- P0: Functions easy to accidentally omit during migration
- P1: Core business actions with observable outcomes
- P2: Validations and conditional behavior
- P3: Navigation and state transitions
- P4: Error handling and user messages
- P5: Secondary UI details

### Anti-Patterns

Do NOT create scenarios that:
- Test internal DOM structure instead of behavior
- Rely on exact pixel positions or visual layout
- Test framework-specific behavior (e.g., JSP tag rendering)
- Duplicate the same behavior tested at a different level
- Have no clear connection to migration safety

---

## Step 8: Generate Playwright E2E Tests

**Goal:** Write executable tests for the current legacy screen.

Read `references/playwright-patterns.md` for detailed patterns. Key principles:

1. **Use stable locators**: `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors
2. **Assert observable outcomes**: visible text, URL changes, element presence — not internal state
3. **Keep tests independent**: each test should set up its own state
4. **Name tests descriptively**: test names should read as behavior specifications
5. **Group by function**: organize test blocks by screen capability

### Test File Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('<Screen Name> - As-Is Behavior', () => {

  test.describe('Core Functions', () => {
    test('should [behavior description]', async ({ page }) => {
      // Arrange: navigate and set up state
      // Act: perform the user action
      // Assert: verify observable outcome
    });
  });

  test.describe('Validations', () => {
    // validation scenarios
  });

  test.describe('Navigation', () => {
    // navigation scenarios
  });
});
```

### After Writing Tests

1. Run the tests against the legacy application:
   ```bash
   npx playwright test tests/e2e/<screen-name>.spec.ts
   ```
2. Fix any test failures that are due to test bugs (not application bugs)
3. Confirm all tests pass against the current legacy screen
4. Record any test that cannot be made deterministic with a note on why

---

## Step 9: Create Supporting Artifacts

**Goal:** Generate all documentation artifacts for handoff.

Read `references/artifact-templates.md` for complete templates. Create:

1. **Screen spec** (`docs/modernization/<screen-name>-screen-spec.md`):
   A concise summary of every screen capability with evidence levels.

2. **Test scenarios** (`docs/modernization/<screen-name>-test-scenarios.md`):
   The prioritized scenario inventory from Step 7, refined after test authoring.

3. **Preserve-vs-change log** (`docs/modernization/<screen-name>-preserve-vs-change.md`):
   Explicit decisions on what must be preserved, what can change, and what is unknown.

4. **Observations log** (`artifacts/observations/<screen-name>-observations.md`):
   All confirmed, inferred, and unresolved findings with evidence.

---

## Step 10: Capture Screenshots

**Goal:** Visual evidence of important screen states.

### Required Screenshots

- Default/initial state
- Each major form state (empty, filled, error)
- Validation error display
- Success state after form submission
- Empty data state (e.g., no search results)
- Important conditional rendering variations

### Screenshot Guidelines

```typescript
// Always use fullPage for complete capture
// Keep debug artifacts in test-results via testInfo.outputPath(...)
await page.screenshot({
  path: testInfo.outputPath(`screenshots/<state-description>.png`),
  fullPage: true
});

// For specific elements, use element screenshots
const form = page.locator('form');
await form.screenshot({
  path: testInfo.outputPath('screenshots/form-with-errors.png')
});
```

After test verification, curate required implementation screenshots into:
`artifacts/screenshots/<screen-name>/`

```bash
mkdir -p artifacts/screenshots/<screen-name>
find test-results -path '*/screenshots/default-state.png' -exec cp {} artifacts/screenshots/<screen-name>/default-state.png \; -quit
find test-results -path '*/screenshots/validation-errors.png' -exec cp {} artifacts/screenshots/<screen-name>/validation-errors.png \; -quit
```

Name screenshots descriptively: `default-state.png`, `validation-errors.png`,
`search-results-multiple.png`, `empty-results.png`.

---

## Step 11: Surface Uncertainties

**Goal:** Make unknowns visible. This is one of the most valuable steps.

### What to Surface

1. **Behavior you couldn't test**: scenarios that need specific data, timing, or environment
2. **Ambiguous requirements**: behavior that could be a bug or a feature
3. **Environment-dependent behavior**: things that might differ in production
4. **Policy decisions**: choices that need human judgment (e.g., should this validation change?)
5. **Missing test coverage**: scenarios you identified but couldn't automate
6. **Data dependencies**: behavior that depends on specific database content

### Output Format

```markdown
## Unknowns Requiring Human Review

### [Category]

| # | Question | Context | Impact if Wrong |
|---|----------|---------|-----------------|
| 1 | [specific question] | [what you observed] | [what could go wrong] |
```

### Why This Matters

An incomplete list of unknowns is more dangerous than an incomplete test suite.
A missing test can be added later. A missing unknown can cause an undetected
functional regression that reaches production.
