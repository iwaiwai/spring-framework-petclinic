# Find Owners — Behavior Observations Log

## Metadata

- **Analyst:** Copilot (As-Is Guardrail Skill)
- **Date:** 2026-03-12
- **Application URL:** http://localhost:8080
- **Application version:** Spring Framework PetClinic (current HEAD)
- **Analysis method:** Runtime inspection via Playwright + source code review

## Confirmed Behavior [CONFIRMED]

Observations verified by direct runtime interaction.

### OBS-C001: Default Form State

- **Category:** display
- **How confirmed:** Navigated to `/owners/find`, inspected DOM snapshot
- **Observation:** Page shows heading "Find Owners", a "Last name" label (without `for` attribute), an empty text input (`name="lastName"`, `maxlength="80"`), a "Find Owner" submit button, and an "Add Owner" link below the form
- **Screenshot:** `artifacts/screenshots/find-owners/default-state.png`
- **Test reference:** "should display search form with last name field and Find Owner button"

### OBS-C002: Duplicate ID on lastName

- **Category:** display
- **How confirmed:** `document.querySelectorAll('#lastName')` returned 2 elements: a `<div class="control-group">` and an `<input class="form-control">`
- **Observation:** The JSP template sets `id="lastName"` on both the wrapper div and the input field, creating invalid HTML with duplicate IDs. This breaks `page.locator('#lastName')` in Playwright strict mode.
- **Test reference:** N/A (workaround: use `input[name="lastName"]` locator)

### OBS-C003: Label Without for Attribute

- **Category:** display
- **How confirmed:** `document.querySelectorAll('label')` inspection showed `for: null` on the "Last name" label
- **Observation:** The `<label>` element displays "Last name" but has no `for` attribute linking it to the input. This means `getByLabel('Last name')` fails in Playwright and is an accessibility issue.
- **Test reference:** N/A (workaround documented)

### OBS-C004: Empty Search Returns All Owners

- **Category:** function
- **How confirmed:** Clicked "Find Owner" with empty input, observed results
- **Observation:** Submitting the form with an empty Last name field navigates to `/owners?lastName=` and displays a table with all 10 seeded owners. The controller converts null to empty string for broadest search.
- **Screenshot:** `artifacts/screenshots/find-owners/all-owners.png`
- **Test reference:** "should show all owners when searching with empty last name"

### OBS-C005: Single Match Redirect

- **Category:** function
- **How confirmed:** Searched "Franklin", observed HTTP redirect
- **Observation:** When search returns exactly one owner, the controller issues a redirect to `/owners/{id}` (e.g., `/owners/1`). The user sees the owner details page directly, never the results table.
- **Test reference:** "should find single owner by exact last name and redirect to details"

### OBS-C006: Multiple Match Table Display

- **Category:** function
- **How confirmed:** Searched "Davis", observed table with 2 rows
- **Observation:** When search returns 2+ owners, results are displayed in a table with columns: Name (linked), Address, City, Telephone, Pets. Searched "Davis" and saw Betty Davis and Harold Davis.
- **Screenshot:** `artifacts/screenshots/find-owners/multiple-results.png`
- **Test reference:** "should show filtered results table when multiple owners match"

### OBS-C007: Not-Found Error Display

- **Category:** validation
- **How confirmed:** Searched "ZZZNonExistent", observed error
- **Observation:** When no owners match, the user is returned to the search form with "has not been found" displayed below the input field. The searched value is preserved in the input.
- **Screenshot:** `artifacts/screenshots/find-owners/not-found-error.png`
- **Test reference:** "should show 'has not been found' for non-existent owner"

### OBS-C008: Prefix Matching Semantics

- **Category:** function
- **How confirmed:** Searched "D", observed Davis entries in results
- **Observation:** Search uses SQL LIKE with prefix matching (`lastName%`). Entering "D" returns all owners whose last name starts with "D". This is not exact match or contains — it is starts-with matching.
- **Test reference:** "should perform prefix matching on last name search"

### OBS-C009: Pet Names in Results Table

- **Category:** data
- **How confirmed:** Inspected table rows for multi-pet owners
- **Observation:** Jean Coleman shows "Max Samantha" and Carlos Estaban shows "Lucky Sly" in the Pets column. Pet names are space-separated, sorted case-insensitively (per `Owner.getPets()` comparator).
- **Test reference:** "should display pet names for owners with multiple pets"

### OBS-C010: Owner Names Link to Details

- **Category:** navigation
- **How confirmed:** Inspected link hrefs and clicked links
- **Observation:** Each owner name in the results table is an `<a>` link with href `/owners/{id}`. Clicking navigates to the owner details page.
- **Test reference:** "should link owner names to their detail pages"

### OBS-C011: GET Method for Search

