# SFX library

The engine synthesises its effects (`bin/lib/sfx-synth.mjs`) — risers, whooshes,
impacts and pings are filtered noise sweeps and decaying sines, so there is
nothing to download and nothing to licence.

To override one with a recorded effect, drop a file here named for the kind:

```
impact.wav        replaces every impact
impact-2.wav      replaces only the second impact in a video (variant rotation)
whoosh.wav
riser.wav
```

Kinds: `riser`, `whoosh`, `whoosh_rev`, `impact`, `sub_drop`, `notification`,
`tick`, `slide`, `pop`.

A per-variation `assets/sfx/` folder takes precedence over this one.

## Anchors

A synthesised effect knows where its *moment* is — a riser's peak is at its end,
an impact's transient is at its front — and the scheduler lands that moment on
the cut. A supplied file has no such metadata, so the engine finds its first
transient (first sample within 6 dB of peak) and uses that.

If a supplied effect lands late, trim the silence off its head.

Files here are gitignored; this README stays.
