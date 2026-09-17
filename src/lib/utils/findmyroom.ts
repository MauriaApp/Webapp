// findmyroom codes are ALL_CAPS, underscore-separated, and mix real words
// with acronyms/ids ("ALG_SALLE_201_H_2TAB", "BDX_J003_FA024_SALLE_COURS_
// INFORMATIQUE"). We don't know what every short token means (H, VP, TV,
// 2TAB...), so we only reformat what we're sure about — real French words —
// and leave codes untouched rather than guess and get it wrong.
const WORD_TOKEN = /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/;
const MIN_WORD_LENGTH = 4;

function isWordToken(token: string): boolean {
    return token.length >= MIN_WORD_LENGTH && WORD_TOKEN.test(token);
}

function titleCase(token: string): string {
    return token.charAt(0) + token.slice(1).toLowerCase();
}

// A handful of room-code suffixes are equipment tags whose meaning we do
// know — spell those out instead of leaving the raw acronym. Anything not
// listed here (H, and any future code) stays untouched: better an
// unexplained code than a guessed-wrong label.
const TAG_LABELS: Record<string, string> = {
    VP: "(Vidéo proj.)",
    "2TAB": "(2 tableaux)",
    TV: "(Télé)",
};

function formatTokens(tokens: string[]): string {
    return tokens
        .map((token) => {
            const tag = TAG_LABELS[token.toUpperCase()];
            if (tag) return tag;
            return isWordToken(token) ? titleCase(token) : token;
        })
        .join(" ");
}

// findmyroom only exposes building codes, not their real names — this maps
// the known ones explicitly rather than guessing from the code.
const BUILDING_NAMES: Record<string, string> = {
    ALG_2RNS: "Albert Legrand",
    BORDEAUX_2AML: "Bordeaux",
    IC1: "IC1",
    IC2: "IC2",
    PR_39BV: "Palais Rameau",
};

/** "BORDEAUX_2AML" -> "Bordeaux", falls back to generic formatting. */
export function formatBuildingName(code: string): string {
    return BUILDING_NAMES[code] ?? formatTokens(code.split("_"));
}

/**
 * Every room code in a building shares a leading run of tokens (building
 * prefix, sometimes a sub-site like "BDX"), which is redundant once the
 * building is already shown as context (e.g. the drawer title). This finds
 * how many leading tokens are common to every code in the list, keeping at
 * least one token so no room ever displays blank.
 */
export function getCommonPrefixTokenCount(roomCodes: string[]): number {
    if (roomCodes.length === 0) return 0;
    const tokenLists = roomCodes.map((code) => code.split("_"));
    const minLength = Math.min(...tokenLists.map((tokens) => tokens.length));

    let count = 0;
    for (let i = 0; i < minLength - 1; i++) {
        const candidate = tokenLists[0][i];
        if (tokenLists.every((tokens) => tokens[i] === candidate)) {
            count++;
        } else {
            break;
        }
    }
    return count;
}

/** "IC2_A622_2TAB" with prefixTokens=1 -> "A622 2TAB". */
export function formatRoomName(
    roomCode: string,
    prefixTokens: number
): string {
    const tokens = roomCode.split("_");
    const remaining = tokens.slice(prefixTokens);
    return formatTokens(remaining.length > 0 ? remaining : tokens);
}

// findmyroom's sentences ("libre à 19:30", "réservable ensuite : 30 min
// max") always carry at most one figure worth drawing the eye to: the clock
// time, or the remaining duration. This finds that figure so the UI can bold
// it, converting HH:MM to the French "HHhMM" spelling outside English.
const ALL_DAY_RE = /\b(?:toute la journ[ée]e|all day)\b/i;
const DURATION_RE = /\b(?:\d+\s*h\s*\d*|\d+\s*min)\s*max\b/i;
const TIME_RE = /\b(\d{1,2}):(\d{2})\b/;

/**
 * "Réservable toute la journée" only ever shows up alongside "libre jusqu'à
 * <closing time>" — it says nothing that line doesn't already, so it's
 * worth hiding rather than restating.
 */
export function isRedundantAllDayDuration(text: string): boolean {
    return ALL_DAY_RE.test(text);
}

