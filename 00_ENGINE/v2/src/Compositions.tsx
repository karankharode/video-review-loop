import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {COLOR, HEIGHT, WIDTH} from './core/design';
import {BEATS, Beat, MUSIC, TOTAL_FRAMES, f, faceFor, stockFor} from './core/timeline';
import {Transition, energy, transition} from './core/motion';
import {StockLayer} from './layers/Stock';
import {FaceLayer, FaceStrap} from './layers/Face';
import {Graphic} from './layers/Graphics';
import {CaptionBlock, Kicker} from './layers/Captions';
import {Aberration, Flash, Grain, Progress, Vignette} from './layers/Look';

/**
 * A single beat's picture: stock, grade, graphic, transition motion.
 * Everything animates on the beat's own clock — frame 0 is the beat's start.
 */
const BeatPicture: React.FC<{beat: Beat; index: number; dur: number}> = ({beat, index, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tr = transition(beat.transitionIn as Transition, frame, fps);
  const e = energy(frame, fps, beat.transitionIn as Transition);
  const face = faceFor(beat);

  return (
    <AbsoluteFill>
      <Aberration amount={e}>
        <AbsoluteFill
          style={{
            transform: tr.transform,
            filter: tr.filter,
            opacity: tr.opacity,
          }}
        >
          <StockLayer
            src={stockFor(beat)}
            durationInFrames={dur}
            push={beat.motion?.push ?? (beat.hold ? 1.04 : 1.12)}
            origin={beat.motion?.origin ?? '50% 50%'}
            gradeName={beat.grade}
            seed={index}
          />
          {face ? (
            <FaceLayer
              src={face}
              mode={beat.face?.mode}
              flip={beat.face?.flip}
              focus={beat.face?.focus}
              durationInFrames={dur}
              gradeName={beat.grade}
            />
          ) : null}
          <Graphic g={beat.graphic as Record<string, any> | undefined} />
          {face && beat.face?.strap ? <FaceStrap text={beat.face.strap} /> : null}
        </AbsoluteFill>
      </Aberration>
      <Flash amount={tr.flash} />
    </AbsoluteFill>
  );
};

/** Picture track: stock + graphics, no captions. */
const PictureTrack: React.FC = () => (
  <>
    {BEATS.map((b, i) => {
      const from = f(b.start);
      const dur = Math.max(1, f(b.end) - from);
      return (
        <Sequence key={b.id} from={from} durationInFrames={dur} layout="none">
          <BeatPicture beat={b} index={i} dur={dur} />
        </Sequence>
      );
    })}
  </>
);

/** Caption track: word-locked type only. */
const CaptionTrack: React.FC = () => (
  <>
    {BEATS.map((b) => {
      const from = f(b.start);
      const dur = Math.max(1, f(b.end) - from);
      return (
        <Sequence key={`c-${b.id}`} from={from} durationInFrames={dur} layout="none">
          <CaptionBlock beat={b} />
          {b.id === 'hirevue' ? <Kicker text="Fortune · Jan 2021" at={6} /> : null}
        </Sequence>
      );
    })}
  </>
);

/** Graphics-only track, for the transparent Resolve overlay. */
const GraphicsTrack: React.FC = () => (
  <>
    {BEATS.map((b) => {
      if (!b.graphic) return null;
      const from = f(b.start);
      const dur = Math.max(1, f(b.end) - from);
      return (
        <Sequence key={`g-${b.id}`} from={from} durationInFrames={dur} layout="none">
          <Graphic g={b.graphic as Record<string, any>} />
        </Sequence>
      );
    })}
  </>
);

/**
 * The music bed.
 *
 * The duck is already printed into this file by bin/build.mjs — the curve comes
 * from the aligned word timings, not from a compressor reacting to the voice,
 * so the bed is down before a word starts rather than a few milliseconds after
 * it, and it lifts in the gaps between beats. That is the thing a sidechain
 * cannot do at all, because a sidechain only knows about sound that has already
 * happened.
 *
 * Played at unity deliberately. Passing a per-frame `volume` callback here
 * instead makes Remotion compile the curve into a single nested ffmpeg
 * expression, which a smooth envelope overruns — see the note in build.mjs.
 */
const MusicBed: React.FC = () => (MUSIC ? <Audio src={staticFile(MUSIC.src)} /> : null);

/** The finished video. */
export const Master: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: COLOR.bg}}>
    <Audio src={staticFile('voice.wav')} />
    <MusicBed />
    <PictureTrack />
    <CaptionTrack />
    <Vignette />
    <Grain />
    <Progress total={TOTAL_FRAMES} />
  </AbsoluteFill>
);

/** Captions only, transparent — drop above your own edit in Resolve. */
export const CaptionsAlpha: React.FC = () => (
  <AbsoluteFill>
    <CaptionTrack />
  </AbsoluteFill>
);

/** Graphics only, transparent. */
export const GraphicsAlpha: React.FC = () => (
  <AbsoluteFill>
    <GraphicsTrack />
  </AbsoluteFill>
);
