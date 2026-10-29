// Run directly with `node` (type stripping): erasable TypeScript only, no
// local imports, so the mock duplicates the few constants it needs from src.
import { randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';

type ExamType = 'IELTS_ACADEMIC' | 'IELTS_GENERAL' | 'TOEIC_LR' | 'TOEIC_SW';
type SkillType = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';

type ListItem = {
  id: number;
  slug: string;
  examType: ExamType;
  title: string;
  source: string | null;
  durationMinutes: number | null;
  publishedAt: string | null;
  testSections: {
    id: number;
    skill: SkillType;
    order: number;
    durationMinutes: number | null;
  }[];
};

const PORT = Number(process.env.MOCK_API_PORT) || 4010;

const EXAM_SKILLS: Record<ExamType, SkillType[]> = {
  IELTS_ACADEMIC: ['LISTENING', 'READING', 'WRITING', 'SPEAKING'],
  IELTS_GENERAL: ['LISTENING', 'READING', 'WRITING', 'SPEAKING'],
  TOEIC_LR: ['LISTENING', 'READING'],
  TOEIC_SW: ['SPEAKING', 'WRITING'],
};

const PROFILE = {
  id: 'u1',
  email: 'linh@example.com',
  firstName: 'Linh',
  lastName: 'Nguyen',
  avatar: null,
};

const DAY_MS = 24 * 60 * 60 * 1000;

function makeTest(
  id: number,
  examType: ExamType,
  title: string,
  source: string | null,
  durationMinutes: number | null,
  publishedAt: Date,
): ListItem {
  return {
    id,
    slug: `${title.toLowerCase().replaceAll(' ', '-')}-${id}`,
    examType,
    title,
    source,
    durationMinutes,
    publishedAt: publishedAt.toISOString(),
    testSections: EXAM_SKILLS[examType].map((skill, i) => ({
      id: id * 10 + i,
      skill,
      order: i + 1,
      durationMinutes: i === 0 ? 30 : 60,
    })),
  };
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// Higher id = newer within an exam type; every IELTS test is newer than every TOEIC test.
const TESTS: ListItem[] = [
  ...range(1, 14).map((n) =>
    makeTest(
      n,
      'IELTS_ACADEMIC',
      `Academic Test ${n}`,
      'Cambridge IELTS 18',
      160,
      new Date(Date.UTC(2026, 9, 1) + n * DAY_MS),
    ),
  ),
  ...range(1, 3).map((n) =>
    makeTest(
      100 + n,
      'TOEIC_LR',
      `TOEIC LR Test ${n}`,
      null,
      null,
      new Date(Date.UTC(2026, 8, 1) + n * DAY_MS),
    ),
  ),
  ...range(1, 2).map((n) =>
    makeTest(
      200 + n,
      'TOEIC_SW',
      `TOEIC SW Test ${n}`,
      'ETS 2024',
      80,
      new Date(Date.UTC(2026, 7, 1) + n * DAY_MS),
    ),
  ),
].sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!));

const OPTIONS = ['A', 'B', 'C', 'D'].map((key) => ({
  key,
  text: `Option ${key}`,
}));

// Ids are unique across the whole test, like the real API.
const questionId = (sectionId: number, n: number) => sectionId * 100 + n;

const questions = (sectionId: number, from: number, to: number) =>
  range(from, to).map((n, i) => ({
    id: questionId(sectionId, n),
    numberFrom: n,
    numberTo: n,
    order: i + 1,
    prompt: `Question ${n} prompt`,
    content: { options: OPTIONS },
    audioStartMs: null,
    audio: null,
    image: null,
  }));

const group = (
  id: number,
  questionType: string,
  items: ReturnType<typeof questions>,
) => ({
  id,
  order: id,
  questionType,
  instruction: null,
  wordLimit: null,
  content: null,
  audio: null,
  image: null,
  passages: [],
  questions: items,
});

const PART_DEFAULTS = {
  instruction: null,
  audio: null,
  audioStartMs: null,
  audioEndMs: null,
  passage: null,
};

