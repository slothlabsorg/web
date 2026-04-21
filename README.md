# SlothLabs — Marketing Site

Landing website for [SlothLabs](https://slothlabs.org), built with Next.js 14 (App Router) + Tailwind CSS.

---

## Tech Stack

- **Next.js 14** — App Router, server + client components
- **Tailwind CSS** — utility-first styling with custom design tokens
- **TypeScript** — type-safe components throughout
- **Deploy** — Vercel (zero config)

---

## Local Setup

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Build check:

```bash
node_modules/.bin/next build
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | SlothLabs landing — product carousel, roadmap, support banner |
| `/cloudorbit` | CloudOrbit product page |
| `/dataorbit` | DataOrbit product page |
| `/bastionorbit` | BastionOrbit product page |
| `/proxyorbit` | ProxyOrbit product page |
| `/wattsorbit` | WattsOrbit product page |

---

## Updating copy

All text content lives in one file: `src/config/content.ts`

To update any copy:
1. Open `src/config/content.ts`
2. Edit the relevant exported constant
3. Save — changes appear instantly in dev, rebuild for production

Never touch component files for copy-only updates.

---

## Adding / replacing images

1. Drop the new image in `public/images/`
2. Update the path in `src/config/content.ts` under the relevant field
3. No code changes needed

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b my-change`
2. Run `npm run dev` and verify your changes locally
3. Run `node_modules/.bin/next build` to confirm no build errors
4. Open a pull request — all PRs require review before merging to `main`
5. Direct pushes to `main` are disabled

---

## Support the project

This site (and all the apps it promotes) runs on nights and weekends:

- [Ko-fi](https://ko-fi.com/slothlabs)
- [GitHub Sponsors](https://github.com/sponsors/slothlabsorg)
- [Polar.sh](https://polar.sh/slothlabs)

---

## License

MIT © SlothLabs
