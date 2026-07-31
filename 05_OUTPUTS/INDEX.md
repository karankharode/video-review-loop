# Output register

Every finished render, newest first. One row per run — re-rendering a variation
adds a row rather than replacing one, so this is the record of what was actually
produced and when.

Written by `00_ENGINE/v2/bin/deliver.mjs`. The `.mp4` files here are
gitignored; this index is not.

**Filename format:**
`<date>_<time>__<track>__<variation>__<duration>__<loudness>__<commit>.mp4`

| # | Date | Time | Track | Variation | Length | Loudness | Built from |
|---|---|---|---|---|---|---|---|
| 2 | 2026-07-31 | 14:48 | SAI | `sai_stage_fright` | 49.4s | -14.00LUFS | `b6a34f7-dirty` |
| 1 | 2026-07-31 | 14:45 | SAI | `sai_opus_websites` | 43.5s | -14.06LUFS | `b6a34f7-dirty` |

2 runs. A `-dirty` suffix on the commit
means the working tree had uncommitted changes when it was built.
