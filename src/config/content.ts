// ─── ALL SITE COPY IN ONE FILE ───────────────────────────────────────────────
// Edit here only. Never touch components for copy changes.

export const slothLabsContent = {
  nav: {
    logo: '/images/slothlabs-logo-dark.png',
    links: ['Home', 'Products', 'Pricing', 'Docs'],
    cta: 'Sign up',
  },

  hero: {
    badge: '🚀 Now in beta',
    headline: 'Dev tools designed to give you\ntime back',
    subtitle:
      'Tools for devs and DevOps that boost performance and save time — so you can focus on what actually matters.',
    cta: 'View Products',
    ctaSecondary: 'About SlothLabs →',
    image: '/images/slothlabs-hero.png',
  },

  products: {
    headline: 'Tools that save time so you can focus on what matters',
    sub: 'Each product solves a real pain. Less friction, more shipping.',
    launchBanner: 'Many tools shipping soon — free, native Rust, built for developers',
    items: [
      {
        name: 'WattsOrbit',
        slug: '/wattsorbit',
        logo: null,
        by: '· SlothLabs ·',
        desc: 'Real-time Mac power monitor. Watts in, watts out, per-device USB draw, cable quality alerts, and smart battery notifications — all from the menu bar.',
        tags: ['macOS', 'Battery', 'USB power'],
        cta: 'Learn more →',
        live: false,
        accent: '#F59E0B',
        comingSoonDate: 'April 25, 2026',
        previewImage: '/images/wattsorbit-landing.png',
      },
      {
        name: 'ProxyOrbit',
        slug: '/proxyorbit',
        logo: null,
        by: '· SlothLabs ·',
        desc: 'Local HTTP/HTTPS proxy inspector. Capture every API call, filter by method and status, set as system proxy — free forever, no Charles subscription required.',
        tags: ['HTTP', 'HTTPS', 'Proxy inspector'],
        cta: 'Learn more →',
        live: false,
        accent: '#94A3B8',
        comingSoonDate: 'May 5, 2026',
        previewImage: '/images/proxyorbit-landing.png',
      },
      {
        name: 'DataOrbit',
        slug: '/dataorbit',
        logo: null,
        by: '· SlothLabs ·',
        desc: 'The DynamoDB & CouchDB client you wished existed. Query with real filters, stream live changes, cross-join tables for debugging, and save every query automatically.',
        tags: ['DynamoDB', 'CouchDB', 'Live stream'],
        cta: 'Learn more →',
        live: false,
        accent: '#8B5CF6',
        comingSoonDate: 'May 15, 2026',
        previewImage: '/images/dataorbit-landing.png',
      },
      {
        name: 'BastionOrbit',
        slug: '/bastionorbit',
        logo: null,
        by: '· SlothLabs ·',
        desc: 'SSH tunnel manager for teams. One click to forward a database or service through a bastion host — with auto-expiry TTL so you never leave a port open by accident.',
        tags: ['SSH', 'Tunnels', 'Bastion'],
        cta: 'Learn more →',
        live: false,
        accent: '#10B981',
        comingSoonDate: 'May 27, 2026',
        previewImage: '/images/bastionorbit-landing.png',
      },
      {
        name: 'CloudOrbit',
        slug: '/cloudorbit',
        logo: '/images/cloudorbit-logo.png',
        by: '· SlothLabs ·',
        desc: 'AWS session manager with a UI. Switch accounts, manage sessions, detect EKS clusters — no terminal needed. Works behind Cloudflare. GCP and Azure coming soon.',
        tags: ['AWS', 'EKS', 'kubeconfig'],
        cta: 'Learn more →',
        live: false,
        accent: '#00D4FF',
        comingSoonDate: 'Mid-June 2026',
        previewImage: '/images/cloudorbit-badge.png',
      },
    ],
  },

  featureHighlight: {
    eyebrow: 'CLOUDORBIT',
    headline: 'Manage your AWS sessions,\naccounts, and access visually',
    body:
      "No more juggling aws configure profiles or fighting Leapp behind a Cloudflare network. CloudOrbit gives you a clean visual interface for everything AWS.",
    features: [
      'Switch AWS accounts instantly',
      'Visual session management',
      'EKS cluster detection',
      'Auto kubeconfig update',
      'Works behind Cloudflare',
      'AWS only for now, GCP and Azure coming soon',
    ],
    cta: 'View All Products',
    heroImage: '/images/character-server.png',
    logo: '/images/slothlabs-logo-light.png',
  },

  problem: {
    eyebrow: 'The problem',
    title: 'Tired of "network service terminated"?',
    body1:
      "Leapp, Granted, and other Electron-based AWS tools use Chromium's own TLS stack — which ignores your system certificate store. If your company uses Cloudflare Zero Trust, a corporate CA, or any SSL-inspecting proxy, those apps simply crash or refuse to connect.",
    body2:
      "CloudOrbit is built on Tauri, which uses WKWebView on macOS. WKWebView trusts the exact same certificates as Safari and your system browser — so corporate VPN, Cloudflare Gateway, or custom CA certificates work out of the box. No configuration needed.",
  },

  whyRust: {
    eyebrow: 'Built with Rust + Tauri',
    headline: 'No GC. No overhead.\nNo Electron.',
    body: 'CloudOrbit is a native binary — not a bundled Node.js server wrapped in Chromium. It starts in milliseconds and uses a fraction of the RAM.',
    stats: [
      { value: '~12 MB', label: 'app bundle' },
      { value: '< 50 MB', label: 'memory at rest' },
      { value: '0', label: 'GC pauses' },
    ],
    pills: ['Memory-safe by design', 'No null pointer crashes', 'No data races', 'AWS SDK for Rust', 'Tokio async runtime'],
  },

  plugins: {
    eyebrow: 'Roadmap',
    headline: 'Plugin architecture — coming soon',
    sub: 'The goal is a lightweight, shell-first plugin system. No JavaScript bundles, no npm, no build steps — just scripts and config.',
    cards: [
      { icon: '🪝', title: 'Lifecycle Hooks', desc: 'Shell scripts that fire on pre-login, post-assume-role, on-expiry events. Trigger Slack notifications, refresh kubeconfigs, update .envrc files automatically.' },
      { icon: '🔌', title: 'Credential Types', desc: 'Add new credential sources beyond SSO: IAM User access keys, cross-account chains, OIDC providers (Okta, Azure AD, Google Workspace). Each type is a Rust trait implementation.' },
      { icon: '📊', title: 'Dashboard Panels', desc: 'Embed custom WebView panels into the main content area. Build a cost dashboard, a CloudWatch widget, or a custom resource viewer — all from a single URL.' },
    ],
  },

  screenshots: {
    eyebrow: 'Screenshots',
    headline: 'See it in action',
    sub: 'Real screenshots coming soon. In the meantime, grab the app and see for yourself.',
    placeholders: ['SSO Login & Account List', 'EKS Cluster Discovery', 'EC2 Instance Manager', 'AWS Web Console Federation'],
  },

  downloadCta: {
    headline: 'Ready to ditch Electron?',
    sub: 'Download CloudOrbit for macOS. Free and open source.',
    primary: 'Download for macOS',
    secondary: 'View on GitHub →',
    note: 'Linux and Windows builds are planned. Contributions welcome.',
  },

  footer: {
    logo: '/images/slothlabs-logo-light.png',
    tagline: 'Dev tools designed to give you time back.',
    products: [
      { label: 'WattsOrbit', href: '/wattsorbit' },
      { label: 'ProxyOrbit', href: '/proxyorbit' },
      { label: 'DataOrbit', href: '/dataorbit' },
      { label: 'BastionOrbit', href: '/bastionorbit' },
      { label: 'CloudOrbit', href: '/cloudorbit' },
    ],
    organization: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '#contact' }],
    social: [
      { label: 'GitHub', href: 'https://github.com/slothlabs', external: true },
      { label: 'Twitter', href: '#', comingSoon: true },
      { label: 'Discord', href: '#' },
    ],
    copy: '© 2025 SlothLabs · Built for devs who want their time back · Made with ☕ and 🦥',
    trademark: 'SlothLabs and our Slothy mascot are registered — we’re glad you use our tools; please don’t use our name or character without asking.',
    donateLink: 'Support us',
  },
}

