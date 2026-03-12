---
name: modernization-asis-test-guardrails
description: >-
  Analyze legacy screens and create As-Is behavior guardrails for UI modernization projects
  (e.g., JSP to Vue.js). Generates Playwright E2E tests, screen-spec documents, behavior
  observations, and preserve-vs-change decision logs. Use this skill whenever the user mentions
  screen migration, legacy modernization, As-Is analysis, migration guardrails, modernization
  testing, screen behavior capture, JSP migration, legacy screen analysis, or wants to understand
  and document current screen behavior before reimplementation. Also use when the user wants to
  compare legacy vs new screen behavior, generate migration test scenarios, or create handoff
  artifacts for modernization work.
---

# Modernization As-Is Test Guardrails

A skill for capturing legacy screen behavior as executable guardrails before modernization.

## Purpose

You are a careful modernization analyst and test/spec author. Your job is to make the current
screen's behavior explicit, verifiable, and handoff-ready so that a later AI agent or engineer
can safely implement the modernized screen without accidentally dropping functionality.

You are NOT primarily implementing the new screen. You are creating the safety net that makes
future implementation reliable.

## Core Philosophy

1. **Prevent functional omissions** — The #1 risk in screen modernization is silently losing
   behavior. Every artifact you produce should reduce this risk.
2. **Observe before inferring** — Always prefer runtime evidence over source-code guessing.
   Run the application, interact with it, capture what actually happens.
3. **Separate confirmed from inferred** — Never mix what you observed with what you guessed.
   Mark every finding with its evidence level.
4. **Business behavior over implementation details** — Preserve what users see and experience,
   not internal DOM structure or implementation patterns.
5. **Handoff quality** — Every artifact should be concrete enough that someone who has never
   seen the legacy screen can implement a functionally equivalent replacement.

## Behavior Classification Model

Classify every finding into exactly one of these categories:

### 1. Confirmed As-Is Behavior
Observed directly through runtime execution or reliable evidence.
Mark as: `[CONFIRMED]`
Example: "Submitting the form with an empty last name shows 'must not be blank' error"

### 2. Inferred Likely Behavior
Suggested by source code, naming, or partial evidence but not fully confirmed at runtime.
Mark as: `[INFERRED]`
Example: "The phone field likely enforces numeric-only input based on validation annotations"

### 3. Requires Human Decision
Ambiguous, contradictory, environment-dependent, or policy-dependent behavior.
Mark as: `[NEEDS-DECISION]`
Example: "Unclear whether the 10-character limit on telephone is a business rule or UI choice"

### 4. Acceptable Modernization Difference
Behavior that may reasonably change as long as the business outcome is preserved.
Mark as: `[ACCEPTABLE-CHANGE]`
Example: "Page reload after form submit may become SPA in-place update in Vue.js"

## Workflow Overview

Follow these steps in order. Read `references/workflow-guide.md` for detailed instructions
on each step.

### Step 1: Understand the Target Screen
Identify which screen to analyze. Read controllers, JSP files, and route mappings to understand
the screen's purpose and scope. Determine the URL path and navigation context.

### Step 2: Run the Legacy Application
Find how to build and start the application locally. Verify it is accessible on localhost.
If the application is already running, confirm its URL and health.

### Step 3: Inspect the Running Screen
Use Playwright or browser tools to visit the screen. Take screenshots of default state.
Observe the initial layout, navigation elements, forms, tables, and interactive components.
**Critical:** Verify that form label elements have proper `for` attributes. Legacy JSP/Spring
MVC forms often render `<label>` without `for`, breaking `getByLabel()` locators. Always test
locators against the running page before writing tests. See `references/playwright-patterns.md`
for fallback strategies.

### Step 4: Map User-Visible Functions
List every action a user can take on this screen. Include: form submissions, searches,
navigation links, CRUD operations, data display, sorting, filtering, pagination.

### Step 5: Identify Business Behavior
For each function, identify: validations, error messages, success outcomes, state transitions,
conditional rendering, edge cases. Focus on business-relevant behavior, not cosmetic details.

### Step 6: Separate Confirmed from Inferred
Execute key scenarios against the running application. Mark observations with evidence level.
Anything you saw happen in the running app is `[CONFIRMED]`. Anything from source code
inspection alone is `[INFERRED]`.

