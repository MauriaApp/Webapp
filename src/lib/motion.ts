import type { Variants } from "framer-motion";

// Smooth, "pro" ease-out curve shared by every entrance animation.
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Standard entrance for a page element: a gentle fade, no movement.
 * Use as `variants={fadeIn}` — either standalone with
 * `initial="hidden" animate="show"`, or as a child of a `staggerGroup`
 * parent (it then inherits the parent's state and its cascade delay).
 */
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { duration: 0.4, ease: EASE },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    },
};

/**
 * Parent that cascades its `fadeIn` children top-to-bottom: each child
 * starts a little later than the one above it.
 */
export const staggerGroup: Variants = {
    hidden: {},
    show: { transition: { delayChildren: 0.15, staggerChildren: 0.09 } },
};

/**
 * Same entrance as `fadeIn`, but the delay is driven by the element's
 * index via framer's `custom` prop — use for list items so each row
 * comes in a bit after the previous one, regardless of nesting.
 * `<motion.div variants={fadeInIndexed} custom={index} initial="hidden" animate="show" exit="exit" />`
 */
export const fadeInIndexed: Variants = {
    hidden: { opacity: 0 },
    show: (i = 0) => ({
        opacity: 1,
        transition: { duration: 0.4, ease: EASE, delay: 0.04 + i * 0.055 },
    }),
    exit: {
        opacity: 0,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    },
};

/** Full-page route transition: fade, no movement. */
export const pageFade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: EASE },
};
