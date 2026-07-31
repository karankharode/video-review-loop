import React from 'react';
import {Composition} from 'remotion';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './beats';
import {CaptionsAlpha, GraphicsAlpha, PlaceholderCut} from './Compositions';

/**
 * Compositions are driven by src/timeline.json, which `link-assets.sh
 * <variation-folder>` writes — so switching variation is a shell command, not
 * a code edit. This replaces the hardcoded v5 KallawayFresher composition;
 * v5 renders through the same path by linking its folder.
 *
 * The two *Alpha compositions render on a transparent background for the
 * DaVinci Resolve handoff. PlaceholderCut is the flat, watchable preview.
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PlaceholderCut"
      component={PlaceholderCut}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="CaptionsAlpha"
      component={CaptionsAlpha}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="GraphicsAlpha"
      component={GraphicsAlpha}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
);
