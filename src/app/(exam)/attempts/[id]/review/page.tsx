import type { Metadata } from 'next';

import { notFound, redirect } from 'next/navigation';

import { ReviewRunner } from '@/components/review/reviewRunner';
import { ROUTES } from '@/constants/routes';
import { getAttemptResult } from '@/lib/api/attempts';
import { getStudentTest } from '@/lib/api/student-tests';
import { buildReviewModel, initialPosition } from '@/lib/results/review';
import { buildResultView } from '@/lib/results/view';

export async function generateMetadata({
  params,
}: PageProps<'/attempts/[id]/review'>): Promise<Metadata> {
  const { id } = await params;
  const lookup = await getAttemptResult(id);
  return {
    title:
      lookup.status === 'ok' ? lookup.result.attempt.test.title : undefined,
  };
}

export default async function AttemptReviewPage({
  params,
  searchParams,
}: PageProps<'/attempts/[id]/review'>) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const lookup = await getAttemptResult(id);
  if (lookup.status === 'notFound') notFound();
  if (lookup.status === 'inProgress') {
    redirect(ROUTES.takeTest(lookup.testSlug));
  }

  const { result } = lookup;
  const test = await getStudentTest(result.attempt.test.slug);
  if (!test) notFound();

  const model = buildReviewModel(result, test, buildResultView(result, test));
  const initial = initialPosition(model, query);
  if (!initial) notFound();

  return <ReviewRunner model={model} initial={initial} />;
}
