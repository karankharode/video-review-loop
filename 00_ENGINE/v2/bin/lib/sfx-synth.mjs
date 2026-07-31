/**
 * Cinematic SFX, synthesised rather than sourced.
 *
 * Risers, whooshes, impacts and pings are noise sweeps, filtered ramps and
 * decaying sines — they are *made of DSP*, so generating them costs nothing,
 * carries no licence, needs no download, and is reproducible from a seed. A
 * downloaded pack would mean attribution to track, files to gitignore, and a
 * fetch step that can fail. This has none of that.
 *
 * User-supplied files are still supported (see bin/lib/sfx.mjs) — this is the
 * default, not the only option.
 *
 * ## The anchor
 *
 * Every effect returns an `anchor`: the offset *within the clip* where its
 * moment lands. A riser's anchor is its peak at the very end; an impact's is
 * its transient near the start; a whoosh's is the middle of its sweep. The
 * scheduler aligns the anchor to the cut, not the clip's start.
 *
 * This is the whole reason the effects land right. "A riser that peaks at the
 * reveal" and "a hit that lands exactly on the cut" are the same instruction
 * with different anchors, and getting it wrong by 200ms is the difference
 * between punctuation and mud.
 */

const TAU = Math.PI * 2;

/** Deterministic RNG, so a seed reproduces a variant exactly. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * State-variable filter. Chosen over a biquad because its coefficients can be
 * recomputed every sample without blowing up, which is exactly what a sweep
 * needs — the cutoff moves continuously through the whole effect.
 */
function svf() {
  let low = 0;
  let band = 0;
  return (x, cutoff, q, rate, mode) => {
    const f = 2 * Math.sin((Math.PI * Math.min(cutoff, rate * 0.45)) / rate);
    const damp = Math.min(2 * (1 - Math.pow(q, 0.25)), Math.min(2, 2 / f - f * 0.5));
    const high = x - low - damp * band;
    band += f * high;
    low += f * band;
    return mode === 'bp' ? band : mode === 'hp' ? high : low;
  };
}

/** Exponential curve from a to b. Ear hears ratios, not differences. */
const expRamp = (a, b, t) => a * Math.pow(b / a, t);
/** Smooth 0..1..0 window with no clicks at the edges. */
const hann = (t) => 0.5 - 0.5 * Math.cos(TAU * Math.min(Math.max(t, 0), 1));

/**
 * A cheap stereo widener: delay one channel by a few samples and invert a
 * little of it. Enough to make a mono noise sweep feel like it moves past the
 * listener rather than sitting in the middle of their head.
 */
function widen(pcm, rate, amount = 1) {
  const d = Math.round((0.012 * rate) / 1000) * Math.round(amount * 20);
  if (d <= 0) return pcm;
  const out = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i += 2) {
    const j = i - d * 2;
    const delayed = j >= 0 ? pcm[j] : 0;
    out[i] = pcm[i];
    out[i + 1] = pcm[i + 1] * 0.8 + delayed * 0.35;
  }
  return out;
}

/** Short decaying tail. Gives an impact a room to happen in. */
function tail(pcm, rate, seconds = 0.25, mix = 0.25) {
  const d1 = Math.round(0.0297 * rate);
  const d2 = Math.round(0.0371 * rate);
  const fb = Math.pow(0.001, 1 / (seconds * rate));
  const b1 = new Float32Array(d1);
  const b2 = new Float32Array(d2);
  let i1 = 0;
  let i2 = 0;
  for (let i = 0; i < pcm.length; i += 2) {
    const x = (pcm[i] + pcm[i + 1]) * 0.5;
    const y1 = b1[i1];
    const y2 = b2[i2];
    b1[i1] = x + y1 * fb;
    b2[i2] = x + y2 * fb;
    i1 = (i1 + 1) % d1;
    i2 = (i2 + 1) % d2;
    pcm[i] += y1 * mix;
    pcm[i + 1] += y2 * mix;
  }
  return pcm;
}

/** Peak-normalise to a target dBFS. */
function normalise(pcm, targetDb) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  if (peak === 0) return pcm;
  const g = Math.pow(10, targetDb / 20) / peak;
  for (let i = 0; i < pcm.length; i++) pcm[i] *= g;
  return pcm;
}

