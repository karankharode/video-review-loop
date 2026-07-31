# Remotion — captions and graphics

Frame-accurate caption motion, spring punch-ins and plate animation. Renders a flat preview plus **transparent overlays for DaVinci Resolve**.

Generic: the compositions read whichever variation you link, so this is engine code, not per-video code.

## Use

```bash
cd 00_ENGINE/remotion
npm install                                                    # once
./link-assets.sh ../../02_BATCHES/2026-07-31/v1_dendrite_waterjet
npm start                                                      # studio
```

`link-assets.sh` copies that variation's `assets/stills`, `assets/face` and `voice.wav` into `public/`, and its `beats_kallaway.json` into `src/timeline.json`. Remotion can only serve from `public/`, and composition durations must be known at bundle time, so this is a copy — not a symlink.

Called with no argument it links v5, which is how it behaved before it took a parameter.

## Compositions

| id | Output | For |
|---|---|---|
| `PlaceholderCut` | opaque H.264 | Watch the whole cut today, placeholders and all |
| `CaptionsAlpha` | ProRes 4444 + alpha | Drop on a track above the edit in Resolve |
| `GraphicsAlpha` | ProRes 4444 + alpha | Top-panel graphics; transparent below the rule so face footage shows through |

```bash
npm run preview     # → out/preview.mp4
npm run captions    # → out/captions_alpha.mov
npm run graphics    # → out/graphics_alpha.mov
```

### Transparency needs PNG frames

`remotion.config.ts` sets JPEG frames globally, which is right for the opaque preview and wrong for alpha. The two alpha scripts pass `--image-format=png` explicitly. Without it the render fails with *"Pixel format was set to 'yuva444p10le' but the image format is not PNG."*

Verify a render really has alpha:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0 out/captions_alpha.mov
```

`yuva444p12le` is correct. Anything without the `a` is opaque.

## Layout

Top 55% graphics, accent rule, bottom 45% face, captions above the 250px platform-UI safe zone. All of it comes from the beats file's `layout` block — change it there, not here.

## Sync rule

`src/timeline.json` is a **copy**. Edit `beats_kallaway.json` in the variation folder and re-run `link-assets.sh`. Editing `src/timeline.json` directly works until the next link, then silently reverts.

`.active-variation` records what's currently linked.

## Relationship to the Python path

`00_ENGINE/pipeline/kallaway.py` renders the same beats file with Pillow + FFmpeg. It's the fast preview — seconds, not minutes, and no browser. Remotion is the polish pass: real spring physics, word-level caption stagger, and the alpha overlays.

Both read the same `beats_kallaway.json`, so they never disagree about timing.
