import type { StudentQuestion, StudentTestDetail } from '@/types/student-test';

const question = (
  id: number,
  numberFrom: number,
  overrides: Partial<StudentQuestion> = {},
): StudentQuestion => ({
  id,
  numberFrom,
  numberTo: numberFrom,
  order: 1,
  prompt: null,
  content: null,
  audioStartMs: null,
  audio: null,
  image: null,
  ...overrides,
});

const groupBase = {
  content: null,
  instruction: null,
  wordLimit: null,
  audio: null,
  image: null,
  passages: [],
};

const partBase = {
  instruction: null,
  audio: null,
  audioStartMs: null,
  audioEndMs: null,
  passage: null,
};

export function makeTest(
  overrides: Partial<StudentTestDetail> = {},
): StudentTestDetail {
  return {
    id: 1,
    slug: 'practice-test-1',
    examType: 'IELTS_ACADEMIC',
    title: 'Practice Test 1',
    source: null,
    durationMinutes: 60,
    publishedAt: '2026-01-01T00:00:00.000Z',
    testSections: [
      {
        id: 30,
        skill: 'LISTENING',
        order: 1,
        durationMinutes: 30,
        testParts: [
          {
            ...partBase,
            id: 300,
            order: 1,
            title: 'Part 1',
            instruction: 'Listen and answer the questions.',
            audio: {
              id: 1,
              kind: 'AUDIO',
              mimeType: 'audio/mpeg',
              durationMs: 600000,
              url: 'https://cdn.test/l1.mp3',
            },
            audioStartMs: 0,
            audioEndMs: 600000,
            questionGroups: [
              {
                ...groupBase,
                id: 3000,
                order: 1,
                questionType: 'FORM_COMPLETION',
                instruction: 'Write NO MORE THAN TWO WORDS for each answer.',
                wordLimit: 2,
                content: { template: 'Name: {{1}}\nPostcode: {{2}}' },
                questions: [
                  question(1, 1, { order: 1 }),
                  question(2, 2, { order: 2 }),
                ],
              },
              {
                ...groupBase,
                id: 3001,
                order: 2,
                questionType: 'MULTIPLE_CHOICE_MULTI',
                instruction: 'Choose TWO letters, A-E.',
                questions: [
                  question(3, 3, {
                    numberTo: 4,
                    prompt: 'Which TWO facilities does the centre offer?',
                    content: {
                      options: [
                        { key: 'A', text: 'A swimming pool' },
                        { key: 'B', text: 'A library' },
                        { key: 'C', text: 'A cafe' },
                        { key: 'D', text: 'A gym' },
                        { key: 'E', text: 'A car park' },
                      ],
                    },
                  }),
                ],
              },
            ],
          },
          {
            ...partBase,
            id: 301,
            order: 2,
            title: 'Part 2',
            questionGroups: [
              {
                ...groupBase,
                id: 3010,
                order: 1,
                questionType: 'MULTIPLE_CHOICE',
                instruction: 'Choose the correct letter, A, B or C.',
                questions: [
                  question(4, 5, {
                    prompt: 'Where will the tour start?',
                    content: {
                      options: [
                        { key: 'A', text: 'At the station' },
                        { key: 'B', text: 'In the office' },
                        { key: 'C', text: 'At the museum' },
                      ],
                    },
                  }),
                ],
              },
            ],
          },
        ],
      },
      {
        id: 31,
        skill: 'READING',
        order: 2,
        durationMinutes: null,
        testParts: [
          {
            ...partBase,
            id: 310,
            order: 1,
            title: 'Passage 1',
            passage: {
              id: 1,
              title: 'The history of tea',
              subtitle: null,
              markedBy: 'ALPHABET',
              paragraphs: [
                {
                  id: 1,
                  order: 1,
                  content: 'Tea was first cultivated in ancient China.',
                },
                {
                  id: 2,
                  order: 2,
                  content: 'It later spread to Europe through trade routes.',
                },
              ],
            },
            questionGroups: [
              {
                ...groupBase,
                id: 3100,
                order: 1,
                questionType: 'MATCHING_HEADINGS',
                instruction: 'Choose the correct heading for each paragraph.',
                content: {
                  allowReuse: false,
                  options: [
                    { key: 'i', text: 'The origins of a drink' },
                    { key: 'ii', text: 'A journey across continents' },
                    { key: 'iii', text: 'Modern production methods' },
                  ],
                },
                questions: [
                  question(10, 1, { order: 1, prompt: 'Paragraph A' }),
                  question(11, 2, { order: 2, prompt: 'Paragraph B' }),
                ],
              },
            ],
          },
          {
            ...partBase,
            id: 311,
            order: 2,
            title: 'Passage 2',
            questionGroups: [],
          },
        ],
      },
    ],
    ...overrides,
  };
}
