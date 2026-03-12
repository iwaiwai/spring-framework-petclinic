---
name: modernization-tobe-vue-ts-implementation
description: >-
  Implement ToBe screens for JSP-to-Vue 3 + TypeScript migration in the PetClinic application.
  Takes As-Is guardrail artifacts (Playwright E2E tests, screen specs, preserve-vs-change logs)
  as contract inputs and produces working Vue 3 + TypeScript replacement screens with full
  backward compatibility. Use this skill whenever the user wants to implement a Vue.js replacement
  for a legacy JSP screen, migrate a specific PetClinic screen to Vue 3, build a ToBe implementation
  for any screen that already has As-Is analysis completed, or perform JSP-to-Vue modernization
  work. Also use when the user mentions ToBe implementation, Vue migration, screen reimplementation,
  or modernization implementation phase — even if they don't explicitly name this skill.
---

# Modernization ToBe Vue 3 + TypeScript Implementation

Implement modernized Vue 3 + TypeScript screens that replace legacy JSP pages while preserving
every user-visible behavior documented in the As-Is guardrail artifacts.

## 1. Purpose

You are a modernization implementation engineer. Your job is to replace legacy JSP screens with
Vue 3 + TypeScript equivalents that pass every existing As-Is guardrail test without modification.

The As-Is analysis phase (handled by the `modernization-asis-test-guardrails` skill) has already
captured what the screen does. Your job is to build the new version that does exactly the same
thing — and then prove it with the same tests.

### Non-goals

- **As-Is analysis is NOT your responsibility.** Never generate screen specs, observations logs, or
  preserve-vs-change documents. Those are inputs you consume, not outputs you produce.
- **Do not redesign the UX.** Preserve all user-visible behavior. Visual modernization (cleaner
  CSS, responsive layout) is acceptable only when the preserve-vs-change log marks it as
  `[ACCEPTABLE-CHANGE]`.
- **Do not create throwaway prototypes.** Every file you produce should be production-quality and
  part of the final application structure.

## 2. Inputs Contract

Before starting implementation, verify that these As-Is artifacts exist:

### Required Inputs

| Artifact | Path | Purpose |
|----------|------|---------|
| Playwright E2E tests | `tests/e2e/<screen>.spec.ts` | Executable compatibility contract |
| Screen spec | `docs/modernization/<screen>-screen-spec.md` | Capability inventory |

### Optional but Recommended

| Artifact | Path | Purpose |
|----------|------|---------|
| Preserve-vs-change log | `docs/modernization/<screen>-preserve-vs-change.md` | Explicit change permissions |
| Test scenarios | `docs/modernization/<screen>-test-scenarios.md` | Prioritized scenario list |
| Observations log | `artifacts/observations/<screen>-observations.md` | Evidence-graded findings |

### When Inputs Are Missing

If the required Playwright test file or screen spec is missing:

1. **Stop implementation.** Do not guess at behavior.
2. Report exactly which artifacts are missing and their expected paths.
3. Provide a ready-to-run prompt for the `modernization-asis-test-guardrails` skill to generate them:
   ```
   Analyze the <screen-name> screen in this PetClinic app and produce As-Is guardrail
   artifacts including Playwright tests, a screen spec, and a preserve-vs-change decision log.
   ```
4. Resume only after the user confirms the artifacts are available.

If the preserve-vs-change log is missing, default to **strict preservation** for all behaviors —
treat every documented behavior as must-preserve until told otherwise.

## 3. Execution Workflow

Follow these steps in order. Do not skip steps.

### Step 1: Verify As-Is Inputs

Read and internalize all available As-Is artifacts for the target screen:

1. Read `tests/e2e/<screen>.spec.ts` — understand every assertion
2. Read `docs/modernization/<screen>-screen-spec.md` — understand all capabilities
3. Read `docs/modernization/<screen>-preserve-vs-change.md` (if exists) — understand change boundaries
4. Summarize: list the URL(s), all user-visible functions, and the must-preserve behaviors

If any required artifact is missing, execute the "When Inputs Are Missing" protocol from Section 2.

### Step 2: Run Baseline Guardrail Tests

Before making any changes, run the existing E2E tests to confirm the current state:

```bash
npx playwright test tests/e2e/<screen>.spec.ts --reporter=line
```

