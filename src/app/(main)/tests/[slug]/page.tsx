import type { Metadata } from 'next';

import { Chip } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  LuChevronLeft,
  LuClock,
  LuFlag,
  LuListChecks,
  LuLogOut,
  LuSave,
  LuTimer,
} from 'react-icons/lu';

import type { StudentTestDetail } from '@/types/student-test';

import TestOverview, {
  type IntroQuestion,
  type OverviewSection,
} from '@/components/tests/testOverview';
import { useFormatDuration } from '@/components/tests/useFormatDuration';
import { EXAM_CLASSES } from '@/constants/exam';
import { ROUTES } from '@/constants/routes';
import { getStudentTest } from '@/lib/api/student-tests';
import { questionSlots, sectionDurationSeconds } from '@/lib/exam/structure';
import { countSectionQuestions } from '@/lib/tests/structure';

const GUIDE = [
  { key: 'timer', icon: LuTimer },
  { key: 'autosave', icon: LuSave },
  { key: 'flag', icon: LuFlag },
  { key: 'resume', icon: LuLogOut },
] as const;

export async function generateMetadata({
  params,
}: PageProps<'/tests/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const test = await getStudentTest(slug);
  return { title: test?.title };
}

function OverviewHeader({
  test,
  sections,
}: {
  test: StudentTestDetail;
  sections: OverviewSection[];
}) {
  const t = useTranslations();
  const formatDuration = useFormatDuration();
  const minutes = sections.reduce((sum, s) => sum + (s.minutes ?? 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <Chip
        size="sm"
        variant="soft"
        className={`self-start rounded-full ${EXAM_CLASSES[test.examType].soft}`}
      >
        {t(`exam.${test.examType}`)}
      </Chip>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {test.title}
      </h1>
      <p className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        {test.source && <span>{test.source}</span>}
        {minutes > 0 && (
          <span className="flex items-center gap-1.5">
            <LuClock aria-hidden className="size-4" />
            {formatDuration(minutes)}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <LuListChecks aria-hidden className="size-4" />
          {t('taking.intro.summaryMeta', {
            sections: sections.length,
            questions: sections.reduce((sum, s) => sum + s.questionCount, 0),
          })}
        </span>
      </p>
    </div>
  );
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

  const sorted = [...test.testSections].sort((a, b) => a.order - b.order);
  const sections: OverviewSection[] = sorted.map((section) => {
    const seconds = sectionDurationSeconds(test, section);
    return {
      id: section.id,
      skill: section.skill,
      questionCount: countSectionQuestions(section),
      minutes: seconds === null ? null : seconds / 60,
    };
  });
  const questions: IntroQuestion[] = sorted.flatMap((section) => {
    const sizes = new Map<number, number>();
    for (const slot of questionSlots(section)) {
      sizes.set(slot.questionId, (sizes.get(slot.questionId) ?? 0) + 1);
    }
    return [...sizes].map(([questionId, size]) => ({
      sectionId: section.id,
      questionId,
      size,
    }));
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={ROUTES.TESTS}
        className="text-muted hover:text-foreground -ml-1 flex w-fit items-center gap-1 rounded-full px-1 text-sm font-medium transition-colors"
      >
        <LuChevronLeft aria-hidden className="size-4" />
        {t('taking.intro.back')}
      </Link>
      <OverviewHeader test={test} sections={sections} />
      <TestOverview
        slug={test.slug}
        questions={questions}
        sections={sections}
        rules={
          <section
            aria-labelledby="rules-heading"
            className="bg-surface shadow-surface rounded-2xl p-6"
          >
            <h2 id="rules-heading" className="mb-4 text-lg font-semibold">
              {t('taking.intro.guideTitle')}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {GUIDE.map(({ key, icon: Icon }) => (
                <li
                  key={key}
                  className="bg-surface-secondary flex gap-3 rounded-xl p-4 text-sm leading-relaxed"
                >
                  <span
                    aria-hidden
                    className="bg-surface text-brand-navy shadow-surface flex size-8 flex-none items-center justify-center rounded-lg"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span>{t(`taking.intro.guide.${key}`)}</span>
                </li>
              ))}
            </ul>
          </section>
        }
      />
    </div>
  );
}
