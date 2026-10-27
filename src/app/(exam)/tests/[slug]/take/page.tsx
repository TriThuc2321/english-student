import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ExamRunner } from '@/components/exam/examRunner';
import { getStudentTest } from '@/lib/api/student-tests';

export async function generateMetadata({
  params,
}: PageProps<'/tests/[slug]/take'>): Promise<Metadata> {
  const { slug } = await params;
  const test = await getStudentTest(slug);
  return { title: test?.title };
}

export default async function TakeTestPage({
  params,
}: PageProps<'/tests/[slug]/take'>) {
  const { slug } = await params;
  const test = await getStudentTest(slug);
  if (!test) notFound();

  return <ExamRunner test={test} />;
}
