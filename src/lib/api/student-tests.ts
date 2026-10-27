import { cache } from 'react';

import type {
  ExamType,
  Paginated,
  StudentTestDetail,
  StudentTestListItem,
} from '@/types/student-test';

import { ApiError } from './client';
import { apiGet } from './server';

export const TESTS_PAGE_SIZE = 12;

type StudentTestsParams = {
  examType?: ExamType;
  search?: string;
  page?: number;
  take?: number;
};

export function getStudentTests({
  examType,
  search,
  page,
  take,
}: StudentTestsParams) {
  const query = new URLSearchParams();
  if (examType) query.set('examType', examType);
  if (search) query.set('search', search);
  if (page) query.set('page', String(page));
  if (take) query.set('take', String(take));
  return apiGet<Paginated<StudentTestListItem>>(`/student/tests?${query}`);
}

export const getStudentTest = cache(
  async (id: number): Promise<StudentTestDetail | null> => {
    try {
      return await apiGet<StudentTestDetail>(`/student/tests/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
);
