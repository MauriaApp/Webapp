import { ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24,
            staleTime: 1000 * 60 * 5,
        },
    },
});

const localStorageAsyncPersister = createAsyncStoragePersister({
    storage: {
        getItem: (key) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key, value) =>
            Promise.resolve(localStorage.setItem(key, value)),
        removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
    },
});

interface ReactQueryProviderProps {
    children: ReactNode;
}

export const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: localStorageAsyncPersister }}
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