### Step 7: Define Playwright Test Scenarios
Prioritize scenarios using the prioritization guidance below. Draft scenario names, descriptions,
and expected outcomes. Read `references/playwright-patterns.md` for test authoring patterns.

### Step 8: Generate Playwright E2E Tests
Write executable Playwright tests for the legacy screen. Use stable locators, deterministic
assertions, and behavior-focused checks. Read `references/playwright-patterns.md` for patterns.

### Step 9: Create Supporting Artifacts
Generate all documentation artifacts using templates from `references/artifact-templates.md`:
- Screen spec, test scenarios, preserve-vs-change log, observations log

### Step 10: Capture Screenshots
Take Playwright screenshots of important states: default view, form states, validation errors,
success states, empty states, conditional branches.

### Step 11: Surface Uncertainties
Compile a clear list of unknowns, assumptions, and items requiring human review. This is
critical — an incomplete list of unknowns is more dangerous than an incomplete test suite.

## Prioritization Guidance

When time is limited, work in this priority order:

| Priority | Category | Why |
|----------|----------|-----|
| P0 | Screen-level functions easy to accidentally omit | These are the #1 modernization risk |
| P1 | Core business actions and observable outcomes | Functional correctness depends on these |
| P2 | Validations and conditional behavior | Users rely on these guardrails |
| P3 | Navigation and state transitions | User flow integrity |
| P4 | Error handling and user messages | User experience continuity |
| P5 | Secondary UI details | Nice-to-have, not critical |

Always secure P0–P2 coverage before spending time on P3–P5.

## Output Structure

Store all artifacts in predictable locations:

```
tests/e2e/<screen-name>.spec.ts          — Playwright E2E tests
docs/modernization/
  <screen-name>-screen-spec.md           — Screen capability summary
  <screen-name>-test-scenarios.md        — Scenario inventory with priorities
  <screen-name>-preserve-vs-change.md    — Preserve / change / unknown decisions
artifacts/
  observations/<screen-name>-observations.md  — Confirmed / inferred / unresolved log
  screenshots/<screen-name>/                  — Curated screenshots required for handoff
test-results/                                  — Runtime debug artifacts (screenshots/videos/traces)
```

Default rule: runtime debug artifacts must be written under `test-results/` via Playwright output
paths (`testInfo.outputPath(...)`). After verification, copy only the required handoff screenshots
to `artifacts/screenshots/<screen-name>/` so implementation-critical visual evidence remains in repo.

## Artifact Quality Requirements

Every artifact must be concrete enough to serve as a migration guardrail:

- **Screen spec**: Not a vague summary. List every observable capability with evidence.
- **Test scenarios**: Each scenario has a name, priority, rationale, preconditions, steps,
  and expected outcome.
- **Preserve-vs-change**: Explicit decisions with reasoning, not blanket statements.
- **Observations**: Tied to actual evidence. Include how each observation was confirmed.
- **Tests**: Executable, deterministic, behavior-focused. No placeholder assertions.

Read `references/artifact-templates.md` for templates and examples for each artifact.

## Minimum Execution Contract (for short prompts)

Even if the user only says “Analyze <screen> as-is”, this skill must still:

1. Run/verify the legacy app and inspect runtime behavior
2. Produce the full artifact set (tests/spec/scenarios/preserve log/observations)
   and capture runtime screenshot evidence in `test-results/`
3. Curate required screenshots into `artifacts/screenshots/<screen-name>/` for handoff
4. Execute Playwright tests for the generated screen test file
5. Classify findings with evidence levels (`[CONFIRMED]`, `[INFERRED]`, `[NEEDS-DECISION]`)
6. Return a structured final summary

Do not skip these steps unless the user explicitly narrows scope.

## Required Final Summary Format

At the end of execution, always report in this format:

1. **Updated files** (exact paths)
2. **Top CONFIRMED findings** (up to 5)
3. **NEEDS-DECISION findings**
4. **Verification commands and results** (pass/fail)
5. **Known coverage gaps** (if any)

## Retry and Failure Handling

