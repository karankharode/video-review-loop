import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ACCENT, SAFE_BOTTOM, SAFE_SIDE, WIDTH} from '../beats';

const FAMILY = '"Helvetica Neue", "Arial Black", Arial, sans-serif';

/**
 * Kallaway-style caption block.
 *
 * Words arrive one at a time on a short stagger rather than the whole line
 * fading up together — that's the thing that reads as "edited" instead of
 * "subtitled". Highlighted words get a rounded accent box; everything else is
 * white on a dark scrim so it survives whatever is behind it.
 *
 * The block is anchored above SAFE_BOTTOM because the lower ~250px of a
 * vertical video is covered by the platform's own UI.
 */
export const Caption: React.FC<{
  text: string;
  highlight?: string[];
  kicker?: string;
  /** Seconds this caption is on screen — drives the exit, not just the entry. */
  durationInFrames: number;
}> = ({text, highlight = [], kicker, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const hi = new Set(highlight.map((h) => h.toUpperCase()));

  // Whole-block punch on entry.
  const enter = spring({frame, fps, config: {damping: 15, stiffness: 190, mass: 0.6}});
  // Fade the block out over the last 4 frames so cuts don't pop.
  const exit = interpolate(
    frame,
    [Math.max(0, durationInFrames - 4), durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const size = words.length > 4 ? 54 : 66;

  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE_SIDE,
        right: SAFE_SIDE,
        bottom: SAFE_BOTTOM + 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        opacity: exit,
        transform: `translateY(${(1 - enter) * 26}px) scale(${0.95 + 0.05 * enter})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px 12px',
          maxWidth: WIDTH - SAFE_SIDE * 2,
        }}
      >
        {words.map((w, i) => {
          // Each word lands ~2 frames after the one before it.
          const wordIn = spring({
            frame: frame - i * 2,
            fps,
            config: {damping: 14, stiffness: 220, mass: 0.5},
          });
          const isHi = hi.has(w);
          return (
            <span
              key={`${w}-${i}`}
              style={{
                display: 'inline-block',
                fontFamily: FAMILY,
                fontWeight: 900,
                fontSize: size,
                lineHeight: 1.05,
                letterSpacing: 0.5,
                color: isHi ? '#06121B' : '#FFFFFF',
                background: isHi ? ACCENT : 'rgba(4,8,14,0.78)',
                borderRadius: 14,
                padding: isHi ? '8px 16px' : '8px 12px',
                opacity: wordIn,
                transform: `translateY(${(1 - wordIn) * 18}px) scale(${
                  0.86 + 0.14 * wordIn
                })`,
                textShadow: isHi ? 'none' : '0 3px 10px rgba(0,0,0,0.55)',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      {kicker ? (
        <div
          style={{
            fontFamily: FAMILY,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 2,
            color: ACCENT,
            background: 'rgba(4,8,14,0.72)',
            borderRadius: 10,
            padding: '6px 14px',
            opacity: interpolate(enter, [0, 1], [0, 1]),
          }}
        >
          {kicker.toUpperCase()}
        </div>
      ) : null}
    </div>
  );
};
