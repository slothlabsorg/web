// ─── RAG COURSE — static metadata (importable by client & server) ─────────────
// Content lives in content/rag-course/{es,en}/...  This file only describes the
// structure used to build navigation and cards.

export type Lang = 'es' | 'en'

export const LANGS: Lang[] = ['es', 'en']

export interface CourseModule {
  slug: string          // folder name, identical across languages
  n: number             // module number (0..11)
  icon: string
  accent: string
  title: { es: string; en: string }
  desc: { es: string; en: string }
}

export const MODULES: CourseModule[] = [
  {
    slug: '00-setup', n: 0, icon: '🧰', accent: '#4DA6FF',
    title: { es: 'Setup y repaso', en: 'Setup & refresher' },
    desc: {
      es: 'Entorno, modo offline (mock), repaso de Python y tour de RAGorbit.',
      en: 'Environment, offline (mock) mode, Python refresher, and a RAGorbit tour.',
    },
  },
  {
    slug: '01-fundamentos', n: 1, icon: '📚', accent: '#00D4FF',
    title: { es: 'Fundamentos de LLMs y RAG', en: 'LLM & RAG fundamentals' },
    desc: {
      es: 'Qué es un LLM, prompting, el patrón RAG y embeddings desde cero.',
      en: 'What an LLM is, prompting, the RAG pattern, and embeddings from scratch.',
    },
  },
  {
    slug: '02-ingesta', n: 2, icon: '📥', accent: '#8B5CF6',
    title: { es: 'Ingesta de datos', en: 'Data ingestion' },
    desc: {
      es: 'Loaders, chunking y metadatos: de documentos crudos a fragmentos.',
      en: 'Loaders, chunking, and metadata: from raw documents to chunks.',
    },
  },
  {
    slug: '03-embeddings-y-stores', n: 3, icon: '🧮', accent: '#10B981',
    title: { es: 'Embeddings y vector stores', en: 'Embeddings & vector stores' },
    desc: {
      es: 'Embeddings reales, ChromaDB, FAISS y sentence-transformers.',
      en: 'Real embeddings, ChromaDB, FAISS, and sentence-transformers.',
    },
  },
  {
    slug: '04-retrieval-y-query', n: 4, icon: '🔎', accent: '#F59E0B',
    title: { es: 'Retrieval avanzado', en: 'Advanced retrieval' },
    desc: {
      es: 'Búsqueda híbrida, rerankers, transformación de query y GraphRAG.',
      en: 'Hybrid search, rerankers, query transformation, and GraphRAG.',
    },
  },
  {
    slug: '05-generacion-y-logic', n: 5, icon: '✍️', accent: '#EC4899',
    title: { es: 'Generación, lógica y evaluación', en: 'Generation, logic & eval' },
    desc: {
      es: 'Salida estructurada, citas, y evaluación con RAGAS y métricas.',
      en: 'Structured output, citations, and evaluation with RAGAS and metrics.',
    },
  },
  {
    slug: '06-agentes-i', n: 6, icon: '🤖', accent: '#4DA6FF',
    title: { es: 'Agentes I — fundamentos', en: 'Agents I — fundamentals' },
    desc: {
      es: 'Tool calling, bucle ReAct, memoria, Reflexion y LangGraph desde cero.',
      en: 'Tool calling, the ReAct loop, memory, Reflexion, and LangGraph from scratch.',
    },
  },
  {
    slug: '07-agentes-ii', n: 7, icon: '🧠', accent: '#00D4FF',
    title: { es: 'Agentes II — multi-agente', en: 'Agents II — multi-agent' },
    desc: {
      es: 'Multi-agente con LangGraph, CrewAI, AutoGen/AG2 y BeeAI.',
      en: 'Multi-agent with LangGraph, CrewAI, AutoGen/AG2, and BeeAI.',
    },
  },
  {
    slug: '08-mcp', n: 8, icon: '🔌', accent: '#8B5CF6',
    title: { es: 'Model Context Protocol', en: 'Model Context Protocol' },
    desc: {
      es: 'Servidor y cliente MCP con FastMCP, y su seguridad.',
      en: 'MCP server and client with FastMCP, and its security.',
    },
  },
  {
    slug: '09-produccion-y-seguridad', n: 9, icon: '🛡️', accent: '#10B981',
    title: { es: 'Producción y seguridad', en: 'Production & security' },
    desc: {
      es: 'Guardrails, HITL, observabilidad, despliegue, seguridad de IA y UIs.',
      en: 'Guardrails, HITL, observability, deployment, AI security, and UIs.',
    },
  },
  {
    slug: '10-multimodal', n: 10, icon: '🎙️', accent: '#F59E0B',
    title: { es: 'Multimodal — voz y visión', en: 'Multimodal — voice & vision' },
    desc: {
      es: 'STT/Whisper, visión, generación de imagen/audio y embeddings multimodales.',
      en: 'STT/Whisper, vision, image/audio generation, and multimodal embeddings.',
    },
  },
  {
    slug: '11-capstone', n: 11, icon: '🚀', accent: '#EC4899',
    title: { es: 'Arquitectura y capstone', en: 'Architecture & capstone' },
    desc: {
      es: 'Reconstruir templates, reto de diseño y examen integrado.',
      en: 'Rebuild templates, a design challenge, and the integrated exam.',
    },
  },
]

