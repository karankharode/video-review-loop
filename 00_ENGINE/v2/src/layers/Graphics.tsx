import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR, HEIGHT, SAFE, TYPE, WIDTH} from '../core/design';
import {SPRING, backOut, expoOut, pop, ramp} from '../core/motion';

/**
 * Beat graphics.
 *
 * Each kind is a small motion-designed card rather than a static plate. They
 * live in the upper two-thirds of frame so they never collide with captions,
 * and they all animate in on the beat's own clock (frame 0 = beat start).
 */

const Panel: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 340}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left: SAFE.side,
      right: SAFE.side,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
    }}
  >
    {children}
  </div>
);

/** Big number that counts up and stops hard. */
const Counter: React.FC<{g: any}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dur = Math.round(fps * 0.9);
  const p = ramp(frame, 2, dur, expoOut);
  const value = (g.to ?? 100) * p;
  const enter = pop(frame, fps, SPRING.slam);

  return (
    <Panel top={300}>
      <div
        style={{
          fontFamily: TYPE.family,
          fontWeight: TYPE.stat.weight,
          fontSize: TYPE.stat.size,
          letterSpacing: TYPE.stat.tracking,
          lineHeight: 0.9,
          color: COLOR.accent,
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [0.72, 1], {easing: backOut})})`,
          textShadow: `0 0 70px ${COLOR.accent}66`,
        }}
      >
        {value.toFixed(g.decimals ?? 0)}
        {g.suffix ?? ''}
      </div>
      {g.label ? (
        <div
          style={{
            fontFamily: TYPE.family,
            fontWeight: TYPE.label.weight,
            fontSize: TYPE.label.size,
            letterSpacing: TYPE.label.tracking,
            color: COLOR.ink,
            opacity: ramp(frame, dur * 0.6, 8),
          }}
        >
          {String(g.label).toUpperCase()}
        </div>
      ) : null}
      {g.sub ? (
        <div
          style={{
            fontFamily: TYPE.family,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: 2,
            color: '#8FA0B4',
            opacity: ramp(frame, dur * 0.8, 8),
          }}
        >
          {String(g.sub).toUpperCase()}
        </div>
      ) : null}
    </Panel>
  );
};

/** Reactive-looking waveform. Deterministic so renders are reproducible. */
const Waveform: React.FC<{g: any}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bars = 46;
  const intensity = g.intensity ?? 1;
  const enter = ramp(frame, 0, 10, expoOut);

  return (
    <Panel top={620}>
      <div style={{display: 'flex', alignItems: 'center', gap: 8, height: 260}}>
        {Array.from({length: bars}).map((_, i) => {
          // Deterministic pseudo-audio: layered sines + fixed noise per bar.
          const n = random(`bar-${i}`);
          const t = frame / fps;
          const h =
            (0.25 +
              0.75 *
                Math.abs(
                  Math.sin(t * (2.2 + n * 2) + i * 0.42) * 0.6 +
                    Math.sin(t * 5.1 + i * 0.9) * 0.4,
                )) *
            intensity;
          // A few bars flagged as filler words, tinted with accent2.
          const isFiller = g.markFiller && (i === 9 || i === 22 || i === 35);
          return (
            <div
              key={i}
              style={{
                width: 12,
                height: Math.max(8, h * 240 * enter),
                borderRadius: 6,
                background: isFiller ? COLOR.accent2 : COLOR.accent,
                opacity: isFiller ? 1 : 0.85,
                boxShadow: isFiller ? `0 0 24px ${COLOR.accent2}AA` : 'none',
              }}
            />
          );
        })}
      </div>
      {g.markFiller ? (
        <div
          style={{
            fontFamily: TYPE.family,
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: 3,
            color: COLOR.accent2,
            opacity: ramp(frame, 14, 8),
          }}
        >
          FILLER DETECTED
        </div>
      ) : null}
    </Panel>
  );
};

/** Transcript lines that type in and get marked weak/strong. */
const Transcript: React.FC<{g: any}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lines = g.lines ?? [];

  return (
    <Panel top={330}>
      {lines.map((ln: any, i: number) => {
        const at = i * Math.round(fps * 0.55);
        const p = ramp(frame, at, 10, expoOut);
        const markP = ramp(frame, at + 12, 12, expoOut);
        const isQ = ln.role === 'q';
        const strong = ln.mark === 'strong';
        const weak = ln.mark === 'weak';
        return (
          <div
            key={i}
            style={{
              width: '100%',
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [-30, 0])}px)`,
              background: isQ ? 'transparent' : 'rgba(9,14,22,0.82)',
              borderLeft: isQ
                ? 'none'
                : `6px solid ${strong ? COLOR.accent : weak ? COLOR.accent2 : '#33404F'}`,
              borderRadius: 12,
              padding: isQ ? '4px 0 10px' : '18px 22px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Highlighter sweep over the marked line. */}
            {!isQ ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${markP * 100}%`,
                  background: strong
                    ? `${COLOR.accent}22`
                    : weak
                      ? `${COLOR.accent2}22`
                      : 'transparent',
                }}
              />
            ) : null}
            <span
              style={{
                position: 'relative',
                fontFamily: TYPE.family,
                fontWeight: isQ ? 800 : 700,
                fontSize: isQ ? 32 : 38,
                letterSpacing: isQ ? 2 : 0,
                color: isQ ? '#8FA0B4' : COLOR.ink,
              }}
            >
              {isQ ? String(ln.text).toUpperCase() : ln.text}
            </span>
          </div>
        );
      })}
    </Panel>
  );
};

/** Horizontal meters that fill — pace / hesitation / filler. */
const Meters: React.FC<{g: any}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = g.items ?? [];
  return (
    <Panel top={480}>
      {items.map((it: any, i: number) => {
        const at = i * Math.round(fps * 0.28);
        const p = ramp(frame, at, 16, expoOut);
        const hot = it.value >= 0.8;
        return (
          <div key={i} style={{width: '100%', opacity: ramp(frame, at, 8)}}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10,
                fontFamily: TYPE.family,
                fontWeight: 800,
                fontSize: 30,
                letterSpacing: 2,
                color: hot ? COLOR.accent2 : COLOR.ink,
              }}
            >
              <span>{String(it.label).toUpperCase()}</span>
              <span>{Math.round(it.value * p * 100)}</span>
            </div>
            <div style={{height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.1)'}}>
              <div
                style={{
                  height: '100%',
                  width: `${it.value * p * 100}%`,
                  borderRadius: 11,
                  background: hot
                    ? `linear-gradient(90deg, ${COLOR.accent}, ${COLOR.accent2})`
                    : COLOR.accent,
                  boxShadow: hot ? `0 0 26px ${COLOR.accent2}88` : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
    </Panel>
  );
};

/** Struck-out thing vs. an assembling thing. */
const Versus: React.FC<{g: any}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const strikeP = ramp(frame, 6, 12, expoOut);
  const steps = g.right?.steps ?? [];

  return (
    <Panel top={400}>
      <div style={{position: 'relative', width: '100%', textAlign: 'center'}}>
        <span
          style={{
            fontFamily: TYPE.family,
            fontWeight: 900,
            fontSize: 66,
            letterSpacing: -1,
            color: '#63728A',
          }}
        >
          {String(g.left?.label ?? '').toUpperCase()}
        </span>
        <div
          style={{
            position: 'absolute',
            top: '52%',
            left: '50%',
            transform: 'translateX(-50%)',
            height: 8,
            width: `${strikeP * 62}%`,
            background: COLOR.accent2,
            borderRadius: 4,
          }}
        />
      </div>

      <div style={{height: 8}} />

      {steps.map((s: string, i: number) => {
        const at = Math.round(fps * 0.5) + i * Math.round(fps * 0.3);
        const p = pop(frame - at, fps, SPRING.card);
        return (
          <div
            key={s}
            style={{
              width: '100%',
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [24, 0], {easing: backOut})}px)`,
              background: 'rgba(9,14,22,0.85)',
              border: `3px solid ${COLOR.accent}`,
              borderRadius: 16,
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <span
              style={{
                fontFamily: TYPE.family,
                fontWeight: 900,
                fontSize: 40,
                color: COLOR.accent,
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontFamily: TYPE.family,
                fontWeight: 800,
                fontSize: 42,
                letterSpacing: 1,
                color: COLOR.ink,
              }}
            >
              {s}
            </span>
          </div>
        );
      })}
    </Panel>
  );
};

