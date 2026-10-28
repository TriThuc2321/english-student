import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ExamRunner } from '@/components/exam/examRunner';
import { getStudentTest } from '@/lib/api/student-tests';
import { parseSectionIds, pickSections } from '@/lib/exam/structure';

export async function generateMetadata({
  params,
}: PageProps<'/tests/[slug]/take'>): Promise<Metadata> {
  const { slug } = await params;
  const test = await getStudentTest(slug);
  return { title: test?.title };
}

export default async function TakeTestPage({
  params,
  searchParams,
}: PageProps<'/tests/[slug]/take'>) {
  const [{ slug }, { sections }] = await Promise.all([params, searchParams]);
  const test = await getStudentTest(slug);
  if (!test) notFound();

  const picked = pickSections(test, parseSectionIds(sections));
  return <ExamRunner test={picked.test} sectionIds={picked.sectionIds} />;
}
