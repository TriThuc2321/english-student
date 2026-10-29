'use client';

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ApiError } from '@/lib/api/client';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoids an immediate client refetch of data prefetched on the server.
        staleTime: 60 * 1000,
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) &&
          failureCount < 3,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

// A fresh client per server request prevents leaking cache between users;
// the browser keeps one so React suspending during render doesn't reset it.
function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

type QueryProvidersProps = {
  children: React.ReactNode;
};

export function QueryProviders({ children }: QueryProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
