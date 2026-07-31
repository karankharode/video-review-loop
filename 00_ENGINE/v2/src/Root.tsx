import React from 'react';
import {Composition} from 'remotion';
import {FPS, HEIGHT, WIDTH} from './core/design';
import {TOTAL_FRAMES} from './core/timeline';
import {CaptionsAlpha, GraphicsAlpha, Master} from './Compositions';

/**
 * Durations come from the aligned timeline, so they change automatically when
 * the voiceover changes. Nothing here is a magic number.
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Master" component={Master} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="CaptionsAlpha" component={CaptionsAlpha} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="GraphicsAlpha" component={GraphicsAlpha} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
