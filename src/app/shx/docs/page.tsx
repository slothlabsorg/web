import type { Metadata } from 'next'
import LibraryDocs, {
  type DocsSidebarGroup,
  H,
  H3,
  P,
  C as RawC,
  Li as RawLi,
  Callout as RawCallout,
  CodeBlock as RawCodeBlock,
  Table,
  LangTabs,
} from '@/components/LibraryDocs'
import { LIBRARIES } from '@/data/libraries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const lib = LIBRARIES['shx']
const ACCENT = lib.accent

export const metadata: Metadata = {
  title: `shx docs — injection-proof shell runner with typed parsers | SlothLabs`,
  description:
    'Full shx documentation: the command builder (cwd/env/timeout/stdin/allowExitCodes/nothrow), typed parsers (text/lines/json/parse), standalone parsers (columns/match/csv), the rich error type, and the safe-by-default interpolation rule — in Rust, TypeScript, and Kotlin.',
  keywords: lib.keywords,
  openGraph: {
    title: 'shx docs — type-safe shell runner reference',
    description: lib.tagline,
    url: `${SITE_URL}/${lib.slug}/docs`,
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/${lib.slug}/docs` },
}

const C = ({ children }: { children: React.ReactNode }) => <RawC accent={ACCENT}>{children}</RawC>
const Li = ({ children }: { children: React.ReactNode }) => <RawLi accent={ACCENT}>{children}</RawLi>
const Callout = (p: { type: 'info' | 'warn' | 'success'; children: React.ReactNode }) => (
  <RawCallout type={p.type} accent={ACCENT}>{p.children}</RawCallout>
)
const CodeBlock = (p: { code: string; lang?: string; filename?: string }) => (
  <RawCodeBlock code={p.code} lang={p.lang} filename={p.filename} accent={ACCENT} />
)

const SIDEBAR: DocsSidebarGroup[] = [
  {
    group: 'Getting started',
    items: [
      { slug: 'overview', label: 'Overview' },
      { slug: 'install', label: 'Install' },
      { slug: 'quick-start', label: 'Quick start' },
    ],
  },
  {
    group: 'Safety',
    items: [{ slug: 'safety', label: 'Safe-by-default interpolation' }],
  },
  {
    group: 'Running commands',
    items: [
      { slug: 'builder', label: 'The command builder' },
      { slug: 'parsers', label: 'Typed parsers' },
      { slug: 'standalone-parsers', label: 'Standalone parsers' },
      { slug: 'errors', label: 'Errors & nothrow' },
    ],
  },
  {
    group: 'Reference',
    items: [{ slug: 'links', label: 'Links' }],
  },
]

const sections: Record<string, React.ReactNode> = {
  overview: (
    <>
      <H>shx documentation</H>
      <P>
        shx is a type-safe shell runner with safe-by-default interpolation and typed output parsers. Shelling out is
        usually either unsafe (string concatenation — hello injection) or stringly-typed (you hand-parse every{' '}
        <C>stdout</C>). shx fixes both.
      </P>
      <H3>Two guarantees, three languages</H3>
      <ul className="space-y-1 mb-5">
        <Li>
          <strong className="text-white">Injection-proof by construction.</strong> Commands are built from an argument
          list and spawned <strong className="text-white">without a shell</strong>. Every interpolated or user-supplied
          value is exactly one argument — there is nothing to break out of because there is no shell.
        </Li>
        <Li>
          <strong className="text-white">Output is typed.</strong> <C>text</C>, <C>lines</C>, <C>json</C>, <C>csv</C>,
          and custom parsers are a first-class part of running a command, not an afterthought.
        </Li>
        <Li>Tiny dependency footprint in every language.</Li>
      </ul>
      <Callout type="info">
        The languages differ only where idioms differ: TypeScript uses tagged templates, Rust a builder plus a{' '}
        <C>cmd!</C> macro, Kotlin varargs / lists. The one-value-equals-one-argument safety boundary is identical
        everywhere.
      </Callout>
    </>
  ),

  install: (
    <>
      <H>Install</H>

      <H3>Rust — from git</H3>
      <P>
        The crate name <C>shx</C> is taken on crates.io, so install from git (this keeps the <C>use shx::...</C>{' '}
        import). JSON parsing via <C>.json()</C> lives behind the <C>serde</C> feature:
      </P>
      <CodeBlock lang="bash" code={`cargo add shx --git https://github.com/slothlabsorg/shx --features serde`} />
      <CodeBlock
        lang="toml"
        filename="Cargo.toml"
        code={`[dependencies]
shx = { git = "https://github.com/slothlabsorg/shx", features = ["serde"] }`}
      />

      <H3>TypeScript / Node — npm</H3>
      <CodeBlock lang="bash" code={`npm i @slothlabs/shx`} />
      <P>Zero runtime dependencies (just <C>node:child_process</C>). Requires Node ≥ 22.6.</P>

      <H3>Kotlin / JVM — JitPack</H3>
      <CodeBlock
        lang="kotlin"
        filename="build.gradle.kts"
        code={`repositories {
    mavenCentral()
    maven("https://jitpack.io")
}

dependencies {
    implementation("com.github.slothlabsorg:shx:v0.1.0")
}`}
      />
      <P>Requires JDK 17+. The only runtime dependency is kotlinx-coroutines.</P>
    </>
  ),

  'quick-start': (
    <>
      <H>Quick start</H>
      <P>Run a command, parse its output, and interpolate untrusted values safely — in any of the three languages.</P>
      <LangTabs
        accent={ACCENT}
        rust={
          <RawCodeBlock
            accent={ACCENT}
            lang="rust"
            code={`use shx::Cmd;

let branch = Cmd::new("git")
    .args(["rev-parse", "--abbrev-ref", "HEAD"])
    .text()?;

let pods: PodList = Cmd::new("kubectl")
    .args(["get", "pods", "-o", "json"])
    .json()?;            // requires the \`serde\` feature

// Safe even if \`id\` contains spaces, ';', or '$(...)':
Cmd::new("docker").arg("stop").arg(id).run()?;`}
          />
        }
        ts={
          <RawCodeBlock
            accent={ACCENT}
            lang="ts"
            code={`import { sh } from "@slothlabs/shx";

const branch = await sh\`git rev-parse --abbrev-ref HEAD\`.text();
const pods   = await sh\`kubectl get pods -o json\`.json<PodList>();
const files  = await sh\`git ls-files\`.lines();

// Safe even if \`id\` is "foo; rm -rf / #":
await sh\`docker stop \${id}\`;`}
          />
        }
        kotlin={
          <RawCodeBlock
            accent={ACCENT}
            lang="kotlin"
            code={`import com.slothlabs.shx.sh

val branch = sh("git", "rev-parse", "--abbrev-ref", "HEAD").text()
val files  = sh("git", "ls-files").lines()

// Safe even if \`id\` contains spaces, ';', or '$(...)':
sh("docker", "stop", id).run()
// Terminal methods are suspend functions — call them from a coroutine.`}
          />
        }
      />
    </>
  ),

  safety: (
    <>
      <H>Safe-by-default interpolation</H>
      <P>
        A command spawns a program directly with an argv array — there is no shell. Every interpolated value is exactly
        one argument, no matter what it contains (spaces, <C>;</C>, <C>$(...)</C>, quotes). There is no string a caller
        can pass that breaks out into another command, because there is no shell to break out of.
      </P>
      <LangTabs
        accent={ACCENT}
        rust={
          <RawCodeBlock
            accent={ACCENT}
            lang="rust"
            code={`use shx::{Cmd, cmd};

let name = "foo; rm -rf / #";
let c = Cmd::new("docker").arg("rm").arg(name);
assert_eq!(c.argv(), &["docker", "rm", "foo; rm -rf / #"]);

// Rust has no tagged templates, so the cmd! macro is the ergonomic equivalent:
let rev = "HEAD~3";
let c = cmd!("git", "log", rev);
assert_eq!(c.argv(), &["git", "log", "HEAD~3"]);`}
          />
        }
        ts={
          <RawCodeBlock
            accent={ACCENT}
            lang="ts"
            code={`const name = "foo; rm -rf / #";
await sh\`docker rm \${name}\`;
// argv === ["docker", "rm", "foo; rm -rf / #"]   ← one argument, no shell

// Static text is the ONLY thing tokenized. Arrays expand to multiple args;
// adjacent text joins a value (\`--name=\${x}\`); null/undefined and non-scalar
// values throw rather than silently stringify.`}
          />
        }
        kotlin={
          <RawCodeBlock
            accent={ACCENT}
            lang="kotlin"
            code={`val name = "foo; rm -rf / #"
sh("docker", "rm", name).run()
// argv == ["docker", "rm", "foo; rm -rf / #"]   ← one argument, no shell

// Kotlin takes program + args as a vararg (or a List): each value is one arg.
sh("grep", "x", listOf("a.kt", "b.kt"))   // -> grep x a.kt b.kt
sh("retry", 3, "--verbose", true)         // numbers/booleans stringify
sh("echo", null)                          // throws IllegalArgumentException`}
          />
        }
      />
    </>
  ),

  builder: (
    <>
      <H>The command builder</H>
      <P>
        Each command is a lazy, immutable builder: configure it with chainable methods, then run it with a parser
        method (or the raw run/output method). Every method returns a new command — the receiver is never mutated.
      </P>
      <Table
        accent={ACCENT}
        head={['Method', 'Effect']}
        rows={[
          ['cwd / current_dir', 'Working directory for the spawned process.'],
          ['env', 'Merge environment variables over the inherited env.'],
          ['timeout', 'Kill the child if it runs longer than the given duration; sets timedOut.'],
          ['stdin', "Write input to the process's standard input."],
          ['allowExitCodes', 'Treat extra exit codes (besides 0) as success.'],
          ['nothrow / noThrow / .output()', 'Resolve with the result instead of throwing on a bad exit.'],
        ]}
      />
      <LangTabs
        accent={ACCENT}
        rust={
          <RawCodeBlock
            accent={ACCENT}
            lang="rust"
            code={`use std::time::Duration;
use shx::Cmd;

let result = Cmd::new("cargo")
    .arg("test")
    .current_dir("/path/to/crate")
    .env("CI", "true")
    .timeout(Duration::from_secs(60))
    .run()?; // -> Output { stdout, stderr, exit_code, ok, duration_ms, timed_out, .. }

// .run() errors on a disallowed exit; .output() returns Ok(Output) to inspect.`}
          />
        }
        ts={
          <RawCodeBlock
            accent={ACCENT}
            lang="ts"
            code={`const result = await sh\`npm test\`
  .cwd(packageDir)
  .env({ CI: "true" })
  .timeout(60_000)
  .signal(controller.signal)
  .run(); // -> { stdout, stderr, exitCode, ok, durationMs, timedOut, ... }

// Share configuration across calls:
import { shWith } from "@slothlabs/shx";
const git = shWith({ cwd: repoDir, timeoutMs: 10_000 });
const status = await git\`status --porcelain\`.lines();`}
          />
        }
        kotlin={
          <RawCodeBlock
            accent={ACCENT}
            lang="kotlin"
            code={`val result = sh("npm", "test")
    .cwd(packageDir)
    .env("CI", "true")
    .timeout(60.seconds)
    .run() // -> RunResult(stdout, stderr, exitCode, ok, durationMs, timedOut, …)

// suspend fun run() reads stdout and stderr concurrently (no pipe deadlocks)
// and honours timeouts via withTimeoutOrNull.`}
          />
        }
      />
    </>
  ),

  parsers: (
    <>
      <H>Typed parsers</H>
      <P>Parsing is part of running. Pick the terminal method that returns the shape you want:</P>
      <Table
        accent={ACCENT}
        head={['Method', 'Returns', 'Notes']}
        rows={[
          ['text()', 'String / string', 'Trimmed stdout.'],
          ['lines()', 'list of strings', 'Non-empty lines.'],
          ['json<T>() / json::<T>() / json { }', 'T', 'Rust: serde feature. Kotlin: bring a deserializer.'],
          ['parse(fn)', 'T', 'Your own (stdout) -> T.'],
          ['run() / output()', 'Output / RunResult', 'Raw result; run() errors on a bad exit, output() never does.'],
        ]}
      />
      <Callout type="info">
        The Rust JSON parser is gated behind the <C>serde</C> feature. Kotlin core does not depend on a JSON library —
        pair <C>.json {'{ }'}</C> (an alias for <C>.parse {'{ }'}</C>) with kotlinx.serialization:
      </Callout>
      <RawCodeBlock
        accent={ACCENT}
        lang="kotlin"
        code={`import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable data class PodList(val items: List<Pod>)

val json = Json { ignoreUnknownKeys = true }
val pods = sh("kubectl", "get", "pods", "-o", "json")
    .json { json.decodeFromString<PodList>(it) }`}
      />
    </>
  ),

  'standalone-parsers': (
    <>
      <H>Standalone parsers</H>
      <P>
        The reusable parsers — <C>columns</C>, <C>csv</C>, and <C>match</C> — are exported with identical semantics in
        every language, and compose with <C>.parse(...)</C>.
      </P>
      <LangTabs
        accent={ACCENT}
        rust={
          <RawCodeBlock
            accent={ACCENT}
            lang="rust"
            code={`use shx::{Cmd, parsers};

let table = Cmd::new("kubectl").arg("get").arg("pods").parse(parsers::columns)?;
let rows  = Cmd::new("cat").arg("data.csv").parse(parsers::csv)?;
let ver   = Cmd::new("git").arg("--version")
    .parse(parsers::match_re(r"version (\\d+\\.\\d+\\.\\d+)"))?;`}
          />
        }
        ts={
          <RawCodeBlock
            accent={ACCENT}
            lang="ts"
            code={`import { sh, parsers } from "@slothlabs/shx";

const table = await sh\`kubectl get pods\`.parse(parsers.columns); // string[][]
const rows  = await sh\`cat data.csv\`.parse(parsers.csv);         // RFC-4180-ish
const ver   = await sh\`git --version\`.parse(
  parsers.match(/version (\\d+\\.\\d+\\.\\d+)/),
);`}
          />
        }
        kotlin={
          <RawCodeBlock
            accent={ACCENT}
            lang="kotlin"
            code={`import com.slothlabs.shx.parsers

val table = sh("kubectl", "get", "pods").parse(parsers::columns)   // List<List<String>>
val rows  = sh("cat", "data.csv").parse(parsers::csv)              // RFC-4180-ish
val ver   = sh("git", "--version")
    .parse(parsers.match(Regex("version (\\\\d+\\\\.\\\\d+\\\\.\\\\d+)")))`}
          />
        }
      />
      <Callout type="info">
        The CSV parser is RFC-4180-ish: quoted fields, escaped quotes (<C>&quot;&quot;</C>), embedded commas, and
        embedded newlines. <C>match</C> returns the first capture group (or the whole match when there is none), backed
        by a tiny built-in matcher — no <C>regex</C> dependency.
      </Callout>
    </>
  ),

  errors: (
    <>
      <H>Errors &amp; nothrow</H>
      <P>
        A non-zero exit (outside the allowed set), a spawn failure, or a timeout produces a rich error carrying every
        field you need to diagnose it without re-running:
      </P>
      <Table
        accent={ACCENT}
        head={['Field', 'Meaning']}
        rows={[
          ['exitCode', 'Process exit code (when it exited normally).'],
          ['signal', 'Terminating signal, if any (Rust / TS).'],
          ['stdout', 'Captured standard output.'],
          ['stderr', 'Captured standard error.'],
          ['timedOut', 'True when the process was killed by the timeout.'],
          ['durationMs', 'Wall-clock duration of the run.'],
        ]}
      />
      <P>
        The error type is <C>ShxError</C> in Rust and TypeScript, and <C>ShxException</C> in Kotlin (which also carries{' '}
        <C>command</C> and <C>argv</C>). Opt out of throwing with <C>nothrow</C> / <C>noThrow()</C> plus{' '}
        <C>allowExitCodes</C> when a non-zero exit is expected — hello, <C>grep</C>:
      </P>
      <LangTabs
        accent={ACCENT}
        rust={
          <RawCodeBlock
            accent={ACCENT}
            lang="rust"
            code={`use shx::Cmd;

// nothrow-style: .output() never errors on a non-zero exit
let out = Cmd::new("grep")
    .args(["needle", "haystack"])
    .allow_exit_codes([1]) // grep exits 1 on "no match"
    .output()?;
println!("matched: {}", out.ok);`}
          />
        }
        ts={
          <RawCodeBlock
            accent={ACCENT}
            lang="ts"
            code={`import { ShxError } from "@slothlabs/shx";

try {
  await sh\`kubectl apply -f bad.yaml\`;
} catch (err) {
  if (err instanceof ShxError) console.error(err.exitCode, err.stderr);
}

// Or opt out of throwing and inspect the result:
const { ok, exitCode } = await sh\`grep needle haystack\`
  .allowExitCodes(1).nothrow().run();`}
          />
        }
        kotlin={
          <RawCodeBlock
            accent={ACCENT}
            lang="kotlin"
            code={`import com.slothlabs.shx.ShxException

try {
    sh("kubectl", "apply", "-f", "bad.yaml").run()
} catch (e: ShxException) {
    System.err.println("\${e.exitCode}: \${e.stderr}")
}

// Or opt out of throwing and inspect the result:
val result = sh("grep", "needle", "haystack")
    .allowExitCodes(1)
    .noThrow()
    .run()`}
          />
        }
      />
    </>
  ),

  links: (
    <>
      <H>Links</H>
      <ul className="space-y-2 mb-5">
        <Li>
          <a href={`https://github.com/slothlabsorg/${lib.repo}`} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>
            View on GitHub →
          </a>
        </Li>
        <Li>
          <a href={`https://github.com/slothlabsorg/${lib.repo}/tree/main/rust`} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>
            Rust README (rust/) →
          </a>
        </Li>
        <Li>
          <a href={`https://github.com/slothlabsorg/${lib.repo}/tree/main/ts`} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>
            TypeScript README (ts/) →
          </a>
        </Li>
        <Li>
          <a href={`https://github.com/slothlabsorg/${lib.repo}/tree/main/kotlin`} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>
            Kotlin README (kotlin/) →
          </a>
        </Li>
      </ul>
    </>
  ),
}

export default function ShxDocsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'shx documentation',
    description: metadata.description,
    url: `${SITE_URL}/${lib.slug}/docs`,
    author: { '@type': 'Organization', name: 'SlothLabs', url: SITE_URL },
    about: {
      '@type': 'SoftwareSourceCode',
      name: lib.name,
      codeRepository: `https://github.com/slothlabsorg/${lib.repo}`,
      programmingLanguage: ['Rust', 'TypeScript', 'Kotlin'],
      license: 'https://opensource.org/licenses/MIT',
    },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LibraryDocs
        slug={lib.slug}
        name={lib.name}
        icon={lib.icon}
        accent={lib.accent}
        repo={lib.repo}
        tagline={lib.tagline}
        sidebar={SIDEBAR}
        sections={sections}
      />
    </>
  )
}