export const cloudOrbitContent = {
  nav: {
    logo: '/images/cloudorbit-badge.png',
    backLabel: '← SlothLabs',
    backHref: '/',
    downloadCta: 'Download',
  },

  hero: {
    badge: '☁️ AWS · EKS · kubeconfig',
    headline: 'Manage your AWS sessions\nin less time',
    subtitle:
      'A visual AWS session manager that works behind Cloudflare. Switch accounts, manage sessions, detect EKS clusters — so you can focus on what matters.',
    ctaPrimary: 'Download for macOS',
    ctaSecondary: 'Join waitlist',
    note: 'Also available for Windows & Linux',
    heroImage: '/images/cloudorbit-hero.png',
  },

  features: {
    headline: 'Everything you need.\nNothing you don\'t.',
    items: [
      {
        icon: '☁️',
        title: 'AWS Account Switching',
        desc: 'Visual dropdown to switch between all your AWS accounts instantly.',
      },
      {
        icon: '🔐',
        title: 'Session Management',
        desc: 'Start, stop, and monitor AWS sessions from a clean table UI.',
      },
      {
        icon: '☸️',
        title: 'EKS Cluster Detection',
        desc: 'Automatically detects your EKS clusters from active sessions.',
      },
      {
        icon: '📄',
        title: 'kubeconfig Auto-Update',
        desc: 'Updates your kubeconfig automatically when you switch contexts.',
      },
      {
        icon: '🛡️',
        title: 'Cloudflare Compatible',
        desc: 'Works perfectly on corporate networks and behind Cloudflare proxy.',
      },
      {
        icon: '🔜',
        title: 'GCP Support',
        desc: 'Google Cloud Platform support coming soon.',
        badge: 'Coming soon',
      },
    ],
  },

  comparison: {
    headline: 'Why not just use Leapp?',
    sub: "Leapp is great — but it doesn't work for everyone.",
    columns: ['Feature', 'CloudOrbit', 'Leapp'],
    rows: [
      { feature: 'Works behind Cloudflare',    cloudorbit: '✅', leapp: '❌' },
      { feature: 'Active development',         cloudorbit: '✅', leapp: '⚠️' },
      { feature: 'EKS kubeconfig auto-update', cloudorbit: '✅', leapp: '❌' },
      { feature: 'No terminal required',       cloudorbit: '✅', leapp: '✅' },
      { feature: 'macOS + Windows + Linux',    cloudorbit: '✅', leapp: '✅' },
      { feature: 'Open source',                cloudorbit: '🔜 Soon', leapp: '✅' },
    ],
  },

  cta: {
    headline: 'Ready to save time?',
    sub: 'Join developers already using CloudOrbit.',
    primary: 'Download for macOS',
    secondary: 'Join waitlist',
  },

  footer: {
    partOfSuite: 'Part of the SlothLabs suite →',
  },
}

