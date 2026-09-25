import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";

import { GRADE_SCALE } from "@/lib/utils/grade-rarity";

import {
    isFullArt,
    mulberry32,
    type BoosterCard,
    type CardTreatment,
} from "./card-data";

/** Rarity symbol printed next to the card number, like the real thing */
const RARITY_SYMBOL: Record<CardTreatment, string> = {
    common: "●",
    uncommon: "◆",
    holo: "★",
    ex: "★",
    ar: "★★",
    sir: "★★★",
};

const EnergyDot = ({ color }: { color: string }) => (
    <span
        className="inline-block size-[0.75em] rounded-full"
        style={{
            background: `radial-gradient(circle at 34% 30%, #ffffff, ${color} 62%, rgba(0,0,0,0.35))`,
            boxShadow: "inset 0 0 0 0.05em rgba(0,0,0,0.35)",
        }}
    />
);

/**
 * The illustration. A grade has no artwork, so the grade itself *is* the
 * artwork: the number is the hero of the card, everything else frames it.
 */
function CardArt({ card, full }: { card: BoosterCard; full?: boolean }) {
    const Icon = card.subject.icon;
    const random = mulberry32(card.seed);
    const blobs = Array.from({ length: 5 }, () => ({
        x: random() * 100,
        y: random() * 100,
        size: 20 + random() * 45,
    }));

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{
                background: `radial-gradient(circle at 50% 22%, ${card.subject.light}, ${card.subject.accent} 45%, ${card.subject.dark} 100%)`,
            }}
        >
            {blobs.map((blob, index) => (
                <span
                    key={index}
                    className="absolute rounded-full opacity-30 blur-[0.4em]"
                    style={{
                        left: `${blob.x}%`,
                        top: `${blob.y}%`,
                        width: `${blob.size}%`,
                        height: `${blob.size}%`,
                        background:
                            index % 2 === 0
                                ? card.subject.light
                                : card.subject.dark,
                    }}
                />
            ))}
            {/* Speed lines, the way a TCG illustration frames its subject.
                Static rays from the center — they must not track the cursor. */}
            <span
                className="absolute inset-0 opacity-25"
                style={{
                    backgroundImage:
                        "repeating-conic-gradient(from 0deg at 50% 45%, rgba(255,255,255,0.7) 0deg 2deg, transparent 2deg 12deg)",
                }}
            />
            {/* Subject emblem, behind the grade */}
            <Icon
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/25"
                style={{ width: full ? "62%" : "58%", height: "auto" }}
            />
            {/* Halo, so the number never fights the illustration */}
            <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[0.5em]"
                style={{
                    width: full ? "70%" : "78%",
                    height: full ? "50%" : "62%",
                    background: `radial-gradient(ellipse, rgba(0,0,0,0.45), transparent 70%)`,
                }}
            />
            <span className="absolute inset-0 flex items-center justify-center">
                <span
                    className="flex items-baseline font-black leading-none text-white"
                    style={{
                        textShadow:
                            "0 0.04em 0.08em rgba(0,0,0,0.85)",
                        WebkitTextStroke: "0.03em rgba(0,0,0,0.4)",
                    }}
                >
                    <span style={{ fontSize: full ? "4.6em" : "3.1em" }}>
                        {card.grade.grade}
                    </span>
                    <span
                        className="opacity-80"
                        style={{ fontSize: full ? "1.5em" : "1em" }}
                    >
                        {`/${GRADE_SCALE}`}
                    </span>
                </span>
            </span>
        </div>
    );
}

function AttackRow({
    card,
    attack,
}: {
    card: BoosterCard;
    attack: BoosterCard["attacks"][number];
}) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-[0.35em]">
            <span className="flex shrink-0 gap-[0.1em]">
                {Array.from({ length: attack.cost }, (_, index) => (
                    <EnergyDot key={index} color={card.subject.accent} />
                ))}
            </span>
            <span className="min-w-0 flex-1 truncate font-bold">
                {t(attack.nameKey)}
            </span>
            <span className="shrink-0 font-black">{attack.damage}</span>
        </div>
    );
}

