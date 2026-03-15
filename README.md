# SlothLabs Site

Landing website for SlothLabs, built with Next.js 14 (App Router) + Tailwind CSS.

## Tech Stack

- **Next.js 14** – App Router, fully static export
- **Tailwind CSS** – utility-first styling with custom design tokens
- **TypeScript** – type-safe components
- **Deploy** – Vercel (zero config) or Netlify

## Local Setup

```bash
cd aws-switch-tauri/aws-switch-site
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | SlothLabs landing — company overview + product cards |
| `/cloudorbit` | CloudOrbit product page — features, comparison, download |
| `/docs` | CloudOrbit documentation — getting started, AWS setup, troubleshooting |

## Updating Copy

**All text content lives in one file:** `src/config/content.ts`

To update any copy:
1. Open `src/config/content.ts`
2. Edit the relevant exported constant
3. Save — changes appear instantly in dev, rebuild for production

Never touch component files for copy-only updates.

## Adding / Replacing Images

1. Drop the new image in `public/images/`
2. Update the path in `src/config/content.ts` under the relevant `image:` field
3. No code changes needed
