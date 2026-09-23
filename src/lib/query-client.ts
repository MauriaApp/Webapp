import { QueryCache, QueryClient } from "@tanstack/react-query";
import { trackNewGrades } from "@/lib/utils/unopened-grades";
import type { Grade } from "@/types/aurion";

/**
 * The app-wide TanStack Query client, in its own module so non-React code
 * (the API layer's fetch timing) can read the query cache too.
 */
export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onSuccess: (data, query) => {
            if (query.queryKey[0] === "grades") {
                trackNewGrades(data as Grade[]);
            }
        },
    }),
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24,
            staleTime: 1000 * 60 * 5,
        },
    },
});
