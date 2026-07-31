/**
 * Motion vocabulary.
 *
 * Real editors do not use linear fades. These are the curves and gestures the
 * rest of the engine composes from — expo-out for entrances that feel fast then
 * settle, back-out for the slight overshoot that reads as "designed", and three
 * transitions that carry actual energy across a cut.
 */

import {Easing, interpolate, spring} from 'remotion';

/** Fast start, long settle. The workhorse entrance curve. */
export const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
/** Slight overshoot past the target, then back. Use sparingly — it's loud. */
export const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);
/** Symmetric, for pushes and drifts that should feel mechanical. */
export const smooth = Easing.bezier(0.45, 0, 0.55, 1);

export const SPRING = {
  /** Caption words: snappy, minimal wobble. */
  word: {damping: 14, stiffness: 240, mass: 0.45},
  /** Cards and panels: heavier, more deliberate. */
  card: {damping: 18, stiffness: 170, mass: 0.8},
  /** The loud one — for slams and stat reveals. */
  slam: {damping: 11, stiffness: 320, mass: 0.6},
};

export const pop = (frame: number, fps: number, cfg = SPRING.word) =>
  spring({frame, fps, config: cfg});

/** 0→1 over `dur` frames from `at`, on the given curve. */
export const ramp = (
  frame: number,
  at: number,
  dur: number,
  easing = expoOut,
) =>
  interpolate(frame, [at, at + dur], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/**
 * Transition state for the first frames of a beat.
 *
 * Returns transform/filter/opacity to apply to the whole beat, plus a `flash`
 * value the compositor paints as a full-frame wash. Kept as data rather than
 * markup so both the master and the alpha overlays can apply the same motion.
 */
export type Transition = 'none' | 'cut' | 'flash' | 'whip' | 'zoomblur';

export const transition = (kind: Transition | undefined, frame: number, fps: number) => {
  const none = {transform: 'none', filter: 'none', opacity: 1, flash: 0};
  if (!kind || kind === 'none' || kind === 'cut') return none;

  const dur = Math.round(fps * 0.28);
  if (frame > dur) return none;
  const p = ramp(frame, 0, dur);

  if (kind === 'flash') {
    return {
      transform: `scale(${interpolate(p, [0, 1], [1.04, 1])})`,
      filter: `brightness(${interpolate(p, [0, 1], [1.5, 1])})`,
      opacity: 1,
      // Short, bright, and gone — a long flash reads as a mistake.
      flash: interpolate(p, [0, 0.35, 1], [0.85, 0.25, 0], {extrapolateRight: 'clamp'}),
    };
  }

  if (kind === 'whip') {
    // Horizontal smear that decays: the cut carries momentum sideways.
    const x = interpolate(p, [0, 1], [-160, 0]);
    const blur = interpolate(p, [0, 0.6, 1], [26, 6, 0], {extrapolateRight: 'clamp'});
    return {
      transform: `translateX(${x}px) scale(${interpolate(p, [0, 1], [1.08, 1])})`,
      filter: `blur(${blur}px)`,
      opacity: interpolate(p, [0, 0.25, 1], [0.4, 1, 1], {extrapolateRight: 'clamp'}),
      flash: 0,
    };
  }

  // zoomblur — punch out of a blur. Good for a tonal reset.
  const scale = interpolate(p, [0, 1], [1.22, 1]);
  const blur = interpolate(p, [0, 0.7, 1], [22, 4, 0], {extrapolateRight: 'clamp'});
  return {
    transform: `scale(${scale})`,
    filter: `blur(${blur}px)`,
    opacity: interpolate(p, [0, 0.3, 1], [0.5, 1, 1], {extrapolateRight: 'clamp'}),
    flash: 0,
  };
};

/**
 * How much visual energy this frame carries (0–1).
 *
 * Drives chromatic aberration and bloom so the effects fire on cuts and
 * settle during held beats, instead of sitting at a constant level and
 * looking like a filter someone left on.
 */
export const energy = (frame: number, fps: number, kind?: Transition) => {
  if (!kind || kind === 'none' || kind === 'cut') return 0;
  const dur = Math.round(fps * 0.3);
  return frame > dur ? 0 : 1 - ramp(frame, 0, dur, smooth);
};
