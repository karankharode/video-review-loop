/**
 * Timeline loaded from the aligned beats file.
 *
 * `bin/build.mjs` copies <variation>/assets/beats.json here as timeline.json.
 * Every `start`, `end` and per-word timestamp in it was measured from the
 * actual voiceover by bin/align.mjs — nothing in this file is hand-authored,
 * which is the whole difference between v2 and v1.
 */

import spec from '../timeline.json';
import {FPS} from './design';

export type Word = {text: string; start: number; end: number};

export type Beat = {
  id: string;
  say: string;
  caption?: string;
  emphasis?: string[];
  template?: string;
  stock?: {type: string; query?: string; from?: string};
  /** Presenter clip. Omit and no face renders — that's the faceless default. */
  face?: {asset: string; mode?: 'full' | 'band' | 'pip'; flip?: boolean; strap?: string; focus?: number};
  graphic?: Record<string, unknown>;
  motion?: {push?: number; origin?: string; pan?: string};
  transitionIn?: string;
  grade?: string;
  hold?: boolean;
  retentionBeat?: boolean;
  start: number;
  end: number;
  matched?: boolean;
  words: Word[];
};

type Spec = {
  id: string;
  title: string;
  duration: number;
  targetDuration?: number;
  beats: Beat[];
  /** Clip ids that actually exist in public/stock, written by bin/build.mjs. */
  _stockAvailable?: string[];
  /** Presenter clip filenames present in public/face, written by bin/build.mjs. */
  _faceAvailable?: string[];
};

const S = spec as unknown as Spec;

export const ID = S.id;
export const TITLE = S.title;
export const DURATION = S.duration;
export const BEATS = S.beats;
export const TOTAL_FRAMES = Math.round(S.duration * FPS);

const AVAILABLE = new Set(S._stockAvailable ?? []);
const FACES = new Set(S._faceAvailable ?? []);

export const f = (seconds: number) => Math.round(seconds * FPS);

/**
 * Resolve a beat's stock clip, following `reuse` references.
 *
 * Returns null when the clip isn't on disk so the renderer can fall back to a
 * generated backdrop. Remotion can't stat the filesystem mid-render — asking
 * for a missing file 404s and kills the whole render — so availability is
 * baked into the timeline at build time.
 */
export const stockFor = (beat: Beat): string | null => {
  if (!beat.stock) return null;
  const id = beat.stock.type === 'reuse' && beat.stock.from ? beat.stock.from : beat.id;
  return AVAILABLE.has(id) ? `stock/${id}.mp4` : null;
};

/**
 * Resolve a beat's presenter clip, or null if the file isn't there yet.
 *
 * Same reason as stockFor: a missing file 404s the whole render. Returning null
 * means a beat that declares a face but has no footage yet simply renders
 * faceless, so the timeline can be authored before the shoot.
 */
export const faceFor = (beat: Beat): string | null => {
  if (!beat.face?.asset) return null;
  const name = beat.face.asset.replace(/\.mp4$/, '');
  return FACES.has(name) ? `face/${name}.mp4` : null;
};
