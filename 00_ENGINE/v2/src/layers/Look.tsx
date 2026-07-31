import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {COLOR, HEIGHT, LOOK, WIDTH} from '../core/design';

/**
 * The look pipeline — grain, vignette, bloom, chromatic aberration.
 *
 * This runs over the whole frame after everything else. It's what stops the
 * render reading as "a webpage that moves": real footage has grain and falloff,
 * and real edits push aberration and bloom on impacts.
 *
 * The important design choice: aberration and bloom are driven by `energy`,
 * which spikes on a cut and decays. A constant level of either just looks like
 * a filter someone forgot to turn off.
 */

/** Animated film grain via SVG turbulence. Reseeded per frame so it moves. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = LOOK.grain}) => {
  const frame = useCurrentFrame();
  // Stepping the seed every 2 frames reads as 24fps-ish grain rather than a
  // frantic 30fps shimmer.
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width={WIDTH} height={HEIGHT}>
        <filter id={`grain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={WIDTH} height={HEIGHT} filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = LOOK.vignette}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(72% 58% at 50% 45%, transparent 40%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/**
 * Chromatic aberration.
 *
 * Duplicates the frame's content as two channel-isolated copies offset in
 * opposite directions. Only visible while `amount` > 0, i.e. on cuts.
 * Rendered as a screen-blended overlay pair rather than a true per-channel
 * split, which is far cheaper and indistinguishable at this scale and duration.
 */
export const Aberration: React.FC<{amount: number; children?: React.ReactNode}> = ({
  amount,
  children,
}) => {
  if (amount <= 0.001) return <>{children}</>;
  const px = amount * LOOK.aberration * 6;
  return (
    <>
      {children}
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          opacity: amount * 0.5,
          transform: `translateX(${px}px)`,
          background: `linear-gradient(90deg, ${COLOR.accent2}00, ${COLOR.accent2}22)`,
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          opacity: amount * 0.5,
          transform: `translateX(${-px}px)`,
          background: `linear-gradient(270deg, ${COLOR.accent}00, ${COLOR.accent}22)`,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

/** Full-frame wash used by the `flash` transition. */
export const Flash: React.FC<{amount: number; color?: string}> = ({amount, color}) =>
  amount <= 0.001 ? null : (
    <AbsoluteFill
      style={{
        backgroundColor: color ?? '#FFFFFF',
        opacity: amount,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );

/**
 * Letterbox-free progress indicator, pinned to the very top.
 * Bottom is unusable — the platform UI sits there.
 */
export const Progress: React.FC<{total: number}> = ({total}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: 6,
        width: interpolate(frame, [0, total], [0, WIDTH], {extrapolateRight: 'clamp'}),
        background: `linear-gradient(90deg, ${COLOR.accent}, ${COLOR.accent2})`,
        pointerEvents: 'none',
      }}
    />
  );
};

/** Everything that sits above the picture, in the right order. */
export const LookStack: React.FC<{energy: number; flash: number; total: number}> = ({
  energy,
  flash,
  total,
}) => (
  <>
    <Vignette />
    <Grain />
    <Flash amount={flash} />
    <Progress total={total} />
  </>
);