/** Numbered instruction cards. */
const Steps: React.FC<{g: any}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = g.items ?? [];
  return (
    <Panel top={430}>
      {items.map((s: string, i: number) => {
        const at = i * Math.round(fps * 0.42);
        const p = pop(frame - at, fps, SPRING.card);
        return (
          <div
            key={s}
            style={{
              width: '100%',
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [-40, 0], {easing: backOut})}px)`,
              background: 'rgba(9,14,22,0.86)',
              borderLeft: `8px solid ${COLOR.accent}`,
              borderRadius: 14,
              padding: '22px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 22,
            }}
          >
            <span
              style={{
                fontFamily: TYPE.family,
                fontWeight: 900,
                fontSize: 46,
                color: COLOR.accent,
                minWidth: 44,
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontFamily: TYPE.family,
                fontWeight: 800,
                fontSize: 40,
                letterSpacing: 0.5,
                color: COLOR.ink,
              }}
            >
              {s}
            </span>
          </div>
        );
      })}
    </Panel>
  );
};

/** Final product line. */
const EndCard: React.FC<{g: any}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = pop(frame - 6, fps, SPRING.card);
  return (
    <Panel top={560}>
      <div
        style={{
          opacity: p,
          transform: `translateY(${interpolate(p, [0, 1], [30, 0], {easing: backOut})}px)`,
          textAlign: 'center',
          background: 'rgba(4,7,14,0.8)',
          border: `3px solid ${COLOR.accent}`,
          borderRadius: 22,
          padding: '30px 36px',
        }}
      >
        <div
          style={{
            fontFamily: TYPE.family,
            fontWeight: 900,
            fontSize: 52,
            letterSpacing: -0.5,
            color: COLOR.accent,
          }}
        >
          {g.line}
        </div>
        {g.sub ? (
          <div
            style={{
              marginTop: 14,
              fontFamily: TYPE.family,
              fontWeight: 700,
              fontSize: 30,
              color: '#9FB0C4',
            }}
          >
            {g.sub}
          </div>
        ) : null}
      </div>
    </Panel>
  );
};

export const Graphic: React.FC<{g?: Record<string, any>}> = ({g}) => {
  if (!g) return null;
  switch (g.kind) {
    case 'counter': return <Counter g={g} />;
    case 'waveform': return <Waveform g={g} />;
    case 'transcript': return <Transcript g={g} />;
    case 'meters': return <Meters g={g} />;
    case 'versus': return <Versus g={g} />;
    case 'steps': return <Steps g={g} />;
    case 'endcard': return <EndCard g={g} />;
    default: return null;
  }
};
