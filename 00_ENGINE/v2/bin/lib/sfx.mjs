/**
 * SFX scheduling.
 *
 * Two rules from how short-form actually sounds, both of which a script author
 * will break by hand every time:
 *
 * 1. **Sparsity.** Three to five effects per video. One whoosh per cut is the
 *    single most common way an edit starts sounding cheap — the ear stops
 *    hearing them as punctuation and starts hearing them as texture. So the
 *    scheduler *scores* candidate moments and keeps only the best few, rather
 *    than decorating every transition the timeline happens to contain.
 *
 * 2. **Alignment.** The effect's moment lands on the cut, not its file start.
 *    Every effect carries an `anchor` (see sfx-synth.mjs) and the scheduler
 *    subtracts it. A riser peaks at the reveal; an impact hits on the frame.
 *
 * Placement is *derived* from data the timeline already has — which beat is the
 * retention beat, which one lifts, where the transitions are, where the gaps in
 * speech are. A script can override any of it, but it does not have to author
 * a single cue to get a sensible mix.
 */

import {speechRegions} from './music.mjs';
import {SFX_DURATION, renderSfx} from './sfx-synth.mjs';

export const SFX_DEFAULTS = {
  enabled: true,
  /** Hard cap. The research is consistent: past ~5 it reads as noise. */
  maxCount: 5,
  /** Two effects closer than this collide into mush. */
  minSpacing: 2.2,
  /** Bus level. Below the VO — punctuation, not a competing part. */
  peakDb: -10,
  /** Attenuation applied while a word is sounding, so SFX never mask speech. */
  duckUnderSpeechDb: 5,
  /** Effects are muted after this, so a silent tail stays silent. */
  endAt: 'lastWord',
};

export const resolveSfxConfig = (sfx = {}) => ({...SFX_DEFAULTS, ...sfx});

/**
 * Score the moments worth marking.
 *
 * Higher is more important. The ranking encodes what the effect is *for*: the
 * open has to arrest, the reveal has to land, the turn has to feel like relief,
 * the payoff has to close. Everything else is decoration and gets dropped by
 * the cap first.
 */
function candidates(beats, duration) {
  const out = [];
  const push = (time, kind, score, why) => out.push({time, kind, score, why});

  beats.forEach((b, i) => {
    const isFirst = i === 0;
    const isLast = i === beats.length - 1;
    const mode = b.music?.mode;

    if (isFirst) {
      // Into the first frame, not on it — the hook should already be moving.
      push(b.start + 0.02, 'whoosh_rev', 100, 'open');
    }
    if (b.retentionBeat) {
      // The reveal. A riser peaking here is the single highest-value cue in
      // the whole video, which is why it outranks everything except the open.
      push(b.start, 'riser', 95, 'retention beat — riser peaks on the turn');
      push(b.start + 0.02, 'impact', 90, 'retention beat — hit on the cut');
    }
    if (mode === 'lift') {
      push(b.start, 'notification', 80, 'the warm turn');
    }
    if (mode === 'hard') {
      // A beat built on silence gets a hit going in and then nothing at all.
      push(b.start, 'impact', 85, 'held beat — mark it, then leave it alone');
    }
    if (isLast) {
      push(b.start, 'whoosh', 70, 'into the end card');
    }
    if (b.transitionIn === 'zoomblur' || b.transitionIn === 'whip') {
      push(b.start, 'whoosh', 50, `${b.transitionIn} transition`);
    }
    if (b.graphic && ['counter', 'stat', 'statcard'].includes(String(b.graphic.kind))) {
      push(b.start + 0.1, 'pop', 45, 'stat appears');
    }
  });

  return out.filter((c) => c.time >= 0 && c.time < duration).sort((a, b) => b.score - a.score);
}

/**
 * Pick the final cue list: explicit cues first, then the best derived ones that
 * still fit the cap and the spacing rule.
 */
