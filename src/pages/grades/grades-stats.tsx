"use client";

import { Grade } from "@/types/aurion";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function parseNum(val?: string | null): number {
    if (!val) return NaN;
    return parseFloat(val.replace(",", "."));
}

export function GradePositionSlider({ grade }: { grade: Grade }) {
    const { t } = useTranslation();
    const trackRef = useRef<HTMLDivElement>(null);
    const [trackW, setTrackW] = useState(300);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const obs = new ResizeObserver((entries) => {
            setTrackW(entries[0].contentRect.width);
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const myGrade = parseNum(grade.grade);
    const avg = parseNum(grade.average);
    const median = parseNum(grade.median);
    const min = parseNum(grade.min);
    const max = parseNum(grade.max);

    if (isNaN(myGrade)) return null;

    const allValues = [myGrade, avg, median, min, max].filter((v) => !isNaN(v) && v > 0);
    const scale = allValues.every((v) => v <= 10) ? 10 : 20;
    const pct = (val: number) =>
        `${Math.min(100, Math.max(0, (val / scale) * 100))}%`;

    const isAboveAverage = !isNaN(avg) && myGrade >= avg;
    const accentColor = isAboveAverage ? "hsl(142 70% 45%)" : "hsl(0 70% 55%)";

    const classMarkers = [
        { value: min, label: t("gradesPage.min") },
        { value: avg, label: t("gradesPage.average") },
        { value: median, label: t("gradesPage.median") },
        { value: max, label: t("gradesPage.max") },
    ].filter((m) => !isNaN(m.value) && m.value > 0);

    const sd = parseNum(grade.standardDeviation);
    const sdStart = !isNaN(avg) && !isNaN(sd) ? Math.max(0, avg - sd) : null;
    const sdEnd   = !isNaN(avg) && !isNaN(sd) ? Math.min(scale, avg + sd) : null;

    const TRACK_TOP = 44;
    const TRACK_H = 12;
    const DOT_SIZE = 22;
    const CHAR_W = 5.5;
    const GAP = 4;
    const ROW_H = 14;

    function halfW(text: string) {
        return (text.length * CHAR_W) / 2;
    }
    function overlapsH(posA: number, labelA: string, posB: number, labelB: string) {
        const pxA = (posA / 100) * trackW;
        const pxB = (posB / 100) * trackW;
        return Math.abs(pxA - pxB) < halfW(labelA) + halfW(labelB) + GAP;
    }

    const numbersAbove = [...classMarkers]
        .sort((a, b) => a.value - b.value)
        .reduce<Array<{ value: number; label: string; visible: boolean }>>((acc, m) => {
            const lastVisible = [...acc].reverse().find((p) => p.visible);
            const visible =
                !lastVisible ||
                !overlapsH(
                    (m.value / scale) * 100,
                    String(m.value),
                    (lastVisible.value / scale) * 100,
                    String(lastVisible.value)
                );
            acc.push({ ...m, visible });
            return acc;
        }, []);

    const placedMarkers = [...classMarkers]
        .sort((a, b) => a.value - b.value)
        .reduce<Array<{ value: number; label: string; row: number }>>((acc, m) => {
            const pos = (m.value / scale) * 100;
            let row = 0;
            while (acc.filter((p) => p.row === row).some((p) => overlapsH(pos, m.label, (p.value / scale) * 100, p.label))) {
                row++;
            }
            acc.push({ ...m, row });
            return acc;
        }, []);

    const maxRow = placedMarkers.reduce((max, m) => Math.max(max, m.row), 0);
    const labelsBottom = TRACK_TOP + TRACK_H + 4 + (4 + maxRow * ROW_H) + 10;
    const SD_TOP = labelsBottom + 6;
    const containerH = SD_TOP + 20;

    return (
        <div className="space-y-1">
            <p className="text-sm font-medium">{t("gradesPage.positionInClass")}</p>
            <div className="relative w-full" style={{ height: containerH }}>
                <div
                    ref={trackRef}
                    className="absolute left-0 right-0 rounded-full bg-muted"
                    style={{ top: TRACK_TOP, height: TRACK_H }}
                />
                <div
                    className="absolute left-0 right-0 overflow-hidden rounded-full"
                    style={{ top: TRACK_TOP, height: TRACK_H }}
                >
                    <div
                        className="absolute left-0 top-0 h-full"
                        style={{ width: pct(myGrade), backgroundColor: accentColor, opacity: 0.35 }}
                    />
                </div>
                {classMarkers.map((m) => (
                    <div
                        key={m.label}
                        className="absolute"
                        style={{
                            left: pct(m.value),
                            top: TRACK_TOP,
                            width: 2,
                            height: TRACK_H,
                            transform: "translateX(-50%)",
                            backgroundColor: "hsl(var(--muted-foreground) / 0.45)",
                        }}
                    />
                ))}
                <div
                    className="absolute"
                    style={{
                        left: pct(myGrade),
                        top: TRACK_TOP + TRACK_H / 2,
                        transform: "translate(-50%, -50%)",
                        width: DOT_SIZE,
                        height: DOT_SIZE,
                        borderRadius: "50%",
                        backgroundColor: accentColor,
                        border: "2.5px solid hsl(var(--background))",
                        boxShadow: `0 0 0 3px ${accentColor}40, 0 2px 6px rgba(0,0,0,0.18)`,
                        zIndex: 10,
                    }}
                />
                <div
                    className="absolute flex flex-col items-center"
                    style={{ left: pct(myGrade), top: 0, transform: "translateX(-50%)" }}
                >
                    <span
                        className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                        style={{ backgroundColor: accentColor }}
                    >
                        {grade.grade}/{scale}
                    </span>
                    <div className="w-px" style={{ height: 8, backgroundColor: accentColor }} />
                </div>
                {numbersAbove.map((m) =>
                    m.visible ? (
                        <div
                            key={m.label}
                            className="absolute flex flex-col items-center"
                            style={{
                                left: pct(m.value),
                                top: TRACK_TOP - 18,
                                transform: "translateX(-50%)",
                            }}
                        >
                            <span className="whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                                {m.value}
                            </span>
                            <div
                                className="w-px"
                                style={{ height: 4, backgroundColor: "hsl(var(--muted-foreground) / 0.3)" }}
                            />
                        </div>
                    ) : null
                )}
                {placedMarkers.map((m) => (
                    <div
                        key={m.label}
                        className="absolute flex flex-col items-center"
                        style={{
                            left: pct(m.value),
                            top: TRACK_TOP + TRACK_H + 4,
                            transform: "translateX(-50%)",
                        }}
                    >
                        <div
                            className="w-px"
                            style={{
                                height: 4 + m.row * ROW_H,
                                backgroundColor: "hsl(var(--muted-foreground) / 0.3)",
                            }}
                        />
                        <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                            {m.label}
                        </span>
                    </div>
                ))}
                <div
                    className="absolute left-0 right-0 flex justify-between"
                    style={{ top: TRACK_TOP + TRACK_H + 4 }}
                >
                    <span className="text-[9px] text-muted-foreground/40">0</span>
                    <span className="text-[9px] text-muted-foreground/40">{scale}</span>
                </div>
                {sdStart !== null && sdEnd !== null && (
                    <>
                        <div
                            className="absolute w-px bg-muted-foreground/40"
                            style={{ left: pct(sdStart), top: SD_TOP, height: 8 }}
                        />
                        <div
                            className="absolute w-px bg-muted-foreground/40"
                            style={{ left: pct(sdEnd), top: SD_TOP, height: 8 }}
                        />
                        <div
                            className="absolute bg-muted-foreground/40"
                            style={{
                                left: pct(sdStart),
                                width: `${((sdEnd - sdStart) / scale) * 100}%`,
                                top: SD_TOP + 4,
                                height: 1,
                            }}
                        />
                        <div
                            className="absolute flex justify-center"
                            style={{
                                left: pct(sdStart),
                                width: `${((sdEnd - sdStart) / scale) * 100}%`,
                                top: SD_TOP + 8,
                            }}
                        >
                            <span className="text-[9px] text-muted-foreground/60 whitespace-nowrap">
                                {t("gradesPage.standardDeviation")}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