- **Category:** function
- **How confirmed:** Observed URL after search submission
- **Observation:** The form uses `method="get"`, so search parameters appear in the URL query string (e.g., `/owners?lastName=Davis`). This makes search results bookmarkable.
- **Test reference:** "should use GET method for search form"

### OBS-C012: Results Table Seeded Data (10 owners)

- **Category:** data
- **How confirmed:** Counted rows in empty-search results
- **Observation:** The seeded database contains exactly 10 owners: George Franklin, Betty Davis, Eduardo Rodriquez, Harold Davis, Peter McTavish, Jean Coleman, Jeff Black, Maria Escobito, David Schroeder, Carlos Estaban.
- **Test reference:** "should show all owners when searching with empty last name"

## Inferred Behavior [INFERRED]

Observations based on source code or indirect evidence, not directly confirmed at runtime.

### OBS-I001: Case-Insensitive Search

- **Category:** function
- **Source of inference:** SQL LIKE behavior depends on database collation; HSQLDB default is case-insensitive
- **Inference:** Search is likely case-insensitive (e.g., "franklin" matches "Franklin")
- **Confidence:** Medium
- **How to confirm:** Test with lowercase search term at runtime

### OBS-I002: No Pagination Support

- **Category:** function
- **Source of inference:** Controller returns all results in a single Collection; JSP renders all with `<c:forEach>`; no page/size parameters
- **Inference:** There is no pagination — all matching owners are displayed at once regardless of count
- **Confidence:** High
- **How to confirm:** Add 100+ owners and verify all render on one page

### OBS-I003: No Sorting Control

- **Category:** function
- **Source of inference:** No ORDER BY in JPQL query; no sort UI controls in JSP
- **Inference:** Results order is database-default (likely insertion order / primary key order)
- **Confidence:** High
- **How to confirm:** Verify row order matches primary key order

### OBS-I004: Pet Names Sorted Case-Insensitively

- **Category:** data
- **Source of inference:** `Owner.getPets()` uses `Comparator.comparing(Pet::getName, String.CASE_INSENSITIVE_ORDER)`
- **Inference:** Pet names within each owner row are sorted alphabetically (case-insensitive)
- **Confidence:** High
- **How to confirm:** Owner with pets "Zebra" and "alpha" should show "alpha Zebra"

## Unresolved Questions [NEEDS-DECISION]

### OBS-U001: Case Sensitivity of Search

- **Question:** Should search be explicitly case-insensitive regardless of database?
- **Context:** Legacy behavior depends on HSQLDB collation (case-insensitive by default). Production database may differ.
- **Why unresolved:** Database-dependent behavior cannot be guaranteed across environments
- **Suggested options:** A) Enforce case-insensitive in application layer / B) Keep database-dependent behavior
- **Impact if wrong:** Users may not find owners with different capitalization

### OBS-U002: Maximum Result Set Size

- **Question:** Should there be a limit on the number of results displayed?
- **Context:** Empty search returns all owners. With thousands of owners, this could be a performance issue.
- **Why unresolved:** Not a problem with 10 seeded owners; could become one at scale
- **Suggested options:** A) Add pagination / B) Add result limit / C) Keep unlimited
- **Impact if wrong:** Performance degradation or missing data

## Acceptable Modernization Differences [ACCEPTABLE-CHANGE]

### OBS-A001: Page Reload on Search

- **Legacy behavior:** Full page reload (MPA form submission) on every search
- **Expected new behavior:** SPA in-place update — form submits via fetch/axios, results render without page reload
- **Business outcome preserved:** Same search functionality and results
- **Rationale:** Standard Vue.js SPA pattern; improved UX with no functional loss

### OBS-A002: Server-Side Redirect for Single Match

- **Legacy behavior:** HTTP 302 redirect from `/owners?lastName=X` to `/owners/{id}`
- **Expected new behavior:** Client-side Vue Router navigation after detecting single result in API response
- **Business outcome preserved:** User still sees owner details directly for single match
- **Rationale:** SPA routing replaces server redirects; same user experience

### OBS-A003: Server-Rendered Error Messages

- **Legacy behavior:** Error message rendered by `<form:errors>` tag on page reload
- **Expected new behavior:** Reactive error display bound to Vue component state
- **Business outcome preserved:** Same "has not been found" message text and placement
- **Rationale:** Vue reactive rendering replaces JSP tag rendering

### OBS-A004: Fix Accessibility Issues

- **Legacy behavior:** Label without `for` attribute; duplicate `id="lastName"` on div and input
- **Expected new behavior:** Proper `<label for="lastName">` association; unique IDs
- **Business outcome preserved:** Same visual appearance; improved accessibility
- **Rationale:** Fixing accessibility bugs is a modernization improvement
