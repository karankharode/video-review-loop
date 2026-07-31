import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR, SAFE, TYPE, WIDTH} from '../core/design';
import {Beat, f} from '../core/timeline';
import {SPRING, backOut, expoOut, pop, ramp} from '../core/motion';

/**
 * Word-locked captions.
 *
 * Two things separate this from v1's caption block:
 *
 * 1. Each word enters on its *own* timestamp, measured from the audio. Not a
 *    fixed 2-frame stagger approximating speech — the actual moment the word
 *    is spoken.
 * 2. The word currently being spoken is highlighted. That karaoke read is the
 *    single most recognisable "edited by a person" signal in short-form, and
 *    it's only possible because we have real per-word times.
 */

const clean = (s: string) => s.replace(/[^\w'%.\-]/g, '').toUpperCase();

export const CaptionBlock: React.FC<{beat: Beat}> = ({beat}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Prefer the short on-screen line; fall back to the spoken words.
  const display = beat.caption ?? beat.say;
  const tokens = display.toUpperCase().split(/\s+/).filter(Boolean);
  const emph = new Set((beat.emphasis ?? []).map((e) => clean(e)));

  const beatStartF = f(beat.start);
  const beatEndF = f(beat.end);
  const localEnd = beatEndF - beatStartF;

  const spoken = beat.words ?? [];

  /**
   * When the word *appears*. Deliberately fast — a 2-frame stagger, all in
   * within ~0.3s regardless of how long the beat runs.
   *
   * Spreading entrances across the beat's real word times (the obvious thing to
   * do once you have them) looks wrong: on a five-second beat the third word
   * arrives three seconds late, so most of the beat shows a half-built,
   * visually off-centre line. Captions want to be readable immediately.
   */
  const enterAt = (i: number) => i * 2;

  /**
   * When the word is being *spoken*. This is where the measured timings earn
   * their keep — the highlight tracks the read even though the block is
   * already fully drawn.
   */
  const spokenAt = (i: number) => {
    if (!spoken.length) return 0;
    const idx = Math.min(
      spoken.length - 1,
      Math.floor((i / Math.max(1, tokens.length)) * spoken.length),
    );
    return f(spoken[idx].start) - beatStartF;
  };

  const long = tokens.length > 3 || display.length > 16;
  const T = long ? TYPE.captionLong : TYPE.caption;

  // Whole-block exit so a cut never leaves a caption hanging a frame too long.
  const out = interpolate(frame, [localEnd - 4, localEnd], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.side,
        right: SAFE.side,
        bottom: SAFE.bottom,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px 14px',
        justifyContent: 'center',
        alignItems: 'flex-end',
        opacity: out,
      }}
    >
      {tokens.map((tok, i) => {
        const at = enterAt(i);
        const enter = pop(frame - at, fps, SPRING.word);

        // Is this word being spoken right now? Drives the highlight sweep.
        const sAt = Math.max(0, spokenAt(i));
        const sNext = i + 1 < tokens.length ? spokenAt(i + 1) : localEnd;
        const active = frame >= sAt && frame < sNext;

        const isEmph = emph.has(clean(tok));
        const lift = interpolate(enter, [0, 1], [26, 0], {easing: backOut});
        const blur = interpolate(enter, [0, 1], [10, 0]);

        // Emphasis words sit in a solid accent slab; everything else is white
        // on a dark scrim. The word currently being spoken lifts to accent —
        // the karaoke read — without any layout shift, because the block is
        // already fully laid out by this point.
        const bg = isEmph ? COLOR.accent : active ? `${COLOR.accent}E6` : COLOR.scrim;
        const fg = isEmph || active ? '#03150F' : COLOR.ink;

        return (
          <span
            key={`${tok}-${i}`}
            style={{
              display: 'inline-block',
              fontFamily: TYPE.family,
              fontWeight: T.weight,
              fontSize: T.size,
              lineHeight: T.lineHeight,
              letterSpacing: T.tracking,
              color: fg,
              background: bg,
              padding: isEmph ? '6px 20px 12px' : '6px 16px 12px',
              borderRadius: 16,
              opacity: enter,
              filter: `blur(${blur}px)`,
              transform: `translateY(${lift}px) scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
              boxShadow: isEmph
                ? `0 10px 40px ${COLOR.accent}55`
                : '0 8px 30px rgba(0,0,0,0.5)',
              // Slight scale-up on the word being spoken, on top of its
              // entrance scale. Small — the colour change carries the read.
              ...(active
                ? {
                    transform: `translateY(${lift}px) scale(${
                      interpolate(enter, [0, 1], [0.8, 1]) * 1.06
                    })`,
                    boxShadow: `0 10px 44px ${COLOR.accent}66`,
                  }
                : {}),
            }}
          >
            {tok}
          </span>
        );
      })}
    </div>
  );
};

/** Small caps label above the caption — used for source credits. */
export const Kicker: React.FC<{text: string; at?: number}> = ({text, at = 0}) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, at, 8, expoOut);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: SAFE.bottom + 190,
        textAlign: 'center',
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
      }}
    >
      <span
        style={{
          fontFamily: TYPE.family,
          fontWeight: TYPE.kicker.weight,
          fontSize: TYPE.kicker.size,
          letterSpacing: TYPE.kicker.tracking,
          color: COLOR.accent,
          background: 'rgba(4,7,14,0.7)',
          padding: '8px 18px',
          borderRadius: 8,
        }}
      >
        {text.toUpperCase()}
      </span>
    </div>
  );
};
