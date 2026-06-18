// Central registry for the SlothLabs developer libraries — the polyglot
// open-source libs (Rust + TypeScript + Kotlin) that ship from their own
// mono-repos under github.com/slothlabsorg. Distinct from APPS (desktop/plugin
// products) in src/data/apps.ts: libraries install via package managers, not
// downloads, so they have their own data shape, detail component
// (LibraryShowcase), and section on /tools.

export interface LibraryFeature {
  icon: string
  title: string
  desc: string
}

export interface LibraryInstall {
  /** Rust install line(s) — cargo add / cargo install from git. */
  rust: string
  /** npm install line. */
  npm: string
  /** Gradle (Kotlin DSL) JitPack coordinate — keep the leading `v` tag. */
  jitpack: string
}

export interface LibraryCode {
  /** Filename / label shown in the terminal-style card title bar. */
  label: string
  /** Language tag (informational, e.g. "ts"). */
  lang: string
  /** The representative snippet. */
  code: string
}

export interface LibraryMeta {
  /** URL slug used on the site (/<slug>). */
  slug: string
  /** Display name. */
  name: string
  /** GitHub repo name under github.com/slothlabsorg/<repo>. */
  repo: string
  /** Emoji icon (no image asset needed). */
  icon: string
  /** Brand accent hex — distinct from every product accent in apps.ts. */
  accent: string
  /** One-line tagline (hero subtitle / card lead). */
  tagline: string
  /** Slightly longer description used for metadata + card body. */
  description: string
  /** "What it is / why it exists" — one or two paragraphs. */
  whatItIs: string[]
  /** Headline rendered in the hero (supports a single line). */
  headline: string
  /** Hero badge text. */
  badge: string
  /** Feature cards (3 recommended). */
  features: LibraryFeature[]
  /** Per-language install commands. */
  install: LibraryInstall
  /** Representative code example. */
  example: LibraryCode
  /** Tags — languages + domain. */
  tags: string[]
  /** SEO keywords for the detail page metadata. */
  keywords: string[]
}

