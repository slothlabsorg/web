# HANDOFF — Contexto para continuar generando este curso

> **Para una sesión o modelo nuevo que NO conoce el chat donde nació esto.** Léelo completo antes de generar más material. Todo lo necesario está aquí o en los archivos que se citan.

## 1. Qué es este proyecto

- Repo: `/Users/dany/dev/ragorbit`. Contiene **RAGorbit** (un constructor visual de estrategias RAG/agénticas que genera artefactos Python) y este **curso** (`rag-training/`) que enseña, desde cero, todo lo que RAGorbit usa.
- RAGorbit en una frase: dibujas un grafo de nodos → se guarda como **Flow IR** (JSON) → un **codegen** produce un proyecto Python con `app/ mocks/ tests/`. Hay **53 tipos de nodo** en **13 categorías**. Lee `docs/01-concepts.md` (contrato/Flow IR) y `docs/02-node-catalog.md` (catálogo) — son la fuente de verdad técnica.
- Hay **10 templates** de industria en `examples/*/flow.json` (aerolínea, banca, salud, seguros, legal, retail, telecom, manufactura, RRHH, logística). Cada uno con su `README.md`.
- El curso enseña a entender, usar y **reconstruir desde cero** esos templates.

## 2. Objetivo del curso y syllabus

- **Fuente de verdad del temario:** [`PLAN.md`](./PLAN.md). Cada módulo (M0–M11) está especificado en `PLAN.md §6` (objetivos, conceptos, nodos, tecnologías que compiten, template(s), taller con *expected results*).
- El temario IBM de Coursera fue **solo referencia** para asegurar cobertura (ver `PLAN.md §11`); **no** estamos siguiendo ese curso. Construimos material propio aquí.
- Idioma: **español**. Audiencia: alguien que **no sabe nada** de RAG/IA pero programa en Python.

## 3. Método de autoría (OBLIGATORIO para mantener consistencia)

Enfoque **tri-modal** en cada tema y taller:
1. **① Diseño/concepto** — qué es, por qué existe, **cuándo usar / cuándo NO**, qué tecnologías lo reemplazan y trade-offs.
2. **② Desde cero (Python puro)** — implementar el mecanismo a mano para entenderlo.
3. **③ Framework real** — cómo se hace en la herramienta de producción (LangChain/LangGraph/LlamaIndex/CrewAI/AutoGen/MCP…), con profundidad.

Ciclo por módulo: **GUÍA → EJERCICIOS (con respuesta) → TALLER (con *expected results*) → CHECKPOINT**.

> **CONVENCIÓN OBLIGATORIA (capa ③ enseñada, no asumida).** La capa ③ NO debe aparecer "de golpe" solo en `lab/solucion_framework.py`. Cada `guia.md` incluye, antes del Checkpoint, una sección **`## N. La capa ③ explicada: <framework> desde cero`** que: (a) explica qué es el framework y por qué existe, para quien solo sabe Python; (b) trae una **tabla puente "lo que hiciste a mano (②) → la pieza del framework (③)"**; (c) enseña cada API que usa el lab, una por una, con mini-ejemplos; (d) hace un **recorrido bloque por bloque de `solucion_framework.py`**; (e) da "cuándo usar/NO" y gotchas. Las abstracciones base de LangChain (Document, Embeddings, VectorStore, Retriever, chat models, ChatPromptTemplate, LCEL/`|`) se enseñan a fondo en **M1 §11** (`01-fundamentos/guia.md`); los demás módulos ponen un recordatorio + cross-link a M1 §11 y enseñan SOLO lo nuevo. Además, el `lab/enunciado.md` plantea la capa ③ como **tarea guiada** (pistas escalonadas → la sección de la guía), no como "solo léelo".

## 4. Convenciones de archivos (cada módulo `NN-nombre/`)

```
NN-nombre/
  guia.md            # guía integral del módulo, multi-sección, con diagramas ASCII y "cuándo usar / alternativas".
                     #   Ancla cada tema a su nodo de RAGorbit y al/los template(s).
  ejercicios.md      # 12–20 ejercicios (opción múltiple razonada, "predice la salida", "encuentra el bug", "elige la tecnología"). SIN respuestas.
  soluciones.md      # respuestas razonadas de TODOS los ejercicios.
  lab/
    enunciado.md     # taller realista: contexto de negocio, datos, tarea, pistas escalonadas.
    datos/           # datos de muestra (JSON/txt) si aplica.
    expected.md      # resultado esperado CONCRETO (qué imprime/devuelve/pasa).
    solucion_scratch.py     # capa ②: corre SOLO con stdlib (sin red, sin pip). Determinista.
    solucion_framework.py   # capa ③: código real con framework (ilustrativo; cabecera dice qué `pip install` requiere; NO se ejecuta aquí).
    solucion.md      # explicación de ambas soluciones y por qué.
```
- **Tono:** didáctico, directo, con ejemplos. Profundidad alta (es estudio a tiempo completo, no resúmenes).
- **Cross-links:** usa rutas relativas a `referencia/` y a `examples/`/`docs/` del repo.

