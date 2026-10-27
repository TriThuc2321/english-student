// Run directly with `node` (type stripping): erasable TypeScript only, no
// local imports, so the mock duplicates the few constants it needs from src.
import { createServer, type ServerResponse } from 'node:http';

type ExamType = 'IELTS_ACADEMIC' | 'IELTS_GENERAL' | 'TOEIC_LR' | 'TOEIC_SW';
type SkillType = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';

type ListItem = {
  id: number;
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

const questions = (from: number, to: number) =>
  range(from, to).map((n, i) => ({
    id: n,
    numberFrom: n,
    numberTo: n,
    order: i + 1,
  }));

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
                order: 1,
                title: 'Part 1',
                questionGroups: [
                  { id: 1, order: 1, questions: questions(1, 10) },
                ],
              },
              {
                id: section.id * 10 + 2,
                order: 2,
                title: 'Part 2',
                questionGroups: [
                  { id: 2, order: 1, questions: questions(11, 18) },
                  {
                    id: 3,
                    order: 2,
                    questions: [
                      { id: 19, numberFrom: 19, numberTo: 20, order: 1 },
                    ],
                  },
                ],
              },
            ]
          : [
              {
                id: section.id * 10 + 1,
                order: 1,
                title: 'Part 1',
                questionGroups: [
                  { id: 1, order: 1, questions: questions(1, 13) },
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

  if (req.method !== 'GET') return error(res, 404, 'Not found');

  if (pathname === '/api/auth/profile') {
    if (token === 'e2e-no-profile') return error(res, 500, 'Profile failed');
    return send(res, 200, PROFILE);
  }

  if (pathname.startsWith('/api/student/tests')) {
    if (token === 'e2e-error') return error(res, 500, 'Tests failed');

    if (pathname === '/api/student/tests') {
      const isToeicLr = searchParams.get('examType') === 'TOEIC_LR';
      if (
        isToeicLr &&
        (token === 'e2e-row-error' || token === 'e2e-row-error-empty')
      ) {
        return error(res, 500, 'Row failed');
      }
      return listTests(
        res,
        searchParams,
        token === 'e2e-empty' || token === 'e2e-row-error-empty',
      );
    }

    const id = pathname.match(/^\/api\/student\/tests\/(\d+)$/)?.[1];
    const test = id && TESTS.find((t) => t.id === Number(id));
    if (!test) return error(res, 404, 'Not found');
    return send(res, 200, toDetail(test));
  }

  return error(res, 404, 'Not found');
});

server.listen(PORT, () => {
  console.info(`Mock API listening on http://localhost:${PORT}`);
});