export const docsContent = {
  nav: {
    logo: '/images/cloudorbit-logo.png',
    backLabel: '← SlothLabs',
    backHref: '/',
    downloadCta: 'Download',
  },

  sidebar: [
    {
      group: 'Getting Started',
      items: [
        { label: 'Introduction',   slug: 'introduction' },
        { label: 'Installation',   slug: 'installation' },
        { label: 'Quick Start',    slug: 'quick-start' },
      ],
    },
    {
      group: 'Configuration',
      items: [
        { label: 'AWS Setup',  slug: 'aws-setup' },
        { label: 'Profiles',   slug: 'profiles' },
      ],
    },
    {
      group: 'Features',
      items: [
        { label: 'Session Management', slug: 'session-management' },
        { label: 'EKS Integration',    slug: 'eks-integration' },
        { label: 'kubeconfig Update',  slug: 'kubeconfig-update' },
      ],
    },
    {
      group: 'Troubleshooting',
      items: [
        { label: 'Cloudflare Networks', slug: 'cloudflare-networks' },
        { label: 'Common Issues',       slug: 'common-issues' },
      ],
    },
  ],

  introduction: {
    headline: 'CloudOrbit Documentation',
    lead: 'Everything you need to get CloudOrbit running in minutes.',
    quickCards: [
      { icon: '⬇️', title: 'Installation',    desc: 'Get CloudOrbit installed on your system.',  slug: 'installation' },
      { icon: '⚡', title: 'Quick Start',     desc: 'From zero to your first session in 3 steps.', slug: 'quick-start' },
      { icon: '🛡️', title: 'Troubleshooting', desc: 'Fix common issues including Cloudflare.',   slug: 'cloudflare-networks' },
    ],
  },

  installation: {
    headline: 'Installation',
    tabs: ['macOS', 'Windows', 'Linux'],
    macos: {
      method1: {
        title: 'Method 1 — DMG (recommended)',
        body: 'Download the latest .dmg from the releases page and drag to Applications.',
        cta: 'Download for macOS',
      },
      method2: {
        title: 'Method 2 — Homebrew',
        code: 'brew tap slothlabs/cloudorbit\nbrew install cloudorbit',
      },
    },
    windows: {
      body: 'Download the .exe installer from the releases page.',
      code: 'winget install SlothLabs.CloudOrbit',
    },
    linux: {
      code: '# Debian/Ubuntu\nsudo apt install cloudorbit\n\n# Arch\nyay -S cloudorbit',
    },
  },

  quickStart: {
    headline: 'Quick Start',
    steps: [
      {
        n: 1,
        title: 'Launch CloudOrbit',
        body: 'Open the app. On first launch it will request permission to read your AWS config files.',
      },
      {
        n: 2,
        title: 'Connect your AWS profiles',
        body: "CloudOrbit auto-detects SSO profiles from ~/.aws/config. Your SSO groups and accounts appear in the sidebar automatically.",
      },
      {
        n: 3,
        title: 'Start a session',
        body: "Select an account, choose a role, and click 'Assume Role'. Temporary credentials are stored securely in your system Keychain — no terminal needed.",
      },
      {
        n: 4,
        title: 'EKS clusters',
        body: "If the active session has EKS clusters, CloudOrbit detects them automatically. Click 'Update kubeconfig' to configure kubectl.",
      },
    ],
  },

  awsSetup: {
    headline: 'AWS Setup',
    body: "CloudOrbit works with standard AWS SSO credential profiles. No extra IAM policies needed — if you can run 'aws sso login', CloudOrbit works.",
    configExample: `# ~/.aws/config example
[sso-session my-company]
sso_start_url = https://my-company.awsapps.com/start
sso_region = us-east-1

[profile my-company-dev]
sso_session = my-company
sso_account_id = 123456789012
sso_role_name = DeveloperAccess
region = us-east-1`,
    note: '💡 CloudOrbit supports SSO sessions (the modern AWS config format) and reads tokens from both the macOS Keychain and ~/.aws/sso/cache/ for full CLI compatibility.',
  },

  cloudflare: {
    headline: 'Working behind Cloudflare',
    problem: '❌ Leapp and some CLI tools fail here because they use Electron-based OAuth flows that Cloudflare intercepts — the certificate chain is broken before it starts.',
    solution: '✅ CloudOrbit is built with Tauri, which uses the native macOS WKWebView and system certificate store. It trusts the same CAs as Safari — including corporate Cloudflare certificates.',
    steps: [
      'Check that port 443 is open to *.amazonaws.com and *.awsapps.com',
      'Disable SSL inspection for *.amazonaws.com in your Cloudflare configuration if possible',
      "If the SSO browser flow still fails, try opening the verification URL manually from the app's login screen",
    ],
  },
}