// For a free room, the "Libre" status badge already sits right above this
// line, so "libre jusqu'à 20:00" restates it — trim to "jusqu'à 20:00".
// Occupied rooms read "libre à 19:30" (when they free up again), which isn't
// redundant with an "Occupée" badge, so the lookahead leaves that alone.
const FREE_PREFIX_RE = /^(?:libre\s+(?=jusqu['’]à)|free\s+(?=until))/i;

export function stripRedundantFreeLabel(text: string, isFree: boolean): string {
    return isFree ? text.replace(FREE_PREFIX_RE, "") : text;
}

export type HighlightedText = {
    prefix: string;
    highlight: string;
    suffix: string;
};

export function splitHighlight(
    text: string,
    isEnglish: boolean
): HighlightedText | null {
    const allDayMatch = ALL_DAY_RE.exec(text);
    if (allDayMatch) {
        const start = allDayMatch.index;
        const end = start + allDayMatch[0].length;
        return {
            prefix: text.slice(0, start),
            highlight: allDayMatch[0],
            suffix: text.slice(end),
        };
    }

    const durationMatch = DURATION_RE.exec(text);
    if (durationMatch) {
        const start = durationMatch.index;
        const end = start + durationMatch[0].length;
        return {
            prefix: text.slice(0, start),
            highlight: durationMatch[0],
            suffix: text.slice(end),
        };
    }

    const timeMatch = TIME_RE.exec(text);
    if (timeMatch) {
        const start = timeMatch.index;
        const end = start + timeMatch[0].length;
        return {
            prefix: text.slice(0, start),
            highlight: isEnglish
                ? timeMatch[0]
                : `${timeMatch[1]}h${timeMatch[2]}`,
            suffix: text.slice(end),
        };
    }

    return null;
}

/** "18:30:36" -> "18h30" (fr) / "18:30" (en) — drops the seconds. */
export function formatTimeOfDay(time: string, isEnglish: boolean): string {
    const match = /^(\d{1,2}):(\d{2})/.exec(time);
    if (!match) return time;
    return isEnglish ? `${match[1]}:${match[2]}` : `${match[1]}h${match[2]}`;
}

// A room that's occupied now but bookable again once free states two facts
// separately ("libre à 17:00" + "réservable ensuite : 2h30 max"). The one a
// student actually wants is when that booking window closes — so we compute
// it instead of making them do the math.
const ENSUITE_DURATION_RE =
    /(?:r[ée]servable ensuite|then bookable)\s*:\s*((?:\d+\s*h\s*\d*)|(?:\d+\s*min))\s*max/i;

function parseDurationMinutes(raw: string): number | null {
    const trimmed = raw.trim();
    const hourMatch = /^(\d+)\s*h\s*(\d+)?$/i.exec(trimmed);
    if (hourMatch) {
        return (
            parseInt(hourMatch[1], 10) * 60 +
            (hourMatch[2] ? parseInt(hourMatch[2], 10) : 0)
        );
    }
    const minuteMatch = /^(\d+)\s*min$/i.exec(trimmed);
    if (minuteMatch) return parseInt(minuteMatch[1], 10);
    return null;
}

function parseClockMinutes(raw: string): number | null {
    const match = TIME_RE.exec(raw);
    if (!match) return null;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function formatClockMinutes(totalMinutes: number, isEnglish: boolean): string {
    const dayMinutes = 24 * 60;
    const normalized = ((totalMinutes % dayMinutes) + dayMinutes) % dayMinutes;
    const hh = String(Math.floor(normalized / 60)).padStart(2, "0");
    const mm = String(normalized % 60).padStart(2, "0");
    return isEnglish ? `${hh}:${mm}` : `${hh}h${mm}`;
}

/**
 * For a room in that "occupied, then bookable for a capped duration" case,
 * returns when that booking window closes (e.g. "19h30"). Returns null for
 * every other case (available now, no cap, unparseable text) — callers
 * should fall back to showing the raw sentence.
 */
export function computeBookableUntil(
    libreText: string,
    dureeText: string,
    isEnglish: boolean
): string | null {
    const durationMatch = ENSUITE_DURATION_RE.exec(dureeText);
    if (!durationMatch) return null;

    const durationMinutes = parseDurationMinutes(durationMatch[1]);
    const startMinutes = parseClockMinutes(libreText);
    if (durationMinutes === null || startMinutes === null) return null;

    return formatClockMinutes(startMinutes + durationMinutes, isEnglish);
}