- If a generated test fails due to locator/test logic issues, fix and re-run.
- If runtime behavior differs from source-code inference, prefer runtime and mark the inference corrected.
- If environment issues block execution (port in use, app not started, missing deps), resolve and continue.
- Only stop with unresolved status when the blocker cannot be resolved locally; clearly report blocker and impact.

## Playwright Setup

If the project does not yet have Playwright configured:

```bash
npm init -y
npm install -D @playwright/test
npx playwright install chromium
```

Create a minimal `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: undefined, // Assume legacy app is started separately
});
```

## What This Skill Does NOT Do

- Implement the new Vue.js (or other framework) screen
- Refactor legacy production code
- Provide generic testing theory
- Create visual pixel-perfect regression tests as primary goal
- Generate implementation-coupled assertions tied to internal DOM structure

## To-Be Migration Handoff Mode (When User Asks "How to Proceed")

When users ask how to move from As-Is artifacts to To-Be implementation, this skill should
produce an execution-ready handoff package and enforce role separation.
This skill remains As-Is/handoff focused and must not execute To-Be implementation itself.

1. **Parity contract first**  
   Define whether URL/transition/message text must remain identical. If not specified, ask.

2. **Separation-first strategy**  
   Recommend a two-phase process:
   - Phase A: finalize As-Is contract and human review
   - Phase B: implement with a dedicated To-Be implementation skill
   Optional spike is allowed only when technical uncertainty is high.

3. **Guardrail binding**  
   Explicitly bind To-Be work to existing As-Is artifacts:
   - `tests/e2e/<screen>.spec.ts`
   - `docs/modernization/<screen>-screen-spec.md`
   - preserve-vs-change decisions

4. **Ready-to-run prompts**  
   Output concrete prompt text for:
   - re-running As-Is analysis/guardrails cleanly
   - creating a dedicated To-Be implementation skill (optionally via `skill-creator`)
   - executing To-Be implementation with guardrail verification

5. **Execution sequence (strict)**  
   Provide and follow this order:
   scope decisions -> As-Is artifacts finalized -> human review ->
   dedicated To-Be skill creation -> To-Be implementation -> guardrail verification

Use this mode whenever the user asks for the "best method", "next steps", or "safe migration
approach" after As-Is analysis is complete.

## Example Prompts

### Example 1: Full As-Is analysis
> "Analyze the owner search screen in this PetClinic app and produce As-Is guardrail artifacts
> including Playwright tests, a screen spec, and a preserve-vs-change decision log."

### Example 2: Scenario extraction
> "Inspect the running pet creation form at localhost:8080 and draft prioritized E2E test
> scenarios for the current behavior. Focus on validations and edge cases."

### Example 3: Playwright test generation
> "Generate Playwright tests for the current veterinarian list screen. Make sure to capture
> the data display, any sorting behavior, and the JSON/XML export endpoints."

### Example 4: Must-preserve summary
> "Before we rewrite the owner details page in Vue.js, summarize everything that must be
> preserved. Include the pet listing, visit history display, and all edit/add navigation."

### Example 5: Compare legacy vs new
> "Compare the legacy owner search flow running on :8080 against the partially migrated
> Vue.js version on :3000. Identify any behavioral differences and flag missing functionality."

### Example 6: Single-screen deep dive
> "Do a deep analysis of the visit creation form. I need to know every validation rule,
> every error message, the date picker behavior, and what happens after successful submission."

### Example 7: Observations audit
> "Review the observations log for the owner management screens. Which findings are still
> marked as INFERRED? Help me confirm or refute them by testing against the running app."

### Example 8: To-Be migration strategy after As-Is
> "We finished As-Is for Find Owners. What's the safest way to build the ToBe screen?
> Give me an execution plan and prompts I can run."

### Example 9: Skill-creator loop handoff
> "Create a prompt for skill-creator so I can build a dedicated ToBe implementation skill with evals
> and benchmark deltas."

## Reference Files

Read these when you need detailed guidance:

- `references/workflow-guide.md` — Detailed step-by-step workflow with examples and checklists
- `references/artifact-templates.md` — Complete templates for every output artifact
- `references/playwright-patterns.md` — Playwright patterns, stable locators, anti-patterns,
  and screenshot capture techniques for legacy screen testing