Record whether all tests pass. If tests fail before you've changed anything, stop and report —
the As-Is artifacts may be out of date.

### Step 3: Study Test Locators Before Designing

Before writing any Vue code, read the Playwright E2E test file line by line and extract every
locator and assertion. This step is critical because it tells you the exact DOM contract your
Vue components must satisfy.

Build a locator map:
```
Locator                           → Vue template requirement
input[name="lastName"]            → <input name="lastName" ...>
getByRole('heading', {name: 'Find Owners'}) → <h2>Find Owners</h2>
#ownersTable tbody tr             → <table id="ownersTable"><tbody><tr>...
getByText(/has not been found/i)  → Error message with exact text
```

This locator-first approach prevents most test failures. If you build the DOM structure the
tests expect from the start, you avoid a costly repair loop.

### Step 4: Design the Vue 3 Component Architecture

Plan the Vue 3 + TypeScript component structure:

1. **Identify components** — Map each screen capability to one or more Vue components
2. **Define API endpoints** — Determine what Spring MVC endpoints the Vue app needs (existing
   controllers or new REST endpoints). Prefer adding `@ResponseBody` / `@RestController` endpoints
   alongside existing MVC endpoints to avoid breaking the legacy flow during transition.
3. **Plan routing** — Ensure the same URL paths work. For screens that need to live at the same URL
   as the JSP version, use a strategy that allows coexistence during migration:
   - Option A: Serve Vue app at same path, backend returns Vue host page instead of JSP
   - Option B: Vue app at new path with server-side redirect from old path
   - The chosen strategy must preserve URL compatibility as documented in the screen spec

4. **TypeScript interfaces** — Define types for all data structures the screen uses

Output a brief design summary (including the locator map) before proceeding to implementation.

### Step 5: Implement Vue 3 + TypeScript Components

Create the Vue 3 + TypeScript source files. Follow these conventions:

#### File Structure
```
src/main/frontend/
├── src/
│   ├── components/<screen>/     — Screen-specific Vue components
│   ├── types/<screen>.ts        — TypeScript interfaces
│   ├── api/<screen>.ts          — API client functions
│   ├── router/index.ts          — Vue Router configuration
│   └── App.vue                  — Root component
├── package.json                 — Vue/Vite dependencies
├── vite.config.ts               — Vite build configuration
└── tsconfig.json                — TypeScript configuration
```

#### Implementation Rules

- **Vue 3 Composition API** with `<script setup lang="ts">` syntax
- **TypeScript strict mode** — no `any` types, all props and emits typed
- **No JSP dependency** — the final screen must work without JSP rendering. The controller
  serves a static HTML page via `@ResponseBody` (loaded from `classpath:vue/<screen>.html`).
  This HTML contains the full PetClinic layout (navbar, CSS, footer) and a `<div id="vue-app">`
  mount point. Do not embed Vue inside a JSP page.
- **Server-side data embedding** — For screens that display server data on initial load (e.g.,
  search results), the controller queries the database and embeds the result as
  `<script>window.__PETCLINIC_<DATA>__=<JSON>;</script>` before `</body>`. The Vue component
  reads this data synchronously during setup (before the first render), avoiding timing issues
  with non-retrying Playwright assertions like `expect(await locator.count()).toBeGreaterThan(0)`.
- **Preserve all user-visible text** — error messages, labels, headings, button text must match
  exactly what the screen spec documents
- **Preserve URL structure** — the screen must be accessible at the same URL path(s) documented
  in the screen spec
- **Preserve navigation flows** — all links, redirects, and transitions must work as documented
  (e.g., single-result search redirecting directly to detail page)

### Step 6: Add/Update Spring Backend Support

Create the JSP-independent serving infrastructure:

1. **Static HTML host page** — Create `src/main/resources/vue/<screen>.html` with the full
   PetClinic layout (navbar, CSS, Pivotal logo, Bootstrap JS) and a `<div id="vue-app">`
   mount point. This is a plain HTML file, not a JSP.
