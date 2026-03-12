# Find Owners — Preserve vs Change Decision Log

## Purpose

This document records explicit decisions about what must be preserved exactly,
what may change during modernization, and what requires human decision.

## Must Preserve (Business Behavior)

These behaviors must be functionally identical in the new implementation.
The implementation may differ, but the user-observable outcome must match.

| # | Behavior | Rationale | Evidence | Test Reference |
|---|----------|-----------|----------|----------------|
| 1 | Empty search returns all owners | Users rely on this to browse all owners | [CONFIRMED] | SC-002 |
| 2 | Single match redirects directly to owner details | Avoids unnecessary intermediate list for unique results | [CONFIRMED] | SC-003 |
| 3 | Multiple matches display in a table with Name, Address, City, Telephone, Pets columns | Core data display contract | [CONFIRMED] | SC-004, SC-006 |
| 4 | Prefix matching on last name (LIKE 'input%') | Users expect partial name search to work | [CONFIRMED] | SC-005 |
| 5 | "has not been found" error when no results | User feedback on empty results | [CONFIRMED] | SC-010 |
| 6 | Search term preserved in input after error | UX continuity — user doesn't retype | [CONFIRMED] | SC-011 |
| 7 | Owner names in results are clickable links to details | Primary navigation path to owner details | [CONFIRMED] | SC-008, SC-009 |
| 8 | Pet names displayed per owner in results | Business data visibility | [CONFIRMED] | SC-007 |
| 9 | "Add Owner" link available on search page | Entry point for owner creation | [CONFIRMED] | SC-012 |
| 10 | Search uses GET parameters (bookmarkable URLs) | Shareable/bookmarkable search results | [CONFIRMED] | SC-014 |

## Acceptable Changes (Modernization Differences)

These behaviors may change as part of modernization without functional regression.
The business outcome is preserved even if the interaction pattern changes.

| # | Legacy Behavior | Acceptable New Behavior | Rationale |
|---|----------------|------------------------|-----------|
| 1 | Full page reload on form submit | SPA in-place update via API call | Standard SPA pattern; same search outcome |
| 2 | Server-rendered results page (ownersList.jsp) | Client-side rendered table from JSON API | Same data display, better UX |
| 3 | Server-side redirect for single result (HTTP 302) | Client-side router navigation | Same end result (user sees owner details) |
| 4 | Server-side form error rendering | Client-side inline error display | Faster feedback; same error message |
| 5 | Bootstrap 3 CSS classes (form-horizontal, control-group) | Modern CSS framework or Bootstrap 5 | Visual modernization |
| 6 | JSP layout tag wrapping | Vue component + router-view layout | Framework modernization |
| 7 | `<form:errors>` tag for error display | Vue reactive error binding | Same message, different rendering mechanism |

## Requires Human Decision

These items are ambiguous and need explicit human approval before proceeding.

| # | Question | Context | Options | Impact |
|---|----------|---------|---------|--------|
| 1 | Should search be case-sensitive? | Legacy uses SQL LIKE which is case-insensitive in HSQLDB but may vary by production DB | A) Keep case-insensitive / B) Make explicitly case-insensitive in API | Wrong choice could break user expectations |
| 2 | Should the "not found" error message text be preserved exactly? | Legacy shows "has not been found" (from messages.properties `notFound` key) | A) Preserve exact text / B) Allow modernized wording | Minor UX difference but could affect e2e tests |
| 3 | Should URL structure be preserved (`/owners?lastName=X`)? | Legacy URLs may be bookmarked or linked externally | A) Keep same URLs / B) Allow new URL scheme (e.g., `/owners?q=X`) | Breaking URLs could affect existing bookmarks |
| 4 | Should the single-result redirect behavior be preserved? | Some users may prefer always seeing the list | A) Keep redirect / B) Always show list / C) Make configurable | UX design decision |
| 5 | Should maxlength=80 on lastName input be preserved? | Legacy JSP sets `maxlength="80"` on the input | A) Preserve / B) Remove (rely on server validation) | Minor UX difference |

## Implementation Notes for New Screen

- The search form uses GET method — any Vue implementation should use query parameters or hash-based routing that allows bookmarkable search URLs
- The three-way branching (0/1/many results) is core business logic that must be replicated in the Vue component or API layer
- Pet names in the results table are eagerly loaded via JPA `left join fetch` — ensure the API endpoint returns pet data with owners
- The `id="lastName"` is duplicated on both a `<div>` and `<input>` in legacy JSP — do not replicate this accessibility issue
- The `<label>` element lacks a `for` attribute — fix this in the Vue implementation for accessibility
