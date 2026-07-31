import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from 'remotion';

/**
 * Pan targets as transform-origin fractions. Ken Burns here is a moving origin
 * plus a slow zoom rather than an animated crop, which keeps it cheap and
 * avoids resampling twice.
 */
const PANS: Record<string, (p: number) => {x: number; y: number}> = {
  center: () => ({x: 0.5, y: 0.5}),
  left: (p) => ({x: 0.28 + 0.34 * p, y: 0.5}),
  right: (p) => ({x: 0.72 - 0.34 * p, y: 0.5}),
  up: (p) => ({x: 0.5, y: 0.32 + 0.34 * p}),
  down: (p) => ({x: 0.5, y: 0.68 - 0.34 * p}),
  diag: (p) => ({x: 0.32 + 0.36 * p, y: 0.36 + 0.28 * p}),
};

/** A top-panel graphic card: punch in on entry, drift for the rest of the beat. */
export const Plate: React.FC<{
  src: string;
  durationInFrames: number;
  pan?: string;
  punch?: boolean;
  hold?: boolean;
}> = ({src, durationInFrames, pan = 'center', punch = true, hold = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = frame / Math.max(1, durationInFrames - 1);

  const enter = spring({
    frame,
    fps,
    config: {damping: 18, stiffness: 165, mass: 0.7},
  });

  // A held beat still breathes slightly — a completely frozen frame reads as a
  // dropped render rather than a deliberate pause.
  const drift = hold ? 1.02 : 1.15;
  const base = interpolate(progress, [0, 1], [1.0, drift]);
  const zoom = punch && !hold ? base * (0.93 + 0.07 * enter) : base;

  const {x, y} = (PANS[pan] ?? PANS.center)(progress);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${zoom})`,
          transformOrigin: `${x * 100}% ${y * 100}%`,
        }}
      />
    </AbsoluteFill>
  );
};

/** A bottom-panel face plate — same motion language, tighter push. */
export const FacePlate: React.FC<{src: string; durationInFrames: number}> = ({
  src,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = frame / Math.max(1, durationInFrames - 1);
  const enter = spring({frame, fps, config: {damping: 16, stiffness: 145}});
  const zoom = (0.95 + 0.05 * enter) * interpolate(progress, [0, 1], [1, 1.08]);

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#10141c'}}>
      <Video
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${zoom})`,
          transformOrigin: '50% 42%',
        }}
      />
    </AbsoluteFill>
  );
};
