# Find Owners — As-Is Screen Specification

## Overview

- **Screen:** Find Owners
- **URLs:** `/owners/find` (search form), `/owners` (search results)
- **Controller:** `OwnerController.java`
- **View templates:** `findOwners.jsp`, `ownersList.jsp`
- **Analysis date:** 2026-03-12
- **Application version:** Spring Framework PetClinic (current HEAD)

## Purpose

Allows users to search for pet owners by last name. Provides a single text input for prefix-based
search and displays results as a table or directly redirects to owner details when a single match
is found.

## Navigation Context

- **Accessed from:** Top navigation menu ("FIND OWNERS"), any page via navbar
- **Navigates to:** Owner details page (`/owners/{id}`), Add Owner form (`/owners/new`)
- **Menu position:** Main navbar item labeled "FIND OWNERS"

## Screen Capabilities

### Capability 1: Search Owners by Last Name (Prefix Match)

- **Trigger:** Enter text in Last Name field and click "Find Owner"
- **Input:** Last name text (partial or full)
- **Behavior:** LIKE prefix search (`lastName%`) against database
- **Output:** Depends on result count (see conditional behavior below)
- **Evidence:** [CONFIRMED] — tested with "Franklin", "Davis", "D", empty, and non-existent names
- **Priority:** P0

### Capability 2: List All Owners (Empty Search)

- **Trigger:** Click "Find Owner" with empty Last Name field
- **Input:** None (empty string)
- **Behavior:** Returns all owners from database
- **Output:** Owners table showing all 10 seeded owners
- **Evidence:** [CONFIRMED] — submitted empty form, saw 10 rows
- **Priority:** P0

### Capability 3: Direct Navigation for Single Match

- **Trigger:** Search that returns exactly one owner
- **Input:** Last name matching a single owner (e.g., "Franklin")
- **Behavior:** HTTP redirect to owner details page
- **Output:** Owner details page at `/owners/{id}`
- **Evidence:** [CONFIRMED] — searched "Franklin", redirected to `/owners/1`
- **Priority:** P0

### Capability 4: Navigate to Add Owner

- **Trigger:** Click "Add Owner" link
- **Input:** None
- **Behavior:** Navigates to new owner creation form
- **Output:** Page at `/owners/new`
- **Evidence:** [CONFIRMED] — clicked link, navigated to `/owners/new`
- **Priority:** P1

### Capability 5: Navigate to Owner Details from Results

- **Trigger:** Click owner name link in results table
- **Input:** None
- **Behavior:** Navigates to owner details page
- **Output:** Owner details page showing full info, pets, and visits
- **Evidence:** [CONFIRMED] — clicked "George Franklin" link, reached `/owners/1`
- **Priority:** P1

## Form Fields

| Field | Type | Required | Validation | Default | Notes |
|-------|------|----------|------------|---------|-------|
| Last name | text | No | maxlength=80 | Empty | Prefix match search; empty = all results |

## Data Display

### Owners Table (ownersList.jsp)

| Column | Content | Sortable | Notes |
|--------|---------|----------|-------|
| Name | firstName + lastName (linked) | No | Links to `/owners/{id}` |
| Address | owner.address | No | |
| City | owner.city | No | |
| Telephone | owner.telephone | No | |
| Pets | Space-separated pet names | No | Multiple pets shown inline |

- **Empty state:** "has not been found" error displayed on the search form (no separate empty table)
- **Pagination:** None — all matching results shown at once

## Validation Rules

| Rule | Trigger | Message | Evidence |
|------|---------|---------|----------|
| No results found | Submit search with non-matching name | "has not been found" | [CONFIRMED] |

## Error Handling

| Error Condition | User Experience | Evidence |
|-----------------|-----------------|----------|
| No matching owners | Returns to search form with "has not been found" error; input value preserved | [CONFIRMED] |

## Conditional Behavior

| Condition | Behavior When True | Behavior When False | Evidence |
|-----------|-------------------|---------------------|----------|
| 0 results | Show search form + error message | N/A | [CONFIRMED] |
| 1 result | Redirect to `/owners/{id}` | N/A | [CONFIRMED] |
| 2+ results | Show owners table | N/A | [CONFIRMED] |
| Empty search input | Treat as search for all (empty string LIKE '%') | Search with provided value | [CONFIRMED] |

## Screenshots

| State | File | Description |
|-------|------|-------------|
| Default | `artifacts/screenshots/find-owners/default-state.png` | Empty search form |
| All results | `artifacts/screenshots/find-owners/all-owners.png` | All 10 owners listed |
| Not found | `artifacts/screenshots/find-owners/not-found-error.png` | Error message for no match |
| Multiple results | `artifacts/screenshots/find-owners/multiple-results.png` | Filtered table (2 Davis entries) |
