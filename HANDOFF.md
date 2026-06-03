# slothlabs.org / web — Handoff Checklist

Manual items that need to be done by hand on whichever machine picks this up
next. The web project doesn't ship a desktop binary, so there's nothing to
sign with Apple — but Netlify env, news feed, and the Next Big Release
permalink flow still need a human.

Status as of last push:
- Site is up at slothlabs.org with the new `/next/` + `/next/[slug]/` permalink
  pattern wired to `src/data/upcomingLaunches.ts`
- Launch dates: CloudOrbit + WattsOrbit on **Friday June 5, 2026**, DataOrbit
  on **Monday June 15, 2026**, the rest TBD later in 2026
- News feed builder runs as `prebuild` and aggregates per-app JSONs into
  `public/news/feed.json`

---

## 1. Netlify environment — must be done by hand

Netlify deploys from main on push. A handful of env vars need to exist for
the build to succeed and for ancillary GitHub-driven features (release
ticker, sponsor list, etc.) to populate.

- [ ] Netlify → Site settings → Environment variables → confirm:
  - [ ] `GITHUB_TOKEN` — fine-grained PAT, **Contents:Read** on
        `slothlabsorg/web` (and the public Orbit repos so the homepage can
        list latest releases). Used by the prebuild step. Do NOT use the
        same PAT as `RELEASE_TOKEN` from the Orbit repos — that one has
        Contents:Write.
  - [ ] `NEWS_FEED_BASIC_AUTH_USER` (only if you turn on the protected
        News CMS; otherwise leave unset)
  - [ ] `NEWS_FEED_BASIC_AUTH_PASS` (same)
- [ ] Confirm Build command is `npm run build` (the `prebuild` script handles
      `scripts/build-news-feed.mjs` automatically)
- [ ] Confirm Publish directory is `out/` (next.config.js has
      `output: 'export'` + `trailingSlash: true`)
- [ ] **Production branch** is `main`. Deploy previews are on for PRs.

---

## 2. Next Big Release feature — manual test plan

The new permalink pattern is the whole point of the recent refactor. Test
this against a real deploy preview before tagging anything.

- [ ] Visit `/` — the new `<NextBigReleaseHero variant="home" />` shows
      directly under the main hero with a live countdown to the soonest
      launch (currently CloudOrbit + WattsOrbit on June 5)
- [ ] Countdown ticks every minute (open DevTools, Date-mock to T-90s and
      confirm the seconds tick down)
- [ ] When the launch date passes, the hero flips to a **LIVE** badge with
      the product CTA — verify by Date-mocking past 2026-06-05T12:00:00Z
- [ ] `/next/` index renders with all 7 launches in a grid; soonest first
      based on `nextUpcomingLaunch()`
- [ ] `/next/cloudorbit/`, `/next/wattsorbit/`, `/next/dataorbit/` etc. each
      render the per-launch hero with `variant="permalink"`
- [ ] OG meta + Twitter card on each permalink: paste the URL into the
      Twitter / LinkedIn / Slack debuggers and confirm the preview image,
      title, and description match the launch entry
- [ ] **Share buttons in `<SharePermalink>`** — click each (Copy / 𝕏 /
      LinkedIn / Reddit) and confirm the URL it composes is the absolute
      `https://slothlabs.org/next/<slug>/` form, not a relative path
- [ ] TBD entries (klight, ProxyOrbit, BastionOrbit, DropOrbit) show "Later
      in 2026" copy and **no countdown**
- [ ] DropOrbit was added by hand — confirm `/next/droporbit/` renders with
      its previewImage and the homepage carousel doesn't flag it as live
      (it has `launchDate: null`)
- [ ] Sitemap (`/sitemap.xml`) includes `/next/` plus all 7 permalink URLs

---

## 3. News feed — manual test plan

Each Orbit app reads from `https://slothlabs.org/news/feed.json` filtered by
`targetApps`. The web project owns that JSON.

- [ ] `npm run build` runs `prebuild` (which executes
      `scripts/build-news-feed.mjs`) and produces `public/news/feed.json`
      that combines `general.json` + every per-app JSON in
      `public/news/<appname>news.json`
- [ ] `feed.json` items are sorted by `publishedAt` desc, with the
      `targetApps` array preserved
- [ ] On staging deploy, hit `/news/feed.json` directly and confirm:
  - [ ] valid JSON, no parse errors
  - [ ] `cloudorbitnews.json` items are present with `targetApps: ["cloudorbit"]`
  - [ ] `wattsorbitnews.json` items are present with `targetApps: ["wattsorbit"]`
  - [ ] `general.json` items have `targetApps: ["all"]`
- [ ] Open CloudOrbit dev build pointed at the staging news URL
      (override the URL in the news client if needed) and confirm only
      `cloudorbit` + `all` items appear in the bell
- [ ] Same for WattsOrbit, DataOrbit, BastionOrbit, ProxyOrbit
- [ ] Sponsor item from `general.json` shows "SPONSOR" badge tone correctly
      in the apps' news bells

---

## 4. Carousel + roadmap parity

The homepage carousel and the Roadmap section both need to stay in sync
with `src/data/upcomingLaunches.ts`.

- [ ] `src/app/page.tsx` `RAW_ROADMAP` dates match `UPCOMING_LAUNCHES`
- [ ] `src/components/Navbar.tsx` badges match the same dates
- [ ] `src/config/content.ts` `comingSoonDate` strings match
- [ ] `LaunchBanner` `DEFAULT_LAUNCH` is the soonest dated launch
      (currently `2026-06-05T12:00:00Z`)
- [ ] Carousel `isLive` logic uses launchTs comparison, not the legacy
      `released` flag — verify WattsOrbit (which has v1.1.0 already on
      GitHub) stays gated until June 5

---

## 5. Pre-flight before next deploy

- [ ] `npm run build` is green locally (no TS errors, news feed builds)
- [ ] `npx next lint` clean
- [ ] Open a deploy preview on PR, click through `/next/`, `/next/[slug]/`,
      `/cloudorbit`, `/wattsorbit`, `/dataorbit`, `/`, share buttons,
      countdown
- [ ] Lighthouse pass on `/` and one permalink — perf & SEO both ≥ 90
- [ ] OG image debugger confirms each permalink renders correctly on
      Twitter / LinkedIn / Slack / Discord
- [ ] Hit `/news/feed.json` on the deploy preview — JSON valid, items present

When everything above is green, merge to main and Netlify will publish.

---

## 6. News CMS / advertise flow (optional, when ready)

There's a `/stats` flow protected by Basic Auth (creds in MEMORY: `sloth` /
`slothlabsorg123`). The same credential pair is reused for the News CMS
when you turn it on.

- [ ] Confirm `/stats` Basic Auth still works in production
- [ ] If turning on the News CMS, set `NEWS_FEED_BASIC_AUTH_USER` and
      `NEWS_FEED_BASIC_AUTH_PASS` in Netlify env first, then ship the
      authenticated routes
- [ ] `/advertise` page CTAs point at the right intake (currently a mailto
      or form — confirm before launch traffic hits it)
