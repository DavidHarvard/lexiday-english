# Reading vocabulary and grouped listening — 2026-11-03

The daily reader now queries a shared dictionary independently of the selected course. The 10,000 most frequent entries load first; 399,200 total entries are split across 700 small files and loaded as needed. ECDICT's Chinese definitions, pronunciation, English definitions and inflection links are retained. The source and MIT license are included in `dist/dictionary/`. Dictionary lookups and previously downloaded audio survive reloads in Cache Storage.

New generated articles are checked word by word (including the title) before replacing the authored fallback. Articles with unresolved tokens keep the checked fallback. Existing saved articles are also checked on opening and replaced with a checked fallback if necessary. Every token in every authored fallback is covered. Double-click collection still schedules the selected word for tomorrow and uses the actual bilingual paragraph as its context example. The general dictionary stays separate from the learner's personal progress and chosen course.

Listening version 3 groups two comprehension questions and one vocabulary question on one page. Options are English. Initially the material and English questions play with choices hidden. “直接答题” reveals choices immediately; playback errors also reveal them. Neither selection nor submission depends on successful audio playback. Each question has a separate English audio button. The three choices are saved as drafts and submitted together, then the original text appears and is read again. Earlier submitted quiz records remain in history; an unfinished older-format quiz is archived before starting the new format.

Twenty-five original fixed passage/question clips (about 12 MB of PCM WAV) are published with the site. The variable example and target-word question are prepared during vocabulary study. Playback downloads the following chunks while the current chunk plays, and quiz look-ahead includes the following passage. Audio has a bounded 120-clip persistent cache as well as the existing bounded memory cache. The application shell is cached by a versioned service worker; account API responses are never cached by that worker. First use needs a network connection. Already downloaded clips can play offline; uncached clips or browser autoplay restrictions leave answer submission available.

“再学单词” starts another batch using the current daily quantity, capped at 100, without changing the daily plan or clearing earlier results, notes or review dates. If the course is exhausted, the page says so.

## Rebuilding

- Normal build: `npm run build` (includes the offline shell).
- Dictionary: download `ecdict.csv` and `LICENSE` from https://github.com/skywind3000/ECDICT into `outputs/reading-dictionary/`, then run `python scripts/build-reading-dictionary.py`. The source SHA-256 is recorded in `dist/dictionary/manifest.json`. The optional `articles.json` input enables the builder's fallback audit; the automated dictionary test always audits the committed reading library.
- Fixed audio: run `node scripts/prepare-listening-audio.mjs`, then `scripts/record-listening-audio.ps1` on Windows with Microsoft Zira Desktop. The recorder skips existing files; unchanged clips keep stable content-derived filenames. Run the normal build afterward.

## Validation

168 automated checks pass, including full fallback dictionary coverage, inflected forms, next-day collected-word restoration, English grouped quiz submission without playback, static WAV data and an additional learning batch. Browser checks cover automatic choice reveal after playback, immediate answering, replay, errors, draft restoration, mobile layout, real double-click collection, study/audio regressions and an offline page reload with persistent dictionary/audio. A 600 ms simulated network delay test starts an already-prefetched next-word clip in 36 ms (mock playback, not an end-to-end production latency guarantee).

Production verification completed on 2026-11-04 (Asia/Shanghai): code commit `1ea122a`, Cloudflare Pages deployment `e3dfaaed`, live site https://lexiday-english.pages.dev/. All 50 selected asset hashes and endpoint checks passed. A real Chrome audio element played a published WAV through `playing` and `ended`; decoded audio was non-silent (peak 0.696, duration 5.714 seconds). The speech API returned valid WAV audio. A dedicated verification account saved the dictionary entry with its original context example, version-3 grouped answers and a dated note; all were restored after logout and login. Existing user accounts were not modified during verification.

## ERR_FAILED navigation repair — 2026-11-04

The initial offline shell cached `/index.html`. Cloudflare Pages redirects that URL to `/` with HTTP 308, so Cache Storage retained a response marked `redirected: true`. Returning it for a Chrome navigation caused `net::ERR_FAILED`. This was reproduced on production: the first visit returned 200, then reloading after service-worker installation failed. The earlier local offline test did not emulate Cloudflare's canonical-URL redirect.

The shell now caches the canonical `/` URL and strips redirect metadata from any cached redirected response. Cache-storage failures fall back to the network; when both are unavailable, navigation displays a recovery page. `/recover` bypasses the offline shell and unregisters this site's old worker, then offers a link back to learning. It does not clear localStorage, cookies, personal notes, dictionary files or audio caches. Normal activation removes only obsolete application-shell caches. The recovery page and service-worker update use fresh HTTP requests.

174 automated checks pass. A Chrome regression reproduces the old failure behind an HTTP 308 redirect, opens the recovery page, preserves progress/account selection/audio, then completes three reloads and an offline reload using the repaired worker.

Repair deployed as Cloudflare Pages `090eebd9`, code commit `5c38262`. Live Chrome verification at 2026-11-04 23:08 Asia/Shanghai opened `/recover`, returned to learning, confirmed the canonical cached response had `redirected: false`, completed three HTTP-200 reloads and one offline reload, and preserved a dated test note.
