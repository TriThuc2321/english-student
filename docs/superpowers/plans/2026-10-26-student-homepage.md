# Student Homepage, Catalogue and Test Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `(main)` layout (header, nav, user menu), the homepage `/`, the catalogue `/tests` and the test overview `/tests/[id]` for logged-in students, covered by Vitest unit tests and Playwright e2e tests.

**Architecture:** Server Components fetch through `apiFetch` (`src/lib/api/server.ts`) with a typed `apiGet<T>` wrapper that throws `ApiError`. Client components never fetch; they only change the URL (`exam`, `q`, `page`). Homepage rows each get their own Suspense + `catchError` boundary. E2E runs Next against a small mock API server (`e2e/mock-api/server.ts`) because server-side fetches cannot be intercepted by Playwright; the scenario is picked per test through the access-token cookie value.

**Tech Stack:** Next.js 16.3 (App Router, `PageProps<'/route'>`, `error.tsx` with `retry`, `catchError` from `next/error`), React 19.2, HeroUI v3, next-intl 4, dayjs, Tailwind v4, Vitest 5 + Testing Library (jsdom), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-26-student-homepage-design.md` (API contract: `student-tests-api.md`)

## Global Constraints

- Next 16 differs from training data: read the matching file under `node_modules/next/dist/docs/01-app/` before using any Next API. `error.tsx` receives `retry` (not `reset`); `searchParams` / `params` are Promises.
- HeroUI v3 only; read the component's doc in `.heroui-docs/react/components/...` (or the `heroui-react` skill) before using it.
- React Query is not used anywhere in this work.
- Every user-visible string goes through next-intl; every key is added to **both** `messages/en.json` and `messages/vi.json`. Exam labels come from `exam.<ExamType>`.
- Page size on `/tests`: `12`. Homepage rows: `take=4`. `q` max length: `255`.
- Exam type order everywhere: `IELTS_ACADEMIC`, `IELTS_GENERAL`, `TOEIC_LR`, `TOEIC_SW`.
- File naming follows the repo: kebab-case in `src/lib`, camelCase in `src/components`. Unit tests sit next to the file as `*.test.ts(x)` (Vitest only picks up `src/**/*.test.{ts,tsx}`); e2e specs in `e2e/*.spec.ts`.
- Vitest has no `globals`: import `describe/it/expect/vi` from `vitest`. Tests that touch `Request`/`NextResponse`/`fetch` start with `// @vitest-environment node`.
- Components that need translations and are used by both server pages and unit tests use `useTranslations` / `useLocale` (sync, works in Server Components) rather than `getTranslations`, so RTL can render them.
- Comments only when the WHY is non-obvious (CLAUDE.md).
- Every task ends green on: `pnpm typecheck && pnpm lint && pnpm test --run`, plus the task's e2e spec when it has one (`pnpm test:e2e e2e/<name>.spec.ts`).
- Commits: conventional commits (commitlint). Stage only the task's files.

## Review Focus

1. **Expired session with a stale access cookie → redirect loop.** `proxy.ts` sends `/login` back to `/` while an access cookie exists, and a Server Component cannot delete cookies. Expected: user lands on `/login` with cookies cleared. Deviation from the spec's literal `redirect(LOGIN_PATH)`: `apiGet` redirects to a new route handler `/api/session/expired` that clears cookies, then redirects to `LOGIN_PATH`. Pinned by `server.test.ts`, `route.test.ts` (Task 1) and `e2e/session.spec.ts` (Task 8).
2. **Search input vs. URL drift.** "Clear filters", a tab change or back/forward changes `q` while the field holds local state. Expected: the field shows the URL's `q`; typing is never reset by the field's own debounced update. Pinned by `testSearch.test.tsx` (Task 6).
3. **`page` beyond the last page** (`/tests?page=99`). Expected: redirect to the last page, not "No matching tests". Pinned by `e2e/catalogue.spec.ts` (Task 6).
4. **One homepage row fails while the others are empty.** Expected: the failed row's retry UI, not the global empty state. Pinned by `e2e/home.spec.ts` scenario `e2e-row-error-empty` (Task 5).
5. **Malformed ids / params**: `/tests/abc`, `/tests/1.5`, `?exam=FOO`, `?page=abc`, `?page=0`, 300-char `q`, repeated params. Expected: 404 for bad ids; spec fallbacks for params; the API never receives an invalid query. Pinned by `catalogue-params.test.ts` (Task 1) and the e2e specs of Tasks 6–7.

---

## File Structure

```
src/types/student-test.ts            ExamType, SkillType, list/detail types, Paginated<T>, Profile
src/constants/exam.ts                EXAM_TYPES, EXAM_SKILLS, isExamType
src/constants/routes.ts              ROUTES, SESSION_EXPIRED_PATH
src/lib/api/server.ts                (modify) add apiGet<T>
src/lib/api/student-tests.ts         getStudentTests, getStudentTest, TESTS_PAGE_SIZE
src/lib/api/profile.ts               getProfile (React cache)
src/lib/tests/catalogue-params.ts    parseCatalogueParams, buildTestsHref
src/lib/tests/structure.ts           countSectionQuestions
src/lib/date.ts                      formatDate
src/test/render.tsx                  renderWithIntl (RTL + NextIntlClientProvider)
src/app/api/session/expired/route.ts GET: clear session cookies → redirect LOGIN_PATH
src/app/(main)/layout.tsx, error.tsx, page.tsx, loading.tsx
src/app/(main)/tests/page.tsx, loading.tsx
src/app/(main)/tests/[id]/page.tsx, not-found.tsx
src/components/layouts/header.tsx, navLinks.tsx, userMenu.tsx, mobileNav.tsx
src/components/tests/testCard.tsx, skillBadges.tsx, testCardSkeleton.tsx
src/components/tests/examTypeRow.tsx, rowErrorBoundary.tsx, homeEmptyState.tsx
src/components/tests/examTypeTabs.tsx, testSearch.tsx, testPagination.tsx
e2e/mock-api/server.ts               node:http mock of the API, scenarios by token
e2e/fixtures.ts                      `test` with `signIn(scenario)`
e2e/{smoke,header,home,catalogue,overview,session}.spec.ts
playwright.config.ts, .github/workflows/ci.yml   (modify) start mock API, point Next at it
messages/en.json, messages/vi.json   (modify)
```

---

### Task 0: Branch and docs

- [ ] **Step 1:** `main` already contains the Vitest/Playwright setup. Create the branch: `git switch -c feat/student-pages`.
- [ ] **Step 2:** `.heroui-docs/react` is missing. Run `pnpm dlx heroui-cli@latest agents-md --react --output AGENTS.md`. Expected: `.heroui-docs/react/components/` exists. If `AGENTS.md` changes beyond the docs index, restore the rest. If the CLI fails, use the `heroui-react` skill for docs and say so in the task report.
- [ ] **Step 3:** Commit the spec, the plan and `student-tests-api.md`: `git add docs student-tests-api.md && git commit -m "docs: add student homepage spec and plan"`.

---

### Task 1: Types, constants and data layer

**Files:**

- Create: `src/types/student-test.ts`, `src/constants/exam.ts`, `src/constants/routes.ts`, `src/lib/api/student-tests.ts`, `src/lib/api/profile.ts`, `src/lib/tests/catalogue-params.ts`, `src/lib/tests/structure.ts`, `src/app/api/session/expired/route.ts`
- Modify: `src/lib/api/server.ts`
- Test: `src/lib/tests/catalogue-params.test.ts`, `src/lib/tests/structure.test.ts`, `src/constants/exam.test.ts`, `src/lib/api/server.test.ts`, `src/lib/api/student-tests.test.ts`, `src/app/api/session/expired/route.test.ts`

**Interfaces:**

- Produces:
  - Types (field names/nullability verbatim from `student-tests-api.md` §2–4): `ExamType`, `SkillType`, `StudentTestSection`, `StudentTestListItem`, `Paginated<T> = { data: T[]; meta: { page: number; take: number; totalCount: number } }`; `StudentTestDetail` with `testSections: StudentTestSectionDetail[]`, each `{ ...StudentTestSection; testParts: { id; order; title: string | null; questionGroups: { id; order; questions: { id; numberFrom; numberTo; order }[] }[] }[] }` — only these fields. `Profile = { id: string; email: string | null; firstName: string; lastName: string | null; avatar: string | null }`.
  - `EXAM_TYPES: readonly ExamType[]`; `EXAM_SKILLS: Record<ExamType, readonly SkillType[]>` (IELTS ×2 → LISTENING, READING, WRITING, SPEAKING; TOEIC_LR → LISTENING, READING; TOEIC_SW → SPEAKING, WRITING); `isExamType(v: unknown): v is ExamType`.
  - `ROUTES = { HOME: '/', TESTS: '/tests', test: (id: number) => \`/tests/${id}\` }`; `SESSION_EXPIRED_PATH = '/api/session/expired'`.
  - `apiGet<T>(path: string): Promise<T>` — `401` → `redirect(SESSION_EXPIRED_PATH)`; other non-OK → throws `ApiError(status, body)` (class from `src/lib/api/client.ts`); body parsed with `res.json().catch(() => null)`.
  - `TESTS_PAGE_SIZE = 12`; `getStudentTests(params: { examType?: ExamType; search?: string; page?: number; take?: number }): Promise<Paginated<StudentTestListItem>>`; `getStudentTest(id: number): Promise<StudentTestDetail | null>` (null on 404, wrapped in React `cache()`).
  - `getProfile(): Promise<Profile>` wrapped in `cache()`.
  - `CatalogueParams = { exam?: ExamType; q: string; page: number }`; `parseCatalogueParams(sp: Record<string, string | string[] | undefined>): CatalogueParams`; `buildTestsHref(p: Partial<CatalogueParams>): string`.
  - `countSectionQuestions(section: StudentTestSectionDetail): number`.

- [ ] **Step 1: Write the failing pure-function tests**

`catalogue-params.test.ts`:

```ts
describe('parseCatalogueParams', () => {
  it.each([
    [{}, { exam: undefined, q: '', page: 1 }],
    [
      { exam: 'TOEIC_LR', page: '3' },
      { exam: 'TOEIC_LR', q: '', page: 3 },
    ],
    [
      { exam: 'FOO', page: '0' },
      { exam: undefined, q: '', page: 1 },
    ],
    [{ page: 'abc' }, { exam: undefined, q: '', page: 1 }],
    [{ page: '1.5' }, { exam: undefined, q: '', page: 1 }],
    [{ page: '-2' }, { exam: undefined, q: '', page: 1 }],
    [
      { exam: ['IELTS_GENERAL', 'TOEIC_SW'], q: '  cam  ' },
      { exam: 'IELTS_GENERAL', q: 'cam', page: 1 },
    ],
  ])('parses %o', (input, expected) => {
    expect(parseCatalogueParams(input)).toEqual(expected);
  });

  it('truncates q to 255 characters after trimming', () => {
    expect(parseCatalogueParams({ q: ` ${'a'.repeat(300)} ` }).q).toHaveLength(
      255,
    );
  });
});

describe('buildTestsHref', () => {
  it.each([
    [{}, '/tests'],
    [{ page: 1 }, '/tests'],
    [{ exam: 'TOEIC_LR', q: 'cam', page: 1 }, '/tests?exam=TOEIC_LR&q=cam'],
    [{ q: 'a b', page: 2 }, '/tests?q=a+b&page=2'],
  ])('builds %o', (input, expected) => {
    expect(buildTestsHref(input as Partial<CatalogueParams>)).toBe(expected);
  });
});
```

`structure.test.ts` — `countSectionQuestions` returns `20` for a section with part 1 = questions 1..10 (single) and part 2 = 11..18 (single) + one question `numberFrom: 19, numberTo: 20`; returns `0` for a section with no parts.

`exam.test.ts` — `isExamType` accepts each of `EXAM_TYPES`, rejects `'ielts_academic'`, `''`, `undefined`, `1`; `EXAM_SKILLS.TOEIC_SW` equals `['SPEAKING', 'WRITING']`.

- [ ] **Step 2: Run** `pnpm test --run src/lib/tests src/constants` — Expected: FAIL (modules missing).

- [ ] **Step 3: Implement** types, constants, `parseCatalogueParams` (first value of repeated params; `exam` via `isExamType`; `q` trim then `slice(0, 255)`; `page` must match `/^\d+$/` and be ≥ 1), `buildTestsHref` (params in order `exam`, `q`, `page` via `URLSearchParams`; omit undefined exam, empty q, page 1), `countSectionQuestions` (sum of `numberTo − numberFrom + 1`).

- [ ] **Step 4: Run** the same command — Expected: PASS.

- [ ] **Step 5: Write the failing API tests** (`// @vitest-environment node`)

Shared mocks: `vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: 'token' }) }) }))`; `vi.mock('next/navigation', () => ({ redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT'); }) }))`; `vi.stubGlobal('fetch', vi.fn())` returning `new Response(JSON.stringify(body), { status })`.

`server.test.ts`:

- `apiGet returns the parsed body on 200` and sends `Authorization: Bearer token`.
- `apiGet redirects to the session-expired route on 401` → `expect(redirect).toHaveBeenCalledWith('/api/session/expired')`.
- `apiGet throws ApiError with status and body on 500` → `rejects.toMatchObject({ status: 500, data: { message: 'boom' } })`.

`student-tests.test.ts`:

- `getStudentTests sends only defined params` — call with `{ examType: 'TOEIC_LR', take: 4 }`; fetched URL ends with `/api/student/tests?examType=TOEIC_LR&take=4`.
- `getStudentTests omits an empty search` — `{ search: '', page: 2, take: 12 }` → URL ends with `/api/student/tests?page=2&take=12`.
- `getStudentTest returns null on 404`.
- `getStudentTest rethrows other errors` — 500 → rejects with `ApiError` status 500.

`route.test.ts`:

- `GET clears both session cookies and redirects to /login` — `const res = await GET(new NextRequest('http://localhost/api/session/expired'))`; `res.status` is 307; `new URL(res.headers.get('location')!).pathname === '/login'`; `res.cookies.get('st_access_token')?.value === ''` and same for `st_refresh_token` (deleted cookies are emitted empty).

- [ ] **Step 6: Run** `pnpm test --run src/lib/api src/app/api` — Expected: FAIL.

- [ ] **Step 7: Implement** `apiGet`, `student-tests.ts`, `profile.ts`, and `route.ts` (`export async function GET(request: NextRequest)` → `NextResponse.redirect(new URL(LOGIN_PATH, request.url))` + `clearSession(response.cookies)`; `/api/session/*` is excluded from the proxy matcher, so no loop). Read `route.md` first.

- [ ] **Step 8: Run** `pnpm typecheck && pnpm lint && pnpm test --run` — Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/types src/constants src/lib/api src/lib/tests src/app/api/session/expired
git commit -m "feat: add student tests data layer"
```

---

### Task 2: E2E harness with a mock API

**Files:**

- Create: `e2e/mock-api/server.ts`, `e2e/fixtures.ts`, `e2e/smoke.spec.ts`
- Modify: `playwright.config.ts`, `.github/workflows/ci.yml`

**Interfaces:**

- Produces:
  - Mock API on `http://localhost:4010` (env `MOCK_API_PORT`, default `4010`), paths prefixed `/api`. Single file, **no local imports** (run directly with `node e2e/mock-api/server.ts` via Node 24 type stripping — erasable TS only, no enums). `GET /health` → 200.
  - Scenario = the bearer token. Fixture `e2e/fixtures.ts` exports `test` (extends Playwright `test`) with `signIn(scenario: Scenario = 'e2e')`, which adds cookies `st_access_token=<scenario>` and `st_refresh_token=e2e-refresh` for `localhost`; also re-exports `expect`.
  - `type Scenario = 'e2e' | 'e2e-row-error' | 'e2e-row-error-empty' | 'e2e-empty' | 'e2e-no-profile' | 'e2e-error' | 'e2e-expired'`.

Mock data (specs assert these exact values):

| item                     | value                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile                  | `{ id: 'u1', email: 'linh@example.com', firstName: 'Linh', lastName: 'Nguyen', avatar: null }`                                                                  |
| IELTS_ACADEMIC           | 14 tests, ids 1–14, titles `Academic Test 1`…`14`, source `Cambridge IELTS 18`, 160 min                                                                         |
| IELTS_GENERAL            | 0 tests                                                                                                                                                         |
| TOEIC_LR                 | 3 tests, ids 101–103, titles `TOEIC LR Test 1`…`3`, source `null`, `durationMinutes: null`                                                                      |
| TOEIC_SW                 | 2 tests, ids 201–202, titles `TOEIC SW Test 1`…`2`, source `ETS 2024`                                                                                           |
| Ordering                 | `publishedAt` descending; higher id = newer within an exam type; all IELTS newer than all TOEIC                                                                 |
| Search                   | case-insensitive substring of title or source                                                                                                                   |
| Detail (any existing id) | sections per `EXAM_SKILLS`; first section LISTENING 30 min with the Task 1 structure (2 parts, 20 questions); each other section 60 min, 1 part, questions 1–13 |
| Unknown id               | 404 `{ message: 'Not found', statusCode: 404 }`                                                                                                                 |

Scenario behaviour:

| token                 | behaviour                                             |
| --------------------- | ----------------------------------------------------- |
| `e2e`                 | data above                                            |
| `e2e-row-error`       | `/student/tests?examType=TOEIC_LR` → 500              |
| `e2e-row-error-empty` | every list empty, except `examType=TOEIC_LR` → 500    |
| `e2e-empty`           | every list `{ data: [], meta: { …, totalCount: 0 } }` |
| `e2e-no-profile`      | `/auth/profile` → 500                                 |
| `e2e-error`           | every `/student/tests*` → 500                         |
| `e2e-expired`         | every request → 401                                   |
| missing header        | 401                                                   |

`POST /auth/logout` → 201 for any token.

- [ ] **Step 1: Write `e2e/smoke.spec.ts`**

```ts
test('signed-in user stays on the homepage', async ({ page, signIn }) => {
  await signIn();
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
});
```

- [ ] **Step 2: Run** `pnpm test:e2e e2e/smoke.spec.ts` — Expected: FAIL (fixture missing).

- [ ] **Step 3: Implement** the mock server and fixture.

- [ ] **Step 4: Update `playwright.config.ts`**

`PORT` default becomes `3100` so local runs never reuse a normal `pnpm dev` that points at the real API. `webServer` becomes an array: first `{ command: 'node e2e/mock-api/server.ts', url: 'http://localhost:4010/health', reuseExistingServer: !CI }`, then the existing Next entry with `env: { NEXT_PUBLIC_API_URL: 'http://localhost:4010' }` (process env wins over `.env.local`). If Next refuses to start a second dev server in the same project while you have `pnpm dev` running, stop yours before `pnpm test:e2e`.

- [ ] **Step 5: Update `.github/workflows/ci.yml`** — e2e job `NEXT_PUBLIC_API_URL: http://localhost:4010` (the value is inlined at build time, so it must match the mock).

- [ ] **Step 6: Run** `pnpm test:e2e` — Expected: `smoke.spec.ts` and the existing `auth.spec.ts` pass.

- [ ] **Step 7: Commit**

```bash
git add e2e playwright.config.ts .github/workflows/ci.yml
git commit -m "test: add mock API and auth fixture for e2e"
```

---

### Task 3: Main layout, header and error boundary

**Files:**

- Rewrite: `src/app/(main)/layout.tsx`
- Create: `src/app/(main)/error.tsx`, `src/components/layouts/header.tsx`, `navLinks.tsx`, `userMenu.tsx`, `mobileNav.tsx`, `src/test/render.tsx`
- Modify: `src/components/layouts/index.ts`, `messages/en.json`, `messages/vi.json`
- Test: `src/components/layouts/navLinks.test.tsx`, `e2e/header.spec.ts`

**Interfaces:**

- Consumes: `getProfile`, `Profile`, `ROUTES` (Task 1); `signIn` (Task 2); existing `SwitchLocale`, `ThemeSwitch`, `logout`, `LogoHorizontalIcon`, `default-avatar.jpg`.
- Produces:
  - `renderWithIntl(ui: ReactElement, opts?: { locale?: 'en' | 'vi' }): RenderResult` — wraps in `NextIntlClientProvider` with the matching `messages/*.json`, `timeZone: 'UTC'`.
  - `<Header profile={Profile | null} />` (server); `<NavLinks orientation="horizontal" | "vertical" onNavigate?: () => void />` (client; active via `usePathname`: `/` exact, `/tests` prefix; active link has `aria-current="page"`); `<UserMenu profile={Profile | null} />` (client); `<MobileNav />` (client, HeroUI Drawer, trigger hidden from `md` up).

i18n keys:

| key                        | en                                            | vi                                         |
| -------------------------- | --------------------------------------------- | ------------------------------------------ |
| `common.nav.home`          | Home                                          | Trang chủ                                  |
| `common.nav.tests`         | Tests                                         | Đề thi                                     |
| `common.nav.openMenu`      | Open menu                                     | Mở menu                                    |
| `common.userMenu`          | Account menu                                  | Menu tài khoản                             |
| `common.error.title`       | Something went wrong                          | Đã có lỗi xảy ra                           |
| `common.error.description` | We couldn't load this page. Please try again. | Không thể tải trang này. Vui lòng thử lại. |
| `common.error.retry`       | Try again                                     | Thử lại                                    |

- [ ] **Step 1: Read docs** — HeroUI `dropdown.mdx`, `avatar.mdx`, `drawer.mdx`; Next `error.md`, `layout.md`, `04-functions/unstable_rethrow.md`.

- [ ] **Step 2: Write failing tests**

`navLinks.test.tsx` (mock `next/navigation` `usePathname`):

- `marks Tests active on /tests/12` → link "Tests" has `aria-current="page"`, "Home" does not.
- `marks Home active only on /` → on `/tests`, "Home" has no `aria-current`.
- `calls onNavigate when a link is clicked`.

`e2e/header.spec.ts`:

- `shows the user menu with name and email` — `signIn()`, goto `/`, open the button named "Account menu"; expect text `Linh Nguyen` and `linh@example.com`.
- `logs out to /login` — click "Logout" in the menu → URL `/login`.
- `renders without a profile` — `signIn('e2e-no-profile')`, goto `/` → heading/nav visible, menu opens without `linh@example.com`.
- `uses a drawer on mobile` — viewport 375×800; nav link "Tests" is hidden; click "Open menu" → "Tests" visible; click it → URL `/tests` (404 page is fine at this point).

- [ ] **Step 3: Run** `pnpm test --run src/components/layouts && pnpm test:e2e e2e/header.spec.ts` — Expected: FAIL.

- [ ] **Step 4: Implement**

Layout: `const profile = await getProfile().catch((error) => { unstable_rethrow(error); return null; })` — lets the 401 redirect through while other profile errors yield `null`. Render `<Header profile={profile} />` and `<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">{children}</main>`; remove the placeholder logout form. Header: logo → `/` and `NavLinks` (hidden below `md`) on the left; `ThemeSwitch`, `SwitchLocale`, `UserMenu`, `MobileNav` on the right; sticky with a bottom border. UserMenu: avatar `profile?.avatar ?? defaultAvatar.src`; header shows full name and email (each omitted when missing); "Logout" item (`auth.logout`) runs `startTransition(() => logout())`. `error.tsx`: `'use client'`, props `{ error: Error & { digest?: string }; retry: () => void }`, `console.error(error)` in an effect, `common.error.*` + Button calling `retry()`.

- [ ] **Step 5: Run** the Step 3 commands plus `pnpm typecheck && pnpm lint` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(main)/layout.tsx" "src/app/(main)/error.tsx" src/components/layouts src/test e2e/header.spec.ts messages
git commit -m "feat: add main layout header and error boundary"
```

---

### Task 4: Test card and skill badges

**Files:**

- Create: `src/lib/date.ts`, `src/components/tests/testCard.tsx`, `skillBadges.tsx`, `testCardSkeleton.tsx`
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `src/lib/date.test.ts`, `src/components/tests/testCard.test.tsx`

**Interfaces:**

- Consumes: `StudentTestListItem`, `ROUTES.test` (Task 1); `renderWithIntl` (Task 3).
- Produces:
  - `formatDate(iso: string, locale: 'en' | 'vi'): string` — dayjs + `localizedFormat` plugin + `dayjs/locale/vi`, format `'LL'`.
  - `<SkillBadges sections={StudentTestSection[]} />` — one Chip per section in received order: skill label, plus ` · {n} min` when `durationMinutes` is not null.
  - `<TestCard test={StudentTestListItem} />` — whole card is a `next/link` to `ROUTES.test(test.id)`; exam chip, title, source (hidden if null), `SkillBadges`, total duration and published date (each omitted when null).
  - `<TestCardSkeleton />`.

i18n keys:

| key                                                         | en                                       | vi                      |
| ----------------------------------------------------------- | ---------------------------------------- | ----------------------- |
| `exam.IELTS_ACADEMIC`                                       | IELTS Academic                           | IELTS Academic          |
| `exam.IELTS_GENERAL`                                        | IELTS General                            | IELTS General           |
| `exam.TOEIC_LR`                                             | TOEIC Listening & Reading                | TOEIC Nghe & Đọc        |
| `exam.TOEIC_SW`                                             | TOEIC Speaking & Writing                 | TOEIC Nói & Viết        |
| `exam.skill.LISTENING` / `READING` / `WRITING` / `SPEAKING` | Listening / Reading / Writing / Speaking | Nghe / Đọc / Viết / Nói |
| `tests.minutes`                                             | {count} min                              | {count} phút            |
| `tests.publishedOn`                                         | Published {date}                         | Đăng ngày {date}        |

- [ ] **Step 1: Write failing tests**

`date.test.ts`: `formatDate('2026-10-20T08:00:00.000Z', 'en')` → `'October 20, 2026'`; `'vi'` → `'20 tháng 10 năm 2026'`.

`testCard.test.tsx` (fixture `test` = the API doc §3 example item, id 12):

- `links to the overview` → `getByRole('link')` has `href="/tests/12"`.
- `shows exam, title, source, skills with minutes, duration and date` → texts `IELTS Academic`, `Practice Test 1`, `Cambridge IELTS 18`, `Listening · 30 min`, `Reading · 60 min`, `160 min`, `Published October 20, 2026`.
- `omits null fields` → with `source: null, durationMinutes: null, publishedAt: null` and a section with `durationMinutes: null`: no `Cambridge`, no `Published`, chip reads exactly `Listening`.
- `translates to Vietnamese` → `locale: 'vi'` shows `Nghe · 30 phút`.

- [ ] **Step 2: Run** `pnpm test --run src/lib/date.test.ts src/components/tests` — Expected: FAIL.
- [ ] **Step 3: Implement.** Read HeroUI `card.mdx`, `chip.mdx`, `skeleton.mdx`. Card `h-full`, title clamped to 2 lines, visible focus ring on the link. If `next/link` fails to render in jsdom, mock it in the test as a plain `<a>`.
- [ ] **Step 4: Run** Step 2 command + `pnpm typecheck && pnpm lint` — Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/lib/date.ts src/lib/date.test.ts src/components/tests messages
git commit -m "feat: add test card component"
```

---

### Task 5: Homepage

**Files:**

- Rewrite: `src/app/(main)/page.tsx`
- Create: `src/app/(main)/loading.tsx`, `src/components/tests/examTypeRow.tsx`, `rowErrorBoundary.tsx`, `homeEmptyState.tsx`
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `e2e/home.spec.ts`

**Interfaces:**

- Consumes: `getProfile`, `getStudentTests`, `EXAM_TYPES`, `buildTestsHref` (Task 1); `signIn` + mock data (Task 2); `TestCard`, `TestCardSkeleton` (Task 4).
- Produces:
  - `<ExamTypeRow examType data={Promise<Paginated<StudentTestListItem>>} />` (async server) — `null` when empty; `<section aria-labelledby>` with heading = exam label and a "See all →" link to `buildTestsHref({ exam })`; horizontal scroll below `md`, `md:grid-cols-4` above.
  - `<ExamTypeRowSkeleton />`.
  - `RowErrorBoundary` = `catchError(fallback)` from `next/error` (client); fallback props `{ examType: ExamType }`, shows exam label, `home.rowError`, retry Button → `retry()`. Read `04-functions/catchError.md`; it re-fetches like the spec's `router.refresh()` and lets `redirect()` through.
  - `<HomeEmptyState data={Promise<Paginated<StudentTestListItem>>[]} />` (async server) — `Promise.allSettled`; renders only when **every** result is fulfilled and empty.

i18n keys:

| key                      | en                                                  | vi                                           |
| ------------------------ | --------------------------------------------------- | -------------------------------------------- |
| `home.greeting`          | Hi {name}                                           | Chào {name}                                  |
| `home.greetingFallback`  | Hi there                                            | Xin chào                                     |
| `home.subtitle`          | Pick an exam and start practising.                  | Chọn kỳ thi và bắt đầu luyện tập.            |
| `home.seeAll`            | See all →                                           | Xem tất cả →                                 |
| `home.rowError`          | Couldn't load                                       | Không thể tải                                |
| `home.retry`             | Try again                                           | Thử lại                                      |
| `home.empty.title`       | No tests yet                                        | Chưa có đề thi                               |
| `home.empty.description` | New tests will appear here once they are published. | Đề thi mới sẽ xuất hiện ở đây khi được đăng. |

- [ ] **Step 1: Write `e2e/home.spec.ts`** (all with `signIn()` unless stated)
- `greets the user` → heading level 1 `Hi Linh`.
- `shows one row per non-empty exam type in order` → `page.getByRole('region')` headings in order: `IELTS Academic`, `TOEIC Listening & Reading`, `TOEIC Speaking & Writing` (no `IELTS General`).
- `shows at most 4 newest tests per row` → IELTS Academic region has 4 links; first is `Academic Test 14`.
- `shortcut and see-all go to the filtered catalogue` → shortcut `TOEIC Speaking & Writing` has `href="/tests?exam=TOEIC_SW"`; the TOEIC LR region's "See all →" has `href="/tests?exam=TOEIC_LR"`.
- `opens a test from a card` → click `Academic Test 14` → URL `/tests/14`.
- `isolates a failing row` → `signIn('e2e-row-error')`: TOEIC LR shows `Couldn't load` + "Try again"; `Academic Test 14` and `TOEIC SW Test 2` still visible.
- `prefers the row error over the empty state` → `signIn('e2e-row-error-empty')`: `Couldn't load` visible, `No tests yet` not visible.
- `shows the empty state when nothing is published` → `signIn('e2e-empty')`: `No tests yet` visible.
- `greets without a profile` → `signIn('e2e-no-profile')`: `Hi there`.
- `scrolls rows horizontally on mobile` → viewport 375×800; IELTS Academic region's list has `scrollWidth > clientWidth` (via `evaluate`).

- [ ] **Step 2: Run** `pnpm test:e2e e2e/home.spec.ts` — Expected: FAIL.

- [ ] **Step 3: Implement** the page: greeting (+ same `getProfile` catch as the layout; `cache()` dedupes) + subtitle → four shortcut links (`buttonVariants`) → rows. The spec's "continue / recent results" slot renders nothing, so nothing is added for it. Start all four requests without awaiting (`EXAM_TYPES.map((examType) => ({ examType, data: getStudentTests({ examType, take: 4 }) }))`), render each as `<RowErrorBoundary examType><Suspense fallback={<ExamTypeRowSkeleton />}><ExamTypeRow … /></Suspense></RowErrorBoundary>`, then `<Suspense fallback={null}><HomeEmptyState data={…} /></Suspense>`. `metadata.title = 'Home'`. `loading.tsx`: greeting skeleton + two `ExamTypeRowSkeleton`.

- [ ] **Step 4: Run** the e2e spec + `pnpm typecheck && pnpm lint && pnpm test --run` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/page.tsx" "src/app/(main)/loading.tsx" src/components/tests e2e/home.spec.ts messages
git commit -m "feat: add student homepage"
```

---

### Task 6: Catalogue `/tests`

**Files:**

- Create: `src/app/(main)/tests/page.tsx`, `src/app/(main)/tests/loading.tsx`, `src/components/tests/examTypeTabs.tsx`, `testSearch.tsx`, `testPagination.tsx`
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `src/components/tests/examTypeTabs.test.tsx`, `testSearch.test.tsx`, `testPagination.test.tsx`, `e2e/catalogue.spec.ts`

**Interfaces:**

- Consumes: `parseCatalogueParams`, `buildTestsHref`, `getStudentTests`, `TESTS_PAGE_SIZE`, `EXAM_TYPES` (Task 1); `TestCard`, `TestCardSkeleton` (Task 4); `renderWithIntl` (Task 3).
- Produces (client; receive parsed `CatalogueParams`, never read `useSearchParams`):
  - `<ExamTypeTabs params={CatalogueParams} />` — HeroUI Tabs, keys `'all'` + `EXAM_TYPES`; change → `router.push(buildTestsHref({ exam, q: params.q }))`.
  - `<TestSearch params={CatalogueParams} />` — HeroUI SearchField, `maxLength={255}`; debounce `300` ms → `router.replace(buildTestsHref({ exam: params.exam, q }))`; syncs from `params.q` only when it differs from the last value this component sent (ref).
  - `<TestPagination page totalPages params={CatalogueParams} />` — HeroUI Pagination; `router.push(buildTestsHref({ ...params, page }))`; renders nothing when `totalPages <= 1`.

i18n keys:

| key                       | en                             | vi                                |
| ------------------------- | ------------------------------ | --------------------------------- |
| `tests.title`             | Tests                          | Đề thi                            |
| `tests.all`               | All                            | Tất cả                            |
| `tests.searchLabel`       | Search tests                   | Tìm đề thi                        |
| `tests.searchPlaceholder` | Search by title or source      | Tìm theo tên hoặc nguồn           |
| `tests.summary`           | Showing {from}–{to} of {total} | Hiển thị {from}–{to} trên {total} |
| `tests.empty.title`       | No matching tests              | Không có đề thi phù hợp           |
| `tests.empty.clear`       | Clear filters                  | Xoá bộ lọc                        |

- [ ] **Step 1: Write failing unit tests** (mock `next/navigation` `useRouter` → `{ push: vi.fn(), replace: vi.fn() }`; `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` with `vi.useFakeTimers()` for search)

`examTypeTabs.test.tsx`:

- `selects the tab from params` → tab `TOEIC Listening & Reading` has `aria-selected="true"` for `{ exam: 'TOEIC_LR', q: '', page: 3 }`.
- `resets page and keeps q when switching` → params `{ exam: 'TOEIC_LR', q: 'cam', page: 3 }`, click `All` → `push('/tests?q=cam')`.

`testSearch.test.tsx`:

- `debounces and replaces the URL once` → type `cam`; before 300 ms `replace` not called; after → called once with `/tests?q=cam`.
- `keeps exam and drops page` → params `{ exam: 'TOEIC_SW', q: '', page: 2 }`, type `a` → `replace('/tests?exam=TOEIC_SW&q=a')`.
- `syncs when q changes from outside` → rerender with `q: ''` after initial `q: 'cam'` → input value `''`.
- `does not reset typing on its own update` → type `cam`, advance 300 ms, type `b`, rerender with `q: 'cam'` (the echo) → input value stays `camb`.

`testPagination.test.tsx`:

- `renders nothing for one page` → container empty with `totalPages: 1`.
- `pushes the selected page with filters` → params `{ exam: 'TOEIC_LR', q: 'x', page: 1 }`, `totalPages: 3`, click page `2` → `push('/tests?exam=TOEIC_LR&q=x&page=2')`.

- [ ] **Step 2: Write `e2e/catalogue.spec.ts`** (`signIn()`)
- `lists all tests newest first with a summary` → `/tests`: 12 cards, first `Academic Test 14`, text `Showing 1–12 of 19`.
- `paginates` → click page `2` → URL `/tests?page=2`, 7 cards, `Showing 13–19 of 19`.
- `filters by tab and resets page` → from `/tests?page=2` click tab `TOEIC Speaking & Writing` → URL `/tests?exam=TOEIC_SW`, 2 cards.
- `searches with debounce` → type `toeic sw` → URL `/tests?q=toeic+sw`, 2 cards.
- `clears filters from the empty state` → `/tests?q=zzz` → `No matching tests`; click `Clear filters` → URL `/tests`, search field empty, 12 cards.
- `falls back on invalid params` → `/tests?exam=FOO&page=abc` → tab `All` selected, `Showing 1–12 of 19`.
- `redirects past the last page` → `/tests?page=99` → URL `/tests?page=2`.
- `accepts a 300-character query` → `/tests?q=` + `'a'.repeat(300)` → `No matching tests`, search field value length 255.
- `shows the error page when the API fails` → `signIn('e2e-error')`, `/tests` → `Something went wrong` + `Try again`.
- `uses one column on mobile` → viewport 375×800; first two cards have the same `x` bounding box.

- [ ] **Step 3: Run** `pnpm test --run src/components/tests && pnpm test:e2e e2e/catalogue.spec.ts` — Expected: FAIL.

- [ ] **Step 4: Implement.** Read HeroUI `tabs.mdx`, `search-field.mdx`, `pagination.mdx`; Next `page.md`. Page: `params = parseCatalogueParams(await searchParams)`; `getStudentTests({ examType: params.exam, search: params.q || undefined, page: params.page, take: TESTS_PAGE_SIZE })`; `totalPages = Math.ceil(totalCount / 12)`; if `data.length === 0 && totalCount > 0` → `redirect(buildTestsHref({ ...params, page: totalPages }))`. Summary `from = (page − 1) · 12 + 1`, `to = from + data.length − 1`. Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`. Empty state links to `/tests`. `loading.tsx`: header skeleton + 6 `TestCardSkeleton`. `metadata.title = 'Tests'`.

- [ ] **Step 5: Run** Step 3 commands + `pnpm typecheck && pnpm lint` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(main)/tests/page.tsx" "src/app/(main)/tests/loading.tsx" src/components/tests e2e/catalogue.spec.ts messages
git commit -m "feat: add test catalogue page"
```

---

### Task 7: Test overview `/tests/[id]`

**Files:**

- Create: `src/app/(main)/tests/[id]/page.tsx`, `src/app/(main)/tests/[id]/not-found.tsx`
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `e2e/overview.spec.ts`

**Interfaces:**

- Consumes: `getStudentTest`, `countSectionQuestions`, `ROUTES` (Task 1); `formatDate` (Task 4); mock detail data (Task 2).

i18n keys:

| key                          | en                                                    | vi                                       |
| ---------------------------- | ----------------------------------------------------- | ---------------------------------------- |
| `tests.back`                 | Back to tests                                         | Quay lại danh sách                       |
| `tests.structure`            | Structure                                             | Cấu trúc                                 |
| `tests.parts`                | {count, plural, one {# part} other {# parts}}         | {count} phần                             |
| `tests.questions`            | {count, plural, one {# question} other {# questions}} | {count} câu hỏi                          |
| `tests.start`                | Start test                                            | Bắt đầu làm bài                          |
| `tests.comingSoon`           | Coming soon                                           | Sắp ra mắt                               |
| `tests.notFound.title`       | Test not found                                        | Không tìm thấy đề thi                    |
| `tests.notFound.description` | This test doesn't exist or is no longer published.    | Đề thi không tồn tại hoặc đã ngừng đăng. |

- [ ] **Step 1: Write `e2e/overview.spec.ts`** (`signIn()`)
- `shows the test header` → `/tests/14`: heading level 1 `Academic Test 14`, texts `IELTS Academic`, `Cambridge IELTS 18`, `160 min`; page title starts with `Academic Test 14`.
- `lists the structure in order with counts` → list items in order: first contains `Listening`, `30 min`, `2 parts`, `20 questions`; second contains `Reading`, `60 min`, `1 part`, `13 questions`; 4 items total.
- `omits null fields` → `/tests/101`: no `min` text in the header, no source.
- `disables start with a tooltip` → button `Start test` is disabled; hover/focus its wrapper → `Coming soon` visible.
- `goes back to the catalogue` → click `Back to tests` → URL `/tests`.
- `returns 404 for unknown or malformed ids` → for each of `/tests/9999`, `/tests/abc`, `/tests/1.5`: `Test not found` visible.
- `shows the error page when the API fails` → `signIn('e2e-error')`, `/tests/14` → `Something went wrong`.

- [ ] **Step 2: Run** `pnpm test:e2e e2e/overview.spec.ts` — Expected: FAIL.

- [ ] **Step 3: Implement.** Read Next `not-found.md`, `generate-metadata.md`; HeroUI `tooltip.mdx` (a disabled button doesn't receive hover/focus — follow the doc's pattern for a focusable wrapper). Page: `const { id } = await params`; `!/^\d+$/.test(id)` → `notFound()`; `getStudentTest(Number(id))` null → `notFound()`. Content per spec: back link, exam chip, title, source, total duration, published date (each omitted when null); "Structure" as an ordered list, one item per section: skill, minutes (omitted when null), `tests.parts` with `testParts.length`, `tests.questions` with `countSectionQuestions`; disabled "Start test" in a Tooltip. `generateMetadata` → `{ title: test.title }` (cached call; `{}` when invalid/not found). `not-found.tsx`: title, description, link to `/tests`.

- [ ] **Step 4: Run** the e2e spec + `pnpm typecheck && pnpm lint && pnpm test --run` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/tests/[id]" e2e/overview.spec.ts messages
git commit -m "feat: add test overview page"
```

---

### Task 8: Session expiry and final verification

**Files:**

- Test: `e2e/session.spec.ts`

- [ ] **Step 1: Write `e2e/session.spec.ts`**
- `expired session lands on login with cookies cleared` → `signIn('e2e-expired')`, goto `/tests` → URL `/login`; `context.cookies()` contains neither `st_access_token` nor `st_refresh_token`.
- Same for `/` and `/tests/14`.

- [ ] **Step 2: Run** `pnpm test:e2e e2e/session.spec.ts` — Expected: PASS (behaviour built in Task 1). If it fails, debug with superpowers:systematic-debugging before changing code.

- [ ] **Step 3: Full suite** — `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test --run && NEXT_PUBLIC_API_URL=http://localhost:4010 pnpm build && CI=1 pnpm test:e2e`. The build must use the mock URL because `NEXT_PUBLIC_*` is inlined at build time; `CI=1` makes Playwright run `pnpm start` against that build, like CI. Rebuild without the override before deploying. Expected: all exit 0.

- [ ] **Step 4: Manual check** with `pnpm dev` against the real API: light/dark theme on all three pages; switch vi/en — every new string translated, dates in the right locale.

- [ ] **Step 5: Commit**

```bash
git add e2e/session.spec.ts
git commit -m "test: cover expired session redirect"
```
