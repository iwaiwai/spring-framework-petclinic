# Artifact Templates

Templates for all output artifacts produced during As-Is screen analysis.
Copy and fill in the relevant template for each screen you analyze.

---

## Table of Contents

1. [Screen Spec](#screen-spec)
2. [Test Scenarios](#test-scenarios)
3. [Preserve vs Change Log](#preserve-vs-change-log)
4. [Observations Log](#observations-log)
5. [Unknowns Summary](#unknowns-summary)

---

## Screen Spec

**File:** `docs/modernization/<screen-name>-screen-spec.md`

```markdown
# <Screen Name> — As-Is Screen Specification

## Overview

- **Screen:** <name>
- **URL:** <path>
- **Controller:** <class name>
- **View template:** <file path>
- **Analysis date:** <date>
- **Application version:** <version or commit>

## Purpose

<1-2 sentence description of what this screen does from the user's perspective>

## Navigation Context

- **Accessed from:** <list of screens/links that lead here>
- **Navigates to:** <list of screens/links available from here>
- **Menu position:** <where it appears in navigation>

## Screen Capabilities

### <Capability 1: e.g., "Search Owners by Last Name">

- **Trigger:** <user action, e.g., "Enter text in Last Name field and click Find Owner">
- **Input:** <what the user provides>
- **Behavior:** <what happens>
- **Output:** <what the user sees>
- **Evidence:** [CONFIRMED] / [INFERRED]
- **Priority:** P0 / P1 / P2 / P3 / P4 / P5

### <Capability 2>

(repeat for each capability)

## Form Fields

| Field | Type | Required | Validation | Default | Notes |
|-------|------|----------|------------|---------|-------|
| <name> | <text/select/date/...> | Yes/No | <rules> | <value> | <notes> |

## Data Display

### <Table/List Name>

| Column | Content | Sortable | Notes |
|--------|---------|----------|-------|
| <name> | <what it shows> | Yes/No | <notes> |

- **Empty state:** <what shows when no data>
- **Pagination:** <yes/no, how it works>

## Validation Rules

| Rule | Trigger | Message | Evidence |
|------|---------|---------|----------|
| <field> required | Submit with empty <field> | "<exact message>" | [CONFIRMED] |
| <field> format | Submit with invalid format | "<exact message>" | [CONFIRMED] |

## Error Handling

| Error Condition | User Experience | Evidence |
|-----------------|-----------------|----------|
| <condition> | <what user sees> | [CONFIRMED] / [INFERRED] |

## Conditional Behavior

| Condition | Behavior When True | Behavior When False | Evidence |
|-----------|-------------------|---------------------|----------|
| <condition> | <behavior> | <behavior> | [CONFIRMED] / [INFERRED] |

## Screenshots

| State | File | Description |
|-------|------|-------------|
| Default | `artifacts/screenshots/<screen>/default.png` | Curated screenshot for implementation handoff |
| (add rows) | | |
```

---

## Test Scenarios

**File:** `docs/modernization/<screen-name>-test-scenarios.md`

```markdown
# <Screen Name> — Test Scenarios for Migration Guardrails

## Summary

- **Total scenarios:** <count>
- **P0 (must not omit):** <count>
- **P1 (core business):** <count>
- **P2 (validations):** <count>
- **P3-P5 (other):** <count>
- **Coverage assessment:** <brief assessment>

## Scenario Inventory

### P0 — Functions Easy to Accidentally Omit

#### SC-001: <Descriptive scenario name>

- **Priority:** P0
- **Category:** <function / validation / navigation / error / display>
- **Rationale:** <Why this is easy to miss and important to preserve>
- **Preconditions:** <What state must exist>
- **Steps:**
  1. <step>
  2. <step>
  3. <step>
- **Expected outcome:** <Observable result>
- **Evidence:** [CONFIRMED] — <how confirmed>
- **Test file:** `tests/e2e/<screen-name>.spec.ts` line <N>

(repeat for each P0 scenario)

### P1 — Core Business Actions

#### SC-00N: <name>

(same format)

### P2 — Validations and Conditional Behavior

(same format)

### P3 — Navigation and State Transitions

(same format)

### P4 — Error Handling and Messages

(same format)

### P5 — Secondary UI Details

(same format)

## Scenarios Not Automated

| ID | Scenario | Reason Not Automated |
|----|----------|---------------------|
| <id> | <name> | <reason: flaky, env-dependent, needs specific data, etc.> |

## Coverage Gaps

<List any known behavioral areas that are NOT covered by scenarios, with rationale>
```

---

## Preserve vs Change Log

**File:** `docs/modernization/<screen-name>-preserve-vs-change.md`

```markdown
# <Screen Name> — Preserve vs Change Decision Log

## Purpose

This document records explicit decisions about what must be preserved exactly,
what may change during modernization, and what requires human decision.

## Must Preserve (Business Behavior)

These behaviors must be functionally identical in the new implementation.
The implementation may differ, but the user-observable outcome must match.

| # | Behavior | Rationale | Evidence | Test Reference |
|---|----------|-----------|----------|----------------|
| 1 | <behavior> | <why it must be preserved> | [CONFIRMED] | SC-001 |

## Acceptable Changes (Modernization Differences)

These behaviors may change as part of modernization without functional regression.
The business outcome is preserved even if the interaction pattern changes.

| # | Legacy Behavior | Acceptable New Behavior | Rationale |
|---|----------------|------------------------|-----------|
| 1 | Full page reload after form submit | SPA in-place update | Standard SPA pattern; same data outcome |
| 2 | Server-side form validation with page reload | Client-side validation with inline messages | Faster feedback; same validation rules |

## Requires Human Decision

These items are ambiguous and need explicit human approval before proceeding.

| # | Question | Context | Options | Impact |
|---|----------|---------|---------|--------|
| 1 | <specific question> | <what was observed> | <option A> / <option B> | <risk if wrong> |

## Implementation Notes for New Screen

<Optional: any guidance for the implementer based on your analysis>
```

---

## Observations Log

**File:** `artifacts/observations/<screen-name>-observations.md`

```markdown
# <Screen Name> — Behavior Observations Log

## Metadata

- **Analyst:** Copilot (As-Is Guardrail Skill)
- **Date:** <date>
- **Application URL:** <URL>
- **Application version:** <version or commit>
- **Analysis method:** Runtime inspection via Playwright + source code review

## Confirmed Behavior [CONFIRMED]

Observations verified by direct runtime interaction.

### OBS-C001: <Title>

- **Category:** <function / validation / navigation / error / display / data>
- **How confirmed:** <description of test or interaction>
- **Observation:** <what was observed>
- **Screenshot:** <path if captured>
- **Test reference:** <test name if automated>

(repeat for each confirmed observation)

## Inferred Behavior [INFERRED]

Observations based on source code or indirect evidence, not directly confirmed at runtime.

### OBS-I001: <Title>

- **Category:** <category>
- **Source of inference:** <file:line, naming convention, pattern, etc.>
- **Inference:** <what is inferred>
- **Confidence:** High / Medium / Low
- **How to confirm:** <suggested verification step>

(repeat for each inferred observation)

## Unresolved Questions [NEEDS-DECISION]

Items that require human judgment or additional context.

### OBS-U001: <Title>

- **Question:** <specific question>
- **Context:** <what was observed or read>
- **Why unresolved:** <why this can't be decided without human input>
- **Suggested options:** <option A> / <option B>
- **Impact if wrong:** <what could go wrong>

(repeat for each unresolved question)

## Acceptable Modernization Differences [ACCEPTABLE-CHANGE]

Behavior that is expected to change during modernization without functional regression.

### OBS-A001: <Title>

- **Legacy behavior:** <current behavior>
- **Expected new behavior:** <how it will likely change>
- **Business outcome preserved:** <what stays the same>
- **Rationale:** <why the change is acceptable>

(repeat for each acceptable change)
```

---

## Unknowns Summary

This section is included at the bottom of the observations log or as a standalone handoff
artifact when the unknowns list is substantial.

```markdown
## Unknowns Requiring Human Review

### Data-Dependent Behavior

| # | Question | What Was Observed | Potential Impact |
|---|----------|-------------------|-----------------|
| 1 | <question> | <context> | <impact> |

### Environment-Dependent Behavior

| # | Question | What Was Observed | Potential Impact |
|---|----------|-------------------|-----------------|

### Policy Decisions

| # | Question | What Was Observed | Potential Impact |
|---|----------|-------------------|-----------------|

### Untested Scenarios

| # | Scenario | Why Not Tested | Risk Level |
|---|----------|---------------|------------|
```