const alloc = (rate, seconds) => new Float32Array(Math.ceil(rate * seconds) * 2);

// --- the effects ------------------------------------------------------------
//
// Each returns {pcm, anchor}. Durations are deliberate: the research on
// short-form pacing puts risers at 1.5-3s (long enough to build, short enough
// not to eat the beat) and transition whooshes under half a second.

const EFFECTS = {
  /** Noise sweeping up, peaking at the very end. Anchor: the peak. */
  riser(rate, rnd, dur = 2.0) {
    const n = Math.ceil(rate * dur);
    const pcm = alloc(rate, dur);
    const f = svf();
    const g = svf();
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const noise = rnd() * 2 - 1;
      // Cutoff climbs exponentially; the ear reads that as accelerating.
      const cut = expRamp(220, 7800, Math.pow(t, 1.6));
      let s = f(noise, cut, 0.72, rate, 'bp') * 2.2;
      // A second, narrower band an octave up adds the "tightening" quality.
      s += g(noise, cut * 2.02, 0.9, rate, 'bp') * 1.1 * t;
      // Level builds, then a fast lift in the last 15%.
      const env = Math.pow(t, 1.35) * (t > 0.85 ? 1 + (t - 0.85) * 4 : 1);
      pcm[i * 2] = s * env;
      pcm[i * 2 + 1] = s * env;
    }
    return {pcm: normalise(widen(pcm, rate, 0.6), -6), anchor: dur};
  },

  /** Fast band-passed sweep past the listener. Anchor: mid-sweep. */
  whoosh(rate, rnd, dur = 0.42) {
    const n = Math.ceil(rate * dur);
    const pcm = alloc(rate, dur);
    const f = svf();
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const noise = rnd() * 2 - 1;
      // Up then down: the doppler shape of something passing by.
      const cut = expRamp(400, 5200, Math.sin(t * Math.PI) * 0.9 + t * 0.1);
      const s = f(noise, cut, 0.6, rate, 'bp') * 2.6;
      const env = hann(t) * (0.7 + 0.3 * Math.sin(t * Math.PI));
      pcm[i * 2] = s * env;
      pcm[i * 2 + 1] = s * env;
    }
    return {pcm: normalise(widen(pcm, rate, 1), -8), anchor: dur * 0.5};
  },

  /** Swells backwards into the cut. Anchor: the end, where it stops dead. */
  whoosh_rev(rate, rnd, dur = 0.55) {
    const n = Math.ceil(rate * dur);
    const pcm = alloc(rate, dur);
    const f = svf();
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const noise = rnd() * 2 - 1;
      const cut = expRamp(600, 4200, t);
      const s = f(noise, cut, 0.65, rate, 'bp') * 2.6;
      const env = Math.pow(t, 2.2); // silence → slam
      pcm[i * 2] = s * env;
      pcm[i * 2 + 1] = s * env;
    }
    return {pcm: normalise(widen(pcm, rate, 0.8), -8), anchor: dur};
  },

  /** Low thump plus a transient. Anchor: the transient, right at the front. */
  impact(rate, rnd, dur = 0.9) {
    const n = Math.ceil(rate * dur);
    const pcm = alloc(rate, dur);
    let ph = 0;
    const f = svf();
    for (let i = 0; i < n; i++) {
      const t = i / n;
      // Pitch drops fast — that drop is what reads as weight.
      const freq = expRamp(150, 42, Math.min(1, t * 6));
      ph += (TAU * freq) / rate;
      const body = Math.sin(ph) * Math.exp(-t * 7);
      const crack = f(rnd() * 2 - 1, 2600, 0.5, rate, 'bp') * Math.exp(-t * 60) * 0.7;
      const s = body + crack;
      pcm[i * 2] = s;
      pcm[i * 2 + 1] = s;
    }
    return {pcm: normalise(tail(pcm, rate, 0.22, 0.18), -4), anchor: 0.012};
  },

  /** Pure sub sweeping down. Anchor: the front. Pairs under an impact. */
  sub_drop(rate, rnd, dur = 1.1) {
    const n = Math.ceil(rate * dur);
    const pcm = alloc(rate, dur);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const freq = expRamp(90, 28, Math.pow(t, 0.7));
      ph += (TAU * freq) / rate;
      const s = Math.sin(ph) * Math.exp(-t * 3.2);
      pcm[i * 2] = s;
      pcm[i * 2 + 1] = s;
    }
    return {pcm: normalise(pcm, -5), anchor: 0.01};
  },

  /** Two-tone ping. Anchor: the front. */
  notification(rate, rnd, dur = 0.6) {
    const n = Math.ceil(rate * dur);
    const pcm = alloc(rate, dur);
    // A major sixth reads as friendly; a tritone would read as an alert.
    const notes = [1318.5, 2217.5];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      let s = 0;
      for (let k = 0; k < notes.length; k++) {
        const start = k * 0.06;
        const lt = (i / rate - start) / (dur - start);
        if (lt < 0) continue;
        s += Math.sin(TAU * notes[k] * (i / rate)) * Math.exp(-lt * 9) * (k ? 0.5 : 0.8);
      }
      pcm[i * 2] = s;
      pcm[i * 2 + 1] = s;
      void t;
    }
    return {pcm: normalise(tail(pcm, rate, 0.3, 0.22), -9), anchor: 0.005};
  },

  /** Tight click for counters and list items. Anchor: the front. */
  tick(rate, rnd, dur = 0.12) {
    const n = Math.ceil(rate * dur);
    const pcm = alloc(rate, dur);
    const f = svf();
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const s = f(rnd() * 2 - 1, 3200, 0.4, rate, 'bp') * Math.exp(-t * 90);
      pcm[i * 2] = s;
      pcm[i * 2 + 1] = s;
    }
    return {pcm: normalise(pcm, -12), anchor: 0.004};
  },

  /** Short pitched sweep for cards sliding in. Anchor: mid. */
  slide(rate, rnd, dur = 0.3) {
    const n = Math.ceil(rate * dur);
    const pcm = alloc(rate, dur);
    const f = svf();
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const cut = expRamp(900, 3400, t);
      const s = f(rnd() * 2 - 1, cut, 0.75, rate, 'bp') * 2.2;
      pcm[i * 2] = s * hann(t);
      pcm[i * 2 + 1] = s * hann(t);
    }
    return {pcm: normalise(widen(pcm, rate, 0.5), -12), anchor: dur * 0.4};
  },

  /** Blip for a single word or number appearing. Anchor: the front. */
  pop(rate, rnd, dur = 0.18) {
    const n = Math.ceil(rate * dur);
    const pcm = alloc(rate, dur);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const freq = expRamp(420, 1150, Math.min(1, t * 3));
      ph += (TAU * freq) / rate;
      const s = Math.sin(ph) * Math.exp(-t * 16);
      pcm[i * 2] = s;
      pcm[i * 2 + 1] = s;
    }
    return {pcm: normalise(pcm, -11), anchor: 0.004};
  },
};

