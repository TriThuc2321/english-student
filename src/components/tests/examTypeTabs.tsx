'use client';

import { Tabs } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { EXAM_TYPES, isExamType } from '@/constants/exam';
import {
  buildTestsHref,
  type CatalogueParams,
} from '@/lib/tests/catalogue-params';

const ALL = 'all';

type ExamTypeTabsProps = {
  params: CatalogueParams;
};

export default function ExamTypeTabs({ params }: ExamTypeTabsProps) {
  const t = useTranslations();
  const router = useRouter();

  const tabs = [
    { id: ALL, label: t('tests.all') },
    ...EXAM_TYPES.map((examType) => ({
      id: examType,
      label: t(`exam.${examType}`),
    })),
  ];

  return (
    <Tabs
      selectedKey={params.exam ?? ALL}
      onSelectionChange={(key) => {
        const exam = isExamType(key) ? key : undefined;
        router.push(buildTestsHref({ exam, q: params.q }));
      }}
    >
      <Tabs.ListContainer className="overflow-x-auto">
        <Tabs.List aria-label={t('tests.title')}>
          {tabs.map(({ id, label }) => (
            <Tabs.Tab key={id} id={id} className="whitespace-nowrap">
              {label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
