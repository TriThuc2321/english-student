import type { ReactElement } from 'react';

import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { LOCALE, type Locale } from '@/i18n';

import en from '../../messages/en.json';
import vi from '../../messages/vi.json';

const MESSAGES = { [LOCALE.EN]: en, [LOCALE.VI]: vi };

export function renderWithIntl(
  ui: ReactElement,
  { locale = LOCALE.EN }: { locale?: Locale } = {},
) {
  // A wrapper (not wrapping `ui` directly) keeps the provider on `rerender`.
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider
        locale={locale}
        messages={MESSAGES[locale]}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    ),
  });
}
