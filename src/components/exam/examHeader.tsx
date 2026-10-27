'use client';

import { Chip, Tabs } from '@heroui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import type { StudentTestDetail } from '@/types/student-test';

import { ExamTimer } from './examTimer';

type ExamHeaderProps = {
  test: StudentTestDetail;
  sectionId: number;
  remaining: number | null;
  onSelectSection: (id: number) => void;
  exitHref: string;
};

export function ExamHeader({
  test,
  sectionId,
  remaining,
  onSelectSection,
  exitHref,
}: ExamHeaderProps) {
  const t = useTranslations();
  const sections = [...test.testSections].sort((a, b) => a.order - b.order);

  return (
    <header className="border-border bg-surface flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2">
      <Link
        href={exitHref}
        className="text-muted hover:text-foreground text-sm font-medium"
      >
        ← {t('taking.exit')}
      </Link>
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-sm font-semibold">{test.title}</h1>
        <Chip size="sm" variant="soft">
          {t(`exam.${test.examType}`)}
        </Chip>
      </div>
      {sections.length > 1 && (
        <Tabs
          selectedKey={String(sectionId)}
          onSelectionChange={(key) => onSelectSection(Number(key))}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label={t('taking.intro.sections')}>
              {sections.map((section) => (
                <Tabs.Tab key={section.id} id={String(section.id)}>
                  {t(`exam.skill.${section.skill}`)}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      )}
      {remaining !== null && (
        <div className="ml-auto">
          <ExamTimer seconds={remaining} />
        </div>
      )}
    </header>
  );
}
