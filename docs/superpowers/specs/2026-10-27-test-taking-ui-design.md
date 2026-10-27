# Test-taking UI — design

Date: 2026-10-27
Branch: `feat/test-taking`
API reference: `student-tests-api.md` (sections 4–6)
Port source: `english-backoffice/src/components/tests/preview` and `english-backoffice/src/components/tests/editor/typePreview`

## Goal

A student opens a published test and can work through every section and part: read passages, play audio, see images, and enter answers for all 30 question types. Answers survive switching parts/sections and page reloads.

## Out of scope

- Starting an attempt, saving answers to the server, submitting, scoring (no API yet).
- Showing correct answers, explanations, transcripts.
- Real speaking recording (no upload API).
- Strict exam-mode audio (no seek / play once).
- Playwright E2E (added together with submit).

## 1. Routes and data

```
src/app/(main)/tests/[slug]/page.tsx        intro page (shared header, max-w-7xl)
src/app/(main)/tests/[slug]/loading.tsx
src/app/(exam)/layout.tsx                   minimal full-screen layout (h-dvh, no main header)
src/app/(exam)/tests/[slug]/take/page.tsx   taking screen
```

- Add `ROUTES.takeTest(slug)` → `/tests/${slug}/take`.
- Both pages are Server Components calling `getStudentTest(slug)` (already wrapped in `cache()`); `null` → `notFound()`.
- Intro page: title, source, exam chip, table of sections (skill, question count via `countSectionQuestions`, duration). A small client component `StartExamButton` reads the draft and shows **Start**, or **Continue** + **Restart** when a draft exists. Restart clears the draft and navigates to `/take` without confirmation.
- Take page renders `<ExamRunner test={detail} />` (client). No further fetching — the API returns the whole tree.

### Types (`src/types/student-test.ts`)

Complete the types from API doc sections 4–6:

- `QuestionType`, `MarkedBy`, `MediaKind` string unions.
- `StudentMedia { id; kind; mimeType; durationMs; url }`.
- `StudentPassage { id; title; subtitle; markedBy; paragraphs: { id; content; order }[] }`.
- `StudentTestPart` adds `instruction`, `audio`, `audioStartMs`, `audioEndMs`, `passage`.
- `StudentQuestionGroup` adds `questionType`, `instruction`, `wordLimit`, `content: GroupContent | null`, `audio`, `image`, `passages`.
- `StudentQuestion` adds `prompt`, `content: QuestionContent | null`, `audioStartMs`, `audio`, `image`.
- `GroupContent { options?; allowReuse?; template?; table?: { headers?; rows }; info?: { title?; rows } }`.
- `QuestionContent { options?; prepSeconds?; responseSeconds? }`.
- `Option { key: string; text?: string }`.

Existing consumers (`countSectionQuestions`, catalogue) keep working since fields are only added.

## 2. State and persistence

### State (single reducer in `ExamRunner`)

```ts
type Answer = string | string[];

type ExamState = {
  answers: Record<number, Record<number, Answer>>; // sectionId → question number → answer
  sectionId: number;
  partId: number;
  remaining: Record<number, number>; // sectionId → seconds left
  flagged: Record<number, number[]>; // sectionId → question numbers
};
```

- Answers are keyed by section then question number (numbers repeat across sections, e.g. Listening 1–40 and Reading 1–40).
- `MULTIPLE_CHOICE_MULTI`: stored as `string[]` under `numberFrom`; counted as answered when it has `numberTo − numberFrom + 1` keys.
- Actions: `answer`, `toggleFlag`, `goTo(sectionId, partId)`, `next`, `prev`, `tick(sectionId, elapsedSeconds)`, `restore(draft)`.
- `next`/`prev` cross part boundaries and then section boundaries; stop at the ends.

### Draft (`useExamDraft(slug)`)

- Key `exam-draft:<slug>`, value `{ version: 1, ...ExamState }`.
- Every `localStorage` access is wrapped in `try/catch`; on failure the page works without persistence.
- Invalid JSON or other `version` → draft discarded.
- Answers are written debounced (~500 ms). `remaining` is written every 5 s, on section change, and on `visibilitychange` (hidden) / `pagehide`.
- On restore, an unknown `sectionId`/`partId` falls back to the first section/part; answers for numbers no longer in the test are ignored when rendering.
- Intro page uses a `hasExamDraft(slug)` / `clearExamDraft(slug)` helper from the same module.

### Timer

- Duration per section: `section.durationMinutes ?? test.durationMinutes`; if both are `null`, that section has no timer.
- Only the current section counts down. Each tick subtracts real elapsed time (`Date.now()` delta) so background tabs don't drift. Time while the tab is closed is not counted (no server `startedAt` yet).
- Timer turns `warning` color under 5 minutes.
- At 0: `TimeUpModal` opens; that section's inputs become read-only. The student can still switch to other sections.

## 3. Taking-screen layout

