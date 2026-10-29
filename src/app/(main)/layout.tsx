import { unstable_rethrow } from 'next/navigation';

import { Header } from '@/components/layouts';
import { getProfile } from '@/lib/api/profile';

export default async function MainLayout({ children }: LayoutProps<'/'>) {
  // Let the 401 redirect through; any other profile failure must not break the layout.
  const profile = await getProfile().catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        {children}
      </main>
    </>
  );
}
