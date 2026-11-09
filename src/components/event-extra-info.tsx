import { useEffect, useRef, useState } from "react";
import { hashKey, useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, GraduationCap, Users, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { eventDetailsKey, fetchEventDetails } from "@/lib/api/aurion";
import type { EventRef } from "@/lib/api/aurion";
import { useFetchProgress } from "@/lib/hooks/use-fetch-progress";
import type { EventPerson } from "@/types/aurion";

// Same closing as the top bar's ring: ramp to 100% (ease-out cubic), then a
// short pause on the full bar before the content takes its place.
const RAMP_MS = 800;
const HOLD_MS = 300;

const formatPerson = ({ firstName, lastName }: EventPerson) =>
    `${firstName} ${lastName}`.trim();

/** Group codes read "2627_ISEN_CPG2_MPI": show them with spaces. */
const formatGroupCode = (code: string) => code.replace(/_/g, " ");

function DetailsDropdown({
    icon: Icon,
    label,
    items,
}: {
    icon: typeof User;
    label: string;
    items: string[];
}) {
    // An empty list (no teacher assigned, say) has nothing to unfold.
    if (items.length === 0) return null;
    return (
        <details className="group">
            <summary className="font-semibold cursor-pointer text-mauria-purple dark:text-gray-300 oled:text-gray-200 flex items-center gap-2 hover:text-mauria-purple/80 oled:hover:text-gray-200 transition-colors">
                <Icon className="w-4 h-4" />
                {label} ({items.length})
                <ChevronDownIcon className="w-4 h-4 ml-auto" />
            </summary>
            <ul className="mt-1 space-y-1 px-3 py-1 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                {items.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                ))}
            </ul>
        </details>
    );
}

/**
 * Mounted only once the user asked for the extra info, so the query (and its
 * entry in the fetch progress) doesn't exist for events nobody opened. The
 * progress bar follows the same fake progress as the top bar's ring, read
 * from this query's own entry.
 */
export function EventExtraInfo({ lesson }: { lesson: EventRef }) {
    const { t } = useTranslation();
    const queryKey = eventDetailsKey(lesson);
    const { data, isError, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await fetchEventDetails(lesson);
            if (!res?.success || !res.data) {
                throw new Error("eventDetails failed");
            }
            return res.data;
        },
        retry: false,
        staleTime: Infinity,
    });
    const { fetches } = useFetchProgress();

    // The fetch's entry leaves the progress tracking a moment before the data
    // lands here: without a memory the bar would fall back to its start value
    // for one render. It only ever moves forward.
    const reached = useRef({ key: "", value: 5 });
    const hash = hashKey(queryKey);
    if (reached.current.key !== hash) {
        reached.current = { key: hash, value: 5 };
    }
    const progress = Math.max(
        fetches.find((fetch) => fetch.id === hash)?.progress ?? 5,
        reached.current.value
    );
    reached.current.value = progress;

    // Content shows up once the bar has slid to 100%. Data already in the
    // cache at mount (nothing was loading) is shown right away.
    const [revealed, setRevealed] = useState(data !== undefined);
    const [ramp, setRamp] = useState<number | null>(null);
    useEffect(() => {
        if (!data || revealed) return;
        const from = reached.current.value;
        const start = Date.now();
        let holdId = 0;
        const rampId = window.setInterval(() => {
            const t = Math.min(1, (Date.now() - start) / RAMP_MS);
            setRamp(from + (100 - from) * (1 - Math.pow(1 - t, 3)));
            if (t >= 1) {
                window.clearInterval(rampId);
                holdId = window.setTimeout(() => setRevealed(true), HOLD_MS);
            }
        }, 16);
        return () => {
            window.clearInterval(rampId);
            window.clearTimeout(holdId);
        };
    }, [data, revealed]);

    if (data && revealed) {
        return (
            <div className="mt-6 space-y-4">
                <DetailsDropdown
                    icon={User}
                    label={t("drawerPlanningContent.teachers")}
                    items={data.teachers.map(formatPerson)}
                />
                <DetailsDropdown
                    icon={GraduationCap}
                    label={t("drawerPlanningContent.students")}
                    items={data.students.map(formatPerson)}
                />
                <DetailsDropdown
                    icon={Users}
                    label={t("drawerPlanningContent.groups")}
                    items={data.groups.map((g) => formatGroupCode(g.code))}
                />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mt-6 space-y-2">
                <p className="text-sm text-destructive">
                    {t("drawerPlanningContent.loadError")}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                    {t("common.retry")}
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-6 h-10 flex flex-col justify-center gap-1.5">
            <p className="text-sm leading-none text-muted-foreground">
                {t("drawerPlanningContent.loadMore")}…
            </p>
            <Progress
                value={ramp ?? progress}
                // Same easing as the top bar's ring: the default ease-in-out
                // restarts slowly on every tick (one per 140ms), which reads
                // as stop-and-go.
                className="h-2 [&>div]:duration-200 [&>div]:ease-out"
            />
        </div>
    );
}
