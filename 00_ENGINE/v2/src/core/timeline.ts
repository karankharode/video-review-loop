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

/**
 * The music bed, written by bin/build.mjs.
 *
 * The file in public/ is already ducked: the envelope was derived from the same
 * forced alignment the captions use and printed into the audio, so the bed is
 * out of the way before a word lands and lifts in the gaps. Absent when there
 * is no bed, which is the silent default.
 */
export type MusicSpec = {
  src: string;
  /** Level of the bed as heard in the delivered master, not of the file. */
  bedLufs: number;
  endAt: number;
  credit: string;
  title: string;
  ducked: boolean;
  duckedPeakDb: number;
};

/**
 * The SFX bus, written by bin/build.mjs.
 *
 * One pre-mixed track rather than a cue per <Audio>: placement, ducking and
 * level are all decided at build time from the aligned timeline, so the
 * renderer just plays it. `cues` is carried for inspection — it is what the
 * build logged, so a mix can be audited without re-deriving it.
 */
export type SfxSpec = {
  src: string;
  peakDb: number;
  cues: {kind: string; at: number; placedAt: number; variant: number; why: string}[];
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
  /** Bed + per-frame volume curve. Absent means render without music. */
  _music?: MusicSpec;
  /** Pre-mixed SFX bus. Absent means render without effects. */
  _sfx?: SfxSpec;
};

const S = spec as unknown as Spec;

export const ID = S.id;
export const TITLE = S.title;
export const DURATION = S.duration;
export const BEATS = S.beats;
export const TOTAL_FRAMES = Math.round(S.duration * FPS);

const AVAILABLE = new Set(S._stockAvailable ?? []);
const FACES = new Set(S._faceAvailable ?? []);

/** Null when the build produced no bed — the render simply has no music. */
export const MUSIC: MusicSpec | null = S._music ?? null;

/** Null when no cues were scheduled. */
export const SFX: SfxSpec | null = S._sfx ?? null;

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
