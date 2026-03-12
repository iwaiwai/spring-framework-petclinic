# Find Owners — Test Scenarios for Migration Guardrails

## Summary

- **Total scenarios:** 14
- **P0 (must not omit):** 5
- **P1 (core business):** 4
- **P2 (validations):** 2
- **P3 (navigation):** 3
- **P5 (secondary):** 2 (Note: No P4 scenarios identified)
- **Coverage assessment:** All core search flows, result branching, data display, and navigation covered. No pagination or sorting to test (not implemented).

## Scenario Inventory

### P0 — Functions Easy to Accidentally Omit

#### SC-001: Display search form with core elements

- **Priority:** P0
- **Category:** display
- **Rationale:** The search form with its field and buttons is the foundation — easy to forget an element during rewrite
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/owners/find`
  2. Observe page elements
- **Expected outcome:** Heading "Find Owners", "Last name" label, text input, "Find Owner" button, and "Add Owner" link all visible
- **Evidence:** [CONFIRMED] — runtime snapshot verified all elements
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should display search form with last name field and Find Owner button"

#### SC-002: Empty search returns all owners

- **Priority:** P0
- **Category:** function
- **Rationale:** Empty search = show all is a key UX pattern; migration might accidentally require input
- **Preconditions:** Seeded database with 10 owners
- **Steps:**
  1. Navigate to `/owners/find`
  2. Leave Last name empty
  3. Click "Find Owner"
- **Expected outcome:** URL changes to `/owners?lastName=`, heading "Owners" visible, table with 5 columns (Name, Address, City, Telephone, Pets), 10 rows displayed
- **Evidence:** [CONFIRMED] — 10 rows observed in runtime
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should show all owners when searching with empty last name"

#### SC-003: Single match redirects to owner details

- **Priority:** P0
- **Category:** function
- **Rationale:** This redirect-on-single-match pattern is a subtle behavior easily lost during migration
- **Preconditions:** Owner "George Franklin" exists in database
- **Steps:**
  1. Navigate to `/owners/find`
  2. Enter "Franklin" in Last name
  3. Click "Find Owner"
- **Expected outcome:** Redirect to `/owners/1`, "Owner Information" heading visible, "George Franklin" displayed
- **Evidence:** [CONFIRMED] — redirect observed at runtime
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should find single owner by exact last name and redirect to details"

#### SC-004: Multiple matches show filtered table

- **Priority:** P0
- **Category:** function
- **Rationale:** Multi-result display is a distinct view that needs explicit preservation
- **Preconditions:** Betty Davis and Harold Davis exist in database
- **Steps:**
  1. Navigate to `/owners/find`
  2. Enter "Davis" in Last name
  3. Click "Find Owner"
- **Expected outcome:** URL includes `?lastName=Davis`, table with 2 rows showing Betty Davis and Harold Davis
- **Evidence:** [CONFIRMED] — 2 rows observed at runtime
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should show filtered results table when multiple owners match"

#### SC-005: Prefix matching on last name

- **Priority:** P0
- **Category:** function
- **Rationale:** The LIKE prefix search semantics (not exact match, not contains) must be preserved
- **Preconditions:** Davis owners exist
- **Steps:**
  1. Navigate to `/owners/find`
  2. Enter "D" in Last name
  3. Click "Find Owner"
- **Expected outcome:** Results include all owners whose last name starts with "D"
- **Evidence:** [CONFIRMED] — single letter search returned Davis entries
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should perform prefix matching on last name search"

### P1 — Core Business Actions

#### SC-006: Table displays correct data for known owner

- **Priority:** P1
- **Category:** display
- **Rationale:** All 5 data columns must render correctly in migration
- **Preconditions:** George Franklin seeded data
- **Steps:**
  1. Search with empty name
  2. Locate Franklin row
- **Expected outcome:** Row shows "George Franklin", "110 W. Liberty St.", "Madison", "6085551023", "Leo"
- **Evidence:** [CONFIRMED] — data verified at runtime
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should display owner details in table with correct columns"

#### SC-007: Multiple pets displayed per owner

- **Priority:** P1
- **Category:** display
- **Rationale:** Multi-pet display could be missed if only single-pet case is tested
- **Preconditions:** Jean Coleman (Max, Samantha) and Carlos Estaban (Lucky, Sly) in database
- **Steps:**
  1. Search with empty name
  2. Find Coleman and Estaban rows
- **Expected outcome:** Both pet names visible in each row's Pets column
- **Evidence:** [CONFIRMED] — multiple pet names observed
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should display pet names for owners with multiple pets"

#### SC-008: Owner name links to details page

- **Priority:** P1
- **Category:** navigation
- **Rationale:** Link href correctness is essential for navigation
- **Preconditions:** George Franklin exists
- **Steps:**
  1. Search with empty name
  2. Inspect Franklin link href
- **Expected outcome:** Link href matches `/owners/1`
- **Evidence:** [CONFIRMED] — href verified via snapshot
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should link owner names to their detail pages"

#### SC-009: Click owner name navigates to details

- **Priority:** P1
- **Category:** navigation
- **Rationale:** End-to-end navigation flow must work
- **Preconditions:** George Franklin exists
- **Steps:**
  1. Search with empty name
  2. Click "George Franklin" link
- **Expected outcome:** Page navigates to `/owners/1`, "Owner Information" heading visible
- **Evidence:** [CONFIRMED] — navigation tested
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should navigate to owner details when clicking owner name in results"

### P2 — Validations and Conditional Behavior

#### SC-010: Not-found error message display

- **Priority:** P2
- **Category:** validation
- **Rationale:** Error message text and behavior must be preserved
- **Preconditions:** No owner with last name "ZZZNonExistentOwner"
- **Steps:**
  1. Navigate to `/owners/find`
  2. Enter "ZZZNonExistentOwner"
  3. Click "Find Owner"
- **Expected outcome:** Returns to search form, "has not been found" visible, input value preserved
- **Evidence:** [CONFIRMED] — exact error text and value retention observed
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should show 'has not been found' for non-existent owner"

#### SC-011: Search term preserved after not-found error

- **Priority:** P2
- **Category:** validation
- **Rationale:** Value retention is a UX detail that could be lost
- **Preconditions:** None
- **Steps:**
  1. Search for non-existent name
  2. Check input field value
- **Expected outcome:** Input field retains the searched value
- **Evidence:** [CONFIRMED] — value retention verified
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should preserve search term in input after not-found error"

### P3 — Navigation and State Transitions

#### SC-012: Add Owner link navigation

- **Priority:** P3
- **Category:** navigation
- **Rationale:** Secondary navigation must be preserved
- **Steps:**
  1. Click "Add Owner" link on find owners page
- **Expected outcome:** Navigates to `/owners/new`
- **Evidence:** [CONFIRMED] — navigation tested
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should navigate to Add Owner form via link"

#### SC-013: Accessible from top navigation

- **Priority:** P3
- **Category:** navigation
- **Rationale:** Entry point must work
- **Steps:**
  1. Navigate to home page
  2. Use navigation menu to reach Find Owners
- **Expected outcome:** Arrives at `/owners/find`
- **Evidence:** [CONFIRMED] — navigation tested via navbar
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should be accessible from top navigation"

#### SC-014: Search uses GET method (bookmarkable URLs)

- **Priority:** P3
- **Category:** function
- **Rationale:** GET-based search allows bookmarkable/shareable URLs
- **Steps:**
  1. Search for "Davis"
  2. Check URL
- **Expected outcome:** URL includes query string `?lastName=Davis`
- **Evidence:** [CONFIRMED] — URL verified
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should use GET method for search form"

### P5 — Secondary UI Details

#### SC-015: Page title

- **Priority:** P5
- **Steps:** Check page title
- **Expected outcome:** Title contains "PetClinic"
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should have correct page title"

#### SC-016: Input maxlength attribute

- **Priority:** P5
- **Steps:** Check input maxlength
- **Expected outcome:** maxlength="80"
- **Test file:** `tests/e2e/find-owners.spec.ts` — "should show last name input with maxlength 80"

## Scenarios Not Automated

| ID | Scenario | Reason Not Automated |
|----|----------|---------------------|
| — | Case sensitivity of search | Depends on database collation; HSQLDB default is case-insensitive but prod DB may differ |

## Coverage Gaps

- No pagination tested (not implemented in legacy)
- No sorting tested (not implemented in legacy)
- Case sensitivity of search is database-dependent and not tested
- Performance with large datasets not tested (seeded data is small)