// ─── DATAORBIT ────────────────────────────────────────────────────────────────

export const dataOrbitContent = {
  hero: {
    badge: '🗄️ DynamoDB · CouchDB · Time-series',
    eyebrow: 'DATAORBIT',
    headline: 'Query your databases\nthe way they deserve',
    subtitle: 'Stop fighting the AWS console. DataOrbit gives DynamoDB, CouchDB, and time-series databases the native query client they always needed — with live streaming, cross-joins, and full history.',
    ctaPrimary: 'Join waitlist',
    ctaSecondary: 'Learn more ↓',
    launchDate: 'Launching May 15, 2026',
  },
  features: [
    { icon: '🗄️', title: 'DynamoDB without the console pain', desc: 'Auto-complete filters, schema inference, PK/SK selector, paginated grid — built specifically for DynamoDB access patterns. Not a generic SQL tool bolted onto a NoSQL engine.', badge: null },
    { icon: '🔄', title: 'Live stream — watch your table breathe', desc: 'Open a stream tab and watch writes, updates, and deletes flow in real time. Zero polling, zero F5. Powered by DynamoDB Streams. Invaluable for debugging event-driven pipelines.', badge: 'Unique' },
    { icon: '🔗', title: 'Cross-join across tables', desc: 'LEFT JOIN, INNER JOIN, LEFT ANTI JOIN across two DynamoDB tables in a single query. Find missing records and audit inconsistencies — without exporting to S3 first.', badge: 'Unique' },
    { icon: '📜', title: 'Every query saved and searchable', desc: 'Your full query history is persisted locally. Re-run yesterday\'s debug session with one click. Export results to JSON or CSV. No more retyping complex filter expressions.', badge: null },
    { icon: '⚡', title: 'Native binary — starts in under a second', desc: 'Not an Electron wrapper. Not a browser tab. A native Rust binary compiled for your platform. No 200 MB RAM floor, no startup spinner, no Node.js lurking in the background.', badge: null },
    { icon: '🔒', title: 'Your data stays on your machine', desc: 'DataOrbit reads from the standard AWS credential chain. No cloud sync, no analytics, no account required. Your queries, your data, your machine — period.', badge: null },
  ],
  comparison: {
    headline: 'Built for DynamoDB. Not bolted on.',
    sub: 'Generic tools treat DynamoDB like a SQL table. DataOrbit was designed for it from day one.',
    rows: [
      { feature: 'DynamoDB-native query UX', dataorbit: '✅', console: '⚠️ Clunky', workbench: '⚠️ Buggy', tableplus: '❌' },
      { feature: 'Live stream (DynamoDB Streams)', dataorbit: '✅', console: '❌', workbench: '❌', tableplus: '❌' },
      { feature: 'Cross-join across tables', dataorbit: '✅', console: '❌', workbench: '❌', tableplus: '❌' },
      { feature: 'Query history + export', dataorbit: '✅', console: '❌', workbench: '✅', tableplus: '✅' },
      { feature: 'Native binary (not Electron/Java)', dataorbit: '✅', console: 'N/A', workbench: '❌ Java', tableplus: '✅' },
      { feature: 'Free', dataorbit: '✅', console: '✅', workbench: '✅', tableplus: '⚠️ Paid' },
    ],
  },
  screenshots: [
    { src: '/images/dataorbit-screen-home.png', label: 'Home — connection manager' },
    { src: '/images/dataorbit-screen-browse.png', label: 'Table browser — DynamoDB grid' },
    { src: '/images/dataorbit-screen-explore.png', label: 'Query explorer — filters & results' },
    { src: '/images/dataorbit-screen-stream.png', label: 'Live stream — real-time changes' },
  ],
}

