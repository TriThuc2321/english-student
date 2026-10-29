import type { Metadata } from 'next';

import { notFound, redirect } from 'next/navigation';

import { ResultHeader } from '@/components/results/resultHeader';
import { ResultReview } from '@/components/results/resultReview';
import { ScoreSummary } from '@/components/results/scoreSummary';
import { ROUTES } from '@/constants/routes';
import { getAttemptResult } from '@/lib/api/attempts';
import { getStudentTest } from '@/lib/api/student-tests';
import { buildResultView } from '@/lib/results/view';

export async function generateMetadata({
  params,
}: PageProps<'/attempts/[id]/result'>): Promise<Metadata> {
  const { id } = await params;
  const lookup = await getAttemptResult(id);
  return {
    title:
      lookup.status === 'ok' ? lookup.result.attempt.test.title : undefined,
  };
}

export default async function AttemptResultPage({
  params,
}: PageProps<'/attempts/[id]/result'>) {
  const { id } = await params;
  const lookup = await getAttemptResult(id);
  if (lookup.status === 'notFound') notFound();
  // An attempt still being taken has no result yet; the exam page resumes it.
  if (lookup.status === 'notGraded') {
    redirect(ROUTES.takeTest(lookup.testSlug));
  }

  const { result } = lookup;
  const test = await getStudentTest(result.attempt.test.slug);
  if (!test) notFound();

  const view = buildResultView(result, test);

  return (
    <div className="flex flex-col gap-6">
      <ResultHeader attempt={result.attempt} />
      <ScoreSummary view={view} />
      <ResultReview sections={view.sections} />
    </div>
  );
}
