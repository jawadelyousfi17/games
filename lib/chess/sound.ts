/**
 * Tiny WebAudio synth for game-end fanfares.
 *
 * Three short sequences (win / loss / draw) stitched together from oscillator
 * notes — small enough to inline so we don't ship audio assets, distinctive
 * enough to recognize the outcome by ear.
 */

type Outcome = "win" | "loss" | "draw";

const SEQUENCES: Record<Outcome, Array<{ freq: number; ms: number }>> = {
  // Major triad ascending — celebratory.
  win: [
    { freq: 523.25, ms: 120 }, // C5
    { freq: 659.25, ms: 120 }, // E5
    { freq: 783.99, ms: 220 }, // G5
    { freq: 1046.5, ms: 360 }, // C6
  ],
  // Minor triad descending — defeat.
  loss: [
    { freq: 440.0, ms: 160 }, // A4
    { freq: 369.99, ms: 160 }, // F#4
    { freq: 293.66, ms: 320 }, // D4
  ],
  // Two-note neutral.
  draw: [
    { freq: 523.25, ms: 180 },
    { freq: 392.0, ms: 280 },
  ],
};

let cachedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (cachedCtx) return cachedCtx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  cachedCtx = new Ctor();
  return cachedCtx;
}

/**
 * Plays the synthesized fanfare for a given outcome. Resolves once the last
 * note has scheduled — the actual audio plays asynchronously via the audio
 * graph. No-op when WebAudio isn't available.
 */
export function playGameEndSound(outcome: Outcome): void {
  const ctx = getCtx();
  if (!ctx) return;
  // Browsers suspend new contexts until a user gesture; resume just in case.
  if (ctx.state === "suspended") void ctx.resume();

  const sequence = SEQUENCES[outcome];
  let cursor = ctx.currentTime + 0.02;

  for (const note of sequence) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = note.freq;
    // Quick attack/decay envelope so the notes don't click.
    gain.gain.setValueAtTime(0, cursor);
    gain.gain.linearRampToValueAtTime(0.18, cursor + 0.02);
    gain.gain.linearRampToValueAtTime(0, cursor + note.ms / 1000);

    osc.connect(gain).connect(ctx.destination);
    osc.start(cursor);
    osc.stop(cursor + note.ms / 1000 + 0.05);
    cursor += note.ms / 1000;
  }
}
