# Music library

Drop audio files here (`.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg`, `.opus`) and
reference one from a variation's `script.json`:

```jsonc
"music": {
  "file": "lifted-up",          // basename match — no need for the full filename
  "licence": "Pixabay Content License",
  "sourceUrl": "https://pixabay.com/music/...",
  "bedLufs": -24,
  "startAt": 12
}
```

`bin/fetch-music.mjs` copies the file into the variation's
`assets/music/source/`, so a rebuild never depends on this folder still holding
it. Everything downstream — window, loudness calibration, speech-derived duck,
attribution record — is identical to the search path.

List what's here:

```bash
node bin/fetch-music.mjs <variation> --list
```

## Licence is your responsibility on this path

Nothing in an audio file states its terms. If `music.licence` is missing the
attribution record says **UNVERIFIED** rather than guessing, and the build warns.
Set it before publishing.

Files here are gitignored — they are inputs, not source.
