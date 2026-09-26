/**
 * Tiny Web Audio player for the grade reveal sound effects. Web Audio rather
 * than <audio>: the CS2 reel fires dozens of overlapping ticks per second,
 * which media elements can neither overlap nor start without lag.
 *
 * Files live in public/sounds: vite.config.ts gives every imported asset the
 * same fixed name, so they can't go through the bundler.
 */

export const SOUNDS = {
    cs2Tick: "sounds/cs2-tick.mp3",
    cs2Reveal: "sounds/cs2-reveal.mp3",
} as const;

export type SoundName = keyof typeof SOUNDS;

let context: AudioContext | null = null;
const buffers = new Map<SoundName, Promise<AudioBuffer | null>>();

const getContext = (): AudioContext | null => {
    if (typeof window === "undefined" || !("AudioContext" in window)) {
        return null;
    }
    context ??= new AudioContext();
    return context;
};

const loadSound = (name: SoundName): Promise<AudioBuffer | null> => {
    let buffer = buffers.get(name);
    if (!buffer) {
        const ctx = getContext();
        buffer = ctx
            ? fetch(`${import.meta.env.BASE_URL}${SOUNDS[name]}`)
                  .then((response) => response.arrayBuffer())
                  .then((data) => ctx.decodeAudioData(data))
                  .catch(() => null)
            : Promise.resolve(null);
        buffers.set(name, buffer);
    }
    return buffer;
};

/**
 * Call from the click that opens a reveal: browsers (iOS first) only let an
 * AudioContext start inside a user gesture. Also warms up the given sounds.
 */
export const unlockSounds = (...names: SoundName[]) => {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    names.forEach(loadSound);
};

/** Fire and forget; silently does nothing if audio is unavailable. */
export const playSound = (name: SoundName, volume = 1) => {
    const ctx = getContext();
    if (!ctx) return;
    void loadSound(name).then((buffer) => {
        if (!buffer) return;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain).connect(ctx.destination);
        source.start();
    });
};
