import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import type { Locale } from '@/i18n';

dayjs.extend(localizedFormat);

export const formatDate = (iso: string, locale: Locale) =>
  dayjs(iso).locale(locale).format('LL');