// ─── WATTSORBIT ───────────────────────────────────────────────────────────────

export const wattsOrbitContent = {
  hero: {
    badge: '⚡ macOS · Menu bar · USB power',
    eyebrow: 'WATTSORBIT',
    headline: 'Know exactly where\nyour power is going',
    subtitle: 'Real-time watts in, watts out, and per-device USB draw — straight from your menu bar. Catch weak chargers, track solar budgets, and get notified before your battery hits 0.',
    ctaPrimary: 'Join waitlist',
    ctaSecondary: 'Learn more ↓',
    launchDate: 'Launching April 25, 2026',
  },
  features: [
    { icon: '⚡', title: 'Real watts in, real watts out', desc: 'Not a percentage. Not an estimate. Actual wattage from your charger and actual system draw — updated every 10 seconds straight from macOS power APIs. Numbers you can trust, not guess.', badge: null },
    { icon: '🔌', title: 'Which USB device is eating your battery?', desc: 'Every connected USB device has its own row: name, manufacturer, current in mA, voltage, and watts consumed. Finally know if that USB fan costs more power than it\'s worth.', badge: 'Unique' },
    { icon: '☀️', title: 'Built for solar & off-grid work', desc: 'Working off a solar pack, generator, or car inverter? Real-time watts in vs out tells you your exact energy budget. Know when to unplug non-essentials before you discharge into the unknown.', badge: null },
    { icon: '🔔', title: 'Alerts that save your battery', desc: 'Two smart OS notifications: (1) your charger is delivering less than your Mac consumes — net drain alert. (2) Battery below 30 min with USB devices still connected — unplug them now.', badge: null },
    { icon: '🔬', title: 'Expose bad cables before they waste your time', desc: 'Plug in a USB-C cable claiming 100W. WattsOrbit shows 18W. That\'s a bad cable. Test every adapter and hub you own until you know exactly what delivers what.', badge: 'Unique' },
    { icon: '🏠', title: 'Menu bar app — always there, never in the way', desc: 'A 380px popup, no Dock icon, no full-screen window. Click the icon, see your power status, close it. Or open the full dashboard for history, charts, and per-session breakdowns.', badge: null },
  ],
  comparison: {
    headline: 'No other Mac tool does this.',
    sub: 'Activity Monitor shows CPU. iStatMenus shows temperature. WattsOrbit shows power intelligence.',
    rows: [
      { feature: 'Real-time watts in/out', wattsorbit: '✅', activity: '❌', istat: '⚠️ Basic', batfi: '❌' },
      { feature: 'Per-device USB wattage', wattsorbit: '✅', activity: '❌', istat: '❌', batfi: '❌' },
      { feature: 'Smart notifications (weak charger / low battery)', wattsorbit: '✅', activity: '❌', istat: '❌', batfi: '❌' },
      { feature: 'Cable quality testing', wattsorbit: '✅', activity: '❌', istat: '❌', batfi: '❌' },
      { feature: 'Solar / off-grid awareness', wattsorbit: '✅', activity: '❌', istat: '❌', batfi: '❌' },
      { feature: 'Free', wattsorbit: '✅', activity: '✅', istat: '❌ $12/yr', batfi: '✅' },
    ],
  },
}