2. **Controller update** — Modify the controller to serve the HTML page via `@ResponseBody`:
   ```java
   @Value("classpath:vue/<screen>.html")
   private Resource htmlResource;
   private String htmlTemplate;

   @PostConstruct
   void init() throws IOException {
       htmlTemplate = new String(htmlResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
   }

   @GetMapping(value = {"/path"}, produces = MediaType.TEXT_HTML_VALUE)
   @ResponseBody
   public String serveVuePage(@RequestParam(required = false) String param) {
       if (param != null) {
           // Query data and embed as JSON in the HTML
           String json = objectMapper.writeValueAsString(dtos);
           return htmlTemplate.replace("</body>",
               "<script>window.__PETCLINIC_DATA__=" + json + ";</script>\n</body>");
       }
       return htmlTemplate;
   }
   ```
3. **REST API endpoints** — Add `@RestController` endpoints for any client-side API calls needed
4. **Update backend tests** — Change assertions from view name checks to content string checks
   (e.g., `content().string(containsString("vue-app"))`)

Run the backend tests to ensure no regression:

```bash
./mvnw -q test
```

### Step 7: Run Guardrail Verification

This is the critical validation step. Run the same Playwright E2E tests that were created
during the As-Is analysis phase:

```bash
npx playwright test tests/e2e/<screen>.spec.ts --reporter=line
```

**All tests must pass.** These tests are the compatibility contract — they verify that the new
Vue implementation behaves identically to the legacy JSP version from the user's perspective.

### Step 8: Fix Failures (Repair Loop)

If any E2E tests fail:

1. **Read the failure output** — understand exactly which assertion failed and why
2. **Categorize the failure:**
   - Missing functionality → implement it
   - Wrong text/label → fix to match screen spec
   - Wrong URL/redirect → fix routing
   - Timing issue → add appropriate waits (but verify the behavior is actually correct)
   - Locator issue → verify the DOM structure matches what tests expect
3. **Fix and re-run** — apply the fix, then re-run the full test suite
4. **Log every fix** — record what failed, why, and what you changed

Repeat this loop until all tests pass. If a test seems fundamentally incompatible with the Vue
architecture (e.g., it checks for JSP-specific DOM), note it but do not modify the test — report
it as a finding that needs human review.

### Step 9: Final Validation

Run the complete verification suite:

```bash
# E2E tests for the target screen
npx playwright test tests/e2e/<screen>.spec.ts --reporter=line

# Backend unit tests
./mvnw -q test
```

Both must pass before declaring the migration complete.

### Step 10: Generate Migration Report

Produce a structured summary (see Section 6 for the required format).

## 4. Screen Onboarding Template

Use this template when onboarding a new screen for ToBe implementation. Copy and fill in
the placeholders.

```markdown
# ToBe Migration: <Screen Name>

## Pre-flight Checklist
- [ ] As-Is E2E tests exist: tests/e2e/<screen>.spec.ts
- [ ] Screen spec exists: docs/modernization/<screen>-screen-spec.md
- [ ] Preserve-vs-change log reviewed (or defaulting to strict)
- [ ] Baseline E2E tests pass on current JSP version

## Screen Identity
- **Legacy URL(s):** <e.g., /owners/find, /owners>
- **Controller(s):** <e.g., OwnerController.java>
- **JSP file(s):** <e.g., findOwners.jsp, ownersList.jsp>

## Capabilities (from screen spec)
1. <capability 1>
2. <capability 2>
...

## Must-Preserve Behaviors
1. <behavior 1 — from preserve-vs-change or screen spec>
2. <behavior 2>
...

## Acceptable Changes
1. <change 1 — from preserve-vs-change>
2. <change 2>
...

## Vue Components Planned
| Component | Responsibility | Corresponds to |
|-----------|---------------|----------------|
| <Name>.vue | <what it does> | <JSP section> |

## API Endpoints Needed
| Method | Path | Response | Existing? |
|--------|------|----------|-----------|
| GET | /api/... | ... | Yes/No |

## Verification Commands
npx playwright test tests/e2e/<screen>.spec.ts --reporter=line
./mvnw -q test
```

## 5. Failure Patterns and Fixes

Common failure patterns encountered during JSP-to-Vue migration and their fixes:

