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
    items: [
      {
        name: 'CloudOrbit',
        slug: '/cloudorbit',
        logo: '/images/cloudorbit-logo.png',
        by: '· SlothLabs ·',
        desc: 'AWS session manager with a UI. Switch accounts, manage sessions, detect EKS clusters — no terminal needed. AWS only for now, GCP and Azure support coming soon.',
        tags: ['AWS', 'EKS', 'kubeconfig'],
        cta: 'Learn more →',
        live: true,
        accent: '#00D4FF',
      },
      {
        name: 'DataOrbit',
        slug: null,
        logo: null,
        by: '· SlothLabs ·',
        desc: 'The answer to the DynamoDB, CouchDB, and time-series headache. Query easily, save and export built queries, and stream data in real time for debugging — no more fear of using those DBs.',
        tags: ['DynamoDB', 'CouchDB', 'Time-series'],
        cta: null,
        live: false,
        accent: '#4DA6FF',
        comingSoonDate: 'May 1, 2026',
      },
      {
        name: 'DevPanel',
        slug: null,
        logo: null,
        by: '· SlothLabs ·',
        desc: 'Server management UI for DevOps teams.',
        tags: [],
        cta: null,
        live: false,
        accent: '#4DA6FF',
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
    products: ['CloudOrbit', 'DataOrbit', 'DevPanel'],
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