export interface RefDoc {
  slug: string
  icon: string
  title: { es: string; en: string }
  desc: { es: string; en: string }
}

export const REF_DOCS: RefDoc[] = [
  {
    slug: 'glosario', icon: '📖',
    title: { es: 'Glosario', en: 'Glossary' },
    desc: { es: '~138 términos del ecosistema RAG/agentes.', en: '~138 terms across the RAG/agents ecosystem.' },
  },
  {
    slug: 'tecnologias-comparadas', icon: '⚖️',
    title: { es: 'Tecnologías comparadas', en: 'Technologies compared' },
    desc: { es: 'Tablas comparativas + crítica honesta al stack Lang*.', en: 'Comparison tables + an honest critique of the Lang* stack.' },
  },
  {
    slug: 'rag-sin-langchain', icon: '🔄',
    title: { es: 'RAG sin LangChain', en: 'RAG without LangChain' },
    desc: { es: 'El mismo RAG con LlamaIndex, Haystack y el SDK nativo.', en: 'The same RAG with LlamaIndex, Haystack, and the native SDK.' },
  },
  {
    slug: 'agentes-sin-langchain', icon: '🔀',
    title: { es: 'Agentes sin LangChain', en: 'Agents without LangChain' },
    desc: { es: 'El mismo agente con bucle nativo, CrewAI, AutoGen/AG2 y Pydantic-AI.', en: 'The same agent with a native loop, CrewAI, AutoGen/AG2, and Pydantic-AI.' },
  },
  {
    slug: 'panorama-bases-de-datos', icon: '🗄️',
    title: { es: 'Panorama: bases de datos', en: 'Landscape: databases' },
    desc: { es: 'El mercado de almacenamiento para sistemas de IA.', en: 'The storage market for AI systems.' },
  },
  {
    slug: 'panorama-procesos', icon: '⚙️',
    title: { es: 'Panorama: procesos', en: 'Landscape: processes' },
    desc: { es: 'Orquestación, serving, pipelines y despliegue.', en: 'Orchestration, serving, pipelines, and deployment.' },
  },
  {
    slug: 'panorama-estrategias-rag', icon: '🧭',
    title: { es: 'Panorama: estrategias RAG', en: 'Landscape: RAG strategies' },
    desc: { es: '~32 técnicas y arquitecturas de RAG avanzado.', en: '~32 advanced RAG techniques and architectures.' },
  },
  {
    slug: 'catalogo-nodos', icon: '🧩',
    title: { es: 'Catálogo de nodos', en: 'Node catalog' },
    desc: { es: 'Referencia de nodos del lenguaje de flujos de RAGorbit.', en: 'Reference for the RAGorbit flow language nodes.' },
  },
  {
    slug: 'plantillas-mapeadas', icon: '🗂️',
    title: { es: 'Plantillas mapeadas', en: 'Mapped templates' },
    desc: { es: 'Las 10 plantillas de industria explicadas y mapeadas.', en: 'The 10 industry templates explained and mapped.' },
  },
  {
    slug: 'cobertura-ibm-coursera', icon: '🎓',
    title: { es: 'Cobertura IBM/Coursera', en: 'IBM/Coursera coverage' },
    desc: { es: 'Mapeo del syllabus de IBM Coursera al curso.', en: 'Mapping the IBM Coursera syllabus onto the course.' },
  },
]

