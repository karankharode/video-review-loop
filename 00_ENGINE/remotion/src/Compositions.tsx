import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  ACCENT,
  BG_A,
  BOTTOM_H,
  CAPTIONS,
  FACES,
  RULE_H,
  TOP_H,
  VISUALS,
  WIDTH,
  sec,
} from './beats';
import {Caption} from './components/Caption';
import {FacePlate, Plate} from './components/Plate';

/** Thin accent bar across the top, filling as the video plays. */
const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: 8,
        width: interpolate(frame, [0, durationInFrames], [0, WIDTH]),
        backgroundColor: ACCENT,
      }}
    />
  );
};

/** Top-panel graphics + the divider rule + progress bar. */
const GraphicsLayer: React.FC = () => (
  <>
    <div style={{position: 'absolute', top: 0, left: 0, width: WIDTH, height: TOP_H}}>
      {VISUALS.map((v, i) => {
        const dur = sec(v.end) - sec(v.start);
        return (
          <Sequence
            key={`v${i}`}
            from={sec(v.start)}
            durationInFrames={dur}
            layout="none"
          >
            <AbsoluteFill style={{width: WIDTH, height: TOP_H}}>
              <Plate
                src={v.asset}
                durationInFrames={dur}
                pan={v.pan}
                punch={v.punch}
                hold={v.hold}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </div>

    <div
      style={{
        position: 'absolute',
        top: TOP_H,
        left: 0,
        width: WIDTH,
        height: RULE_H,
        backgroundColor: ACCENT,
      }}
    />
    <ProgressBar />
  </>
);

/** Bottom-panel face plates. */
const FaceLayer: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: TOP_H + RULE_H,
      left: 0,
      width: WIDTH,
      height: BOTTOM_H,
      backgroundColor: '#10141c',
    }}
  >
    {FACES.map((f, i) => {
      const dur = sec(f.end) - sec(f.start);
      return (
        <Sequence key={`f${i}`} from={sec(f.start)} durationInFrames={dur} layout="none">
          <AbsoluteFill style={{width: WIDTH, height: BOTTOM_H}}>
            <FacePlate src={f.asset} durationInFrames={dur} />
          </AbsoluteFill>
        </Sequence>
      );
    })}
  </div>
);

/** Word-level animated captions. */
const CaptionLayer: React.FC = () => (
  <>
    {CAPTIONS.map((c, i) => {
      const dur = sec(c.end) - sec(c.start);
      return (
        <Sequence key={`c${i}`} from={sec(c.start)} durationInFrames={dur} layout="none">
          <Caption
            text={c.text}
            highlight={c.highlight}
            kicker={c.kicker}
            durationInFrames={dur}
          />
        </Sequence>
      );
    })}
  </>
);

/**
 * Full placeholder cut — everything baked, with the scratch VO.
 * This is the "can I watch it today" render.
 */
export const PlaceholderCut: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: BG_A}}>
    <Audio src={staticFile('voice.wav')} />
    <GraphicsLayer />
    <FaceLayer />
    <CaptionLayer />
  </AbsoluteFill>
);

/**
 * Captions only, transparent background.
 * Renders to ProRes 4444 and drops straight onto a track above the edit.
 */
export const CaptionsAlpha: React.FC = () => (
  <AbsoluteFill>
    <CaptionLayer />
  </AbsoluteFill>
);

/**
 * Top-panel graphics + rule + progress bar, transparent below the rule.
 * Sits above full-frame face footage in Resolve so the graphics occupy the top
 * of frame and the face shows through underneath.
 */
export const GraphicsAlpha: React.FC = () => (
  <AbsoluteFill>
    <GraphicsLayer />
  </AbsoluteFill>
);
