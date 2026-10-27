import type { Metadata } from 'next';

import { Chip } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import StartExamButton from '@/components/exam/startExamButton';
import { EXAM_CLASSES } from '@/constants/exam';
import { getStudentTest } from '@/lib/api/student-tests';
import { sectionDurationSeconds } from '@/lib/exam/structure';
import { countSectionQuestions } from '@/lib/tests/structure';

export async function generateMetadata({
  params,
}: PageProps<'/tests/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const test = await getStudentTest(slug);
  return { title: test?.title };
}

export default async function TestIntroPage({
  params,
}: PageProps<'/tests/[slug]'>) {
  const { slug } = await params;
  const [test, t] = await Promise.all([
    getStudentTest(slug),
    getTranslations(),
  ]);
  if (!test) notFound();

  const examClasses = EXAM_CLASSES[test.examType];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Chip
          size="sm"
          variant="soft"
          className={`self-start ${examClasses.soft}`}
        >
          {t(`exam.${test.examType}`)}
        </Chip>
        <h1 className="text-2xl font-semibold md:text-3xl">{test.title}</h1>
        {test.source && <p className="text-muted text-sm">{test.source}</p>}
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('taking.intro.sections')}</h2>
        <ul className="divide-separator border-separator divide-y rounded-3xl border">
          {test.testSections.map((section) => {
            const seconds = sectionDurationSeconds(test, section);
            return (
              <li
                key={section.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <span className="font-medium">
                  {t(`exam.skill.${section.skill}`)}
                </span>
                <span className="text-muted text-sm">
                  {t('taking.intro.questionCount', {
                    count: countSectionQuestions(section),
                  })}
                  {seconds !== null &&
                    ` · ${t('tests.minutes', { count: seconds / 60 })}`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <StartExamButton slug={test.slug} />
    </div>
  );
}
