import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {COLOR, HEIGHT, SAFE, TYPE, WIDTH, grade} from '../core/design';
import {SPRING, backOut, expoOut, pop, ramp, smooth} from '../core/motion';

/**
 * Presenter layer.
 *
 * Sits above the stock plate and below the captions. Three treatments, chosen
 * per beat, so a presenter can appear without taking the frame hostage:
 *
 *   full  - full bleed, presenter carries the beat
 *   band  - horizontal band across the upper-middle, graphics still readable
 *   pip   - rounded corner inset, presence without losing the b-roll
 *
 * Built now so that recorded footage is a drop-in later: put a clip at
 * <variation>/assets/face/<name>.mp4, reference it as `face.asset` on a beat,
 * and nothing else in the pipeline changes. Until then beats simply omit
 * `face` and this renders nothing.
 */

export type FaceMode = 'full' | 'band' | 'pip';

const BAND_H = 760;
const PIP_W = 380;
const PIP_H = 500;

export const FaceLayer: React.FC<{
  src: string;
  mode?: FaceMode;
  durationInFrames: number;
  gradeName?: string;
  /** Mirror the clip. Selfie-cam footage often needs it. */
  flip?: boolean;
  focus?: number;
}> = ({src, mode = 'band', durationInFrames, gradeName, flip, focus}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const g = grade(gradeName);

  const enter = pop(frame, fps, SPRING.card);
  const p = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    easing: smooth,
    extrapolateRight: 'clamp',
  });
  // Slow push, same motion language as the stock layer.
  const zoom = interpolate(p, [0, 1], [1.02, 1.1]);

  /**
   * Where in the source clip the crop sits vertically.
   *
   * `objectFit: cover` centres by default, which is wrong for a talking head:
   * squeezing a 1080x2048 portrait clip into a 1080x760 band and centring it
   * lands the crop on the chin and shoulders. Faces sit high in the frame, so
   * bias upward. transformOrigin cannot fix this — it moves the scale pivot,
   * not the cover crop.
   */
  const focusY = focus ?? (mode === 'band' ? 24 : mode === 'pip' ? 30 : 34);

  const video = (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: `50% ${focusY}%`,
        transform: `scale(${zoom})${flip ? ' scaleX(-1)' : ''}`,
        transformOrigin: `50% ${focusY}%`,
      }}
    />
  );

  if (mode === 'full') {
    return (
      <AbsoluteFill style={{overflow: 'hidden', filter: g.filter, opacity: enter}}>
        {video}
        <AbsoluteFill
          style={{
            background: `linear-gradient(to top, ${COLOR.bg}F2 0%, ${COLOR.bg}90 20%, transparent 48%)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  if (mode === 'pip') {
    return (
      <div
        style={{
          position: 'absolute',
          right: SAFE.side,
          // Clear of the caption block, which is anchored to SAFE.bottom.
          bottom: SAFE.bottom + 260,
          width: PIP_W,
          height: PIP_H,
          borderRadius: 28,
          overflow: 'hidden',
          border: `4px solid ${COLOR.accent}`,
          boxShadow: `0 24px 70px rgba(0,0,0,0.6), 0 0 40px ${COLOR.accent}33`,
          filter: g.filter,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0], {
            easing: backOut,
          })}px) scale(${interpolate(enter, [0, 1], [0.86, 1])})`,
        }}
      >
        {video}
      </div>
    );
  }

  // band
  const bandTop = Math.round(HEIGHT * 0.16);
  return (
    <div
      style={{
        position: 'absolute',
        top: bandTop,
        left: 0,
        width: WIDTH,
        height: BAND_H,
        overflow: 'hidden',
        filter: g.filter,
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.94, 1], {easing: backOut})})`,
      }}
    >
      {video}
      {/* Feather top and bottom so the band sits in the frame instead of
          looking like a rectangle pasted over it. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, ${COLOR.bg} 0%, transparent 12%, transparent 88%, ${COLOR.bg} 100%)`,
        }}
      />
    </div>
  );
};

/** Small label for a presenter beat, e.g. a name or role strap. */
export const FaceStrap: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, 6, 10, expoOut);
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.side,
        bottom: SAFE.bottom + 200,
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [-24, 0])}px)`,
        background: COLOR.accent,
        color: '#03150F',
        fontFamily: TYPE.family,
        fontWeight: 900,
        fontSize: 28,
        letterSpacing: 2,
        padding: '10px 18px',
        borderRadius: 10,
      }}
    >
      {text.toUpperCase()}
    </div>
  );
};
