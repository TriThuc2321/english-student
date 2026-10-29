import { permanentRedirect } from 'next/navigation';

import {
  buildTestsHref,
  parseCatalogueParams,
} from '@/lib/tests/catalogue-params';

// The library moved to `/`; keep old /tests links and bookmarks working.
export default async function TestsPage({ searchParams }: PageProps<'/tests'>) {
  permanentRedirect(buildTestsHref(parseCatalogueParams(await searchParams)));
}
