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
const lib = LIBRARIES['health-dsl']
const ACCENT = lib.accent

export const metadata: Metadata = {
  title: `health-dsl docs — declarative service health checks | SlothLabs`,
  description:
    'Full health-dsl documentation: the healthChecks DSL with critical flags and per-check timeouts, the UP/DEGRADED/DOWN status semantics, concurrent execution, the report (status/isHealthy/durationMs/toJson), and the Spring Actuator HealthIndicator bridge — in Rust, TypeScript, and Kotlin.',
  keywords: lib.keywords,
  openGraph: {
    title: 'health-dsl docs — declarative health checks reference',
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
    group: 'The DSL',
    items: [
      { slug: 'dsl', label: 'Declaring checks' },
      { slug: 'status', label: 'Status semantics' },
      { slug: 'concurrency', label: 'Concurrency & timeouts' },
    ],
  },
  {
    group: 'Output',
    items: [
      { slug: 'report', label: 'The report' },
      { slug: 'actuator', label: 'Spring Actuator bridge' },
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
      <H>health-dsl documentation</H>
      <P>
        health-dsl is a tiny DSL for declaring service readiness/liveness checks — they run concurrently, aggregate to
        a correct overall status, and serialize anywhere.
      </P>
      <P>
        Most services grow an ad-hoc <C>/health</C> endpoint: a pile of try/catch blocks, inconsistent timeouts, one
        slow dependency that hangs the whole probe, and no clear distinction between &ldquo;we are down&rdquo; and
        &ldquo;we are degraded but still serving.&rdquo; health-dsl makes that a declaration.
      </P>
      <H3>What it gives you</H3>
      <ul className="space-y-1 mb-5">
        <Li>
          <strong className="text-white">Correct aggregation.</strong> A <C>critical</C> dependency that is{' '}
          <C>DOWN</C> makes the system <C>DOWN</C>; a non-critical failure (or any <C>degraded</C> check) caps the
          system at <C>DEGRADED</C> but still healthy. You stop conflating &ldquo;page someone&rdquo; with
          &ldquo;we are fine.&rdquo;
        </Li>
        <Li>
          <strong className="text-white">Concurrency + per-check timeouts.</strong> <C>report.durationMs</C> is roughly
          your slowest check, not the sum. A hung dependency becomes a <C>DOWN</C> outcome after its timeout.
        </Li>
        <Li>
          <strong className="text-white">No check can break the report.</strong> Exceptions, panics, and timeouts fold
          into a <C>DOWN</C> outcome (cancellation is still propagated).
        </Li>
        <Li>
          <strong className="text-white">Serialize anywhere.</strong> A dependency-free JSON renderer plus a map/struct
          form for Jackson, kotlinx.serialization, serde, or a Spring Actuator <C>HealthIndicator</C>.
        </Li>
      </ul>
    </>
  ),

  install: (
    <>
      <H>Install</H>

      <H3>Rust — tokio-based</H3>
      <CodeBlock
        lang="bash"
        code={`cargo add health-dsl --git https://github.com/slothlabsorg/health-dsl
cargo add tokio --features rt-multi-thread,macros,time`}
      />
      <P>
        health-dsl uses <C>tokio</C> for concurrency and per-check timeouts, and <C>serde</C> / <C>serde_json</C> for
        serialization. A crates.io release is wired behind a <C>rust-v*</C> tag.
      </P>

      <H3>TypeScript — npm</H3>
      <CodeBlock lang="bash" code={`npm i @slothlabs/health-dsl`} />
      <P>Zero runtime dependencies. Requires Node 22.6+ (ESM).</P>

      <H3>Kotlin / JVM — JitPack</H3>
      <CodeBlock
        lang="kotlin"
        filename="build.gradle.kts"
        code={`repositories {
    mavenCentral()
    maven("https://jitpack.io")
}

dependencies {
    implementation("com.github.slothlabsorg:health-dsl:v0.1.0")
}`}
      />
      <P>
        Requires Kotlin 2.x and <C>kotlinx-coroutines</C> (declared transitively). A GitHub Packages coordinate{' '}
        <C>com.slothlabs:health-dsl</C> is also published on each <C>jvm-v*</C> tag.
      </P>
    </>
  ),

  'quick-start': (
    <>
      <H>Quick start</H>
      <P>Declare a few checks, run them, and read the aggregate status. Each language uses its native async model.</P>
      <LangTabs
        accent={ACCENT}
        rust={
          <RawCodeBlock
            accent={ACCENT}
            lang="rust"
            code={`use std::time::Duration;
use health_dsl::{CheckResult, Critical, HealthRegistry};

let health = HealthRegistry::builder()
    .check("database", Critical::Yes, Duration::from_secs(5), || async {
        if db_ping().await { CheckResult::up() } else { CheckResult::down("primary unreachable") }
    })
    .check_default("cache", || async {
        CheckResult::up_with([("hitRate", "0.93".to_string())])
    })
    .check("disk", Critical::No, Duration::from_secs(2), || async {
        let free = free_percent().await;
        if free < 5 { CheckResult::down(format!("disk almost full: {free}%")) }
        else if free < 15 { CheckResult::degraded(format!("disk low: {free}%")) }
        else { CheckResult::up_with([("freePercent", free.to_string())]) }
    })
    .build()?;

let report = health.run().await;  // all checks run concurrently
report.status;                    // Status::Up | Degraded | Down
report.is_healthy();              // false only when Down
report.to_json();`}
          />
        }
        ts={
          <RawCodeBlock
            accent={ACCENT}
            lang="ts"
            code={`import { healthChecks, up, down, degraded } from "@slothlabs/health-dsl";

const health = healthChecks((c) => {
  c.check("database", { critical: true }, async () =>
    (await db.ping()) ? up() : down("primary unreachable"),
  );
  c.check("cache", async () => up({ hitRate: "0.93" }));
  c.check("disk", { timeoutMs: 2000 }, async () => {
    const free = await freePercent();
    if (free < 5) return down(\`disk almost full: \${free}%\`);
    if (free < 15) return degraded(\`disk low: \${free}%\`);
    return up({ freePercent: String(free) });
  });
});

const report = await health.run(); // all checks run concurrently
report.status;    // "UP" | "DEGRADED" | "DOWN"
report.isHealthy; // false only when "DOWN"
report.toJSON();`}
          />
        }
        kotlin={
          <RawCodeBlock
            accent={ACCENT}
            lang="kotlin"
            code={`import com.slothlabs.health.*

val health = healthChecks {
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

val report = health.run()      // suspend; all checks run concurrently
report.status                  // UP | DEGRADED | DOWN
report.isHealthy               // false only when DOWN
report.toJson()`}
          />
        }
      />
    </>
  ),

  dsl: (
    <>
      <H>Declaring checks</H>
      <P>
        Each check has a name, an optional <C>critical</C> flag (default <C>false</C>), an optional per-check{' '}
        <C>timeout</C> (default 5s), and a body that returns a result built with <C>up()</C>, <C>degraded(msg)</C>, or{' '}
        <C>down(msg)</C> — each accepting optional string details.
      </P>
      <H3>TypeScript signatures</H3>
      <CodeBlock
        lang="ts"
        code={`c.check(name, body);                       // defaults: not critical, 5s timeout
c.check(name, { critical: true }, body);
c.check(name, { timeoutMs: 2000 }, body);`}
      />
      <ul className="space-y-1 mb-5">
        <Li>
          <C>critical</C> (default <C>false</C>) — a <C>DOWN</C> here fails the whole report.
        </Li>
        <Li>
          <C>timeoutMs</C> (default <C>5000</C>) — exceeding it yields a <C>DOWN(&quot;timed out after …ms&quot;)</C>.
        </Li>
      </ul>
      <Callout type="warn">
        Duplicate names, blank names, and non-positive timeouts are rejected at registration / build time.
      </Callout>
      <P>
        In Rust the equivalent is the builder&apos;s <C>.check(name, Critical, Duration, body)</C> (and{' '}
        <C>.check_default(name, body)</C>); in Kotlin, <C>check(name, critical = …, timeout = …) {'{ … }'}</C> inside
        the <C>healthChecks {'{ }'}</C> block.
      </P>
    </>
  ),

  status: (
    <>
      <H>Status semantics</H>
      <P>
        Aggregation is identical across all three languages. <C>Status</C> is ordered{' '}
        <C>UP &lt; DEGRADED &lt; DOWN</C>, so aggregation is just &ldquo;take the worst&rdquo; — with one twist: a
        non-critical <C>DOWN</C> is capped at <C>DEGRADED</C>.
      </P>
      <Table
        accent={ACCENT}
        head={['Any check…', 'Overall status']}
        rows={[
          ['critical DOWN', 'DOWN'],
          ['non-critical DOWN, or DEGRADED', 'DEGRADED'],
          ['all UP (or no checks)', 'UP'],
        ]}
      />
      <Callout type="info">
        A critical dependency going down pages you; a degraded cache does not. <C>isHealthy</C> /{' '}
        <C>is_healthy()</C> is <C>false</C> only when the overall status is <C>DOWN</C> — so a <C>DEGRADED</C> service
        is still considered healthy.
      </Callout>
    </>
  ),

  concurrency: (
    <>
      <H>Concurrency &amp; timeouts</H>
      <P>
        Checks run concurrently using each language&apos;s native primitive, with per-check timeouts. So{' '}
        <C>report.durationMs</C> reflects your slowest check, not the sum, and a hung dependency becomes a <C>DOWN</C>{' '}
        outcome after its timeout instead of hanging the whole probe.
      </P>
      <Table
        accent={ACCENT}
        head={['Language', 'Async model']}
        rows={[
          ['Rust', 'tokio + join_all'],
          ['TypeScript', 'Promise.all / Promise.race (zero deps; timer always cleared)'],
          ['Kotlin', 'coroutines (withTimeoutOrNull)'],
        ]}
      />
      <Callout type="success">
        No check can break the report: thrown errors, panics, and timeouts all fold into a <C>DOWN</C> outcome.{' '}
        <C>run()</C> never rejects because of a failing check (structured-concurrency cancellation is still propagated).
      </Callout>
    </>
  ),

  report: (
    <>
      <H>The report</H>
      <P>
        <C>run()</C> returns a report exposing <C>status</C>, <C>isHealthy</C> (<C>is_healthy()</C> in Rust),{' '}
        <C>durationMs</C>, and serializers. Render a JSON string with <C>toJson()</C> / <C>toJSON()</C> /{' '}
        <C>to_json()</C>, or get the map/struct form (<C>toMap()</C> / <C>toObject()</C> / <C>to_value()</C>) to hand to
        your own serializer.
      </P>
      <H3>Stable JSON shape (identical across languages)</H3>
      <CodeBlock
        lang="json"
        code={`{
  "status": "DEGRADED",
  "durationMs": 41,
  "checks": {
    "database": { "status": "UP", "critical": true, "durationMs": 6 },
    "cache":    { "status": "UP", "critical": false, "durationMs": 2, "details": { "hitRate": "0.93" } },
    "disk":     { "status": "DEGRADED", "critical": false, "durationMs": 3, "message": "disk low: 12%" }
  }
}`}
      />
      <Callout type="info">
        <C>message</C> is included only when present; <C>details</C> only when non-empty. Checks appear in declaration
        order.
      </Callout>
      <H3>Wiring into an HTTP endpoint (TypeScript)</H3>
      <CodeBlock
        lang="ts"
        code={`server.get("/health", async (_req, res) => {
  const report = await health.run();
  res.status(report.isHealthy ? 200 : 503);
  res.type("application/json").send(report.toJSON());
});`}
      />
    </>
  ),

  actuator: (
    <>
      <H>Spring Actuator bridge</H>
      <P>
        health-dsl is framework-agnostic; bridging to a Spring Boot Actuator <C>HealthIndicator</C> is a few lines and
        needs no dependency from this library. Map the three statuses onto Actuator&apos;s builder and attach the
        report&apos;s map form as details.
      </P>
      <CodeBlock
        lang="kotlin"
        code={`@Component
class DependencyHealthIndicator(private val health: HealthRegistry) : HealthIndicator {
    override fun health(): org.springframework.boot.actuate.health.Health {
        val report = runBlocking { health.run() }
        val builder = when (report.status) {
            Status.UP       -> org.springframework.boot.actuate.health.Health.up()
            Status.DEGRADED -> org.springframework.boot.actuate.health.Health.status("DEGRADED")
            Status.DOWN     -> org.springframework.boot.actuate.health.Health.down()
        }
        return builder.withDetails(report.toMap()).build()
    }
}`}
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

export default function HealthDslDocsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'health-dsl documentation',
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
