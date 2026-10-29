# Test-taking UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students open a published test at `/tests/[slug]`, start it, and answer every question type on a full-screen `/tests/[slug]/take` screen with per-section timers and a localStorage draft — no submit yet.

**Architecture:** Server pages fetch `StudentTestDetail` once via `getStudentTest(slug)`. A client `ExamRunner` owns a pure reducer (`src/lib/exam/`) for answers, flags, position and timers, persists it through a draft module, and renders parts with question views ported from the backoffice `typePreview` (grading removed, media by URL, next-intl).

**Tech Stack:** Next 16.3 App Router, React 19.2, HeroUI v3, Tailwind v4, next-intl 4, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-10-27-test-taking-ui-design.md`

**Port source:** `../english-backoffice/src/components/tests/editor/typePreview/` (views, `parts.tsx`, `GroupPreview.tsx`, `fromGroup.ts`), `../english-backoffice/src/components/tests/editor/group/PassagePreview.tsx` (`paragraphLabel`, `letterAt`), strings in `../english-backoffice/src/i18n/locales/{en,vi}.ts` under `tests.editor.typePreview`.

## Global Constraints

- Read `node_modules/next/dist/docs/` before writing routes/layouts (AGENTS.md: this Next has breaking changes). Page props use the generated `PageProps<'/tests/[slug]'>` helper, `params` is a Promise.
- Search `.heroui-docs/react` before using any HeroUI component (Tabs, Modal, Drawer, Tooltip, Button, Chip, Card, Skeleton).
- i18n: new strings go under a new `taking` namespace in `messages/en.json` and `messages/vi.json` (`exam` already exists for exam/skill labels). Both locales get every key.
- Comments only for non-obvious WHY (CLAUDE.md).
- Files use camelCase component filenames like the existing `src/components/tests/*.tsx`; lib files kebab-case like `src/lib/tests/catalogue-params.ts`.
- Draft key `exam-draft:<slug>`, `version: 1`; answers debounce 500 ms; `remaining` saved every 5 s, on section change, on `visibilitychange` (hidden) and `pagehide`.
- Timer warning under 300 s. Section duration = `section.durationMinutes ?? test.durationMinutes`; both null → no timer.
- Images use `<img>`, not `next/image`.
- No grading, answers, transcripts, recording, E2E.
- Verification commands: `pnpm test --run <path>`, `pnpm typecheck`, `pnpm lint`.

## Review Focus

1. **Hydration** — the draft lives in `localStorage`, so the server render cannot know it; `ExamRunner` must render a skeleton until the draft is restored on mount, with no hydration warning. → Task 7 test "renders skeleton then restored part".
2. **MULTIPLE_CHOICE_MULTI numbers** — a 21–22 question stores under 21; navigator must show both 21 and 22 answered only when 2 keys are picked, and clicking 22 scrolls to `#q-21`. → Task 3 (`questionSlots`, `isAnswered`) and Task 6 navigator test.
3. **Reload right after typing** — an answer typed <500 ms before reload must survive; `pagehide` flushes the pending write. → Task 4 hook test.
4. **Reload after time up** — a section with `remaining === 0` stays read-only after reload, and the time-up modal does not reopen on load (it only opens on the live transition to 0). → Task 3 reducer test + Task 7 runner test.
5. **Empty structure** — a section with no parts or a part with no groups renders an empty message instead of crashing; Prev/Next still move. → Task 3 (`partSequence`) + Task 6 `PartView` test.

---

## File Structure

```
src/types/student-test.ts                      modify: full detail types
src/constants/routes.ts                        modify: takeTest
messages/en.json, messages/vi.json             modify: taking.*
src/lib/exam/structure.ts (+test)              part sequence, question slots, durations, isAnswered
src/lib/exam/group-view.ts (+test)             toGroupView, paragraphLabel, GroupViewModel
src/lib/exam/question-views.ts                 QUESTION_VIEWS hint table
src/lib/exam/reducer.ts (+test)                ExamState, ExamAction, createInitialState, examReducer
src/lib/exam/draft.ts (+test)                  load/save/has/clear draft
src/components/exam/useExamPersistence.ts (+test)
src/components/exam/useSectionTimer.ts
src/components/exam/questions/context.ts       ExamGroupContext, useExamGroup
src/components/exam/questions/parts.tsx (+test)
src/components/exam/questions/media.tsx        ExamAudio, ExamImage
src/components/exam/questions/views/{choice,completion,matching,productive,index}.tsx (+views.test.tsx)
src/components/exam/questions/groupView.tsx
src/components/exam/partView.tsx (+test)
src/components/exam/partBanner.tsx
src/components/exam/questionNavigator.tsx (+test)
src/components/exam/examHeader.tsx
src/components/exam/examTimer.tsx
src/components/exam/timeUpModal.tsx
src/components/exam/examRunner.tsx (+test)
src/components/exam/startExamButton.tsx (+test)
src/app/(main)/tests/[slug]/page.tsx, loading.tsx
src/app/(exam)/layout.tsx
src/app/(exam)/tests/[slug]/take/page.tsx
src/test/fixtures/student-test.ts              shared StudentTestDetail fixture for tests
```

---

### Task 1: Detail types, route helper, fixture

**Files:**

- Modify: `src/types/student-test.ts`, `src/constants/routes.ts`
- Create: `src/test/fixtures/student-test.ts`
- Modify (if typecheck breaks): existing tests building `StudentTestDetail` (`src/lib/tests/structure.test.ts`, `src/lib/api/student-tests.test.ts`)

**Interfaces — Produces:**

- Types exactly as spec §1 "Types": `QuestionType` (30-member union from API doc §6), `MarkedBy = 'ALPHABET' | 'NUMBER' | 'NONE'`, `MediaKind`, `StudentMedia`, `StudentParagraph { id; content; order }`, `StudentPassage`, `Option { key: string; text?: string }`, `GroupContent`, `QuestionContent`, `StudentQuestion`, `StudentQuestionGroup`, `StudentTestPart`, `StudentTestSectionDetail`, `StudentTestDetail`. Keep the existing names `StudentTestQuestion` / `StudentTestQuestionGroup` / `StudentTestPart` — rename the first two to `StudentQuestion` / `StudentQuestionGroup` and update imports.
- `ROUTES.takeTest(slug: string) => \`/tests/${slug}/take\``.
- `src/test/fixtures/student-test.ts` exports `makeTest(overrides?)` returning a `StudentTestDetail` slug `practice-test-1` with:
  - section 30 LISTENING, 30 min: part 300 (audio `https://cdn.test/l1.mp3`, start 0, end 600000) with a FORM_COMPLETION group 3000 (template `"Name: {{1}}\nPostcode: {{2}}"`, questions 1, 2) and a MULTIPLE_CHOICE_MULTI group 3001 (question numberFrom 3, numberTo 4, 5 options A–E); part 301 with a MULTIPLE_CHOICE group 3010 (question 5, options A–C).
  - section 31 READING, `durationMinutes: null` (falls back to test 60): part 310 with `passage` (markedBy ALPHABET, 2 paragraphs) and a MATCHING_HEADINGS group 3100 (`allowReuse: false`, options i–iii, questions 1, 2); part 311 with no groups.
  - test `durationMinutes: 60`.

- [ ] **Step 1:** Write the types and route helper.
- [ ] **Step 2:** Write the fixture.
- [ ] **Step 3:** Run `pnpm typecheck` — Expected: passes (fix existing test fixtures that now miss fields).
- [ ] **Step 4:** Run `pnpm test --run` — Expected: all existing tests pass.
- [ ] **Step 5:** Commit `feat: add student test detail types`.

---

### Task 2: Group view model

**Files:**

- Create: `src/lib/exam/question-views.ts`, `src/lib/exam/group-view.ts`, `src/lib/exam/group-view.test.ts`

**Interfaces:**

- Consumes: Task 1 types.
- Produces:
  ```ts
  type ViewKind =
    | 'mcq'
    | 'multi'
    | 'judge'
    | 'matching'
    | 'template'
    | 'sentence'
    | 'summary'
    | 'table'
    | 'diagram'
    | 'map'
    | 'short'
    | 'photo'
    | 'qresp'
    | 'textcomp'
    | 'speak'
    | 'write';
  type ViewHints = {
    view: ViewKind;
    variant?: 'form' | 'note' | 'flow';
    boxTitle?: 'headings' | 'people' | 'endings' | 'categories' | 'wordBank';
    email?: boolean;
    rows?: number;
    minWords?: number;
  };
  const QUESTION_VIEWS: Record<QuestionType, ViewHints>;
  type PassageView = {
    title: string;
    subtitle: string | null;
    paragraphs: { label: string | null; text: string }[];
  };
  type QuestionView = {
    n: number;
    nTo: number;
    prompt: string | null;
    content: QuestionContent | null;
    audio: StudentMedia | null;
    image: StudentMedia | null;
    audioStartMs: number | null;
  };
  type GroupViewModel = ViewHints & {
    id: number;
    type: QuestionType;
    instruction: string | null;
    wordLimit: number | null;
    content: GroupContent | null;
    audio: StudentMedia | null;
    image: StudentMedia | null;
    passages: PassageView[];
    passageText: string | null;
    questions: QuestionView[];
  };
  function paragraphLabel(markedBy: MarkedBy, index: number): string | null; // ALPHABET → 'A'…, NUMBER → '1'…, NONE → null
  function toPassageView(passage: StudentPassage): PassageView;
  function toGroupView(group: StudentQuestionGroup): GroupViewModel;
  ```
- `boxTitle` is an i18n key suffix (`taking.boxTitle.<key>`), not English text. Hint values come from backoffice `samples.ts`: MATCHING_HEADINGS headings, MATCHING_FEATURES people, MATCHING_SENTENCE_ENDINGS endings, CLASSIFICATION categories, SUMMARY_COMPLETION wordBank; FORM/NOTE/FLOW_CHART variants form/note/flow; WRITE_SENTENCE_PICTURE rows 2; RESPOND_WRITTEN_REQUEST email true rows 8; OPINION_ESSAY rows 12 minWords 300; YES_NO_NOT_GIVEN and TRUE_FALSE_NOT_GIVEN judge; MAP/PLAN_LABELLING map.
- `toGroupView` only uses `group.passages` (the part passage is rendered by `PartView`, spec §3). For TEXT_COMPLETION, `passages` is `[]` and `passageText` is all paragraphs joined by `\n\n` with `{{n}}` → `[[n]]`; otherwise `passageText` is `null`.

- [ ] **Step 1: Write failing tests** in `group-view.test.ts`:
  - `paragraphLabel('ALPHABET', 1) === 'B'`, `paragraphLabel('NUMBER', 1) === '2'`, `paragraphLabel('NONE', 0) === null`, `paragraphLabel('ALPHABET', 26) === 'AA'` (match backoffice `letterAt`).
  - `toGroupView` sorts questions by `order` (input orders 2,1 → output n of order 1 first) and maps `numberFrom/numberTo` to `n/nTo`.
  - MATCHING_HEADINGS group → `view === 'matching'`, `boxTitle === 'headings'`.
  - TEXT_COMPLETION group with passage paragraph `"Dear {{131}} and {{ 132 }}"` → `passageText === 'Dear [[131]] and [[132]]'`, `passages` empty.
  - Group with two `passages` → `passages.length === 2` and labels from `markedBy`.
  - Every `QuestionType` has an entry in `QUESTION_VIEWS` (iterate a const list of the 30 types).
- [ ] **Step 2:** Run `pnpm test --run src/lib/exam/group-view.test.ts` — Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `question-views.ts` and `group-view.ts`. Placeholder regex `/\{\{\s*(\d+)\s*\}\}/g` (API doc §5).
- [ ] **Step 4:** Re-run — Expected: PASS.
- [ ] **Step 5:** Commit `feat: add exam group view model`.

---

### Task 3: Structure helpers and exam reducer

**Files:**

- Create: `src/lib/exam/structure.ts`, `src/lib/exam/structure.test.ts`, `src/lib/exam/reducer.ts`, `src/lib/exam/reducer.test.ts`

**Interfaces:**

- Consumes: Task 1 types, fixture `makeTest`.
- Produces (`structure.ts`):
  ```ts
  type PartRef = { sectionId: number; partId: number | null }; // partId null = section without parts
  function partSequence(test: StudentTestDetail): PartRef[]; // sections then parts, by order
  type QuestionSlot = { n: number; from: number; partId: number };
  function questionSlots(section: StudentTestSectionDetail): QuestionSlot[]; // one per displayed number; MULTI 3–4 → {3,from 3},{4,from 3}
  function sectionDurationSeconds(
    test: StudentTestDetail,
    section: StudentTestSectionDetail,
  ): number | null;
  function isAnswered(value: Answer | undefined, count: number): boolean; // string: trimmed non-empty; array: length === count
  ```
- Produces (`reducer.ts`):
  ```ts
  type Answer = string | string[];
  type ExamState = {
    answers: Record<number, Record<number, Answer>>;
    sectionId: number;
    partId: number | null;
    remaining: Record<number, number>;
    flagged: Record<number, number[]>;
  };
  type ExamAction =
    | { type: 'answer'; n: number; value: Answer } // current section; ignored when locked
    | { type: 'toggleFlag'; n: number } // current section
    | { type: 'goTo'; sectionId: number; partId?: number | null } // partId omitted → first part of section
    | { type: 'step'; dir: 1 | -1 } // along partSequence, clamped at ends
    | { type: 'tick'; seconds: number } // current section; floors at 0; no-op without timer
    | { type: 'restore'; state: ExamState };
  function createInitialState(test: StudentTestDetail): ExamState; // first section/part; remaining only for timed sections
  function examReducer(
    test: StudentTestDetail,
    state: ExamState,
    action: ExamAction,
  ): ExamState;
  function isSectionLocked(state: ExamState, sectionId: number): boolean; // remaining[sectionId] === 0
  ```
- `restore` sanitizes: unknown `sectionId`/`partId` → first; non-finite or negative `remaining` → recomputed from duration; keeps everything else.

- [ ] **Step 1: Write failing tests**
  - `structure.test.ts`: `partSequence(makeTest())` equals `[{30,300},{30,301},{31,310},{31,311}]`; a section with no parts yields `{sectionId, partId: null}`; `questionSlots(listening)` ns are `[1,2,3,4,5]` and slot 4 has `from: 3`; `sectionDurationSeconds` gives 1800 for section 30 and 3600 for 31 (fallback), `null` when both null; `isAnswered(['A'], 2) === false`, `isAnswered(['A','C'], 2) === true`, `isAnswered('  ', 1) === false`.
  - `reducer.test.ts`:
    - initial state: section 30, part 300, `remaining` `{30: 1800, 31: 3600}`.
    - `answer` stores under `answers[30][1]`; same number in section 31 is independent.
    - `toggleFlag` twice → empty.
    - `step +1` from part 301 → section 31 part 310; `step -1` at first part stays; `step +1` at last part stays.
    - `goTo {sectionId: 31}` → part 310.
    - `tick 2000` on section 30 → `remaining[30] === 0`, `isSectionLocked` true, then `answer` in section 30 is ignored.
    - `restore` with `sectionId: 999` → section 30 part 300, answers kept; `restore` with `remaining[30] = 0` keeps it at 0 (Review Focus 4).
- [ ] **Step 2:** Run `pnpm test --run src/lib/exam` — Expected: FAIL.
- [ ] **Step 3:** Implement `structure.ts`, then `reducer.ts`. Move nothing from `src/lib/tests/structure.ts`.
- [ ] **Step 4:** Re-run — Expected: PASS.
- [ ] **Step 5:** Commit `feat: add exam state reducer`.

---

### Task 4: Draft storage and persistence hook

**Files:**

- Create: `src/lib/exam/draft.ts`, `src/lib/exam/draft.test.ts`, `src/components/exam/useExamPersistence.ts`, `src/components/exam/useExamPersistence.test.tsx`

**Interfaces:**

- Consumes: `ExamState`, `examReducer` restore sanitizing (Task 3).
- Produces:
  ```ts
  function loadExamDraft(slug: string): ExamState | null; // null on missing, bad JSON, version !== 1, storage throwing
  function saveExamDraft(slug: string, state: ExamState): void; // swallows storage errors
  function hasExamDraft(slug: string): boolean;
  function clearExamDraft(slug: string): void;
  function useExamPersistence(
    slug: string,
    state: ExamState,
    enabled: boolean,
  ): void;
  ```
- `useExamPersistence` writes 500 ms after the last `answers`/`flagged`/position change; writes immediately when `sectionId` changes; writes every 5 s while mounted (for `remaining`); flushes on `visibilitychange` to hidden and `pagehide`. Does nothing while `enabled` is false (before restore, so the initial state never overwrites a draft).

- [ ] **Step 1: Write failing tests**
  - `draft.test.ts`: save then load round-trips; `localStorage.setItem('exam-draft:x', '{bad')` → `null`; `{version: 2}` → `null`; `vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error() })` → `loadExamDraft` returns `null` and `hasExamDraft` false; `clearExamDraft` removes it.
  - `useExamPersistence.test.tsx` (fake timers, `renderHook`): change answers → nothing saved at 499 ms, saved at 500 ms; change answers then `window.dispatchEvent(new Event('pagehide'))` → saved immediately (Review Focus 3); `enabled: false` → nothing saved after 6 s.
- [ ] **Step 2:** Run `pnpm test --run src/lib/exam/draft.test.ts src/components/exam/useExamPersistence.test.tsx` — Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Re-run — Expected: PASS.
- [ ] **Step 5:** Commit `feat: persist exam drafts in localStorage`.

---

### Task 5: Question primitives, media and strings

**Files:**

- Create: `src/components/exam/questions/context.ts`, `src/components/exam/questions/parts.tsx`, `src/components/exam/questions/media.tsx`, `src/components/exam/questions/parts.test.tsx`
- Modify: `messages/en.json`, `messages/vi.json`

**Interfaces:**

- Consumes: `GroupViewModel`, `QuestionView`, `PassageView`, `Option` (Tasks 1–2), `Answer` (Task 3).
- Produces:
  ```ts
  type ExamGroupContextValue = { group: GroupViewModel; answers: Record<number, Answer>; setAnswer: (n: number, value: Answer) => void; readOnly: boolean; flagged: number[]; toggleFlag: (n: number) => void };
  const ExamGroupContext; function useExamGroup(): ExamGroupContextValue; // throws outside provider
  // parts.tsx — ported from backoffice parts.tsx, same props minus grading:
  QRow({ n, label?, children })  // id="q-<n>", flag ToggleButton (aria-label taking.flag)
  QNum, Prompt, Hint, Blank({ n, options? }), KeySelect({ n, options, disabledKeys? }), TextAnswer({ n }), Choices({ n, options, multi?, limit?, variant? }), OptionsBox({ title?, options }), PassagePane({ passage: PassageView, className? })
  fillTemplate(text, blank), formatRange(q: QuestionView), mmss(seconds)
  // media.tsx
  ExamAudio({ media: StudentMedia, startMs?: number | null, endMs?: number | null }) // play/pause, seek (range input), speed 0.75/1/1.25; clamps to start/end
  ExamImage({ media: StudentMedia, className? })                                    // <img alt=""> with eslint/oxlint disable for next/image only if lint flags it
  QuestionAudioButton({ media: StudentMedia, startMs: number })                      // "Play this question" — seeks own audio
  ```
- Every input reads `readOnly` and sets `disabled`. Drop `Feedback`, `useResult`, `resultTone`, `AudioBar`, `Transcript`, `SampleAnswerBox`.
- `fillTemplate` uses the tolerant regex `/\{\{\s*(\d+)\s*\}\}/`.
- Strings: port the `tests.editor.typePreview` keys used by the ported code into `taking.*` (en from backoffice `en.ts`, vi from `vi.ts`), plus: `taking.flag`, `taking.boxTitle.{headings,people,endings,categories,wordBank}`, `taking.audio.{play,pause,speed,playQuestion}`, `taking.recordSoon`, `taking.wordCount`, and the screen strings used in Tasks 6–8 (`exit`, `partFallback`, `questionsRange`, `answeredCount`, `prev`, `next`, `passage`, `questions`, `emptyPart`, `timeUp.{title,body,review,nextSection}`, `intro.{start,continue,restart,sections,questionCount}`).

- [ ] **Step 1: Write failing tests** in `parts.test.tsx` (render inside a test provider with a minimal `GroupViewModel`):
  - `Blank` typing "Smith" calls `setAnswer(1, 'Smith')`; with `readOnly` the input is disabled.
  - `Choices multi limit=2`: after two picks the third checkbox is disabled.
  - `KeySelect disabledKeys={['i']}` renders option `i` disabled.
  - `QRow n={7}` renders an element with `id="q-7"`; clicking the flag button calls `toggleFlag(7)`.
  - `fillTemplate('a {{ 3 }} b', n => \`[${n}]\`)`renders`a [3] b`.
- [ ] **Step 2:** Run `pnpm test --run src/components/exam/questions/parts.test.tsx` — Expected: FAIL.
- [ ] **Step 3:** Port `context.ts`, `parts.tsx`, `media.tsx`; add strings to both locales.
- [ ] **Step 4:** Re-run — Expected: PASS.
- [ ] **Step 5:** Commit `feat: add exam question primitives`.

---

### Task 6: Question views, group view, part view, navigator

**Files:**

- Create: `src/components/exam/questions/views/{choice,completion,matching,productive,index}.tsx`, `src/components/exam/questions/views.test.tsx`, `src/components/exam/questions/groupView.tsx`, `src/components/exam/partBanner.tsx`, `src/components/exam/partView.tsx`, `src/components/exam/partView.test.tsx`, `src/components/exam/questionNavigator.tsx`, `src/components/exam/questionNavigator.test.tsx`

**Interfaces:**

- Consumes: Task 5 primitives/context, Task 2 `toGroupView`/`toPassageView`, Task 3 `questionSlots`/`isAnswered`.
- Produces:
  ```ts
  const VIEWS: Record<ViewKind, () => JSX.Element>;
  GroupView({ group: StudentQuestionGroup, answers, setAnswer, readOnly, flagged, toggleFlag }) // builds view model, provides context, renders range chip + highlighted instruction + own passages + view
  PartBanner({ part: StudentTestPart, index: number })                                         // title ?? taking.partFallback, instruction, ExamAudio for part.audio
  PartView({ part: StudentTestPart | null, index: number, answers, onAnswer, readOnly, flagged, onToggleFlag })
  QuestionNavigator({ section: StudentTestSectionDetail, partId: number | null, answers: Record<number, Answer>, flagged: number[], onSelect: (partId: number, from: number) => void, onStep: (dir: 1 | -1) => void, canPrev: boolean, canNext: boolean })
  ```
- Views: port each backoffice view, reading `group` instead of `sample`; replace `FigureImage`/`AudioBar` with `ExamImage`/`ExamAudio`/`QuestionAudioButton` from the `StudentMedia` fields; remove `sample.figure`/`sample.audio` (string)/`transcript` usages. `MatchingView` passes `disabledKeys` = keys answered for other questions in the group when `allowReuse` is not true. `SpeakView` keeps prep/response display and renders a disabled record button inside a HeroUI `Tooltip` with `taking.recordSoon`. `WriteView` textarea shows live word count (`taking.wordCount`) and `minWords` hint.
- `PartView`: part passage split (`lg:grid-cols-2`, each column `overflow-y-auto`) only when `part.passage` and some group has `passages.length === 0`; below `lg` a HeroUI `Tabs` switch `taking.passage` / `taking.questions`; `part === null` or no groups → `taking.emptyPart`.
- `QuestionNavigator`: one button per `questionSlots` entry, grouped by part; answered state = `isAnswered(answers[slot.from], nTo - from + 1)`; flagged = `flagged.includes(slot.from)`; `aria-current` on numbers in the current part. Mobile (< md) shows `taking.answeredCount` summary that opens a HeroUI `Drawer` with the same grid.
- Scroll/focus after selecting a number lives in `ExamRunner` (Task 7), not here.

- [ ] **Step 1: Write failing tests**
  - `views.test.tsx` (use fixture groups through `GroupView`):
    - MCQ: clicking option B calls `setAnswer(5, 'B')`.
    - MULTI 3–4: picking A and C calls `setAnswer(3, ['A','C'])`; a third option is disabled.
    - FORM_COMPLETION template renders two textboxes labelled for 1 and 2; a template containing `{{9}}` with no question 9 still renders a textbox for 9.
    - MATCHING_HEADINGS `allowReuse: false` with `answers {1: 'i'}`: question 2's select has option `i` disabled.
    - OPINION_ESSAY: typing "one two three" shows word count 3.
    - `readOnly`: MCQ radios disabled.
  - `partView.test.tsx`: part 310 shows passage title and paragraph label `A`; part 311 (no groups) shows the `emptyPart` text; `part={null}` shows it too (Review Focus 5).
  - `questionNavigator.test.tsx`: with `answers {3: ['A']}` buttons 3 and 4 are not answered; with `{3: ['A','C']}` both are (check a `data-answered` attribute); clicking 4 calls `onSelect(300, 3)` (Review Focus 2); flagged 1 has `data-flagged`.
- [ ] **Step 2:** Run `pnpm test --run src/components/exam` — Expected: new tests FAIL.
- [ ] **Step 3:** Port views + `index.tsx` (`VIEWS`), then `groupView.tsx`, `partBanner.tsx`, `partView.tsx`, `questionNavigator.tsx`.
- [ ] **Step 4:** Re-run — Expected: PASS.
- [ ] **Step 5:** Commit `feat: add exam question views and navigator`.

---

### Task 7: Exam runner, header, timer, time-up modal

**Files:**

- Create: `src/components/exam/useSectionTimer.ts`, `src/components/exam/examTimer.tsx`, `src/components/exam/examHeader.tsx`, `src/components/exam/timeUpModal.tsx`, `src/components/exam/examRunner.tsx`, `src/components/exam/examRunner.test.tsx`

**Interfaces:**

- Consumes: Tasks 3, 4, 6.
- Produces:
  ```ts
  useSectionTimer(running: boolean, onTick: (seconds: number) => void): void // 1 s interval, passes real elapsed seconds from Date.now() deltas
  ExamTimer({ seconds: number })                                              // mm:ss, warning color when < 300
  ExamHeader({ test, sectionId, remaining: number | null, onSelectSection: (id: number) => void, exitHref: string })
  TimeUpModal({ isOpen, onReview: () => void, onNextSection: (() => void) | null })
  ExamRunner({ test: StudentTestDetail })
  ```
- `ExamRunner`: `useReducer((s, a) => examReducer(test, s, a), test, createInitialState)`; on mount `loadExamDraft(test.slug)` → `restore`, then `restored = true`; renders `Skeleton` until restored (Review Focus 1); `useExamPersistence(slug, state, restored)`; timer runs when current section has `remaining > 0`; opens `TimeUpModal` only when a `tick` moves the current section from >0 to 0 in this session (Review Focus 4). On navigator select: `goTo`, then after commit `document.getElementById('q-' + from)?.scrollIntoView({ block: 'center' })` and focus its first input. Layout: `h-dvh flex flex-col` — header, banner + part view (`flex-1 min-h-0`), navigator.
- `ExamHeader`: exit `Link` to `ROUTES.test(slug)`; HeroUI `Tabs` over sections (hidden when one); `ExamTimer` when `remaining != null`.

- [ ] **Step 1: Write failing tests** in `examRunner.test.tsx` (fake timers, fixture, `localStorage` cleared per test):
  - Renders a skeleton (`role="status"` or test id) on first render, then part 300 content after effects (Review Focus 1).
  - With a saved draft at section 31 part 310, the passage title is shown after mount.
  - Clicking "Next" twice moves from part 300 to part 310 and the section tab shows Reading as selected.
  - Advancing timers 1800 s opens the time-up dialog and the Blank inputs become disabled.
  - Draft with `remaining {30: 0}` → inputs disabled, no time-up dialog (Review Focus 4).
- [ ] **Step 2:** Run `pnpm test --run src/components/exam/examRunner.test.tsx` — Expected: FAIL.
- [ ] **Step 3:** Implement timer hook, `ExamTimer`, `ExamHeader`, `TimeUpModal`, `ExamRunner`.
- [ ] **Step 4:** Re-run — Expected: PASS.
- [ ] **Step 5:** Commit `feat: add exam runner`.

---

### Task 8: Routes and intro page

**Files:**

- Create: `src/app/(main)/tests/[slug]/page.tsx`, `src/app/(main)/tests/[slug]/loading.tsx`, `src/app/(exam)/layout.tsx`, `src/app/(exam)/tests/[slug]/take/page.tsx`, `src/components/exam/startExamButton.tsx`, `src/components/exam/startExamButton.test.tsx`

**Interfaces:**

- Consumes: `getStudentTest`, `countSectionQuestions`, `ROUTES.takeTest`, `hasExamDraft`/`clearExamDraft`, `ExamRunner`.
- Produces: `StartExamButton({ slug: string })`.
- Intro page: `notFound()` on `null`; title, source, exam chip using `EXAM_CLASSES` like `TestCard`, list of sections (skill label `exam.skill.*`, `taking.intro.questionCount`, minutes from `sectionDurationSeconds`), `StartExamButton`. `generateMetadata` returns the test title.
- `StartExamButton`: reads `hasExamDraft` in an effect (initially renders Start to keep SSR stable); with draft shows Continue (link to `/take`) and Restart (`clearExamDraft` then `router.push`).
- `(exam)/layout.tsx`: no header, `<main className="h-dvh">`; no auth change needed (proxy already guards). Take page: `notFound()` on `null`, renders `<ExamRunner test={test} />`.

- [ ] **Step 1: Write failing test** `startExamButton.test.tsx`: no draft → one link "Start" to `/tests/practice-test-1/take`; with `saveExamDraft` beforehand → "Continue" link and "Restart" button; clicking Restart removes the draft and calls the mocked `router.push('/tests/practice-test-1/take')`.
- [ ] **Step 2:** Run `pnpm test --run src/components/exam/startExamButton.test.tsx` — Expected: FAIL.
- [ ] **Step 3:** Implement `StartExamButton`, both pages, loading and layout.
- [ ] **Step 4:** Re-run — Expected: PASS.
- [ ] **Step 5:** Run `pnpm typecheck && pnpm lint && pnpm test --run` — Expected: all pass.
- [ ] **Step 6:** Commit `feat: add test intro and taking pages`.

---

### Task 9: Manual verification

- [ ] **Step 1:** `pnpm dev`, log in, open one IELTS Academic and one TOEIC LR test from `/tests`.
- [ ] **Step 2:** Check: intro shows sections; Start → `/take`; every group in the test renders; passage split on desktop and tab switch at 375 px width; audio plays inside its range; navigator jumps and focuses; reload keeps answers, part and timer; Restart clears; no hydration warning in the console.
- [ ] **Step 3:** Fix anything found with a test first where possible; commit `fix: …` per issue.