/** One card front, laid out like a real TCG card. Scales with `width`. */
export function PokemonCard({
    card,
    width,
}: {
    card: BoosterCard;
    width: number;
}) {
    const { t } = useTranslation();
    const full = isFullArt(card.treatment);
    const gold = card.treatment === "sir";
    const isEx = card.treatment === "ex";
    const name = t(card.subjectLabelKey);

    const frame = gold
        ? "linear-gradient(150deg, #fde68a, #d4a017 35%, #fff3c4 55%, #b8860b 80%)"
        : isEx
          ? "linear-gradient(150deg, #f3e2a9, #cfa640 45%, #f7edc4)"
          : "linear-gradient(150deg, #f7e07a, #e8c33c 45%, #f9ecae)";

    return (
        <div
            className={`poke-card relative overflow-hidden rounded-[0.9em] ${
                card.treatment === "common" ? "" : "poke-holo-host"
            }`}
            style={{
                width,
                aspectRatio: "63 / 88",
                fontSize: width / 20,
                background: frame,
                boxShadow:
                    "0 0.5em 1.4em rgba(0,0,0,0.45), inset 0 0 0 0.06em rgba(0,0,0,0.35)",
            }}
        >
            {full && <CardArt card={card} full />}

            <div
                className="absolute inset-[0.42em] flex flex-col overflow-hidden rounded-[0.55em]"
                style={
                    full
                        ? { background: "transparent" }
                        : {
                              background: `linear-gradient(165deg, ${card.subject.light}, ${card.subject.accent})`,
                              boxShadow: "inset 0 0 0 0.05em rgba(0,0,0,0.25)",
                          }
                }
            >
                {/* Name plate */}
                <div
                    className={`flex items-center gap-[0.3em] px-[0.4em] py-[0.25em] ${
                        full
                            ? "rounded-[0.3em] bg-black/45 backdrop-blur-[1px]"
                            : ""
                    }`}
                    style={full ? { margin: "0.3em" } : undefined}
                >
                    <div className="min-w-0 flex-1">
                        <p
                            className={`truncate text-[0.62em] font-bold uppercase tracking-wider ${
                                full ? "text-white/70" : "text-black/60"
                            }`}
                        >
                            {t("gradesPage.booster.stage")}
                        </p>
                        <p
                            className={`flex items-baseline gap-[0.2em] truncate text-[1.05em] font-black leading-tight ${
                                full ? "text-white" : "text-zinc-900"
                            }`}
                        >
                            {name}
                            {isEx && (
                                <span className="text-[0.85em] font-black italic text-amber-700">
                                    {t("gradesPage.booster.ex")}
                                </span>
                            )}
                        </p>
                    </div>
                    <span
                        className={`shrink-0 font-black leading-none ${
                            full ? "text-white" : "text-zinc-900"
                        }`}
                    >
                        <span className="text-[0.6em] align-top">
                            {t("gradesPage.booster.hp")}
                        </span>
                        <span className="text-[1.15em]">{card.hp}</span>
                    </span>
                    <EnergyDot color={card.subject.accent} />
                </div>

                {!full && (
                    <>
                        <div
                            className="relative mx-[0.3em] overflow-hidden rounded-[0.15em]"
                            style={{
                                aspectRatio: "4 / 3",
                                boxShadow:
                                    "0 0 0 0.09em #d4b13c, 0 0 0 0.14em rgba(0,0,0,0.35)",
                            }}
                        >
                            <CardArt card={card} />
                        </div>
                        <p className="mx-[0.3em] mt-[0.25em] truncate rounded-[0.1em] bg-black/25 px-[0.3em] py-[0.1em] text-[0.58em] font-medium text-white">
                            {t("gradesPage.booster.speciesLine", {
                                species: t(
                                    `gradesPage.booster.subjects.${card.subject.id}.species`
                                ),
                                evaluation: card.grade.name,
                            })}
                        </p>
                    </>
                )}

                {/* Attacks */}
                <div
                    className={`mx-[0.3em] mt-[0.3em] flex flex-col gap-[0.3em] rounded-[0.2em] px-[0.35em] py-[0.3em] text-[0.72em] ${
                        full
                            ? "bg-black/55 text-white backdrop-blur-[2px]"
                            : "flex-1 justify-center bg-[#f7f1e0] text-zinc-900"
                    }`}
                    style={full ? { margin: "auto 0.3em 0.3em" } : undefined}
                >
                    {card.attacks.map((attack, index) => (
                        <AttackRow key={index} card={card} attack={attack} />
                    ))}

                    <div
                        className={`mt-[0.15em] flex items-center justify-between gap-[0.3em] border-t pt-[0.2em] text-[0.72em] ${
                            full ? "border-white/25" : "border-black/20"
                        }`}
                    >
                        <span className="truncate">
                            {t("gradesPage.booster.weakness")}{" "}
                            <span className="font-bold">
                                {t("gradesPage.booster.weaknessValue", {
                                    type: t(card.subject.weaknessKey),
                                })}
                            </span>
                        </span>
                        <span className="truncate">
                            {t("gradesPage.booster.resistance")}{" "}
                            <span className="font-bold">
                                {t("gradesPage.booster.resistanceValue", {
                                    type: t(card.subject.resistanceKey),
                                })}
                            </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-[0.15em]">
                            {t("gradesPage.booster.retreat")}
                            {Array.from(
                                { length: card.retreat },
                                (_, index) => (
                                    <EnergyDot key={index} color="#d4d4d8" />
                                )
                            )}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className={`flex items-center justify-between gap-[0.3em] px-[0.45em] pb-[0.25em] pt-[0.2em] text-[0.5em] ${
                        full ? "text-white/80" : "text-black/70"
                    }`}
                >
                    <span className="truncate italic">
                        {t("gradesPage.booster.illustrator")}
                    </span>
                    <span className="shrink-0 font-mono font-bold tracking-tight">
                        {card.number} {RARITY_SYMBOL[card.treatment]}
                    </span>
                </div>
            </div>

            {card.treatment !== "common" && (
                <>
                    <span
                        className={`poke-shine pointer-events-none absolute inset-0 rounded-[0.9em] ${
                            gold ? "poke-shine-gold" : ""
                        }`}
                        style={{
                            opacity:
                                card.treatment === "uncommon"
                                    ? 0.25
                                    : card.treatment === "holo"
                                      ? 0.5
                                      : 0.75,
                        }}
                    />
                    <span className="poke-glare pointer-events-none absolute inset-0 rounded-[0.9em]" />
                </>
            )}
        </div>
    );
}