export const LIBRARIES: Record<string, LibraryMeta> = {
  envlint: {
    slug: 'envlint',
    name: 'envlint',
    repo: 'envlint',
    icon: '🧪',
    accent: '#2DD4BF',
    tagline:
      'Schema-driven validation for environment variables and .env files — one portable schema, three native implementations.',
    description:
      'envlint validates your environment against a single portable envlint.toml — in CI, in a container entrypoint, or at process boot. Catch missing or malformed config before it ships. CLI + library, native in Rust, TypeScript, and Kotlin.',
    headline: 'Catch bad config before it ships',
    badge: 'Rust · TypeScript · Kotlin',
    whatItIs: [
      'Most production incidents that trace back to "config" are not subtle: a required variable was never set, a PORT held a hostname, a LOG_LEVEL of "verbose" silently fell back to a default, a timeout was 30 — seconds or milliseconds? These are caught trivially if something declares what the service expects.',
      'envlint is that something. You describe your environment once in envlint.toml, then validate a .env file or the live process environment. Unlike dotenv, envalid, or zod — which make a running program read its config — envlint is a gate that runs before your program (or your deploy) does, with no code in the target service and no language lock-in. The same envlint.toml validates a Rust binary, a Node container, and a JVM service alike. It is a CI/CD check first, a library second.',
    ],
    features: [
      {
        icon: '📐',
        title: 'One portable schema',
        desc: 'A single envlint.toml drives identical validation semantics across Rust, TypeScript, and Kotlin. Types: string, int, float, bool, url, port, enum, duration — plus required, default, pattern, min/max, and secret masking.',
      },
      {
        icon: '🚦',
        title: 'A gate, not a runtime read',
        desc: 'Runs in CI, a container entrypoint, or at boot — before your program does. Exit codes are pipeline-ready: 0 clean, 1 validation errors, 2 usage/IO. Drop it into GitHub Actions in two lines.',
      },
      {
        icon: '🔒',
        title: 'Secrets stay masked',
        desc: 'Mark a variable secret and it renders as ****** in every output — text and JSON, CLI and library. Validated values come back typed and default-filled, ready to hand to the rest of your config layer.',
      },
    ],
    install: {
      rust: 'cargo add envlint --git https://github.com/slothlabsorg/envlint\n# CLI:\ncargo install --git https://github.com/slothlabsorg/envlint envlint',
      npm: 'npm i @slothlabs/envlint',
      jitpack:
        'repositories {\n    maven("https://jitpack.io")\n}\n\ndependencies {\n    implementation("com.github.slothlabsorg:envlint:v0.1.0")\n}',
    },
    example: {
      label: 'envlint.toml + envlint check',
      lang: 'toml',
      code: `# envlint.toml — the SAME file works across all three implementations
[vars.DATABASE_URL]
type = "url"
required = true

[vars.LOG_LEVEL]
type = "enum"
values = ["debug", "info", "warn", "error"]
default = "info"

$ envlint check --env-file .env
envlint: validating .env
error: DATABASE_URL: required variable is not set
error: LOG_LEVEL: must be one of ["debug","info","warn","error"], got "verbose"
2 error(s), 0 warning(s)   →   exit 1`,
    },
    tags: ['Rust', 'TypeScript', 'Kotlin', 'CLI', 'CI/CD', 'Config'],
    keywords: [
      'envlint',
      'environment variable validation',
      '.env validation',
      'dotenv linter',
      'config validation CLI',
      'envlint.toml',
      'CI environment check',
      'Rust env validation',
      'TypeScript env validation',
      'Kotlin env validation',
      'SlothLabs',
    ],
  },
  shx: {
    slug: 'shx',
    name: 'shx',
    repo: 'shx',
    icon: '🐚',
    accent: '#FB923C',
    tagline:
      'A type-safe, injection-proof shell runner with typed output parsers — three native implementations.',
    description:
      'shx runs shell commands without a shell: every interpolated value is exactly one argument, so there is nothing to break out of. Parsing (text, json, lines, csv) is a first-class part of running. Native in Rust, TypeScript, and Kotlin.',
    headline: 'Shell out without the footguns',
    badge: 'Rust · TypeScript · Kotlin',
    whatItIs: [
      'Shelling out is either unsafe (string concatenation — hello injection) or stringly-typed (you hand-parse every stdout). shx fixes both. Commands are built from an argument list and spawned without a shell, so every interpolated or user-supplied value is exactly one argument. There is no string a caller can pass that breaks out into another command, because there is no shell to break out of.',
      'Output is typed, too: text, lines, json, csv, and custom parsers are part of running a command, not an afterthought. A rich error carries exitCode, stdout, stderr, timedOut, and durationMs, so you never re-run just to see what went wrong. The dependency footprint stays tiny in every language — TS uses tagged templates, Rust a builder plus a cmd! macro, Kotlin varargs — but the one-value-equals-one-argument safety boundary is identical everywhere.',
    ],
    features: [
      {
        icon: '🛡️',
        title: 'Injection-proof by construction',
        desc: 'Commands spawn directly with an argv array — no shell. sh`docker stop ${id}` is safe even if id is "foo; rm -rf / #": it is passed as one literal argument. There is nothing to escape because there is no shell to escape from.',
      },
      {
        icon: '🧩',
        title: 'Typed output, first-class',
        desc: 'text(), lines(), json<T>(), csv, and parse(fn) make parsing part of running. Get a typed PodList from kubectl get pods -o json, or rows from a CSV with the same call that ran the command.',
      },
      {
        icon: '🔎',
        title: 'Errors you can read',
        desc: 'A non-zero exit, spawn failure, or timeout throws a rich error carrying exitCode, signal, stdout, stderr, timedOut, and durationMs. Opt out with nothrow/allowExitCodes when a non-zero exit is expected (hello, grep).',
      },
    ],
    install: {
      rust: 'cargo add shx --git https://github.com/slothlabsorg/shx --features serde',
      npm: 'npm i @slothlabs/shx',
      jitpack:
        'repositories {\n    maven("https://jitpack.io")\n}\n\ndependencies {\n    implementation("com.github.slothlabsorg:shx:v0.1.0")\n}',
    },
    example: {
      label: 'shell.ts',
      lang: 'ts',
      code: `import { sh } from "@slothlabs/shx";

const branch = await sh\`git rev-parse --abbrev-ref HEAD\`.text();
const pods   = await sh\`kubectl get pods -o json\`.json<PodList>();

// Safe even if \`id\` is "foo; rm -rf / #":
await sh\`docker stop \${id}\`;
// argv === ["docker", "stop", "foo; rm -rf / #"]  ← one argument, no shell`,
    },
    tags: ['Rust', 'TypeScript', 'Kotlin', 'Shell', 'Security', 'CLI'],
    keywords: [
      'shx',
      'safe shell runner',
      'shell injection prevention',
      'type-safe shell',
      'typed shell output',
      'execa alternative',
      'Rust shell command',
      'TypeScript shell',
      'Kotlin ProcessBuilder',
      'command injection',
      'SlothLabs',
    ],
  },
  'health-dsl': {
    slug: 'health-dsl',
    name: 'health-dsl',
    repo: 'health-dsl',
    icon: '🩺',
    accent: '#FB7185',
    tagline:
      'A tiny DSL for service readiness/liveness checks — run concurrently, aggregated correctly, serialized anywhere.',
    description:
      'health-dsl turns your ad-hoc /health endpoint into a declaration: declare checks, run them concurrently with per-check timeouts, aggregate a correct overall status (critical-down vs degraded), and serialize to JSON. Native in Rust, TypeScript, and Kotlin.',
    headline: 'Health checks, declared not improvised',
    badge: 'Rust · TypeScript · Kotlin',
    whatItIs: [
      'Most services grow an ad-hoc /health endpoint: a pile of try/catch blocks, inconsistent timeouts, one slow dependency that hangs the whole probe, and no clear distinction between "we are down" and "we are degraded but still serving." health-dsl makes that a declaration.',
      'You declare checks; they run concurrently with per-check timeouts, so report.durationMs is roughly your slowest check, not the sum. Aggregation is correct by design: a critical dependency that is DOWN makes the system DOWN, while a non-critical failure (or any degraded check) caps the system at DEGRADED but still healthy — you stop conflating "page someone" with "we are fine." No check can break the report: exceptions, panics, and timeouts fold into a DOWN outcome. Then serialize anywhere with a dependency-free JSON renderer or a map/struct form for Jackson, kotlinx.serialization, serde, or a Spring Actuator HealthIndicator.',
    ],
    features: [
      {
        icon: '⚖️',
        title: 'Correct aggregation',
        desc: 'Status is ordered UP < DEGRADED < DOWN — aggregation is "take the worst," with a non-critical DOWN capped at DEGRADED. A critical dependency going down pages you; a degraded cache does not.',
      },
      {
        icon: '⚡',
        title: 'Concurrent, with timeouts',
        desc: 'Checks run concurrently (tokio / Promise.all / coroutines) with per-check timeouts. A hung dependency becomes a DOWN outcome after its timeout instead of hanging the whole probe. durationMs reflects your slowest check.',
      },
      {
        icon: '📤',
        title: 'Serialize anywhere',
        desc: 'A dependency-free JSON renderer plus a map/struct form for Jackson, kotlinx.serialization, serde, or a Spring Actuator HealthIndicator. One stable JSON shape across all three languages.',
      },
    ],
    install: {
      rust: 'cargo add health-dsl --git https://github.com/slothlabsorg/health-dsl',
      npm: 'npm i @slothlabs/health-dsl',
      jitpack:
        'repositories {\n    maven("https://jitpack.io")\n}\n\ndependencies {\n    implementation("com.github.slothlabsorg:health-dsl:v0.1.0")\n}',
    },
    example: {
      label: 'Health.kt',
      lang: 'kotlin',
      code: `val health = healthChecks {
    check("database", critical = true) {
        if (db.ping()) up() else down("primary unreachable")
    }
    check("cache") { up("hitRate" to "0.93") }
    check("disk", timeout = 2.seconds) {
        val free = freePercent()
        when {
            free < 5  -> down("disk almost full: $free%")
            free < 15 -> degraded("disk low: $free%")
            else      -> up("freePercent" to free.toString())
        }
    }
}

val report = health.run()   // all checks run concurrently
report.status               // UP | DEGRADED | DOWN
report.toJson()`,
    },
    tags: ['Rust', 'TypeScript', 'Kotlin', 'Health Checks', 'Observability', 'Readiness'],
    keywords: [
      'health-dsl',
      'health check DSL',
      'readiness liveness probe',
      'service health endpoint',
      'Spring Actuator HealthIndicator',
      'kubernetes readiness probe',
      'Rust health check',
      'TypeScript health check',
      'Kotlin health check',
      'degraded vs down status',
      'SlothLabs',
    ],
  },
}

export const LIBRARY_LIST: LibraryMeta[] = Object.values(LIBRARIES)
