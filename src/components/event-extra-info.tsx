import { hashKey, useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, GraduationCap, Users, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { eventDetailsKey, fetchEventDetails } from "@/lib/api/aurion";
import type { EventRef } from "@/lib/api/aurion";
import { useFetchProgress } from "@/lib/hooks/use-fetch-progress";
import type { EventPerson } from "@/types/aurion";

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

    if (data) {
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

    const progress =
        fetches.find((fetch) => fetch.id === hashKey(queryKey))?.progress ?? 5;
    return (
        <div className="mt-6 h-10 flex flex-col justify-center gap-1.5">
            <p className="text-sm leading-none text-muted-foreground">
                {t("drawerPlanningContent.loadMore")}…
            </p>
            <Progress value={progress} className="h-2" />
        </div>
    );
}