export type DocType = 'guia' | 'ejercicios' | 'soluciones' | 'lab'

export const DOC_TABS: { type: DocType; label: { es: string; en: string }; icon: string }[] = [
  { type: 'guia',        label: { es: 'Guía', en: 'Guide' },          icon: '📘' },
  { type: 'ejercicios',  label: { es: 'Ejercicios', en: 'Exercises' }, icon: '🎯' },
  { type: 'soluciones',  label: { es: 'Soluciones', en: 'Solutions' }, icon: '✅' },
  { type: 'lab',         label: { es: 'Taller', en: 'Lab' },           icon: '🧪' },
]

export const UI = {
  brandBadge: { es: 'Curso · gratis y open source', en: 'Course · free & open source' },
  heroTitle: { es: 'Curso de RAG e IA Agéntica', en: 'RAG & Agentic AI Course' },
  heroSub: {
    es: 'De cero a experto. Cada tema en tres capas: concepto → desde cero en Python → framework real. Con ejercicios que ejecutas en el navegador.',
    en: 'From zero to expert. Every topic in three layers: concept → from scratch in Python → real framework. With exercises you run in the browser.',
  },
  modulesHeading: { es: 'Módulos', en: 'Modules' },
  refHeading: { es: 'Base de conocimiento (vendor-neutral)', en: 'Knowledge base (vendor-neutral)' },
  methodHeading: { es: 'El método: tres capas', en: 'The method: three layers' },
  layers: [
    { n: '①', t: { es: 'Concepto / diseño', en: 'Concept / design' }, d: { es: 'Por qué, cuándo y qué reemplaza.', en: 'Why, when, and what it replaces.' } },
    { n: '②', t: { es: 'Desde cero (Python puro)', en: 'From scratch (pure Python)' }, d: { es: 'Implementas el mecanismo a mano. Solo stdlib, determinista, ejecutable aquí.', en: 'You implement the mechanism by hand. Stdlib-only, deterministic, runnable here.' } },
    { n: '③', t: { es: 'Framework real', en: 'Real framework' }, d: { es: 'Cómo se hace en herramientas de producción (LangChain, LlamaIndex, CrewAI…).', en: 'How it is done in production tools (LangChain, LlamaIndex, CrewAI…).' } },
  ],
  viewRepo: { es: 'Ver en GitHub', en: 'View on GitHub' },
  backToCourse: { es: '← Volver al curso', en: '← Back to course' },
  runnable: { es: 'Ejecutable en el navegador', en: 'Runnable in the browser' },
  tool: {
    badge: { es: 'La herramienta del curso', en: 'The tool behind the course' },
    title: { es: 'RAGorbit', en: 'RAGorbit' },
    body: {
      es: 'Cada tema del curso está anclado a un bloque de RAGorbit y a una de sus 10 plantillas de industria: dibujas el flujo en un lienzo y obtiene un proyecto Python desplegable, con mocks y tests. Al terminar el curso podrás reconstruir esas plantillas desde cero — y diseñar las tuyas.',
      en: 'Every topic in the course is anchored to a RAGorbit block and to one of its 10 industry templates: you draw the flow on a canvas and get a deployable Python project, with mocks and tests. By the end of the course you can rebuild those templates from scratch — and design your own.',
    },
    cta: { es: 'Ver RAGorbit →', en: 'See RAGorbit →' },
    docs: { es: 'Documentación', en: 'Documentation' },
    note: {
      es: 'Gratis y open source, igual que el curso. Un solo archivo, sin dependencias.',
      en: 'Free and open source, like the course. One file, zero dependencies.',
    },
  },
}

export const REPO_URL = 'https://github.com/slothlabsorg/rag-course'

export function moduleLabel(n: number): string {
  return `M${n}`
}
