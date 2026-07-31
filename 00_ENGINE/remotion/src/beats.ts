/**
 * Timeline loaded from the active variation.
 *
 * `link-assets.sh <variation-folder>` copies that folder's beats_kallaway.json
 * to src/timeline.json, so the compositions below are generic — switching
 * variation is a shell command, not a code edit.
 */

import timeline from './timeline.json';

export type Visual = {
  start: number;
  end: number;
  asset: string;
  mode: string;
  pan?: string;
  punch?: boolean;
  hold?: boolean;
  counter_from?: number;
  counter_to?: number;
  overlay?: string;
  sub?: string;
};

export type Face = {start: number; end: number; asset: string; hold?: boolean};

export type Caption = {
  start: number;
  end: number;
  text: string;
  highlight?: string[];
  kicker?: string;
};

type Timeline = {
  accent: string;
  bg_a?: string;
  bg_b?: string;
  duration: number;
  layout?: {
    top_ratio?: number;
    rule_h?: number;
    safe_bottom?: number;
    safe_side?: number;
  };
  visuals: Visual[];
  faces: Face[];
  captions: Caption[];
};

const T = timeline as Timeline;

/** Beats files store colours as FFmpeg hex (0xRRGGBB); CSS wants #RRGGBB. */
const css = (v: string | undefined, fallback: string) =>
  v ? `#${v.replace(/^0x/, '').replace(/^#/, '')}` : fallback;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const DURATION_SEC = T.duration;
export const TOTAL_FRAMES = Math.round(FPS * T.duration);

export const ACCENT = css(T.accent, '#4CC9F0');
export const BG_A = css(T.bg_a, '#05080F');
export const BG_B = css(T.bg_b, '#101C2E');

export const TOP_RATIO = T.layout?.top_ratio ?? 0.55;
export const RULE_H = T.layout?.rule_h ?? 5;
/** Instagram and YouTube overlay their own UI across the lower ~250px. */
export const SAFE_BOTTOM = T.layout?.safe_bottom ?? 250;
export const SAFE_SIDE = T.layout?.safe_side ?? 48;

export const TOP_H = Math.round(HEIGHT * TOP_RATIO);
export const BOTTOM_H = HEIGHT - TOP_H - RULE_H;

export const VISUALS = T.visuals;
export const FACES = T.faces;
export const CAPTIONS = T.captions;

export const sec = (s: number) => Math.round(s * FPS);