export function scheduleSfx({beats, duration, sfx = {}}) {
  const cfg = resolveSfxConfig(sfx);
  if (!cfg.enabled) return {cfg, cues: [], dropped: []};

  // Explicit cues are never dropped — an author who wrote one meant it.
  const explicit = [];
  beats.forEach((b) => {
    const decl = b.sfx;
    if (!decl) return;
    const list = Array.isArray(decl) ? decl : [decl];
    for (const d of list) {
      const spec = typeof d === 'string' ? {kind: d} : d;
      const at = spec.at === undefined || spec.at === 'in' ? b.start : spec.at === 'out' ? b.end : b.start + Number(spec.at);
      explicit.push({time: at, kind: spec.kind, gainDb: spec.gain ?? 0, why: `declared on ${b.id}`, explicit: true});
    }
  });

  const chosen = [...explicit];
  const dropped = [];

  /**
   * A riser resolving into a hit is one gesture, not two cues colliding — the
   * build is *supposed* to land on the impact. So the spacing rule ignores that
   * specific pairing, and only that one; everything else keeps its distance.
   */
  const RESOLVES = new Set(['impact', 'sub_drop']);
  const isResolution = (a, b) =>
    Math.abs(a.time - b.time) <= 0.25 &&
    ((a.kind === 'riser' && RESOLVES.has(b.kind)) || (b.kind === 'riser' && RESOLVES.has(a.kind)));

  const fits = (cand) =>
    chosen.every((c) => Math.abs(c.time - cand.time) >= cfg.minSpacing || isResolution(c, cand));

  for (const c of candidates(beats, duration)) {
    if (chosen.length >= cfg.maxCount) {
      dropped.push({...c, why: `${c.why} (over the ${cfg.maxCount}-cue cap)`});
      continue;
    }
    if (!fits(c)) {
      dropped.push({...c, why: `${c.why} (within ${cfg.minSpacing}s of another cue)`});
      continue;
    }
    chosen.push({...c, gainDb: 0});
  }

  chosen.sort((a, b) => a.time - b.time);

  // Rotate variants per kind. Repeating one identical whoosh trains the ear to
  // filter it out, which costs the cue its whole reason for existing.
  const seen = new Map();
  for (const c of chosen) {
    const n = seen.get(c.kind) ?? 0;
    c.variant = n;
    seen.set(c.kind, n + 1);
  }

  return {cfg, cues: chosen, dropped};
}

/**
 * Render the cue list to a single stereo bus, ducked under speech.
 *
 * Baked to one track for the same reason the music bed is: Remotion turns a
 * per-frame volume callback into one nested ffmpeg expression, and a dozen
 * separate <Audio> elements is a dozen chances to hit that.
 */
export function renderSfxBus({cues, cfg, words, duration, rate = 48000, load}) {
  const n = Math.ceil(duration * rate);
  const bus = new Float32Array(n * 2);

  for (const cue of cues) {
    const {pcm, anchor} = load ? load(cue) : renderSfx(cue.kind, {rate, variant: cue.variant ?? 0});
    const gain = Math.pow(10, (cue.gainDb ?? 0) / 20);
    const start = Math.round((cue.time - anchor) * rate) * 2;
    cue.placedAt = cue.time - anchor;
    cue.duration = pcm.length / 2 / rate;
    for (let j = 0; j < pcm.length; j++) {
      const k = start + j;
      if (k >= 0 && k < bus.length) bus[k] += pcm[j] * gain;
    }
  }

  // Duck under speech. Gentler than the music bed — an effect that vanishes
  // under the voice may as well not be there — but enough that a whoosh never
  // fights a consonant.
  const regions = speechRegions(words, {preRoll: 0.05, release: 0.12});
  const duck = Math.pow(10, -cfg.duckUnderSpeechDb / 20);
  const lastWord = words.length ? Math.max(...words.map((w) => w.end)) : duration;
  const endAt = cfg.endAt === 'lastWord' ? lastWord : Number(cfg.endAt);

  let ri = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    while (ri < regions.length && regions[ri][1] < t) ri++;
    const speaking = ri < regions.length && t >= regions[ri][0] && t < regions[ri][1];
    let g = speaking ? duck : 1;
    if (t >= endAt) g = 0;
    bus[i * 2] *= g;
    bus[i * 2 + 1] *= g;
  }

  let peak = 0;
  for (let i = 0; i < bus.length; i++) peak = Math.max(peak, Math.abs(bus[i]));
  if (peak > 0) {
    const target = Math.pow(10, cfg.peakDb / 20);
    const g = target / peak;
    for (let i = 0; i < bus.length; i++) bus[i] *= g;
    // Report the peak of what was actually written, not of the signal before
    // normalisation — the caller records this as the bus level, and the
    // pre-gain number reads as a missed target when nothing is wrong.
    peak = target;
  }

  return {bus, peak};
}
