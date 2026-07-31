/**
 * Music bed envelope.
 *
 * The one idea here: the duck is computed from `assets/words.json` — the real
 * per-word timings that forced alignment already measured off the voiceover —
 * not from a sidechain compressor guessing at the audio. That means the bed
 * knows where a word *starts* before it starts, so it can be out of the way by
 * the time the word lands instead of pumping down after it.
 *
 * It also means the gaps are knowable. Between beats the bed can lift, which is
 * what a human mixer does and what a sidechain cannot do at all.
 *
 * One envelope, two consumers: the Remotion <Audio volume> callback and the
 * offline ffmpeg mix. They must never drift apart, so both sample this module.
 */

/** Envelope is computed on a fine grid, then sampled by whoever needs it. */
const GRID = 200; // Hz

export const dbToGain = (db) => Math.pow(10, db / 20);
export const gainToDb = (g) => (g <= 0 ? -Infinity : 20 * Math.log10(g));

/**
 * Per-beat treatments, declared in script.json as `music: {mode: "hard"}`.
 *
 *   hard   — a beat built on held silence. The bed gets out of the way and
 *            stays out; no gap lift, because the "gap" IS the beat.
 *   settle — a retention beat. Motion settles, so the bed settles with it.
 *   lift   — the one optimistic turn. Bed comes up and gaps are allowed to
 *            breathe.
 *   normal — default behaviour.
 *
 * `ceilDb` is a cap, not an offset: it wins over everything, which is why a
 * `hard` beat can never swell no matter what the gap rule wants.
 */
export const MODES = {
  hard: {ceilDb: -18, allowLift: false},
  settle: {ceilDb: -11, allowLift: false},
  lift: {baseDb: 3, allowLift: true},
  normal: {allowLift: true},
};

/**
 * Two different complaints, two different knobs — they are easy to confuse and
 * only one of them does what you want:
 *
 *   "The music is too loud."     → lower `bedLufs`.
 *   "The music muddies the VO."  → raise `duckDb`.
 *
 * Raising `duckDb` does **not** make the bed quieter overall. `bedLufs` is
 * calibrated against the *ducked* result, so a deeper duck is compensated by a
 * larger make-up gain and the gaps simply come up to match. It changes the
 * contrast between speech and silence, not the level.
 */
export const MUSIC_DEFAULTS = {
  /**
   * Integrated loudness of the bed as heard in the master. The main volume
   * control. -30 sits it clearly under the voice; -24 is close to a music video.
   */
  bedLufs: -30,
  /** Attenuation applied while a word is sounding. */
  duckDb: 12,
  /** Boost applied in a gap long enough to notice. */
  liftDb: 1.5,
  /** Shorter silences than this are inside the phrasing, not between it. */
  gapMin: 0.35,
  /** Duck starts before the word so it is already down on the consonant. */
  preRoll: 0.12,
  /** ...and holds after it, so short inter-word breaths don't flutter. */
  release: 0.3,
  /** One-pole smoothing. Down fast, up slow — anything else pumps. */
  attackMs: 90,
  releaseMs: 380,
  fadeIn: 1,
  fadeOut: 1.5,
  /** "lastWord" ends the bed on the final word; a number is an absolute time. */
  endAt: 'lastWord',
  /**
   * Calibration gain, written into music.json by bin/fetch-music.mjs and folded
   * into every point on the curve.
   *
   * It carries the two corrections that make `bedLufs` mean "the level you hear
   * in the master": what the duck removes, and what the master bus adds. It
   * lives here rather than being baked into bed.wav because the correction is
   * positive — printing it into the file would push a bed with any crest factor
   * into the clipping the file's own headroom is there to prevent.
   */
  makeupDb: 0,
};

export const resolveMusicConfig = (music = {}) => ({...MUSIC_DEFAULTS, ...music});

/**
 * Merge word intervals into speech regions, padded by preRoll/release.
 * Overlapping pads collapse so a fast passage is one duck, not fifty.
 */
