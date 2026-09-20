import { ReactNode } from "react";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
    getFromStorage,
    removeFromStorage,
    saveToStorage,
} from "@/lib/utils/storage";
import { trackNewGrades } from "@/lib/utils/unopened-grades";
import type { Grade } from "@/types/aurion";

const queryClient = new QueryClient({
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

const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

const localStorageAsyncPersister = createAsyncStoragePersister({
    storage: {
        getItem: (key) => Promise.resolve(getFromStorage(key)),
        setItem: (key, value) => Promise.resolve(saveToStorage(key, value)),
        removeItem: (key) => Promise.resolve(removeFromStorage(key)),
    },
});

interface ReactQueryProviderProps {
    children: ReactNode;
}

export const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister: localStorageAsyncPersister,
                maxAge: PERSIST_MAX_AGE,
            }}
            onSuccess={() => {
                console.log(
                    "Cache React Query restauré avec persistance asynchrone"
                );
            }}
        >
            {children}
        </PersistQueryClientProvider>
    );
};