### Pattern 1: Locator Mismatch
**Symptom:** Playwright test fails with "element not found" or timeout.
**Cause:** Vue renders different DOM structure than JSP (different tag nesting, missing IDs).
**Fix:** Ensure Vue components render the same semantic HTML elements that the E2E tests target.
Check what locators the test uses (role-based, name-based, ID-based) and ensure your Vue template
produces matching elements. Do NOT modify the E2E test — adapt your Vue template.

### Pattern 2: Navigation/Redirect Missing
**Symptom:** Test expects to be on a different URL after an action.
**Cause:** Vue SPA routing doesn't replicate server-side redirects.
**Fix:** Implement the same redirect logic in Vue Router or in the API response handler.
For example, if the legacy app redirects to owner details when search returns exactly one result,
your Vue component must do the same via `router.push()`.

### Pattern 3: Server-Side Form Validation Messages Missing
**Symptom:** Test expects specific error message text that doesn't appear.
**Cause:** Legacy JSP uses Spring MVC server-side validation with specific message keys.
**Fix:** Either replicate validation messages client-side (matching exact text from screen spec)
or call the server validation endpoint and display returned messages.

### Pattern 4: Table/List Data Not Rendering
**Symptom:** Test expects table rows or list items that aren't present.
**Cause:** API endpoint not returning data, or Vue component not rendering it correctly.
**Fix:** Verify the API endpoint returns the expected data structure. Check that `v-for` rendering
matches the expected DOM structure (e.g., `<table>` with `<tr>` elements, matching IDs/classes
the tests use as locators).

### Pattern 5: Timing Issues with Non-Retrying Assertions
**Symptom:** Tests intermittently fail with `expect(await locator.count()).toBeGreaterThan(0)`
returning 0, even though the data appears in error-context snapshots taken moments later.
**Cause:** Vue's async fetch + re-render creates a window where a heading is visible but table
rows haven't been patched into the DOM yet. Non-retrying assertions like `await locator.count()`
capture the state at that exact instant.
**Fix:** Use **server-side data embedding** — the controller embeds search results as
`window.__PETCLINIC_DATA__` in the HTML. The Vue component reads this data synchronously during
`<script setup>` (before the first render), so the heading and rows render together in Vue's
initial DOM patch. This eliminates the async gap entirely.
```typescript
// In <script setup>: read data BEFORE first render
const embedded = (window as unknown as Record<string, unknown>).__PETCLINIC_OWNERS__ as OwnerDto[] | undefined;
const view = ref<ViewState>(embedded && embedded.length > 1 ? 'list' : 'search');
const owners = ref<OwnerDto[]>(embedded && embedded.length > 1 ? embedded : []);
```
**Important:** Using `v-show` + `nextTick` or `onMounted` hooks is NOT sufficient — the data
must be available during component setup, not after mounting.

### Pattern 6: Build Integration Issues
**Symptom:** `./mvnw -q test` passes but the Vue app doesn't serve correctly.
**Cause:** Vite build output not integrated into the WAR packaging.
**Fix:** Configure `vite.config.ts` to output to a directory that the Maven WAR plugin includes.
Alternatively, configure Maven to run `npm run build` during the `generate-resources` phase.

## 6. Required Final Summary Format

At the end of every ToBe implementation, report in exactly this format:

```
## ToBe Migration Summary: <Screen Name>

### 1. Created/Updated Files
- <path> — <what it does>

### 2. As-Is Contract Compliance
- Screen spec referenced: <path>
- Preserve-vs-change referenced: <path> (or "not available — strict mode applied")
- Must-preserve behaviors verified: <count>/<total>

### 3. Verification Results
- `npx playwright test tests/e2e/<screen>.spec.ts`: <PASS/FAIL> (<N> tests)
- `./mvnw -q test`: <PASS/FAIL>

### 4. Repair Log
| # | Test | Failure Reason | Fix Applied | Result |
|---|------|---------------|-------------|--------|
| 1 | ... | ... | ... | PASS |

### 5. Architecture Decisions
- Component structure: <brief>
- API strategy: <new endpoints / existing reuse>
- Routing strategy: <how URL compat is achieved>

### 6. Remaining Items
- <any items needing human decision>
- <any tests that couldn't be made to pass and why>
```

## Reference Files

Read these when you need detailed guidance for specific scenarios:

- `references/vue-conventions.md` — Vue 3 + TypeScript patterns, Composition API examples,
  and component organization for this project
