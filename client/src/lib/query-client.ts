import { MutationCache, QueryClient } from "@tanstack/react-query";
import { showRequestError } from "./toast";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => showRequestError(error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiClientError && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: false,
    }
  }
});

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fieldErrors: Array<{ field: string; message: string }> = [],
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}
