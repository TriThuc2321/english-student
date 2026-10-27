'use client';

import { SearchField } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  buildTestsHref,
  type CatalogueParams,
  SEARCH_MAX_LENGTH,
} from '@/lib/tests/catalogue-params';

const DEBOUNCE_MS = 300;

type TestSearchProps = {
  params: CatalogueParams;
};

export default function TestSearch({ params }: TestSearchProps) {
  const t = useTranslations('tests');
  const router = useRouter();
  const [value, setValue] = useState(params.q);
  // The URL value this field last produced; `params.q` echoing it back must not overwrite newer typing.
  const sentRef = useRef(params.q);
  const { exam } = params;

  useEffect(() => {
    if (params.q === sentRef.current) return;
    sentRef.current = params.q;
    setValue(params.q);
  }, [params.q]);

  useEffect(() => {
    // The page trims `q`, so compare trimmed values or a trailing space would be reset mid-typing.
    const q = value.trim();
    if (q === sentRef.current) return;
    const timer = setTimeout(() => {
      sentRef.current = q;
      router.replace(buildTestsHref({ exam, q }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, exam, router]);

  return (
    <SearchField
      aria-label={t('searchLabel')}
      value={value}
      onChange={setValue}
      maxLength={SEARCH_MAX_LENGTH}
      className="w-full sm:max-w-xs"
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={t('searchPlaceholder')} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}
