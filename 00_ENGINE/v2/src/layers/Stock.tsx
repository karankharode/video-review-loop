import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {COLOR, HEIGHT, WIDTH, grade} from '../core/design';
import {smooth} from '../core/motion';

/**
 * Stock footage layer.
 *
 * Three jobs, in order of how much they matter:
 *
 * 1. **Grade.** Clips come from a dozen unrelated shoots. Left raw they read as
 *    a slideshow of other people's footage. A per-beat filter chain plus a tint
 *    wash is what makes them read as one video.
 * 2. **Motion.** A slow push with a per-beat transform origin. Static stock is
 *    the fastest way to look like a template.
 * 3. **Fallback.** If a clip is missing (no API key, no search results) this
 *    renders a generated gradient instead of a black hole, so the cut is always
 *    watchable.
 */

const GeneratedBackdrop: React.FC<{seed: number}> = ({seed}) => {
  const frame = useCurrentFrame();
  // Counter-rotating washes plus a drifting grid. Deliberately brighter than
  // feels right in isolation: the per-beat grade darkens it again (the `dark`
  // and `cold` grades cut brightness to 0.7/0.82) and the caption scrim sits
  // on top, so a subtle backdrop lands as pure black in the finished frame.
  const a = (frame * 0.14 + seed * 47) % 360;
  const rad = (a * Math.PI) / 180;
  return (
    <AbsoluteFill style={{backgroundColor: '#0C1524'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 50% at ${50 + 20 * Math.cos(rad)}% ${
            40 + 16 * Math.sin(rad)
          }%, ${COLOR.accent}55 0%, transparent 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 44% at ${50 - 18 * Math.cos(rad)}% ${
            64 - 14 * Math.sin(rad)
          }%, ${COLOR.accent2}3A 0%, transparent 72%)`,
        }}
      />
      {/* Perspective grid — gives the frame structure and a sense of depth so
          it reads as a designed plate rather than a missing asset. */}
      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage: `linear-gradient(${COLOR.accent} 1px, transparent 1px),
                            linear-gradient(90deg, ${COLOR.accent} 1px, transparent 1px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `${(frame * 0.5) % 90}px ${(frame * 0.3) % 90}px`,
          maskImage: 'radial-gradient(70% 60% at 50% 45%, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(70% 60% at 50% 45%, black 0%, transparent 80%)',
        }}
      />
    </AbsoluteFill>
  );
};

export const StockLayer: React.FC<{
  src: string | null;
  durationInFrames: number;
  push?: number;
  origin?: string;
  gradeName?: string;
  seed?: number;
}> = ({src, durationInFrames, push = 1.12, origin = '50% 50%', gradeName, seed = 0}) => {
  const frame = useCurrentFrame();
  const g = grade(gradeName);

  const p = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    easing: smooth,
    extrapolateRight: 'clamp',
  });
  // Start slightly in so the push has somewhere to go without revealing edges.
  const scale = interpolate(p, [0, 1], [1.04, 1.04 * push]);

  // The grade exists to unify unrelated real footage. The generated backdrop is
  // already built from the palette, so grading it just crushes it to black —
  // apply only the tint, not the brightness/contrast chain.
  const filter = src ? g.filter : 'none';
  const tintOpacity = src ? g.tintOpacity : g.tintOpacity * 0.4;

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: COLOR.bg}}>
      <AbsoluteFill style={{filter}}>
        {src ? (
          <OffthreadVideo
            src={staticFile(src)}
            muted
            // Stock clips are usually shorter than the beat; hold the last
            // frame rather than cutting to black.
            endAt={undefined}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale})`,
              transformOrigin: origin,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${scale})`,
              transformOrigin: origin,
            }}
          >
            <GeneratedBackdrop seed={seed} />
          </div>
        )}
      </AbsoluteFill>

      {/* Tint wash — the unifier. */}
      {tintOpacity > 0 ? (
        <AbsoluteFill
          style={{
            backgroundColor: g.tint,
            opacity: tintOpacity,
            mixBlendMode: 'color',
          }}
        />
      ) : null}

      {/* Bottom scrim so captions always have contrast to sit on, whatever
          the footage is doing down there. Lighter over the generated backdrop,
          which has no bright highlights to fight. */}
      <AbsoluteFill
        style={{
          background: src
            ? `linear-gradient(to top, ${COLOR.bg}F2 0%, ${COLOR.bg}A0 22%, transparent 52%)`
            : `linear-gradient(to top, ${COLOR.bg}CC 0%, ${COLOR.bg}55 24%, transparent 46%)`,
        }}
      />
    </AbsoluteFill>
  );
};
