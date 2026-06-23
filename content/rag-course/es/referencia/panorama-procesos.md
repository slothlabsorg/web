# Panorama de procesos en producción — orquestación, serving, datos y despliegue

> **Referencia del curso RAGorbit.** Mapa **vendor-neutral** del ecosistema de **procesos** alrededor de un sistema RAG o agéntico en producción. Complementa (no sustituye) el [Módulo 9 — Producción & Seguridad](../09-produccion-y-seguridad/guia.md), que ya cubrió los cuatro `deploymentTarget` de RAGorbit, guardrails, observabilidad y los nodos `io.*` básicos.
>
> **Audiencia:** programas en Python, ya completó M9 y quiere conocer **todo el mercado** de orquestación, serving/inferencia, pipelines de datos y despliegue — no solo Temporal, Kafka y FastAPI.
>
> **Prerequisitos:** M9 §5–§6 (IO y deployment targets), [`tecnologias-comparadas.md` §14](./tecnologias-comparadas.md#14-orquestación-de-producción) y §12 (observabilidad).

---

## Introducción: un sistema de IA en producción es más que el LLM

En M6–M8 construiste el **núcleo cognitivo**: retrieval, agentes ReAct, tools y MCP. En M9 aprendiste a **envolver** ese núcleo con guardrails, auditoría y el nodo de entrada correcto (`io.input`, `io.event-source`, `io.trigger`, `io.batch`). Pero en una empresa real, alrededor de ese grafo conviven **cuatro capas de proceso** que rara vez las cubre un solo framework:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 4 — DESPLIEGUE / RUNTIME                                              │
│  Docker, K8s, Lambda, Cloud Run, Modal, gateways LLM (LiteLLM, Portkey…)   │
├─────────────────────────────────────────────────────────────────────────────┤
│  CAPA 3 — PIPELINES DE DATOS / INGESTA                                      │
│  Kafka, Spark, dbt, Flink, CDC, reindexación del vector store               │
├─────────────────────────────────────────────────────────────────────────────┤
│  CAPA 2 — SERVING / INFERENCIA DE MODELOS                                   │
│  vLLM, TGI, APIs gestionadas, TEI (embeddings), batching, cuantización      │
├─────────────────────────────────────────────────────────────────────────────┤
│  CAPA 1 — ORQUESTACIÓN DE WORKFLOWS / AGENTES DURABLES                      │
│  Temporal, Prefect, Airflow, colas + estado en BD, cron + batch              │
├─────────────────────────────────────────────────────────────────────────────┤
│  NÚCLEO RAGORBIT — grafo: retrieval + agent + guardrails + observability    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Modelo mental:** el grafo RAGorbit responde a *«qué hace el agente con cada petición»*. Las cuatro capas responden a *«cómo llega la petición, dónde vive el modelo, de dónde salen los chunks y en qué máquina corre todo»*.

### Tabla resumen de las cuatro capas

| Capa | Pregunta que responde | Ejemplos representativos | Nodo RAGorbit típico |
|------|----------------------|--------------------------|----------------------|
| **1. Orquestación** | ¿Cómo coordino pasos que duran segundos, horas o días? | Temporal, Prefect, Kafka + Postgres | `io.trigger`, `io.event-source` |
| **2. Serving / inferencia** | ¿Dónde ejecuto el LLM y los embeddings? | vLLM, Bedrock, TEI, Groq | `model.llm`, `model.embedding` |
| **3. Pipelines de datos** | ¿Cómo indexo y actualizo el conocimiento? | Spark, dbt, Flink, cron batch | `io.batch`, `loader.*`, `ingest.*` |
| **4. Despliegue / runtime** | ¿En qué infraestructura corre el servicio? | K8s, Cloud Run, LiteLLM gateway | `deploymentTarget` del nodo `io.*` |

> **Nota temporal (2025/2026):** el mercado de LLM serving y gateways evoluciona cada trimestre. Los principios de este documento (durabilidad vs latencia, batch vs streaming, self-host vs API) son estables; los nombres concretos y benchmarks cambian — verifica documentación oficial antes de decidir.

---

## 1. Orquestación de workflows / agentes durables

La orquestación responde: *«¿quién ejecuta qué paso, cuándo, con qué reintentos, y qué pasa si el servidor se reinicia a mitad del flujo?»*

En M9 ya viste **Temporal** (`io.trigger`) frente a **Kafka + estado en BD** (`io.event-source`) y **cron + batch** (`io.batch`). Esta sección **amplía** el catálogo completo del mercado.

### 1.1 Mapa comparativo de orquestadores

| Herramienta | Modelo mental | Durabilidad | Mejor para | Cuándo NO |
|-------------|---------------|-------------|------------|-----------|
| **Temporal** | Código como workflow; historial de eventos durable | **Alta** — sobrevive reinicios, días/semanas | Procesos largos, HITL, compensaciones (sagas), cron durable | Eventos de segundos, volumen masivo stateless |
| **Prefect** | Flows Python con `@flow` / `@task`; UI moderna | Media-alta (con Prefect Cloud o server) | Pipelines de datos + ML, equipos Python-first | Workflows con señales humanas complejas (Temporal gana) |
| **Dagster** | **Assets** como unidad (tablas, modelos, índices) | Media-alta | Data pipelines con linaje, RAG index como asset | Chat en tiempo real, latencia sub-segundo |
| **Apache Airflow** | DAGs declarativos (Python o YAML); scheduler central | Media (reintentos por task) | ETL clásico, jobs nocturnos, dependencias batch | Streaming, agentes interactivos, baja latencia |
| **Flyte** | Workflows tipados sobre K8s; reproducibilidad | Alta en K8s | ML training + inferencia batch a escala | Equipos sin K8s, prototipos rápidos |
| **Argo Workflows** | DAGs nativos de K8s (CRD) | Alta en K8s | Pipelines containerizados en cluster existente | Fuera de K8s, equipos sin ops de cluster |
| **Kestra** | Orquestador declarativo (YAML); UI + plugins | Media-alta | Equipos que prefieren YAML sobre código Python | Lógica de agente muy dinámica en runtime |
| **Cola + workers** (Celery, RQ, Kafka consumer) | Mensaje → worker stateless → estado en BD | Media (depende de idempotencia) | Alto throughput, fan-out, procesamiento < minutos | Procesos multi-día sin orquestador encima |
| **Cron + script** | `crontab` / K8s CronJob | Baja | Indexación nocturna, jobs idempotentes cortos | Cualquier cosa con HITL o estado complejo |

### 1.2 Ficha por herramienta (estilo catálogo)

#### Temporal

**Qué hace:** Motor de workflows **durable**. El código del workflow se re-ejecuta desde el historial de eventos tras un fallo; los *activities* (llamadas externas) tienen retry, timeout y compensación nativos. Soporta timers de días, señales humanas (`signal`) y cron.

**Cuándo usar:** Onboarding bancario multi-día, aprobaciones médicas con esperas, cualquier flujo donde `hitl.escalate` implica pausas de horas y el proceso **debe** sobrevivir deploys.

**Cuándo NO usar:** Fan-out de 50 000 eventos/hora con procesamiento < 30 s (template 10 — usa `io.event-source`). Un cron nocturno de reindexación (usa `io.batch`).

**Alternativas:** AWS Step Functions (vendor lock-in AWS), Prefect con pausas manuales (menos robusto para semanas), Cadence (predecesor open-source de Temporal).

**RAGorbit:** [`io.trigger`](./catalogo-nodos.md#iotrigger) → `deploymentTarget: temporal`.

---

#### Prefect

**Qué hace:** Orquestador Python-first. Defines flows con decoradores; Prefect gestiona scheduling, retries, logging y una UI de ejecuciones. Integración natural con pipelines de ML y tareas de ingesta.

**Cuándo usar:** Reindexar el vector store cada noche con pasos claros (cargar → chunkear → embed → upsert), evaluaciones RAGAS programadas, sincronización de datos desde APIs.

**Cuándo NO usar:** Workflows con señales humanas interactivas de días (Temporal). Streaming de eventos en tiempo real.

**Alternativas:** Dagster (si el linaje de datos es prioritario), Airflow (si ya lo tienes en la empresa), cron simple (si el pipeline cabe en un script).

---

#### Dagster

**Qué hace:** Orquestador centrado en **software-defined assets** — cada tabla, índice o modelo es un asset con dependencias explícitas. Excelente linaje: «este chunk en pgvector proviene de este PDF procesado ayer».

**Cuándo usar:** Equipos de datos que ya piensan en términos de pipelines; RAG como **asset** versionado (`vector_index_v3` depende de `raw_documents_v3`).

**Cuándo NO usar:** Orquestar un agente conversacional en runtime. Latencia interactiva.

**Alternativas:** Prefect (más simple para equipos ML sin cultura data-engineering), dbt (solo transformaciones SQL, no orquestación general).

---

#### Apache Airflow

**Qué hace:** El estándar de facto en ETL batch desde 2015. DAGs con operadores (`PythonOperator`, `BashOperator`, sensores). Scheduler central que dispara tasks según dependencias y cron.

**Cuándo usar:** Empresas con Airflow ya operado; jobs nocturnos de ingesta masiva; sincronización de data warehouse antes de reindexar.

**Cuándo NO usar:** **Anti-patrón:** Airflow para chat o eventos de baja latencia — el scheduler no está diseñado para eso. Agentes con estado conversacional.

**Alternativas:** Prefect/Dagster (DX moderna), cron + Docker (si el DAG tiene 2 pasos).

---

#### Flyte

**Qué hace:** Plataforma de workflows **tipados** sobre Kubernetes. Cada task es un contenedor; inputs/outputs tipados; cacheo y reproducibilidad fuertes. Muy usado en ML a escala (Lyft, Spotify).

**Cuándo usar:** Entrenamiento/fine-tuning + inferencia batch en K8s; pipelines con GPU scheduling nativo.

**Cuándo NO usar:** Equipos sin K8s. Prototipos de RAG en laptop.

**Alternativas:** Argo Workflows (menos tipado, más flexible), Kubeflow Pipelines.

---

#### Argo Workflows

**Qué hace:** Motor de workflows nativo de Kubernetes (Custom Resource Definition). Cada paso es un pod; paralelismo via DAG. Se integra con el ecosistema K8s (Argo CD, eventos).

**Cuándo usar:** Ya tienes K8s y quieres pipelines containerizados sin añadir otro cluster (Temporal, Prefect server).

**Cuándo NO usar:** Entornos serverless puros o VMs sin K8s.

**Alternativas:** Flyte (más estructura ML), Tekton (CI/CD más que data).

---

#### Kestra

**Qué hace:** Orquestador **declarativo** (YAML) con UI, plugins y ejecución distribuida. Menos código Python embebido que Prefect; más configurable que cron.

**Cuándo usar:** Equipos que prefieren YAML/GitOps para pipelines; integraciones plug-and-play (S3, databases, notificaciones).

**Cuándo NO usar:** Lógica de agente muy dinámica (el grafo del agente cambia según el LLM en runtime — mejor código Python + Temporal o LangGraph).

**Alternativas:** Prefect (Python-first), Airflow (ecosistema más maduro).

---

### 1.3 Durabilidad vs simplicidad — el espectro

```
SIMPLICIDAD ──────────────────────────────────────────────▶ DURABILIDAD / COMPLEJIDAD

cron + script    Celery/RQ + Redis    Kafka + Postgres    Prefect/Dagster    Temporal
     │                    │                    │                  │                │
 io.batch           tareas async         io.event-source      pipelines        io.trigger
 indexación         emails, jobs         fan-out masivo       data assets      HITL multi-día
 nocturna           cortos               template 10          reindexación     onboarding
```

### 1.4 ¿Cuándo basta cola + estado en BD vs orquestador?

| Señal | Cola + BD (Celery, RQ, Kafka) | Orquestador (Temporal, Prefect…) |
|-------|------------------------------|----------------------------------|
| Duración máxima del flujo | Segundos – pocos minutos | Horas – semanas |
| Pasos humanos intermedios | Polling manual o tabla `pending_approval` | Señales nativas (Temporal) o pausas (Prefect) |
| Compensación / saga | Manual (difícil de mantener) | Nativa (Temporal) |
| Volumen (eventos/hora) | **Alto** — workers horizontales | Medio — un workflow por instancia de negocio |
| Complejidad ops | Baja–media (ya tienes Kafka) | Alta (cluster Temporal adicional) |
| Ejemplo RAGorbit | Template 10 (logística) | Onboarding bancario con `io.trigger` |

**Regla práctica del curso** (ampliada desde [§14](./tecnologias-comparadas.md#14-orquestación-de-producción)):

- Chat tiempo real → FastAPI (`io.input`) — **no** orquestador.
- Eventos masivos stateless → Kafka (`io.event-source`) — **no** Temporal.
- Procesos interminables con humanos → Temporal (`io.trigger`).
- Reindexación programada → cron, Prefect, Dagster o Airflow (`io.batch` como origen del grafo).

---

## 2. Serving / inferencia de LLMs

El serving responde: *«¿dónde corre el modelo, cómo sirvo tokens con baja latencia y alto throughput, y cuándo pago API vs GPU propia?»*

Los nodos `model.llm` y `model.embedding` del grafo RAGorbit **consumen** un endpoint de inferencia; esta capa es **independiente** del framework de agentes.

### 2.1 Self-hosted — motores de inferencia open source

| Motor | Qué hace | Fortaleza | Limitación | Cuándo elegir |
|-------|----------|-----------|------------|---------------|
| **vLLM** | Servidor LLM con **PagedAttention**, batching continuo, API OpenAI-compatible | Throughput muy alto en GPU; estándar de facto en 2025 para producción OSS | Requiere GPU NVIDIA; ops no trivial | Alto QPS, modelos 7B–70B, control de costos a escala |
| **TGI** (Text Generation Inference) | Servidor de Hugging Face; optimizado para transformers | Integración HF nativa, cuantización GPTQ/AWQ | Menos flexible que vLLM en algunos modelos | Stack Hugging Face, despliegue en HF Inference Endpoints o self-host |
| **SGLang** | Runtime con **radix attention**, batching agresivo | Throughput competitivo con vLLM en benchmarks recientes | Ecosistema más joven (2024–2025) | Experimentación de performance; multi-turn con prefix cache |
| **llama.cpp** | Inferencia CPU/GPU en C++; GGUF | Corre en laptop, Apple Silicon, sin GPU datacenter | Throughput menor que vLLM en cluster | Desarrollo local, edge, demos offline |
| **Ollama** | Wrapper amigable sobre llama.cpp (+ más backends) | `ollama run llama3` — cero fricción local | No diseñado para producción multi-tenant | Desarrollo, POCs, equipos sin ops GPU |
| **TensorRT-LLM** | Optimización NVIDIA (kernels, FP8, inflight batching) | Máximo rendimiento en hardware NVIDIA | Lock-in NVIDIA; curva de compilación | Producción exigente en GPU NVIDIA a escala |
| **LMDeploy** | Serving de OpenMMLab; cuantización TurboMind | Buen balance en GPUs chinas/alternativas | Menor comunidad que vLLM fuera de Asia | Entornos con restricciones de hardware |
| **Ray Serve** | Framework de serving **general** (no solo LLM) | Compone LLM + preprocessing + postprocessing en un deployment | Más piezas (cluster Ray) | Pipelines ML mixtos: embed + rerank + LLM en un servicio |
| **BentoML** | Empaqueta modelos como APIs containerizadas | DX simple para desplegar cualquier modelo | Capa extra sobre vLLM/TGI | Equipos que quieren CI/CD de modelos sin escribir FastAPI a mano |

### 2.2 APIs gestionadas (hosted inference)

| Proveedor | Modelo de consumo | Fortaleza | Cuándo NO |
|-----------|-------------------|-----------|-----------|
| **OpenAI / Azure OpenAI** | Pay-per-token | Calidad, tool calling maduro, SLA enterprise | Costo a escala; datos sensibles sin contrato BAA/DPA |
| **Amazon Bedrock** | Pay-per-token + modelos variados (Claude, Llama, Titan) | Integración AWS, guardrails nativos, VPC | Lock-in AWS; latencia variable por región |
| **Google Vertex AI** | Pay-per-token + Gemini + modelos abiertos | Integración GCP, grounding nativo | Lock-in GCP |
| **Anthropic directo** | API Claude | Razonamiento largo, ventana de contexto | Sin self-host del modelo propietario |
| **Together AI / Fireworks** | API sobre modelos open-weights | Llama/Mistral sin gestionar GPU | Menos control que self-host |
| **Groq** | LPU inference — latencia ultra-baja | TTFT muy bajo en modelos soportados | Catálogo limitado; no es self-host |

**Cuándo API gestionada:** prototipo, equipo sin ops GPU, picos impredecibles, compliance ya resuelto con el proveedor.

**Cuándo self-host:** > 1M tokens/día sostenidos, datos que no pueden salir de VPC, latencia predecible en modelo fine-tuned propio.

### 2.3 Embeddings serving — TEI y alternativas

Los embeddings alimentan `model.embedding` → `store.*`. A diferencia del LLM generativo, el serving de embeddings es **más barato** y suele ser el cuello de botella en **ingesta**, no en chat.

| Herramienta | Qué hace | Cuándo usar |
|-------------|----------|-------------|
| **TEI** (Text Embeddings Inference) | Servidor Hugging Face optimizado para modelos de embedding (sentence-transformers) | Self-host de embeddings en batch de ingesta; API OpenAI-compatible |
| **vLLM / TGI** | También sirven algunos modelos de embedding | Si ya tienes el cluster y quieres un solo stack |
| **API del proveedor** (OpenAI `text-embedding-3-*`, Cohere, Voyage) | Zero ops | Prototipos, volúmenes bajos, sin GPU |
| **Sentence Transformers local** | `model.encode()` en proceso | Scripts batch pequeños (`io.batch`), desarrollo |

**Intuición de throughput:** en ingesta nocturna, el embedding suele procesarse en **batch** (cientos de chunks por llamada). En chat, suele ser **1 query → 1 vector** — latencia importa más que throughput.

### 2.4 Conceptos clave (intuición, no benchmarks)

| Concepto | Qué significa para tu sistema RAG |
|----------|-----------------------------------|
| **Batching continuo** | El servidor agrupa peticiones concurrentes en una sola pasada GPU → más tokens/segundo, ligero aumento de latencia P95 |
| **Cuantización (INT8, INT4, GPTQ, AWQ)** | Modelo más pequeño en memoria → cabe en GPU más barata; puede degradar calidad en tareas finas |
| **TTFT** (time to first token) | Crítico en chat streaming (`io.output` con SSE) — Groq y vLLM optimizado compiten aquí |
| **TPOT** (time per output token) | Crítico en respuestas largas (informes, JSON extenso) |
| **Prefix caching / KV cache** | Reutilizar contexto repetido (system prompt, documentos fijos) — ahorra costo en multi-turn |

> **Honestidad 2025/2026:** los benchmarks publicados por cada vendor son difíciles de comparar (hardware, modelo, batch size distintos). **Perfila con tu prompt real y tu hardware** antes de comprometerte.

### 2.5 Cómo elegir serving para RAGorbit

```
¿Datos pueden salir de tu VPC?
  NO → self-host (vLLM/TGI/TEI) o Azure OpenAI/Bedrock en VPC
  SÍ → ¿Volumen sostenido > umbral económico?
         NO → API gestionada (OpenAI, Anthropic, Bedrock)
         SÍ → self-host vLLM + TEI; gateway LiteLLM delante (§4)

¿Es ingesta batch o chat?
  INGESTA → TEI/vLLM con batch grande; no necesitas TTFT bajo
  CHAT    → vLLM/SGLang/Groq; streaming SSE; medir TTFT
```

---

## 3. Pipelines de datos / ingesta a escala

Esta capa responde: *«¿cómo llegan los documentos al vector store, cómo detecto cambios y cuándo reindexo?»* Es **offline** respecto al chat — pero determina la calidad del RAG más que el LLM.

### 3.1 Mapa de tecnologías

| Herramienta | Paradigma | Escala | Mejor para | Cuándo NO |
|-------------|-----------|--------|------------|-----------|
| **Kafka** | Log distribuido; pub/sub; retención | Muy alta | Eventos de cambio, audit trail, desacoplar ingesta de indexación | Procesar 100 PDFs/día |
| **Apache Spark** | Procesamiento distribuido batch/streaming | Masiva (TB+) | Chunking + embedding de millones de docs, ETL pesado | < 10 GB de documentos |
| **Ray Data** | Dataset distribuido en cluster Ray | Alta | Pipelines ML paralelos (embed, transform) integrados con Ray Serve | Sin cluster Ray |
| **dbt** | Transformaciones SQL versionadas | Warehouse | Enriquecer metadata tabular antes de RAG híbrido | Ingesta de PDFs binarios |
| **Apache Flink** | Stream processing con estado | Alta (streaming) | CDC en tiempo casi real → reindex incremental | Batch nocturno simple |
| **Apache Beam** | API unificada batch + streaming (runner: Dataflow, Flink, Spark) | Variable | Portabilidad entre clouds | Equipo pequeño sin necesidad de portabilidad |
| **Cron + Python** | Script secuencial | Baja–media | Templates 02, 04 — `io.batch` | TB de datos, SLA de frescura < 1 h |

### 3.2 Batch vs streaming

| Dimensión | Batch (nocturno, `io.batch`) | Streaming (Kafka + Flink) |
|-----------|------------------------------|---------------------------|
| **Frescura del índice** | Horas (aceptable para políticas RRHH, manuales) | Minutos (precios, inventario, noticias) |
| **Complejidad** | Baja | Alta |
| **Costo** | Mínimo | Infra continua |
| **Idempotencia** | Re-ejecutar el job entero | Upsert por documento/evento |
| **Orquestación típica** | cron, Prefect, Airflow | Kafka → consumer → embed → upsert; Flink para agregaciones |

### 3.3 CDC (Change Data Capture) y reindexación

**CDC** captura cambios en bases operacionales (PostgreSQL, MySQL) y los publica como eventos — ideal para RAG sobre **datos que cambian** sin re-leer todo el warehouse.

```
PostgreSQL ──(Debezium/Logical Replication)──▶ Kafka topic "doc-changes"
                                                      │
                                                      ▼
                                            consumer: delete old vectors
                                                      + embed new version
                                                      + upsert pgvector
```

**Cuándo reindexar completo vs incremental:**

| Señal | Reindex completo | Incremental (CDC / delta) |
|-------|------------------|---------------------------|
| Cambió el modelo de embedding | **Sí** — todos los vectores inválidos | N/A |
| Cambió estrategia de chunking | **Sí** | N/A |
| Nuevo documento o párrafo editado | No | **Sí** — upsert/delete por ID |
| < 0.1% de docs cambian/día | Overkill incremental | **Sí** |
| Fuente es snapshot diario (S3 dump) | **Sí** — job batch | Overkill streaming |

### 3.4 Orquestar ingesta con orquestadores (§1)

La ingesta **offline** suele vivir en la capa 1, no en el grafo de chat:

```
┌─────────────────────────────────────────────────────────────┐
│  ORQUESTADOR (Prefect / Airflow / Dagster / cron)           │
│    1. loader.*  →  2. ingest.*  →  3. model.embedding       │
│    4. store.* (upsert)  →  5. observability (métricas)      │
└─────────────────────────────────────────────────────────────┘
         ▲                              │
         │ schedule                     │ índice listo
         │                              ▼
    io.batch (origen)            RUNTIME: io.input / io.event-source
```

**RAGorbit:** el pipeline offline comparte nodos `loader`, `ingest`, `store` con el grafo; el `deploymentTarget: batch` (`io.batch`) genera un job CLI/cron. Ver templates [02-banking](../../examples/02-banking-credit-scoring/) y [04-insurance](../../examples/04-insurance-claims/).

---

## 4. Despliegue / runtime / serverless

Esta capa responde: *«¿en qué máquina corre cada pieza y cómo la expongo de forma segura?»*

M9 cubrió los cuatro targets RAGorbit (FastAPI, Kafka worker, Temporal, batch). Aquí ampliamos el **espectro de infraestructura** y los **gateways LLM**.

### 4.1 Contenedores y orquestación de contenedores

| Opción | Qué resuelve | Cuándo usar |
|--------|--------------|-------------|
| **Docker** | Empaquetado reproducible | Siempre — base de todo despliegue serio |
| **Docker Compose** | Multi-contenedor local/staging | Desarrollo, demos, template 10 con Kafka |
| **Kubernetes (K8s)** | Scheduling, autoscaling, secrets, ingress | Producción multi-servicio, GPU scheduling, > 1 equipo |
| **Helm charts** | Paquetizar manifests K8s | vLLM, TGI, TEI en cluster — charts comunitarios existen |
| **Nomad / ECS / Cloud Run (K8s-lite)** | Menos ops que K8s full | Equipos pequeños con managed containers |

**Mapeo RAGorbit:**

| `deploymentTarget` | Runtime típico |
|--------------------|----------------|
| `chat-service` | K8s Deployment + Ingress, o Cloud Run, o VM + systemd |
| `event-worker` | K8s Deployment (réplicas = consumer group), autoscale por lag Kafka |
| `temporal` | Workers Temporal + cluster Temporal managed o self-host |
| `batch` | K8s CronJob, AWS Batch, o `docker compose run job` |

### 4.2 Serverless y GPU on-demand

| Plataforma | Modelo | Mejor para | Limitación |
|------------|--------|------------|------------|
| **AWS Lambda / Azure Functions** | Pay-per-invocation | APIs ligeras, preprocessing, **no** LLM pesado | Timeout (15 min max), sin GPU tradicional |
| **Google Cloud Run** | Contenedor serverless | FastAPI chat-service con scale-to-zero | Cold start; GPU Cloud Run es más reciente — verificar región |
| **Modal** | Python serverless con GPU efímera | Jobs GPU bajo demanda, fine-tuning puntual | Vendor específico; costo impredecible sin límites |
| **RunPod / Vast.ai** | GPU bare-metal/on-demand | vLLM self-host sin capex | Ops manual; no enterprise SLA out-of-the-box |
| **HF Inference Endpoints** | Managed TGI/vLLM | Despliegue rápido de modelos HF | Costo; menos control que cluster propio |

**Regla:** serverless **funciona bien** para el **wrapper** del agente (FastAPI, Kafka consumer ligero). El **LLM pesado** suele ir en un servicio dedicado (vLLM en GPU persistente o API gestionada), no en Lambda.

### 4.3 Gateways y proxies LLM

Los gateways sitúan **delante** de uno o varios backends (`model.llm`) y centralizan preocupaciones transversales:

| Gateway | Qué hace | Cuándo usar |
|---------|----------|-------------|
| **LiteLLM** | Proxy OpenAI-compatible; enruta a 100+ proveedores; fallback, retry, presupuesto | Multi-proveedor, dev/prod con mismo SDK, migrar de OpenAI a Azure sin cambiar código |
| **OpenRouter** | Marketplace de modelos vía una API | Experimentar modelos sin contrato con cada vendor |
| **Portkey** | Gateway con observabilidad, caché semántica, guardrails | Producción multi-equipo; métricas de costo por proyecto |
| **Kong AI Gateway** | Extensión del API gateway Kong para LLM | Empresas que ya usan Kong para APIs REST |
| **Envoy + ext_proc / APISIX** | Gateway genérico con plugins | Infra unificada LLM + microservicios no-AI |

**Funciones típicas de un gateway:**

- **Enrutamiento:** GPT-4 para casos complejos, Llama-8B para clasificación barata.
- **Fallback:** si OpenAI cae → Bedrock.
- **Rate limiting / presupuesto:** tope de USD/día por API key.
- **Caché semántica:** respuesta idéntica o similar sin llamar al LLM (cuidado con datos sensibles).
- **Logging unificado:** complementa [`observability.audit`](./catalogo-nodos.md#observabilityaudit) y [§12 observabilidad](./tecnologias-comparadas.md#12-observabilidad).

```
Cliente / io.input ──▶ FastAPI ──▶ LiteLLM/Portkey ──▶ OpenAI | vLLM | Bedrock
                                        │
                                        ├── rate limit
                                        ├── cost tracking
                                        └── fallback
```

---

## 5. ¿Cuándo mantenerlo simple?

No todo sistema RAG necesita cuatro capas enterprise. M9 enseñó los targets porque **debes reconocer** cuándo escalar; no porque debas usar todo desde el día uno.

### 5.1 El stack mínimo viable

| Pieza | Stack simple | Suficiente cuando… |
|-------|--------------|-------------------|
| **Runtime** | Un proceso FastAPI (`io.input`) | < 100 usuarios concurrentes, un equipo |
| **Ingesta** | Script Python + cron (`io.batch`) | < 10k documentos, reindex nocturno |
| **LLM** | API OpenAI/Anthropic directa | Prototipo o bajo volumen |
| **Embeddings** | API o `sentence-transformers` en el script batch | Misma condición |
| **Estado / cola** | PostgreSQL + nada más | Sin eventos masivos, sin workflows multi-día |
| **Observabilidad** | Logs + Langfuse free tier | Sin requisito regulatorio de audit trail |

### 5.2 Señales de que necesitas escalar

| Señal | Síntoma | Capa a añadir |
|-------|---------|---------------|
| **Latencia P95 > SLA** en chat | Usuarios esperan > 3 s al primer token | Serving dedicado (vLLM), gateway con fallback |
| **Reconexiones duplican acciones** | Doble cobro, doble reserva | `guardrail.idempotency` + Redis (M9) |
| **> 10k eventos/hora** | Cola única saturada | Kafka (`io.event-source`) + workers horizontales |
| **Workflow > 24 h con humanos** | Estado en tablas inmanejable | Temporal (`io.trigger`) |
| **Índice desactualizado > 4 h** | Usuarios ven info obsoleta | Streaming CDC o ingesta más frecuente |
| **Costo LLM > presupuesto** | Factura impredecible | Gateway con routing a modelos baratos + caché |
| **Auditoría regulatoria** | No puedes reconstruir quién hizo qué | `observability.audit` → Kafka + retención |
| **Multi-equipo en mismo cluster** | Conflictos de deploy | K8s + namespaces; Dagster/Prefect para pipelines |

### 5.3 Anti-complejidad deliberada

| Tentación | Realidad | Mantén simple con |
|-----------|----------|-------------------|
| «Pongamos Temporal por si acaso» | Ops de cluster sin workflows multi-día | FastAPI + Postgres |
| «Spark para 500 PDFs» | Cluster JVM para horas de trabajo | `io.batch` + Python |
| «K8s en día uno» | YAML antes de product-market fit | Docker Compose o PaaS |
| «Self-host vLLM para 10 queries/día» | GPU idle al 99% | API gestionada |

---

## 6. Tabla de decisión maestra

### 6.1 Por escenario de negocio

| Escenario | Entrada RAGorbit | Orquestación (§1) | Serving (§2) | Datos (§3) | Despliegue (§4) |
|-----------|------------------|-------------------|--------------|------------|-----------------|
| **Chat tiempo real** (copilot, bot RRHH) | `io.input` | Ninguna (request/response) | API gestionada o vLLM + SSE | Batch nocturno (`io.batch`) | FastAPI en K8s/Cloud Run |
| **Event-driven masivo** (disrupciones, fraude) | `io.event-source` | Kafka + workers; **no** Temporal | API rápida (Groq) o reglas sin LLM | Kafka como bus de eventos | Workers autoscale por lag |
| **Batch nocturno** (scoring, siniestros) | `io.batch` | cron / Prefect / Airflow | TEI batch + LLM solo en inferencia | Spark si > TB; else Python | CronJob / AWS Batch |
| **Workflow humano-en-el-loop largo** (onboarding, prior auth) | `io.trigger` | **Temporal** | API gestionada (volumen bajo) | Batch inicial + updates puntuales | Temporal workers + FastAPI para UI |
| **Alto volumen on-prem** (banca, defensa) | `io.input` + `io.event-source` | Kafka + Temporal solo donde hay sagas | vLLM + TEI self-host | Spark/Flink + CDC | K8s on-prem + LiteLLM gateway |
| **Demo / taller** | `io.input` | Ninguna | Ollama local | Script manual | Gradio / `uvicorn` local |

### 6.2 Anti-patrones frecuentes

| Anti-patrón | Por qué falla | Alternativa |
|-------------|---------------|-------------|
| **Airflow para chat** | Scheduler en segundos/minutos, no milisegundos | FastAPI + `io.input` |
| **Temporal para un cron simple** | Cluster Temporal para un job de 5 min/noite | `io.batch` + cron |
| **Kafka para 10 mensajes/día** | Ops de broker sin beneficio | Webhook + FastAPI o SQS |
| **Spark para ingesta de 200 PDFs** | Overhead JVM/cluster | Python + `io.batch` |
| **LLM en Lambda** | Timeout, sin GPU, cold start en modelos grandes | API gestionada o vLLM dedicado |
| **Reindex completo cada hora** | Costo de embedding innecesario | CDC incremental |
| **Un solo modelo caro para todo** | Clasificación simple a precio GPT-4 | Gateway: modelo pequeño → grande si confianza baja |
| **Observabilidad solo en LangSmith** | Lock-in; sin métricas Kafka/infra | [§12](./tecnologias-comparadas.md#12-observabilidad): audit + Langfuse + OTel |

### 6.3 Árbol de decisión rápido (entrada del grafo)

```
¿La entrada es conversacional en tiempo real?
  SÍ → io.input (chat-service)
  NO → ¿Disparada por eventos de un broker?
         SÍ → io.event-source (event-worker)
         NO → ¿Duración del proceso de negocio?
                > 1 día o HITL con esperas → io.trigger (temporal)
                NO → io.batch (batch/cron)
```

---

## Cierre — cómo encaja todo en RAGorbit

Un sistema RAG/agéntico maduro **no elige una sola herramienta** — combina capas:

```
[OFFLINE — Capa 3 + orquestador §1]
io.batch → loader.* → ingest.* → model.embedding → store.*
         (Prefect/Airflow/cron)

[RUNTIME — Capa 2 + 4 + grafo RAGorbit]
io.input | io.event-source | io.trigger
    → agent.* + retrieval + guardrails
    → model.llm (vía gateway §4)
    → observability.* → io.output | io.notify

[TRANSVERSAL — M9 + §12]
observability.audit (Kafka) + Langfuse (dev) + OTel (prod)
guardrail.* + hitl.escalate
```

Tu trabajo como ingeniero no es dominar las 30 herramientas de este documento, sino **ubicar cada pieza en la capa correcta**, reconocer las señales de escalado (§5) y evitar anti-patrones (§6.2).

---

> **Cross-links**
>
> - **M9 — Producción & Seguridad:** [guia.md §5–§6](../09-produccion-y-seguridad/guia.md) — nodos `io.*`, deployment targets, guardrails, comparativa Temporal vs Kafka *(base que este documento amplía)*.
> - **Orquestación ampliada:** [`tecnologias-comparadas.md` §14](./tecnologias-comparadas.md#14-orquestación-de-producción) — tabla Temporal vs colas + BD vs cron.
> - **Observabilidad:** [`tecnologias-comparadas.md` §12](./tecnologias-comparadas.md#12-observabilidad) — LangSmith vs Langfuse vs OTel; complementa [`observability.audit`](./catalogo-nodos.md#observabilityaudit), [`.metrics`](./catalogo-nodos.md#observabilitymetrics), [`.feedback`](./catalogo-nodos.md#observabilityfeedback).
> - **Catálogo de nodos IO:** [`io.input`](./catalogo-nodos.md#ioinput), [`io.event-source`](./catalogo-nodos.md#ioevent-source), [`io.trigger`](./catalogo-nodos.md#iotrigger), [`io.batch`](./catalogo-nodos.md#iobatch).
> - **Templates ancla:** [01-airline](../examples/01-airline-flight-change/) (chat + guardrails), [10-logistics](../examples/10-logistics-disruption-rebooking/) (Kafka fan-out), [02-banking](../examples/02-banking-credit-scoring/) (batch), [03-healthcare](../examples/03-healthcare-prior-auth/) (HITL).
> - **Conceptos:** [`docs/01-concepts.md`](../../docs/01-concepts.md) §5 — tabla `deploymentTarget` y tipos de puerto.
