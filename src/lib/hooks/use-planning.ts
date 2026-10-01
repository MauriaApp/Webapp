import { useQuery } from "@tanstack/react-query";
import { fetchPlanning } from "@/lib/api/aurion";
import { useAurionWarm } from "@/lib/hooks/use-aurion-warm";
import { Lesson } from "@/types/aurion";

/**
 * The Aurion planning, from the same cache as the home and planning pages
 * (usually already there, persisted): for features that only read it.
 */
export function usePlanning(): Lesson[] {
    const { isWarming } = useAurionWarm();
    const { data = [] } = useQuery<Lesson[], Error>({
        queryKey: ["planning"],
        enabled: !isWarming,
        queryFn: async (): Promise<Lesson[]> => {
            const res = await fetchPlanning();
            // Throw so React Query keeps the cached data on failure.
            if (!res?.success) throw new Error("Failed to fetch planning");
            return res.data ?? [];
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 24,
        placeholderData: (previousData) => previousData,
    });
    return data;
}