// ─── PROXYORBIT ───────────────────────────────────────────────────────────────

export const proxyOrbitContent = {
  hero: {
    badge: '🔍 HTTP · HTTPS · Proxy inspector',
    eyebrow: 'PROXYORBIT',
    headline: 'Every API call,\ncaptured and understood',
    subtitle: 'A native HTTP/HTTPS proxy inspector that runs on your Mac. Capture traffic from any app, filter by method and status, inspect requests in real time — and stop paying Charles Proxy every year.',
    ctaPrimary: 'Join waitlist',
    ctaSecondary: 'Learn more ↓',
    launchDate: 'Launching May 5, 2026',
  },
  features: [
    { icon: '🔍', title: 'Every request, captured the instant it happens', desc: 'Method, URL, host, status code, duration, request size, response size — all in a live-updating table. No configuration required beyond setting up the proxy.', badge: null },
    { icon: '🔒', title: 'HTTPS decrypted, fully inspected', desc: 'ProxyOrbit intercepts TLS traffic and decrypts it so you can inspect headers and bodies. Works with any HTTP client: browser, cURL, Node.js, Python, Go, Swift — anything.', badge: null },
    { icon: '⚙️', title: 'One-click system proxy — capture everything', desc: 'Set ProxyOrbit as your Mac\'s system proxy from inside the app. One toggle: all apps start routing through ProxyOrbit automatically. One toggle to stop. No System Preferences digging.', badge: null },
    { icon: '🎛️', title: 'Filter in real time across 10,000 entries', desc: 'Filter by HTTP method, status class (2xx/3xx/4xx/5xx/errors), protocol (HTTP vs HTTPS), or full-text URL search. Find that rogue API call in milliseconds, not minutes.', badge: null },
    { icon: '🧾', title: 'Process attribution — know who made the call', desc: 'Every log entry shows the originating process name. Debugging a Node.js service leaking requests? ProxyOrbit pins it to the process — not just the port or IP address.', badge: 'Unique' },
    { icon: '🦀', title: 'Rust proxy engine — not Java, not Electron', desc: 'ProxyOrbit\'s proxy server is written in Rust with Hyper and Tokio. Sub-millisecond routing overhead. Starts in under a second. Uses under 30 MB RAM at idle. No JVM warm-up, no Chromium.', badge: null },
  ],
  comparison: {
    headline: 'Why are you still paying for Charles?',
    sub: 'ProxyOrbit does everything you actually need — free, native, and built in Rust.',
    rows: [
      { feature: 'Free', proxyorbit: '✅', charles: '❌ $50', proxyman: '❌ $69/yr', mitm: '✅' },
      { feature: 'GUI', proxyorbit: '✅', charles: '✅', proxyman: '✅', mitm: '❌ CLI only' },
      { feature: 'Process attribution', proxyorbit: '✅', charles: '❌', proxyman: '⚠️', mitm: '❌' },
      { feature: 'Native binary (not Electron/JVM)', proxyorbit: '✅ Rust', charles: '❌ Java', proxyman: '❌ Electron', mitm: '⚠️ Python' },
      { feature: 'One-click system proxy', proxyorbit: '✅', charles: '⚠️ Manual', proxyman: '✅', mitm: '❌' },
      { feature: '< 30 MB RAM idle', proxyorbit: '✅', charles: '❌', proxyman: '❌ 200MB+', mitm: '✅' },
    ],
  },
}

