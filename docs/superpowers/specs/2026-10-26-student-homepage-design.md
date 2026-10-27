# Student homepage, test catalogue and test overview — design

Date: 2026-10-26
API contract: `student-tests-api.md`

## Goal

Give logged-in students (a mix of IELTS and TOEIC learners) a real landing experience:
a light personal homepage that surfaces the latest tests per exam, a full filterable
catalogue, and a per-test overview page that will later become the entry point to
taking a test.

## Scope

In scope:

- Main layout (header, navigation, user menu) for the `(main)` route group
- Homepage `/`
- Catalogue `/tests`
- Test overview `/tests/[id]`

Out of scope (API not available yet, or deferred):

- Starting / saving / submitting attempts, scores, progress, "continue test"
- Rendering full test content (passages, questions, audio) — separate project
- Profile and settings pages
- Adding a test runner (Vitest)

## Decisions

| Topic          | Decision                                                                  |
| -------------- | ------------------------------------------------------------------------- |
| Homepage style | Hybrid: greeting + exam shortcuts + one row of latest tests per exam type |
| Exam switching | `/tests` uses tabs; filters live in the URL (`exam`, `q`, `page`)         |
| Card click     | Opens `/tests/[id]` overview; "Start" button disabled ("Coming soon")     |
| Data fetching  | Server Components via `apiFetch`; client components only change the URL   |
| React Query    | Not used here; reserved for the future test-taking screen                 |

## Routes and files

```
src/app/(main)/
  layout.tsx            header + container; calls getProfile()
  page.tsx              homepage
  loading.tsx           homepage skeleton
  error.tsx             error state with "Try again"
  tests/
    page.tsx            catalogue (reads searchParams)
    loading.tsx
    [id]/
      page.tsx          test overview
      not-found.tsx

src/lib/api/
  student-tests.ts      getStudentTests(params), getStudentTest(id)
  profile.ts            getProfile(), wrapped in React cache()

src/types/student-test.ts   ExamType, SkillType, StudentTestListItem,
                            StudentTestDetail (fields used here), Paginated<T>, Profile

src/constants/exam.ts       EXAM_TYPES, EXAM_SKILLS (exam → skills)

src/components/
  layouts/header.tsx, userMenu.tsx, mobileNav.tsx
  tests/testCard.tsx
  tests/examTypeRow.tsx       async; own Suspense + error handling
  tests/examTypeTabs.tsx      client; sets ?exam=
  tests/testSearch.tsx        client; debounced, sets ?q=
  tests/testPagination.tsx    client; sets ?page=
  tests/skillBadges.tsx
```

i18n: add `home`, `tests`, `exam` namespaces to `messages/vi.json` and `messages/en.json`.
Exam labels come from `exam.<ExamType>`.

UI components come from HeroUI v3 (Card, Tabs, SearchField, Pagination, Chip,
Dropdown, Avatar, Skeleton, Drawer, Tooltip, Button). Read `.heroui-docs` before use.

## Layout (header)

```
[Logo]   Home   Tests            [theme] [VI/EN] [Avatar ▾]
                                                  ├ Full name
                                                  ├ email
                                                  └ Log out
```

- Profile from `GET /auth/profile`, fetched once on the server. Avatar falls back to
  `default-avatar.jpg`.
- On mobile, the nav links collapse into a Drawer.
- If the profile request fails, the header still renders with the default avatar and
  no name.

## Homepage `/`

- Greeting: "Hi {firstName}" + subtitle.
- Shortcut buttons for the four exam types → `/tests?exam=<ExamType>`.
- Placeholder slot (renders nothing) above the rows for future "continue / recent results".
- One row per exam type in `EXAM_TYPES` order: `GET /student/tests?examType=X&take=4`,
  fetched in parallel; each row in its own Suspense boundary with a skeleton.
- Row header: exam label + "See all →" (`/tests?exam=X`).
- A row with no tests is hidden. If all rows are empty, show an empty state.
- A row whose request fails shows "Couldn't load" + retry (`router.refresh()`); other
  rows are unaffected.
- Mobile: rows scroll horizontally. Desktop: 4-column grid.

## Test card

Shows: exam type chip, title, source (hidden if null), skill badges with section
minutes, total duration and published date (each omitted when null). The whole card
links to `/tests/[id]`. Dates formatted with dayjs per current locale.

## Catalogue `/tests`

- URL params: `exam` (ExamType, optional), `q` (search, optional, max 255), `page` (≥1).
- Page size 12.
- Invalid values fall back to defaults: unknown `exam` → all; `page` < 1 or non-numeric → 1;
  `q` trimmed and truncated to 255.
- Tabs: All + four exam types. Changing tab or search resets to page 1.
- Search debounced; updates the URL with `router.replace`.
- Grid: 3 columns desktop, 2 tablet, 1 mobile.
- Pagination + summary "Showing 1–12 of 40".
- Empty result: "No matching tests" + "Clear filters".

## Test overview `/tests/[id]`

- `GET /student/tests/:id`. Non-numeric id or `404` → `notFound()`.
- Shows: back link to `/tests`, exam chip, title, source, total duration, published date.
- "Structure" list: per section in order — skill, minutes, number of parts, number of
  questions (sum of `numberTo − numberFrom + 1` over all questions in the section).
- "Start test" button disabled with a "Coming soon" tooltip.

## Error handling

- `lib/api/student-tests.ts` / `profile.ts` throw `ApiError(status, body)` on non-OK.
- `401` after the proxy has refreshed means the session is gone → `redirect(LOGIN_PATH)`.
- `404` on the detail page → `notFound()`.
- Other errors (403, 5xx, network) on `/tests` and `/tests/[id]` → `(main)/error.tsx`
  with a "Try again" button. Homepage rows handle their own errors (see above).
- Profile errors never break the layout.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` pass.
- Unit tests (Vitest): URL param parsing, question counting, API modules, client
  components (tabs, search, pagination), test card.
- E2E (Playwright) against a mock API: homepage; tab switch, search, pagination on
  `/tests`; invalid `exam` in the URL; unknown test id → 404; a failing homepage row;
  expired session; mobile width.
- Manual check: light/dark theme; vi/en.
