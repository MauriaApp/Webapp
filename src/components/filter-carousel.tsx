import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

export type CarouselItem = { value: string | null; label: string };

/**
 * Horizontal chip picker. Native CSS scroll-snap does the snapping (momentum,
 * flicks, release all handled by the browser); JS only (a) centres the selected
 * chip once on mount and (b) adopts whichever chip ends up centred after a
 * user scroll settles. No programmatic-vs-user scroll feedback loop.
 */
export function FilterCarousel({
    items,
    selected,
    onSelect,
}: {
    items: CarouselItem[];
    selected: string | null;
    onSelect: (v: string | null) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didInitRef = useRef(false);
    const [sidePadding, setSidePadding] = useState(0);

    const selectedIndex = Math.max(
        0,
        items.findIndex((i) => i.value === selected)
    );

    const centerIndex = useCallback((idx: number, behavior: ScrollBehavior) => {
        itemRefs.current[idx]?.scrollIntoView({
            behavior,
            inline: "center",
            block: "nearest",
        });
    }, []);

    // Half-width padding on both ends so the first/last chip can reach centre.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => setSidePadding(el.clientWidth / 2);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Centre the selected chip once, as soon as the padding is laid out.
    useEffect(() => {
        if (sidePadding <= 0 || didInitRef.current) return;
        didInitRef.current = true;
        centerIndex(selectedIndex, "auto");
    }, [sidePadding, selectedIndex, centerIndex]);

    // Smoothly re-centre whenever the selection changes. Runs *after* the
    // commit (and on the next frame) so the scroll animation starts on a
    // settled DOM — otherwise the very first change would land instantly.
    const prevSelectedRef = useRef(selected);
    useEffect(() => {
        if (prevSelectedRef.current === selected) return;
        prevSelectedRef.current = selected;
        if (!didInitRef.current) return;
        const id = requestAnimationFrame(() =>
            centerIndex(selectedIndex, "smooth")
        );
        return () => cancelAnimationFrame(id);
    }, [selected, selectedIndex, centerIndex]);

    // After a user scroll settles, adopt the chip closest to the centre.
    const handleScroll = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            idleTimerRef.current = null;
            const container = containerRef.current;
            if (!container) return;
            const center = container.scrollLeft + container.clientWidth / 2;
            let bestIdx = selectedIndex;
            let bestDist = Infinity;
            for (let i = 0; i < items.length; i++) {
                const el = itemRefs.current[i];
                if (!el) continue;
                const dist = Math.abs(
                    el.offsetLeft + el.offsetWidth / 2 - center
                );
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            const value = items[bestIdx]?.value ?? null;
            if (value !== selected) onSelect(value);
        }, 120);
    }, [items, selected, selectedIndex, onSelect]);

    useEffect(
        () => () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        },
        []
    );

    // Keep horizontal drags from bubbling to the pull-to-refresh handler.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        let startX = 0;
        let startY = 0;
        let axis: "h" | "v" | null = null;
        const onStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            startX = touch.clientX;
            startY = touch.clientY;
            axis = null;
        };
        const onMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            if (!axis) {
                const dx = Math.abs(touch.clientX - startX);
                const dy = Math.abs(touch.clientY - startY);
                if (dx < 5 && dy < 5) return;
                axis = dx > dy ? "h" : "v";
            }
            if (axis === "h") e.stopPropagation();
        };
        el.addEventListener("touchstart", onStart, { passive: true });
        el.addEventListener("touchmove", onMove, { passive: false });
        return () => {
            el.removeEventListener("touchstart", onStart);
            el.removeEventListener("touchmove", onMove);
        };
    }, []);

    return (
        <div className="relative overflow-hidden">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex snap-x snap-mandatory gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden"
                style={{ paddingInline: sidePadding, scrollbarWidth: "none" }}
            >
                {items.map((item, idx) => {
                    const isSelected = item.value === selected;
                    return (
                        <Button
                            key={item.value ?? "__all__"}
                            ref={(el) => {
                                itemRefs.current[idx] = el;
                            }}
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            aria-pressed={isSelected}
                            onClick={() => {
                                if (isSelected) {
                                    // Selection won't change → re-centre here;
                                    // otherwise the effect above handles it.
                                    requestAnimationFrame(() =>
                                        centerIndex(idx, "smooth")
                                    );
                                } else {
                                    onSelect(item.value);
                                }
                            }}
                            // `border` on both states keeps the width identical
                            // when the variant flips, so chips never shift.
                            className={cn(
                                "shrink-0 snap-center border",
                                isSelected && "border-transparent"
                            )}
                        >
                            {item.label}
                        </Button>
                    );
                })}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-background to-transparent" />
        </div>
    );
}