export function CardBack({ width }: { width: number }) {
    const { t } = useTranslation();

    return (
        <div
            className="relative"
            style={
                {
                    width,
                    fontSize: width / 20,
                } as CSSProperties
            }
        >
            <div
                className="relative overflow-hidden rounded-[0.9em]"
                style={{
                    aspectRatio: "63 / 88",
                    background:
                        "linear-gradient(160deg, #1e3a8a 0%, #172554 45%, #0f172a 100%)",
                    boxShadow:
                        "0 0.5em 1.4em rgba(0,0,0,0.5), inset 0 0 0 0.06em rgba(255,255,255,0.15)",
                }}
            >
                <span
                    className="absolute inset-[0.4em] rounded-[0.6em]"
                    style={{
                        background:
                            "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 0.3em, transparent 0.3em 0.6em)",
                        boxShadow: "inset 0 0 0 0.08em rgba(250,204,21,0.55)",
                    }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.4em]">
                    <span
                        className="relative flex size-[4.2em] items-center justify-center rounded-full"
                        style={{
                            background:
                                "conic-gradient(from 210deg, #f8fafc 0deg 180deg, #ef4444 180deg 360deg)",
                            boxShadow:
                                "0 0 0 0.18em #0f172a, 0 0.2em 0.6em rgba(0,0,0,0.6)",
                        }}
                    >
                        <span className="size-[1.5em] rounded-full bg-white shadow-[0_0_0_0.16em_#0f172a]" />
                    </span>
                    <span className="text-[0.9em] font-black uppercase tracking-[0.35em] text-amber-300">
                        {t("gradesPage.booster.cardBack")}
                    </span>
                </div>
            </div>
        </div>
    );
}
