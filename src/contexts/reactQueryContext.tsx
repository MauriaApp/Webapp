import { ReactNode } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createDoubleBufferedPersister } from "@/lib/persist/double-buffered-persister";
import { queryClient } from "@/lib/query-client";

const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

const persister = createDoubleBufferedPersister();

interface ReactQueryProviderProps {
    children: ReactNode;
}

export const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
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
