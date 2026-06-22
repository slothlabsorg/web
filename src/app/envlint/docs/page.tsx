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
const lib = LIBRARIES['envlint']
const ACCENT = lib.accent

export const metadata: Metadata = {
  title: `envlint docs — envlint.toml schema, CLI & library reference | SlothLabs`,
  description:
    'Full envlint documentation: the portable envlint.toml schema (string/int/float/bool/url/port/enum/duration), the envlint check / init CLI with exit codes, and the Rust, TypeScript, and Kotlin library APIs.',
  keywords: lib.keywords,
  openGraph: {
    title: 'envlint docs — schema, CLI & library reference',
    description: lib.tagline,
    url: `${SITE_URL}/${lib.slug}/docs`,
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/${lib.slug}/docs` },
}

// Bind the accent into the shared primitives so each call site stays terse.
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
    group: 'Schema',
    items: [
      { slug: 'schema-format', label: 'envlint.toml format' },
      { slug: 'types', label: 'Variable types' },
      { slug: 'var-keys', label: 'Per-variable keys' },
    ],
  },
  {
    group: 'CLI',
    items: [
      { slug: 'cli', label: 'envlint check / init' },
      { slug: 'ci', label: 'CI / GitHub Actions' },
    ],
  },
  {
    group: 'Library',
    items: [{ slug: 'library', label: 'Embedding (3 langs)' }],
  },
  {
    group: 'Reference',
    items: [{ slug: 'links', label: 'Links' }],
  },
]

const sections: Record<string, React.ReactNode> = {
  overview: (
    <>
      <H>envlint documentation</H>
      <P>
        envlint is schema-driven validation for environment variables and <C>.env</C> files. You describe what your
        service expects once in an <C>envlint.toml</C>, then validate a <C>.env</C> file or the live process
        environment against it — in CI, in a container entrypoint, or at process boot via the library.
      </P>
      <P>
        Most production incidents that trace back to &ldquo;config&rdquo; are not subtle: a required variable was never
        set, a <C>PORT</C> held a hostname, a <C>LOG_LEVEL</C> of <C>verbose</C> silently fell back to a default, a
        timeout was <C>30</C> — seconds or milliseconds? These are caught trivially if something declares what the
        service expects.
      </P>
      <H3>When to use it</H3>
      <ul className="space-y-1 mb-5">
        <Li>
          Unlike <C>dotenv</C>, <C>envalid</C>, or <C>zod</C> — which make a running program read its config — envlint is
          a <strong className="text-white">gate that runs before your program (or your deploy) does</strong>, with no
          code in the target service.
        </Li>
        <Li>No language lock-in: the same <C>envlint.toml</C> validates a Rust binary, a Node container, and a JVM service alike.</Li>
        <Li>It is a CI/CD check first, a library second.</Li>
      </ul>
      <Callout type="info">
        All three implementations (Rust, TypeScript, Kotlin) parse the <strong className="text-white">same</strong>{' '}
        <C>envlint.toml</C>, apply identical validation semantics, mask secrets as <C>******</C>, and share the same
        CLI exit codes: <C>0</C> clean · <C>1</C> validation errors · <C>2</C> usage/IO error.
      </Callout>
    </>
  ),

  install: (
    <>
      <H>Install</H>
      <P>Same schema, three ecosystems. Each ships a library plus a CLI binary.</P>

      <H3>Rust — straight from git</H3>
      <CodeBlock
        lang="bash"
        code={`# Library
cargo add envlint --git https://github.com/slothlabsorg/envlint

# CLI binary
cargo install --git https://github.com/slothlabsorg/envlint envlint`}
      />
      <P>
        The repository root is a Cargo virtual workspace, so the git dependency resolves the <C>rust/</C> member crate
        automatically. A crates.io release is wired behind a <C>rust-v*</C> tag.
      </P>

      <H3>TypeScript — npm</H3>
      <CodeBlock lang="bash" code={`npm install @slothlabs/envlint`} />
      <P>
        The package ships a <C>bin</C>, so <C>npx envlint</C> (or a <C>package.json</C> script) works without a global
        install.
      </P>

      <H3>Kotlin / JVM — JitPack</H3>
      <CodeBlock
        lang="kotlin"
        filename="build.gradle.kts"
        code={`repositories {
    mavenCentral()
    maven("https://jitpack.io")
}

dependencies {
    implementation("com.github.slothlabsorg:envlint:v0.1.0")
}`}
      />
      <P>JitPack builds the Kotlin module on first request for a tagged version. Requires the Gradle <C>application</C> plugin to build a runnable CLI distribution.</P>
    </>
  ),

  'quick-start': (
    <>
      <H>Quick start</H>
      <P>
        Scaffold a schema, then validate. <C>envlint init</C> writes a sample <C>envlint.toml</C> you can edit:
      </P>
      <CodeBlock
        lang="bash"
        code={`envlint init                      # scaffold a sample envlint.toml
envlint check --env-file .env     # validate a .env file
envlint check --env               # validate the live process environment`}
      />
      <P>A failing run prints each error and exits non-zero — ready to gate a pipeline:</P>
      <CodeBlock
        lang="console"
        code={`$ envlint check --env-file .env
envlint: validating .env
error: DATABASE_URL: required variable is not set
error: LOG_LEVEL: must be one of ["debug", "info", "warn", "error"], got "verbose"
2 error(s), 0 warning(s)
$ echo $?
1`}
      />
      <Callout type="info">
        If neither <C>--env-file</C> nor <C>--env</C> is given, envlint validates <C>./.env</C> when present, otherwise
        the live environment.
      </Callout>
    </>
  ),

  'schema-format': (
    <>
      <H>envlint.toml format</H>
      <P>
        Each <C>[vars.NAME]</C> table describes one variable. A top-level <C>strict = true</C> turns undeclared
        variables (present in the environment but not in the schema) into errors.
      </P>
      <CodeBlock
        lang="toml"
        filename="envlint.toml"
        code={`# Treat variables present in the environment but not declared below as errors.
strict = false

[vars.PORT]
type = "port"
default = "8080"
description = "HTTP listen port."

[vars.LOG_LEVEL]
type = "enum"
values = ["debug", "info", "warn", "error"]
default = "info"

[vars.DATABASE_URL]
type = "url"
required = true
description = "Primary database connection string."

[vars.REQUEST_TIMEOUT]
type = "duration"
default = "30s"

[vars.MAX_WORKERS]
type = "int"
min = 1
max = 64
default = "8"

[vars.ENABLE_TRACING]
type = "bool"
default = "false"

[vars.API_KEY]
type = "string"
required = true
secret = true
pattern = "^sk-[A-Za-z0-9]{16,}$"
description = "Secret; masked in all output."`}
      />
      <Callout type="success">
        This exact file works unchanged across the Rust, TypeScript, and Kotlin implementations.
      </Callout>
    </>
  ),

  types: (
    <>
      <H>Variable types</H>
      <P>The <C>type</C> key on each variable selects how the raw text is parsed and validated.</P>
      <Table
        accent={ACCENT}
        head={['type', 'Accepts']}
        rows={[
          ['string', 'Any value (the default if type is omitted).'],
          ['int', 'Signed integer; honours min / max.'],
          ['float', 'Floating point; honours min / max.'],
          ['bool', 'true/false, 1/0, yes/no, on/off (case-insensitive).'],
          ['url', 'scheme://authority[...]'],
          ['port', 'Integer in 1..=65535.'],
          ['enum', 'One of values = [...].'],
          ['duration', '500ms, 30s, 5m, 2h, 1d; a bare number = seconds.'],
        ]}
      />
      <Callout type="info">
        Durations resolve to a millisecond value and render as <C>&lt;n&gt;ms</C> in reports (so <C>30s</C> becomes{' '}
        <C>30000ms</C>). <C>min</C> / <C>max</C> on a duration compare against the value in <strong className="text-white">seconds</strong>.
      </Callout>
    </>
  ),

  'var-keys': (
    <>
      <H>Per-variable keys</H>
      <P>Any of these keys may appear inside a <C>[vars.NAME]</C> table:</P>
      <Table
        accent={ACCENT}
        head={['Key', 'Effect']}
        rows={[
          ['required', 'Marks the variable as mandatory; a missing value is an error.'],
          ['default', 'Value used when the variable is absent (the resolved value is the default).'],
          ['pattern', 'Regex matched against the raw text of the value.'],
          ['values', 'Allowed values for an enum type.'],
          ['min / max', 'Numeric and duration bounds (durations compared in seconds).'],
          ['secret', 'Masks the value as ****** in every output — text and JSON.'],
          ['description', 'Human-readable note carried into reports.'],
        ]}
      />
      <P>
        At the top level, <C>strict = true</C> (or the <C>--strict</C> flag) treats any environment variable not
        declared in the schema as an error.
      </P>
    </>
  ),

  cli: (
    <>
      <H>CLI — envlint check / init</H>
      <CodeBlock
        lang="text"
        code={`envlint check [OPTIONS]
envlint init [--force]          # scaffold a sample envlint.toml

OPTIONS (check):
  -s, --schema <FILE>    Schema file (default: envlint.toml)
  -f, --env-file <FILE>  Validate this .env file
      --env              Validate the live process environment
      --format <FMT>     text | json   (default: text)
      --strict           Treat undeclared variables as errors`}
      />
      <H3>Exit codes</H3>
      <Table
        accent={ACCENT}
        head={['Code', 'Meaning']}
        rows={[
          ['0', 'Clean — every variable validated.'],
          ['1', 'Validation errors — one or more variables failed.'],
          ['2', 'Usage / IO error — bad flags, unreadable schema or env file.'],
        ]}
      />
      <Callout type="info">
        If neither <C>--env-file</C> nor <C>--env</C> is given, envlint validates <C>./.env</C> when present, otherwise
        the live environment.
      </Callout>
    </>
  ),

  ci: (
    <>
      <H>CI / GitHub Actions</H>
      <P>envlint is a CI/CD gate first. Drop it into a workflow in two lines — the exit code fails the job on bad config.</P>
      <H3>Rust</H3>
      <CodeBlock
        lang="yaml"
        code={`- run: cargo install envlint
- run: envlint check --env-file .env.ci --strict --format json`}
      />
      <H3>TypeScript</H3>
      <CodeBlock lang="yaml" code={`- run: npx -y @slothlabs/envlint check --env-file .env.ci --strict --format json`} />
      <H3>Kotlin / JVM</H3>
      <CodeBlock
        lang="yaml"
        code={`- run: ./gradlew installDist
- run: ./build/install/envlint/bin/envlint check --env-file .env.ci --strict --format json`}
      />
    </>
  ),

  library: (
    <>
      <H>Embedding the library</H>
      <P>
        Beyond the CLI, each port exposes a <C>Schema</C> you can validate at process boot. Load it from TOML, get a{' '}
        <C>Report</C> back, and read <C>resolved</C> — a typed, default-filled map you hand straight to the rest of your
        config layer. <C>secret</C> values are masked as <C>******</C> in <C>toText()</C> / <C>toJson()</C>.
      </P>
      <LangTabs
        accent={ACCENT}
        rust={
          <RawCodeBlock
            accent={ACCENT}
            lang="rust"
            code={`use envlint::{Schema, env_from_dotenv};

let schema = Schema::from_toml_str(
    std::fs::read_to_string("envlint.toml")?.as_str(),
)?;
let env = env_from_dotenv(&std::fs::read_to_string(".env")?)?;
let report = schema.validate(&env);

if report.has_errors() {
    eprint!("{}", report.to_text());
    std::process::exit(1);
}
// report.resolved: BTreeMap<String, Value> of typed, default-filled values`}
          />
        }
        ts={
          <>
            <RawCodeBlock
              accent={ACCENT}
              lang="ts"
              code={`import { readFileSync } from "node:fs";
import { Schema, envFromDotenv } from "@slothlabs/envlint";

const schema = Schema.fromTomlStr(readFileSync("envlint.toml", "utf8"));
const env = envFromDotenv(readFileSync(".env", "utf8"));
const report = schema.validate(env);

if (report.hasErrors()) {
  process.stderr.write(report.toText());
  process.exit(1);
}
// report.resolved: Map<string, Value>; report.toJSON() masks secrets`}
            />
            <P>You can also define the schema programmatically — fully typed, no TOML required:</P>
            <RawCodeBlock
              accent={ACCENT}
              lang="ts"
              code={`const schema = Schema.fromDef({
  vars: {
    PORT: { type: "port", default: "8080" },
    DATABASE_URL: { type: "url", required: true },
    API_KEY: { type: "string", required: true, secret: true },
  },
  strict: true,
});

const report = schema.validate(process.env as Record<string, string>);`}
            />
          </>
        }
        kotlin={
          <RawCodeBlock
            accent={ACCENT}
            lang="kotlin"
            code={`import com.slothlabs.envlint.Schema
import com.slothlabs.envlint.envFromDotenv
import java.io.File
import kotlin.system.exitProcess

val schema = Schema.fromTomlString(File("envlint.toml").readText())
val env = envFromDotenv(File(".env").readText())
val report = schema.validate(env)

if (report.hasErrors) {
    System.err.print(report.toText())
    exitProcess(1)
}
// report.resolved: Map<String, Value> (sorted); report.toJson() masks secrets`}
          />
        }
      />
      <Callout type="info">
        In Kotlin, <C>Value</C> is a sealed class (<C>Value.Int</C>, <C>Value.Port</C>, <C>Value.Dur</C> — a{' '}
        <C>kotlin.time.Duration</C> — and so on). The <C>.env</C> parser is also exposed as <C>parseEnv(contents)</C>,
        returning line-numbered <C>EnvEntry</C> records and throwing <C>EnvParseException</C> on malformed input.
      </Callout>
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

export default function EnvlintDocsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'envlint documentation',
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