## 5. Restricción de entorno (CRÍTICA para los talleres)

- En esta máquina **no hay red utilizable y `pip` está roto** (Python 3.14 + libexpat) — no se pueden instalar paquetes ni descargar modelos/embeddings.
- Por eso **la capa ② (scratch) DEBE correr con la librería estándar de Python** y ser **determinista**:
  - Embeddings de juguete: hashing / bag-of-words / char-n-grams + similitud coseno a mano.
  - Vector store: diccionario/listas en memoria.
  - LLM: función "fake" determinista (plantillas) — igual que el runtime mock de RAGorbit (`ragorbit/runtime/`).
  - Tools/servicios: stubs en memoria o `http.server` de stdlib.
- La capa ③ (frameworks) se entrega como **código real comentado** que el alumno puede ejecutar cuando tenga red/pip; no se ejecuta en este entorno. Marca en la cabecera: `# Requiere: pip install langchain langgraph ...`.
- **Verificación:** los `solucion_scratch.py` deben poder correrse con `python3 archivo.py` y producir lo que dice `expected.md`. Si generas un módulo, intenta `python3 -m py_compile` y, si es runnable, ejecútalo para confirmar el expected.

## 6. Estado de generación

| Módulo | Carpeta | Estado |
|--------|---------|--------|
| referencia | `referencia/` | ✅ generado (catalogo-nodos, glosario, tecnologias-comparadas, plantillas-mapeadas, cobertura-ibm-coursera) + **alternativas a Lang\***: `rag-sin-langchain.md` (LlamaIndex/Haystack/SDK nativo), `agentes-sin-langchain.md` (loop nativo/CrewAI/AutoGen/Pydantic-AI), y sección de críticas al stack LangChain/LangGraph/LangSmith dentro de `tecnologias-comparadas.md`. Objetivo: ingeniero de IA completo, no experto solo en `lang*`. Si creas nuevos módulos con framework, mantén también el enfoque multi-framework y enlaza estos docs. Además, **panoramas vendor-neutral del mercado**: `panorama-bases-de-datos.md` (DBs/almacenamiento), `panorama-procesos.md` (orquestación/serving/datos/deploy) y `panorama-estrategias-rag.md` (arquitecturas RAG). |
| M0 | `00-setup/` | ✅ generado |
| M1 | `01-fundamentos/` | ✅ generado |
| M2 | `02-ingesta/` | ✅ generado |
| M3 | `03-embeddings-y-stores/` | ✅ generado |
| M4 | `04-retrieval-y-query/` | ✅ generado |
| M5 | `05-generacion-y-logic/` | ✅ generado |
| M6 | `06-agentes-i/` | ✅ generado |
| M7 | `07-agentes-ii/` | ✅ generado |
| M8 | `08-mcp/` | ✅ generado |
| M9 | `09-produccion-y-seguridad/` | ✅ generado |
| M10 | `10-multimodal/` | ✅ generado |
| M11 | `11-capstone/` | ✅ generado |

> **El curso está COMPLETO: M0–M11 + `referencia/` (5 docs) generados.** Todos los `solucion_scratch.py` compilan y corren con stdlib, y cada `guia.md` tiene su sección "La capa ③ explicada" (ver convención en §3). Si ves un módulo marcado ✅ pero su carpeta está incompleta, regéneralo siguiendo §4.

## 7. Cómo continuar (receta para regenerar un módulo o crear uno nuevo)

1. Lee: este HANDOFF (§3–§5), `PLAN.md §6` (la entrada del módulo objetivo), `referencia/catalogo-nodos.md` y `referencia/tecnologias-comparadas.md`, y **un módulo ya hecho como plantilla de estilo** (p.ej. `06-agentes-i/`).
2. Lee los `examples/*/flow.json` del/los template(s) que el módulo domina (ver `PLAN.md §8`).
3. Genera la carpeta `NN-nombre/` con los archivos de §4, respetando el método tri-modal y la restricción de entorno (§5).
4. Verifica: `python3 -m py_compile NN-nombre/lab/solucion_scratch.py` y, si corre, ejecútalo y confirma `expected.md`.
5. Actualiza la tabla de §6 (marca el módulo ✅).
6. Mantén el español, la profundidad y los cross-links.

## 8. Polaridad de calidad (qué hace bueno a este material)

- Cada tecnología con **por qué / cuándo / alternativas** (no solo "cómo").
- Talleres **realistas** (briefs de negocio creíbles) con **expected results concretos** y solución en las **dos capas** (scratch + framework).
- El alumno, tras leer la guía del módulo, **puede resolver el taller** sin ayuda externa.
- Todo conecta con los **nodos de RAGorbit** y los **10 templates**, para que el alumno pueda al final **reconstruirlos** y **diseñar** nuevos.