// ─── BASTIONORBIT ─────────────────────────────────────────────────────────────

export const bastionOrbitContent = {
  hero: {
    badge: '🔐 SSH · Tunnels · Bastion',
    headline: 'SSH tunnels in one click\nnever left open',
    subtitle: 'Stop memorizing SSH flags. BastionOrbit manages your bastion hosts, opens tunnels with auto-expiry TTL, and probes connectivity — so you can connect your tools and get back to work.',
    ctaPrimary: 'Join waitlist',
    ctaSecondary: 'See features ↓',
    launchDate: 'Launching May 27, 2026',
  },
  features: [
    { icon: '🔐', title: 'One-click tunnels — no SSH flags', desc: 'Click 30m or 1h next to any target and the tunnel opens instantly. No terminal, no flags, no copy-pasting ports. BastionOrbit runs a real ssh -N -L process under the hood — not a reimplemented protocol.', badge: null },
    { icon: '⏱️', title: 'Auto-expiry TTL — ports close themselves', desc: 'Every tunnel has a timer. When it expires the tunnel closes automatically. No more "oh I left port 5432 forwarded all weekend." Extend with +15m or +30m without stopping. Built for the paranoid DevOps engineer.', badge: 'Unique' },
    { icon: '🔌', title: 'DataOrbit integration — DB in 2 clicks', desc: 'Open a BastionOrbit tunnel to localhost:5434, then connect DataOrbit to that port. Instant production database access — no VPN, no credential sharing, no IAM magic required. Two SlothLabs tools, one seamless workflow.', badge: null },
    { icon: '🔍', title: 'Connectivity probe — test before you tunnel', desc: 'BastionOrbit runs an SSH test command before opening a tunnel and probes the remote port through the bastion (nc -z equivalent). Know within seconds if your key is wrong, the bastion is down, or the target port is closed.', badge: null },
    { icon: '⚡', title: 'Native Rust binary — real ssh processes', desc: 'BastionOrbit is not an SSH reimplementation. It spawns the real system ssh binary for maximum compatibility with your key agent, ~/.ssh/config, and corporate SSH servers. The app itself is a native Rust binary — no Electron, no Node.js, no JVM.', badge: null },
    { icon: '🗂️', title: 'Multi-bastion management — all in one place', desc: 'Add prod-bastion, staging-bastion, and your personal VPS side by side. Each bastion stores its own list of targets. Offline bastions are flagged automatically so you never wonder why a tunnel failed to open.', badge: null },
  ],
  comparison: {
    headline: 'Stop copy-pasting SSH commands',
    sub: 'BastionOrbit replaces the sticky note of port-forwards you keep near your monitor.',
    rows: [
      { feature: 'One-click open', bastionorbit: '✅', manual: '❌', teleport: '✅', vscode: '⚠️' },
      { feature: 'Auto-expiry TTL', bastionorbit: '✅', manual: '❌', teleport: '❌', vscode: '❌' },
      { feature: 'Multi-bastion UI', bastionorbit: '✅', manual: '❌', teleport: '✅', vscode: '⚠️' },
      { feature: 'No server setup', bastionorbit: '✅', manual: '✅', teleport: '❌ Server req', vscode: '✅' },
      { feature: 'DataOrbit integration', bastionorbit: '✅', manual: '❌', teleport: '❌', vscode: '❌' },
      { feature: 'Free forever', bastionorbit: '✅', manual: '✅', teleport: '❌ Paid tiers', vscode: '✅' },
      { feature: 'Native binary (not Electron)', bastionorbit: '✅ Rust', manual: '✅', teleport: '❌ Electron', vscode: '❌ Electron' },
    ],
  },
}
