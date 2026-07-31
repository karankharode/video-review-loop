/**
 * Design tokens.
 *
 * One place for every number that affects how the video looks. v1 scattered
 * font sizes and colours across five files, so "make the captions bigger" was
 * a five-file change and the two renderers drifted apart. Everything visual
 * here resolves from this module or from the script's `design` block.
 */

import spec from '../timeline.json';

type Design = {
  accent?: string;
  accent2?: string;
  ink?: string;
  bg?: string;
  grain?: number;
  vignette?: number;
  aberration?: number;
};

const D: Design = (spec as {design?: Design}).design ?? {};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const COLOR = {
  accent: D.accent ?? '#00E5A0',
  accent2: D.accent2 ?? '#FF2E63',
  ink: D.ink ?? '#FFFFFF',
  bg: D.bg ?? '#05070C',
  scrim: 'rgba(4,7,14,0.62)',
};

/** Platform UI covers the lower ~250px of a vertical feed video. */
export const SAFE = {
  bottom: 260,
  top: 90,
  side: 56,
};

export const TYPE = {
  family: '"Helvetica Neue", "Arial Black", Helvetica, Arial, sans-serif',
  caption: {size: 84, weight: 900, tracking: -1.5, lineHeight: 0.98},
  captionLong: {size: 64, weight: 900, tracking: -1, lineHeight: 1.0},
  kicker: {size: 30, weight: 800, tracking: 3},
  stat: {size: 300, weight: 900, tracking: -8},
  label: {size: 34, weight: 800, tracking: 2},
  body: {size: 42, weight: 700, tracking: 0},
};

export const LOOK = {
  grain: D.grain ?? 0.055,
  vignette: D.vignette ?? 0.5,
  aberration: D.aberration ?? 1.4,
};

/**
 * Per-beat grade. Applied as a CSS filter chain plus a tint wash over the
 * stock layer, so footage from a dozen different shoots reads as one video.
 * This is the single highest-leverage thing for making stock not look stock.
 */
export const GRADE: Record<string, {filter: string; tint: string; tintOpacity: number}> = {
  cool:   {filter: 'saturate(0.85) contrast(1.12) brightness(0.92)', tint: '#0A2A3A', tintOpacity: 0.3},
  cold:   {filter: 'saturate(0.55) contrast(1.2) brightness(0.82)',  tint: '#0B1A2E', tintOpacity: 0.42},
  dark:   {filter: 'saturate(0.7) contrast(1.25) brightness(0.7)',   tint: '#05070C', tintOpacity: 0.5},
  warm:   {filter: 'saturate(1.05) contrast(1.08) brightness(1.02)', tint: '#3A2410', tintOpacity: 0.26},
  accent: {filter: 'saturate(0.9) contrast(1.18) brightness(0.88)',  tint: COLOR.accent, tintOpacity: 0.16},
  neutral:{filter: 'none', tint: '#000000', tintOpacity: 0},
};

export const grade = (name?: string) => GRADE[name ?? 'neutral'] ?? GRADE.neutral;