function toDetail(test: ListItem) {
  return {
    ...test,
    testSections: test.testSections.map((section, i) => ({
      ...section,
      testParts:
        i === 0
          ? [
              {
                id: section.id * 10 + 1,
                ...PART_DEFAULTS,
                order: 1,
                title: 'Part 1',
                questionGroups: [
                  group(1, 'MULTIPLE_CHOICE', questions(section.id, 1, 10)),
                ],
              },
              {
                id: section.id * 10 + 2,
                ...PART_DEFAULTS,
                order: 2,
                title: 'Part 2',
                questionGroups: [
                  group(
                    2,
                    'TRUE_FALSE_NOT_GIVEN',
                    questions(section.id, 11, 18),
                  ),
                  group(3, 'MULTIPLE_CHOICE_MULTI', [
                    {
                      ...questions(section.id, 19, 19)[0],
                      numberTo: 20,
                    },
                  ]),
                ],
              },
            ]
          : [
              {
                id: section.id * 10 + 1,
                ...PART_DEFAULTS,
                order: 1,
                title: 'Part 1',
                questionGroups: [
                  group(1, 'MULTIPLE_CHOICE', questions(section.id, 1, 13)),
                ],
              },
            ],
    })),
  };
}

function send(res: ServerResponse, status: number, body?: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

const error = (res: ServerResponse, status: number, message: string) =>
  send(res, status, { message, statusCode: status });

function listTests(
  res: ServerResponse,
  query: URLSearchParams,
  empty: boolean,
) {
  const page = Number(query.get('page')) || 1;
  const take = Number(query.get('take')) || 10;
  const examType = query.get('examType');
  const search = query.get('search')?.toLowerCase();

  const matches = empty
    ? []
    : TESTS.filter(
        (test) =>
          (!examType || test.examType === examType) &&
          (!search ||
            test.title.toLowerCase().includes(search) ||
            !!test.source?.toLowerCase().includes(search)),
      );

  send(res, 200, {
    data: matches.slice((page - 1) * take, page * take),
    meta: { page, take, totalCount: matches.length },
  });
}

// --- Attempts -------------------------------------------------------------
// In-memory and shared by every worker, so specs that start attempts use their own test.

type Response = { key: string } | { keys: string[] } | { text: string };

type MockSection = {
  id: string;
  sectionId: number;
  skill: SkillType;
  order: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  startedAt: string | null;
  deadlineAt: string | null;
  submittedAt: string | null;
  rawScore: number | null;
  maxScore: number | null;
  scaledScore: number | null;
};

type MockAttempt = {
  id: string;
  token: string;
  test: ListItem;
  mode: 'FULL' | 'SECTION';
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';
  startedAt: string;
  submittedAt: string | null;
  sections: MockSection[];
  answers: Map<number, { response: Response | null; flagged: boolean }>;
};

const GRADED_ATTEMPT_ID = '11111111-1111-4111-8111-111111111111';
const OPEN_ATTEMPT_ID = '22222222-2222-4222-8222-222222222222';

const attempts = new Map<string, MockAttempt>();

type MockQuestion = {
  id: number;
  sectionId: number;
  numberFrom: number;
  numberTo: number;
};

function testQuestions(test: ListItem): MockQuestion[] {
  return toDetail(test).testSections.flatMap((section) =>
    section.testParts.flatMap((part) =>
      part.questionGroups.flatMap((g) =>
        g.questions.map((q) => ({
          id: q.id,
          sectionId: section.id,
          numberFrom: q.numberFrom,
          numberTo: q.numberTo,
        })),
      ),
    ),
  );
}

// Every mock question's key is A; the two-answer question wants A and B.
const answerOf = (q: MockQuestion) =>
  q.numberTo > q.numberFrom ? { keys: ['A', 'B'] } : { key: 'A' };

function grade(q: MockQuestion, response: Response | null) {
  const max = q.numberTo - q.numberFrom + 1;
  if (!response) return { isCorrect: null, score: 0, max };
  if ('keys' in response) {
    const score = response.keys.filter((k) => k === 'A' || k === 'B').length;
    return { isCorrect: score === max, score, max };
  }
  const ok = 'key' in response && response.key === 'A';
  return { isCorrect: ok, score: ok ? 1 : 0, max };
}

const minutesFrom = (iso: string, minutes: number) =>
  new Date(Date.parse(iso) + minutes * 60_000).toISOString();

function openSection(attempt: MockAttempt, now: string) {
  const next = attempt.sections.find((s) => s.status === 'NOT_STARTED');
  if (!next) return;
  const duration = attempt.test.testSections.find(
    (s) => s.id === next.sectionId,
  )?.durationMinutes;
  next.status = 'IN_PROGRESS';
  next.startedAt = now;
  next.deadlineAt = duration ? minutesFrom(now, duration) : null;
}

function gradeAttempt(attempt: MockAttempt, now: string) {
  const qs = testQuestions(attempt.test);
  for (const section of attempt.sections) {
    if (section.status !== 'EXPIRED') section.status = 'SUBMITTED';
    section.submittedAt ??= now;
    let raw = 0;
    let max = 0;
    for (const q of qs.filter((q) => q.sectionId === section.sectionId)) {
      const g = grade(q, attempt.answers.get(q.id)?.response ?? null);
      raw += g.score;
      max += g.max;
    }
    section.rawScore = raw;
    section.maxScore = max;
    section.scaledScore = max ? Math.round((raw / max) * 18) / 2 : null;
  }
  attempt.status = 'GRADED';
  attempt.submittedAt = now;
}

function createAttempt(
  token: string,
  test: ListItem,
  sectionIds: number[] | null,
  startedAt: string,
  id: string = randomUUID(),
): MockAttempt {
  const chosen = test.testSections.filter(
    (s) => !sectionIds || sectionIds.includes(s.id),
  );
  const attempt: MockAttempt = {
    id,
    token,
    test,
    mode: sectionIds ? 'SECTION' : 'FULL',
    status: 'IN_PROGRESS',
    startedAt,
    submittedAt: null,
    sections: chosen.map((s, i) => ({
      id: `${id}-${s.id}`,
      sectionId: s.id,
      skill: s.skill,
      order: i + 1,
      status: 'NOT_STARTED',
      startedAt: null,
      deadlineAt: null,
      submittedAt: null,
      rawScore: null,
      maxScore: null,
      scaledScore: null,
    })),
    answers: new Map(),
  };
  openSection(attempt, startedAt);
  attempts.set(id, attempt);
  return attempt;
}

function attemptBase(attempt: MockAttempt) {
  const deadlines = attempt.sections
    .map((s) => s.deadlineAt)
    .filter((d): d is string => d !== null);
  return {
    id: attempt.id,
    testId: attempt.test.id,
    testSlug: attempt.test.slug,
    mode: attempt.mode,
    status: attempt.status,
    startedAt: attempt.startedAt,
    deadlineAt: deadlines.at(-1) ?? null,
    submittedAt: attempt.submittedAt,
    overallScore: null,
    sections: attempt.sections,
  };
}

const toAttemptDto = (attempt: MockAttempt) => ({
  ...attemptBase(attempt),
  serverNow: new Date().toISOString(),
  answers: [...attempt.answers].map(([questionId, a]) => ({
    questionId,
    response: a.response,
    flagged: a.flagged,
    answeredAt: null,
  })),
});

function toResultDto(attempt: MockAttempt) {
  const sectionIds = attempt.sections.map((s) => s.sectionId);
  return {
    attempt: {
      ...attemptBase(attempt),
      test: {
        id: attempt.test.id,
        slug: attempt.test.slug,
        title: attempt.test.title,
        examType: attempt.test.examType,
      },
    },
    questions: testQuestions(attempt.test)
      .filter((q) => sectionIds.includes(q.sectionId))
      .map((q) => {
        const saved = attempt.answers.get(q.id);
        const g = grade(q, saved?.response ?? null);
        return {
          questionId: q.id,
          sectionId: q.sectionId,
          numberFrom: q.numberFrom,
          numberTo: q.numberTo,
          response: saved?.response ?? null,
          isCorrect: g.isCorrect,
          score: g.score,
          maxScore: g.max,
          flagged: saved?.flagged ?? false,
          answer: answerOf(q),
          explanation:
            q.numberFrom === 1 ? 'Option A is stated directly.' : null,
          evidence: null,
        };
      }),
    transcripts: [],
  };
}

function seedAttempts() {
  const graded = TESTS.find((t) => t.slug === 'academic-test-14-14')!;
  const startedAt = '2026-10-27T19:00:00.000Z';
  const attempt = createAttempt(
    'e2e',
    graded,
    graded.testSections.slice(0, 2).map((s) => s.id),
    startedAt,
    GRADED_ATTEMPT_ID,
  );
  for (const q of testQuestions(graded)) {
    // Right on odd numbers, wrong on most even ones, a few left blank.
    if (q.numberFrom % 5 === 0) continue;
    const response =
      q.numberTo > q.numberFrom
        ? { keys: ['A', 'C'] }
        : { key: q.numberFrom % 2 ? 'A' : 'B' };
    attempt.answers.set(q.id, { response, flagged: false });
  }
  gradeAttempt(attempt, '2026-10-27T20:12:00.000Z');

  const open = TESTS.find((t) => t.slug === 'academic-test-13-13')!;
  createAttempt('e2e', open, null, new Date().toISOString(), OPEN_ATTEMPT_ID);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const conflict = (res: ServerResponse, code: string, extra = {}) =>
  send(res, 409, { message: code, statusCode: 409, code, ...extra });

async function handleAttempts(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  token: string,
) {
  const now = new Date().toISOString();

  if (pathname === '/api/student/attempts' && req.method === 'POST') {
    const body = (await readJson(req)) as {
      testId?: number;
      sectionIds?: number[];
    } | null;
    const test = TESTS.find((t) => t.id === body?.testId);
    if (!test) return error(res, 404, 'Test not found');
    const open = [...attempts.values()].find(
      (a) =>
        a.token === token &&
        a.test.id === test.id &&
        a.status === 'IN_PROGRESS',
    );
    if (open)
      return conflict(res, 'ATTEMPT_IN_PROGRESS', { attemptId: open.id });
    const attempt = createAttempt(token, test, body?.sectionIds ?? null, now);
    return send(res, 201, toAttemptDto(attempt));
  }

  const match = pathname.match(
    /^\/api\/student\/attempts\/([^/]+)(\/result|\/answers|\/submit|\/sections\/(\d+)\/submit)?$/,
  );
  const attempt = match && attempts.get(match[1]);
  if (!attempt || attempt.token !== token) {
    return error(res, 404, 'Attempt not found');
  }
  const action = match[2] ?? '';

  if (req.method === 'GET' && action === '') {
    return send(res, 200, toAttemptDto(attempt));
  }
  if (req.method === 'GET' && action === '/result') {
    if (attempt.status !== 'GRADED' && attempt.status !== 'EXPIRED') {
      return conflict(res, 'ATTEMPT_NOT_GRADED');
    }
    return send(res, 200, toResultDto(attempt));
  }
  if (attempt.status !== 'IN_PROGRESS') {
    return conflict(res, 'ATTEMPT_CLOSED');
  }
  if (req.method === 'PUT' && action === '/answers') {
    const body = (await readJson(req)) as {
      answers?: {
        questionId: number;
        response: Response | null;
        flagged?: boolean;
      }[];
    } | null;
    for (const item of body?.answers ?? []) {
      const prev = attempt.answers.get(item.questionId);
      attempt.answers.set(item.questionId, {
        response: item.response,
        flagged: item.flagged ?? prev?.flagged ?? false,
      });
    }
    return send(res, 200, { savedAt: now, serverNow: now });
  }
  if (req.method === 'POST' && action === '/submit') {
    gradeAttempt(attempt, now);
    return send(res, 201, toAttemptDto(attempt));
  }
  if (req.method === 'POST' && match[3]) {
    const section = attempt.sections.find(
      (s) => s.sectionId === Number(match[3]),
    );
    if (section?.status !== 'IN_PROGRESS') {
      return conflict(res, 'SECTION_NOT_OPEN');
    }
    section.status = 'SUBMITTED';
    section.submittedAt = now;
    openSection(attempt, now);
    if (attempt.sections.every((s) => s.status !== 'IN_PROGRESS')) {
      gradeAttempt(attempt, now);
    }
    return send(res, 201, toAttemptDto(attempt));
  }
  return error(res, 404, 'Not found');
}

seedAttempts();

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const { pathname, searchParams } = url;

  if (pathname === '/health') return send(res, 200, { ok: true });
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    return send(res, 201);
  }

  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token || token === 'e2e-expired') {
    return error(res, 401, 'Unauthorized');
  }

  if (pathname.startsWith('/api/student/attempts')) {
    void handleAttempts(req, res, pathname, token);
    return;
  }

  if (req.method !== 'GET') return error(res, 404, 'Not found');

  if (pathname === '/api/auth/profile') {
    if (token === 'e2e-no-profile') return error(res, 500, 'Profile failed');
    return send(res, 200, PROFILE);
  }

  if (pathname.startsWith('/api/student/tests')) {
    if (token === 'e2e-error') return error(res, 500, 'Tests failed');

    if (pathname === '/api/student/tests') {
      return listTests(res, searchParams, token === 'e2e-empty');
    }

    const slug = pathname.match(/^\/api\/student\/tests\/([^/]+)$/)?.[1];
    const test = slug && TESTS.find((t) => t.slug === slug);
    if (!test) return error(res, 404, 'Not found');
    return send(res, 200, toDetail(test));
  }

  return error(res, 404, 'Not found');
});

server.listen(PORT, () => {
  console.info(`Mock API listening on http://localhost:${PORT}`);
});