```
┌────────────────────────────────────────────────────────────────────┐
│ ← Exit   Title · Exam chip      [Listening|Reading|…]     ⏱ 52:13   │ ExamHeader
├────────────────────────────────────────────────────────────────────┤
│ Part 2 · instruction  (+ audio player for listening parts)         │ PartBanner
├──────────────────────────────┬─────────────────────────────────────┤
│ Passage (own scroll)         │ Question groups (own scroll)        │ PartView
├──────────────────────────────┴─────────────────────────────────────┤
│ Part 1 ①②③…  Part 2 ⑭⑮…                       [‹ Prev] [Next ›]   │ QuestionNavigator
└────────────────────────────────────────────────────────────────────┘
```

Components in `src/components/exam/`:

- `ExamRunner` — client root: reducer, draft, timer, composes everything.
- `ExamHeader` — exit link to the intro page (no confirm; draft is saved), section `Tabs` (hidden when there is one section), `ExamTimer`.
- `PartBanner` — part title (fallback "Part n"), instruction, part audio.
- `PartView` — when the part has a `passage` and at least one group has no own passages: `lg:grid-cols-2`, each column `overflow-y-auto`. Otherwise one centered column (`max-w-3xl`). Groups with their own `passages` render them inline in the question column.
- Mobile (< lg) with a passage: a `Passage / Questions` `Tabs` switch instead of stacking.
- `QuestionNavigator` — numbers grouped by part; states: unanswered, answered (`accent`), flagged (`warning` marker). Clicking a number switches to its part, then `scrollIntoView` + focuses `#q-<n>`. Prev/Next move by part, then section. On mobile it collapses to "Part 2 · 5/13 answered", which opens a `Drawer` with the number grid.
- `TimeUpModal` — HeroUI `Modal` with "Review answers" and "Next section".
- Current section/part live in state + draft only, not in the URL.

## 4. Question renderers

Port into `src/components/exam/questions/`:

| Backoffice             | Student                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `views/choice.tsx`     | Mcq, Multi, Judge, Photo, QuestionResponse, TextCompletion                                                       |
| `views/completion.tsx` | Template, Sentence, Summary, Table, Diagram, ShortAnswer                                                         |
| `views/matching.tsx`   | Matching, Map                                                                                                    |
| `views/productive.tsx` | Speak, Write                                                                                                     |
| `parts.tsx`            | QRow, QNum, Prompt, Hint, Blank, KeySelect, TextAnswer, Choices, OptionsBox, PassagePane, `fillTemplate`, `mmss` |
| `GroupPreview.tsx`     | `GroupView.tsx` (bare mode only: range chip, highlighted instruction, passages, view)                            |

Removed: `grading.ts`, `Feedback`, `SampleAnswerBox`, `Transcript`, `samples.ts`, `figures.tsx`, `QuestionTypePreviewModal`, all `checked`/`results`/`answer` handling.

Changes:

- `PreviewContext` → `ExamGroupContext { group: GroupViewModel; answers; setAnswer; readOnly; flagged; toggleFlag }`.
- `QRow` gets `id="q-<n>"` and a flag toggle; no correct/incorrect border.
- Every input/select/radio honors `readOnly`.
- `QUESTION_VIEWS: Record<QuestionType, { view; variant?; ... }>` replaces `findSample()` — only the hints the views read (`view`, `variant`, `boxTitle`, `email`, `rows`, `minWords`).
- `toGroupView(group, partPassage)` in `src/lib/exam/group-view.ts` (pure) replaces `toSample`:
  - passage: `group.passages` if non-empty, else `part.passage`;
  - text completion: passage text with `{{n}}` → `[[n]]`;
  - paragraph labels from `markedBy` (port `paragraphLabel`);
  - questions sorted by `order`.
- Placeholders without a matching question still render a blank (API doc: not enforced server side).
- Matching with `allowReuse: false`: keys already used by another question in the group are disabled.
- Media from `media.url`. Images use `<img>` (CDN host not fixed, avoids `remotePatterns`).
- `ExamAudio` (practice player): play/pause, seek bar, speed 0.75/1/1.25, clamped to `audioStartMs`–`audioEndMs`. Questions with `audioStartMs` get a "play this question" button seeking the nearest audio.
- Speaking: prompt, image/info table, prep/response time shown; record button disabled with a "Coming soon" tooltip.
- Writing: textarea with live word count; text stored as the answer.
- i18n: backoffice `tests.editor.typePreview.*` strings move to an `exam.*` namespace in `messages/vi.json` and `messages/en.json`.

## 5. Testing

Vitest + Testing Library (`src/test/render.tsx`).

- `group-view.test.ts` — passage choice, `{{n}}` → `[[n]]`, `markedBy` labels, ordering.
- `exam-reducer.test.ts` — answer, MULTI completeness, flag, next/prev across part and section boundaries, timer reaching 0.
- `exam-draft.test.ts` — round trip, bad version / bad JSON discarded, throwing `localStorage` tolerated, stale section/part fallback.
- Component tests — one per view family: MCQ, MULTI, template completion (incl. orphan `{{n}}`), matching with `allowReuse: false`, Write word count; each checks `setAnswer` and `readOnly`.
- `QuestionNavigator` — answered/flagged states, clicking a number switches part.
- Final check: `typecheck`, `lint`, `test`, then manual run with one real IELTS and one TOEIC test.
