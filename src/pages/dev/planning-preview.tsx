/* eslint-disable i18next/no-literal-string -- dev-only debug page, never shipped to users */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlanningCalendar } from "@/components/planning-calendar";
import { fadeIn, staggerGroup } from "@/lib/motion";
import { Lesson } from "@/types/aurion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Dev-only: rejoue les fixtures récoltées par API-v2/scripts/aurion-fixtures.ts
// (une par filière/promo) dans le vrai calendrier, pour valider le rendu des
// cartes sur d'autres classes que la sienne. Nécessite l'API-v2 lancée en
// local (`npm run dev`) — la route /dev/planning-fixtures n'existe qu'en dev.
const DEV_API_URL =
    import.meta.env.VITE_DEV_API_URL ?? "http://localhost:8080";

type FixtureSummary = {
    file: string;
    label: string;
    weekStart: string | null;
    events: number;
};

export function PlanningPreviewPage() {
    const [fixtures, setFixtures] = useState<FixtureSummary[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${DEV_API_URL}/dev/planning-fixtures`)
            .then((res) => res.json())
            .then((data: { fixtures: FixtureSummary[] }) => {
                setFixtures(data.fixtures);
                setSelected(data.fixtures[0]?.file ?? null);
            })
            .catch(() =>
                setError(
                    `Impossible de contacter l'API en local sur ${DEV_API_URL} — lance "npm run dev" dans API-v2/.`
                )
            );
    }, []);

    useEffect(() => {
        if (!selected) return;
        fetch(`${DEV_API_URL}/dev/planning-fixtures/${selected}`)
            .then((res) => res.json())
            .then((data: { success: boolean; data: Lesson[] }) => {
                setLessons(data.success ? data.data : []);
            })
            .catch(() => setLessons([]));
    }, [selected]);

    return (
        <motion.div variants={staggerGroup} initial="hidden" animate="show">
            <motion.h2
                variants={fadeIn}
                className="text-3xl font-bold text-mauria-purple dark:text-white mt-4 mb-6"
            >
                Planning preview (dev only)
            </motion.h2>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <motion.div variants={fadeIn} className="mb-4 max-w-xs">
                <Select
                    value={selected ?? undefined}
                    onValueChange={setSelected}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Choisir une filière" />
                    </SelectTrigger>
                    <SelectContent>
                        {fixtures.map((fixture) => (
                            <SelectItem key={fixture.file} value={fixture.file}>
                                {fixture.label} ({fixture.events})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            <motion.section
                variants={fadeIn}
                className="rounded-lg overflow-hidden shadow-lg"
            >
                <PlanningCalendar eventSources={[lessons]} />
            </motion.section>
        </motion.div>
    );
}
