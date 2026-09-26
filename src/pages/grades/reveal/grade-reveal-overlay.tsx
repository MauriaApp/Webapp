import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";

import { Grade } from "@/types/aurion";
import type { GradeRevealMode } from "@/lib/utils/experimental";
import { CaseOpening } from "./case-opening";
import { ScratchCard } from "./scratch-card";
import { SlotMachine } from "./slot-machine";

/**
 * Renders the reveal effect picked in the settings. Every mode gets the same
 * contract: a full-screen overlay for one grade, closed through `onClose`.
 */
export function GradeRevealOverlay({
    grade,
    mode,
    onClose,
}: {
    grade: Grade | null;
    mode: GradeRevealMode;
    onClose: () => void;
}) {
    const key = grade ? `${grade.date}|${grade.code}|${grade.name}` : "";

    return createPortal(
        <AnimatePresence>
            {grade && mode === "cs2" && (
                <CaseOpening key={key} grade={grade} onClose={onClose} />
            )}
            {grade && mode === "fdj" && (
                <ScratchCard key={key} grade={grade} onClose={onClose} />
            )}
            {grade && mode === "slots" && (
                <SlotMachine key={key} grade={grade} onClose={onClose} />
            )}
        </AnimatePresence>,
        document.body
    );
}
