import { cache } from 'react';

import type { Profile } from '@/types/student-test';

import { apiGet } from './server';

export const getProfile = cache(() => apiGet<Profile>('/auth/profile'));