export const SFX_KINDS = Object.keys(EFFECTS);

/**
 * Default length per kind. Kept here rather than only as a parameter default
 * so renderSfx can jitter it per variant without knowing each effect's
 * internals. Values follow the short-form convention: risers 1.5-3s, transition
 * whooshes well under half a second.
 */
export const SFX_DURATION = {
  riser: 2.0,
  whoosh: 0.42,
  whoosh_rev: 0.55,
  impact: 0.9,
  sub_drop: 1.1,
  notification: 0.6,
  tick: 0.12,
  slide: 0.3,
  pop: 0.18,
};

/**
 * Render one effect.
 *
 * `variant` picks a deterministic alternative within the same kind. Repeating
 * one identical whoosh trains the ear to ignore it, so the scheduler rotates
 * variants; same kind, different noise and slightly different length.
 */
export function renderSfx(kind, {rate = 48000, variant = 0, duration} = {}) {
  const fn = EFFECTS[kind];
  if (!fn) throw new Error(`unknown sfx kind "${kind}" (have: ${SFX_KINDS.join(', ')})`);
  const rnd = mulberry32(0x5f3d + variant * 7919 + kind.length * 104729);
  // Vary length a few percent per variant so rotations aren't detectably the
  // same gesture at a different noise seed.
  const jitter = 1 + ((variant % 5) - 2) * 0.06;
  const dur = duration ?? SFX_DURATION[kind] * jitter;
  return fn(rate, rnd, dur);
}
