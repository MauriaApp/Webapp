"use client";

import { useEffect, useState } from "react";
import { UpdateDrawer } from "@/components/update-drawer";
import { fetchUpdates } from "@/lib/api/supa";
import { useQuery } from "@tanstack/react-query";
import { UpdatesEntry } from "@/types/data";
import { getFromStorage, saveToStorage } from "@/lib/utils/storage";

const LAST_SEEN_UPDATE_KEY = "lastSeenUpdate";

export default function NewUpdateDrawer() {
    const [open, setOpen] = useState(false);
    const [update, setUpdate] = useState<UpdatesEntry | null>(null);

    const { data: updates } = useQuery({
        queryKey: ["updates"],
        queryFn: fetchUpdates,
        staleTime: 1000 * 60 * 5, // 5 min
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchOnMount: true,
    });

    useEffect(() => {
        if (updates) {
            const last = updates[0]?.version ?? null;
            if (last) {
                const seen = getFromStorage(LAST_SEEN_UPDATE_KEY);
                if (seen !== last) {
                    saveToStorage(LAST_SEEN_UPDATE_KEY, last);
                    setOpen(true);
                }
            }
            setUpdate(updates[0] ?? null);
        }
    }, [updates]);

    if (update === null) return null;

    return (
        <UpdateDrawer
            update={update}
            open={open}
            onOpenChange={setOpen}
        />
    );
}