export function speechRegions(words, {preRoll, release}) {
  const out = [];
  for (const w of words) {
    const a = Math.max(0, w.start - preRoll);
    const b = w.end + release;
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/** Silences between speech regions that are long enough to lift into. */
export function gapRegions(regions, duration, gapMin) {
  const gaps = [];
  let cursor = 0;
  for (const [a, b] of regions) {
    if (a - cursor >= gapMin) gaps.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (duration - cursor >= gapMin) gaps.push([cursor, duration]);
  return gaps;
}

const inRegions = (t, regions) => regions.some(([a, b]) => t >= a && t < b);

/**
 * Build the envelope.
 *
 * Returns a continuous sampler plus the raw grid, so the frame-rate sampler and
 * the audio-rate sampler are reading the same numbers rather than two
 * reimplementations of the same intent.
 */
export function buildEnvelope({words, beats, duration, music}) {
  const cfg = resolveMusicConfig(music);
  const regions = speechRegions(words, cfg);
  const gaps = gapRegions(regions, duration, cfg.gapMin);

  const lastWord = words.length ? Math.max(...words.map((w) => w.end)) : duration;
  const endAt = cfg.endAt === 'lastWord' ? lastWord : Number(cfg.endAt);

  // Per-beat mode lookup, resolved once rather than per grid step.
  const beatModes = beats.map((b) => {
    const declared = b.music?.mode;
    // Only `retentionBeat` is inferred. It means "motion settles here", which
    // is a pacing instruction the bed should follow.
    //
    // `hold` deliberately infers nothing: in this engine it is a camera
    // property — BeatPicture reads it to choose the push amount — so treating
    // it as "hold the music too" silently ducks beats that are simply held on
    // one frame while somebody talks over them. A beat that wants silence says
    // `music: {mode: "hard"}`.
    const inferred = b.retentionBeat ? 'settle' : 'normal';
    const name = MODES[declared] ? declared : inferred;
    return {id: b.id, start: b.start, end: b.end, name, mode: MODES[name] ?? MODES.normal};
  });
  const modeAt = (t) => beatModes.find((m) => t >= m.start && t < m.end)?.mode ?? MODES.normal;

  const n = Math.ceil(duration * GRID) + 1;
  const target = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / GRID;
    const mode = modeAt(t);
    let db = (mode.baseDb ?? 0) + cfg.makeupDb;

    if (inRegions(t, regions)) {
      db -= cfg.duckDb;
    } else if ((mode.allowLift ?? true) && inRegions(t, gaps)) {
      db += cfg.liftDb;
    }

    // The cap goes last so a silence beat cannot be lifted out of by any rule.
    // It shifts with the calibration gain because it is a level relative to the
    // bed's nominal level, not an absolute one — otherwise raising makeupDb
    // would quietly deepen every hard duck.
    if (mode.ceilDb !== undefined) db = Math.min(db, cfg.makeupDb + mode.ceilDb);
    target[i] = dbToGain(db);
  }

  // One-pole smoothing, asymmetric. Forward only: the lag on release is the
  // slow recovery we want, and preRoll already bought us the head start on
  // attack that a forward filter would otherwise cost.
  const aAtk = Math.exp(-1000 / (cfg.attackMs * GRID));
  const aRel = Math.exp(-1000 / (cfg.releaseMs * GRID));
  const gains = new Float64Array(n);
  let y = target[0];
  for (let i = 0; i < n; i++) {
    const a = target[i] < y ? aAtk : aRel;
    y = a * y + (1 - a) * target[i];
    gains[i] = y;
  }

  // Head fade, and the tail out — the end card hold is meant to be silent.
  for (let i = 0; i < n; i++) {
    const t = i / GRID;
    if (cfg.fadeIn > 0 && t < cfg.fadeIn) gains[i] *= t / cfg.fadeIn;
    const outStart = endAt - cfg.fadeOut;
    if (t >= endAt) gains[i] = 0;
    else if (cfg.fadeOut > 0 && t > outStart) gains[i] *= (endAt - t) / cfg.fadeOut;
  }

  const sampleAt = (t) => {
    if (t <= 0) return gains[0];
    const x = t * GRID;
    const i = Math.floor(x);
    if (i >= n - 1) return gains[n - 1];
    const frac = x - i;
    return gains[i] * (1 - frac) + gains[i + 1] * frac;
  };

  return {
    cfg,
    grid: GRID,
    gains,
    sampleAt,
    regions,
    gaps,
    endAt,
    beatModes,
    /** Per-frame gains, which is what the Remotion volume callback wants. */
    atFps: (fps, totalFrames) =>
      Array.from({length: totalFrames}, (_, f) => Number(sampleAt(f / fps).toFixed(4))),
  };
}

/**
 * Multiply interleaved float samples by the envelope, in place.
 *
 * Shared so that the calibration in fetch-music.mjs, the offline ffmpeg mix and
 * any verification all duck the audio identically. Returns the peak so callers
 * can check headroom rather than assume it.
 */
export function applyEnvelopeToPcm(pcm, env, {rate, channels}) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i += channels) {
    const g = env.sampleAt(i / channels / rate);
    for (let c = 0; c < channels; c++) {
      const v = pcm[i + c] * g;
      pcm[i + c] = v;
      const a = Math.abs(v);
      if (a > peak) peak = a;
    }
  }
  return peak;
}

/** Human-readable summary, for the build log and for verifying the mix. */
export function describeEnvelope(env, beats) {
  const rows = beats.map((b) => {
    const mid = (b.start + b.end) / 2;
    let lo = Infinity;
    let hi = -Infinity;
    for (let t = b.start; t < b.end; t += 1 / env.grid) {
      const g = env.sampleAt(t);
      lo = Math.min(lo, g);
      hi = Math.max(hi, g);
    }
    return {
      id: b.id,
      start: b.start,
      end: b.end,
      // The declared/inferred mode, not a guess from the numbers: a fade edge
      // or the release tail of the previous beat can look like a hard duck
      // without being one.
      mode: env.beatModes.find((m) => m.id === b.id)?.name ?? 'normal',
      minDb: gainToDb(lo),
      maxDb: gainToDb(hi),
      midDb: gainToDb(env.sampleAt(mid)),
    };
  });
  return rows;
}
