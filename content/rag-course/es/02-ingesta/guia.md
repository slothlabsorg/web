# M2 · Ingesta de datos — `loader` + `ingest`

> **Objetivo del módulo:** entender cómo los datos crudos (PDFs, tablas, web, SQL, S3, imágenes) se convierten en chunks con metadata listos para ser indexados en un vector store.
>
> **Nodos RAGorbit cubiertos:** `loader.*`, `ingest.chunker`, `ingest.metadata`
>
> **Templates de referencia:** `05-legal-contract-review`, `02-banking-credit-scoring`, `08-manufacturing-maintenance-rag`, `04-insurance-claims`

---

## Índice

1. [El problema de la ingesta](#1-el-problema-de-la-ingesta)
2. [Fuentes de datos y loaders](#2-fuentes-de-datos-y-loaders)
3. [Parsing: de formato bruto a texto estructurado](#3-parsing-de-formato-bruto-a-texto-estructurado)
4. [Chunking a fondo](#4-chunking-a-fondo)
5. [Metadata y su rol en filtros duros](#5-metadata-y-su-rol-en-filtros-duros)
6. [Multimodal: tablas y diagramas](#6-multimodal-tablas-y-diagramas)
7. [Comparativa de frameworks de ingesta](#7-comparativa-de-frameworks-de-ingesta)
8. [Pipelining completo en RAGorbit](#8-pipelining-completo-en-ragorbit)
9. [Cuándo usar / cuándo no / alternativas](#9-cuándo-usar--cuándo-no--alternativas)
10. [La capa ③ explicada: chunking con LangChain desde cero](#10-la-capa--explicada-chunking-con-langchain-desde-cero)
11. [Checkpoint](#11-checkpoint)

---

## 1. El problema de la ingesta

Antes de que un LLM pueda responder preguntas sobre documentos de tu empresa, esos documentos deben pasar por un **pipeline de ingesta**: carga → parsing → chunking → metadata → indexado.

Este proceso parece simple pero esconde la mayoría de los fallos de un sistema RAG en producción. Cuatro problemas frecuentes:

| Problema | Síntoma en producción | Causa raíz |
|---------|----------------------|------------|
| Chunks demasiado grandes | El LLM ignora partes del contexto (ventana llena) | `chunkSize` excesivo |
| Chunks demasiado pequeños | El LLM no tiene suficiente contexto para responder | `chunkSize` insuficiente o `overlap` cero |
| Cláusula partida | La respuesta mezcla obligaciones de cláusulas distintas | Chunking por caracteres sobre texto legal |
| Sin metadata | No puedes filtrar por tipo de documento ni fecha | `ingest.metadata` ausente |

El enfoque correcto es elegir la **estrategia de chunking** según la estructura del documento y enriquecer cada chunk con **metadata** que permita filtros duros en el retriever.

```
Documentos crudos
      │
      ▼
 ┌─────────┐    parsing    ┌──────────────┐   chunking   ┌────────────┐
 │ Loader  │ ────────────▶ │  texto limpio│ ────────────▶ │  chunks[]  │
 └─────────┘               └──────────────┘              └────────────┘
                                                                │
                                                          metadata
                                                                │
                                                                ▼
                                                    ┌─────────────────────┐
                                                    │ {text, metadata,    │
                                                    │  source, chunk_id}  │
                                                    └─────────────────────┘
```

---

## 2. Fuentes de datos y loaders

### 2.1 Los seis tipos de loader en RAGorbit

El catálogo `docs/02-node-catalog.md` define seis tipos de `loader.*`. Todos producen `Documents` (lista de objetos `{text, metadata}`):

| Nodo | Fuente | Config clave | Cuándo usarlo |
|------|--------|-------------|---------------|
| `loader.pdf` | PDFs de texto | `ocr: false/true` | Contratos, políticas, manuales en PDF seleccionable |
| `loader.multimodal` | PDFs con tablas y diagramas | `extractTables: true`, `describeImages: true`, `sectionScheme` | Manuales técnicos (AMM), fichas de seguros con imágenes |
| `loader.tabular` | CSV/Parquet/Excel | `schemaHint` | Datos financieros, inventarios, registros de sensores |
| `loader.web` | Páginas web / sitemaps | `urls[]`, `crawlDepth` | FAQs públicas, documentación de APIs, noticias |
| `loader.s3` | Objetos en S3/GCS | `bucket`, `prefix` | Repositorios de documentos a escala (millones de PDFs) |
| `loader.sql` | Filas de base de datos | `query` | Catálogos de productos, datos de clientes, logs |

### 2.2 Cuándo OCR y cuándo no

Los PDFs tienen dos variantes:
- **PDF seleccionable (text-based):** el texto está codificado en el archivo. `loader.pdf` con `ocr: false` extrae el texto en milisegundos.
- **PDF escaneado (image-based):** el PDF es una foto. Se necesita OCR. `ocr: true` activa Tesseract o un servicio externo (más lento y costoso).

**Regla práctica:** usa `ocr: true` solo cuando confirmes que el PDF es escaneado. El OCR introduce errores tipográficos que contaminan el índice.

### 2.3 loader.sql: convertir filas en documentos

`loader.sql` ejecuta una query y convierte cada fila en un documento. Ejemplo: la query `SELECT sku, descripcion, especificaciones FROM productos WHERE activo = true` produce un documento por producto. Esto permite hacer RAG sobre catálogos de productos sin exportarlos a CSV.

**Cuándo usar:** cuando los datos están en una BD operacional y quieres mantener la ingesta siempre sincronizada con la fuente (ejecutando la query periódicamente).

**Alternativa:** `loader.s3` o `loader.tabular` si los datos ya están exportados.

### 2.4 Conexión con los templates

- **Template 02 (Banca):** usa `loader.pdf` (declaraciones fiscales) + `loader.tabular` (CSV financiero) → `ingest.chunker` con `strategy: by-section`.
- **Template 05 (Legal):** usa `loader.pdf` (contratos, playbook, normativa) → `ingest.chunker` con `strategy: by-clause`.
- **Template 08 (Manufactura):** usa `loader.multimodal` con `sectionScheme: ATA` para preservar la estructura de capítulos del manual.
- **Template 04 (Seguros):** usa `loader.multimodal` para extraer tablas de cobertura y describir fotografías de daños.

---

## 3. Parsing: de formato bruto a texto estructurado

El **parsing** convierte el binario del formato original (PDF, XLSX, HTML) en texto limpio. Es el paso más silencioso del pipeline pero el que más afecta la calidad del índice.

### 3.1 PDF parsing bajo el capó

`loader.pdf` usa bibliotecas como `pdfminer` o `pypdf` para extraer el texto manteniendo el orden de lectura. Los problemas más comunes:

- **Columnas múltiples:** un PDF a dos columnas puede extraerse como texto entrelazado si la biblioteca sigue el flujo de caracteres en lugar del flujo visual.
- **Encabezados/pies de página:** pueden contaminar el texto principal. Las herramientas avanzadas (Unstructured.io) detectan y filtran estas regiones.
- **Caracteres especiales:** ligaduras tipográficas (`ﬁ`, `ﬂ`), caracteres de guión (`—`, `-`, `–`) y comillas curvas (`"`, `"`) pueden quedar como caracteres raros si el PDF no embebe las fuentes correctamente.

**Solución práctica:** normalizar el texto después de la extracción:
```python
import unicodedata
texto_limpio = unicodedata.normalize("NFKC", texto_crudo)
```

### 3.2 Tabular parsing

`loader.tabular` lee CSV/Parquet con `pandas` (o equivalente). La config `schemaHint` ayuda al loader a interpretar columnas ambiguas. Por ejemplo, una columna `periodo` puede ser un string "2023-Q3" o un entero `20234`.

**Conversión a texto:** cada fila se convierte en un texto legible:
```
concepto: ingreso_anual | valor: 85000 | periodo: 2023
```

Esto permite buscar por similitud semántica en datos que de otra forma serían solo números.

### 3.3 Web parsing

`loader.web` descarga HTML y extrae el texto visible (eliminando scripts, estilos, menús de navegación). La profundidad de rastreo (`crawlDepth`) controla cuántos niveles de links seguir.

**Problema:** el HTML web cambia con frecuencia. Un sistema RAG que indexa contenido web necesita re-ingesta periódica. Si el contenido es estable (documentación técnica versionada), prefiere `loader.s3` o `loader.pdf`.

---

## 4. Chunking a fondo

El chunking es la decisión de diseño más importante del pipeline de ingesta. Un chunk mal dimensionado o mal delimitado contamina toda la cadena: los embeddings son menos precisos, el retriever devuelve contexto incorrecto y el LLM responde con información mezclada.

### 4.1 Estrategia 1 — Fixed chunking (tamaño fijo)

Divide el texto en bloques de N caracteres (o N tokens), con un overlap de O caracteres entre bloques consecutivos.

```
Texto original:
  [──────── 1000 chars ────────][──────── 1000 chars ────────]
                            [── overlap 200 ──]

Chunks resultantes:
  Chunk 0: chars 0..1000
  Chunk 1: chars 800..1800    ← overlap cubre el contexto de transición
  Chunk 2: chars 1600..2600
```

**Diagrama ASCII:**
```
TEXTO: "La indemnización...límite de 2×...plazo de 30 días..."
        |<──── 1000 ────>|<──200──>|<──── 1000 ────>|
        Chunk 0           overlap    Chunk 1
```

**Cuándo usar:**
- Documentos sin estructura semántica clara (texto continuo, transcripciones de voz).
- Como fallback cuando no tienes un parser estructural.
- Prototipos rápidos.

**Cuándo NO usar:**
- Contratos y normativas (parte cláusulas a la mitad).
- Manuales técnicos con tablas y procedimientos (mezcla pasos de procedimientos distintos).
- Cualquier documento donde la unidad semántica natural no sea el párrafo.

**Config en RAGorbit:**
```json
{ "strategy": "recursive", "chunkSize": 1000, "overlap": 150 }
```

---

### 4.2 Estrategia 2 — Recursive chunking (separadores jerárquicos)

Prueba separadores en orden de preferencia semántica. Si el chunk resultante supera `chunkSize`, aplica el siguiente separador.

Jerarquía típica: `\n\n` (párrafos) → `\n` (líneas) → `. ` (oraciones) → ` ` (palabras)

```
TEXTO con párrafos bien marcados:
┌──────────────────────────────────────┐
│ Párrafo 1 (400 chars)                │ ← chunk 0 (cabe en 1000)
├──────────────────────────────────────┤
│ Párrafo 2 (600 chars)                │ ← chunk 1 (cabe en 1000)
├──────────────────────────────────────┤
│ Párrafo 3 larguísimo (2000 chars)    │ ← se parte por oraciones
│   Oración 1 (400)                    │   chunk 2
│   Oración 2 (300)                    │   chunk 3
│   Oración 3 + Oración 4 (900)        │   chunk 4
└──────────────────────────────────────┘
```

**Cuándo usar:**
- Documentos con estructura de párrafos (artículos, informes, políticas de empresa con secciones).
- Cuando quieres respetar la estructura natural sin conocer el dominio.

**Cuándo NO usar:**
- Cuando los documentos tienen estructura de dominio muy específica (cláusulas numeradas, capítulos ATA, tablas). En ese caso, usa estrategias semánticas de dominio.

**Config en RAGorbit:** es el default — `strategy: recursive`.

---

### 4.3 Estrategia 3 — Semantic chunking (por similitud semántica)

Calcula embeddings de oraciones consecutivas y corta donde la similitud cae por debajo de un umbral. Cada chunk es un "bloque temático" coherente.

```
Oraciones con su embedding:
  S1 ─── S2 ─── S3 ─── S4 ─── S5 ─── S6
         │similitud alta│      │baja│   │alta│
                          ← corte →    ← corte →

Chunks resultantes:
  Chunk A: S1+S2+S3
  Chunk B: S4
  Chunk C: S5+S6
```

**Ventaja:** los chunks tienen coherencia semántica aunque el documento no tenga marcas estructurales.

**Desventaja:** requiere calcular embeddings durante la ingesta (más costoso), y el umbral hay que calibrarlo por tipo de documento.

**Cuándo usar:**
- Textos narrativos sin estructura explícita (memorias anuales, testimonios, transcripciones).
- Cuando los párrafos visibles no corresponden a unidades semánticas reales.

**En RAGorbit:** no hay un nodo `strategy: semantic` nativo. Se implementa en la capa ③ con LangChain `SemanticChunker` o LlamaIndex `SemanticSplitterNodeParser`.

---

### 4.4 Estrategia 4 — By-layout chunking (por estructura visual/HTML)

Aprovecha la estructura del documento: títulos, subtítulos, listas, tablas. Herramientas como Unstructured.io clasifican cada bloque del PDF ("Título", "NarrativeText", "Table", "ListItem") y los agrupan semánticamente.

```
PDF con estructura:
┌─────────────────────────────────────────┐
│ [Título] Capítulo 3. Resultados         │ ─── Chunk "Capítulo 3"
│ [NarrativeText] El análisis muestra...  │
│ [Table] | Año | Ingresos | Costos |     │ ─── Chunk tabla (→ JSON)
│         | 2022 | 1.2M    | 0.8M  |     │
│ [NarrativeText] La tabla anterior...   │ ─── Chunk "texto post-tabla"
└─────────────────────────────────────────┘
```

**Cuándo usar:**
- Informes financieros con tablas y gráficas.
- Documentos técnicos donde la jerarquía visual (H1, H2, H3) es semánticamente relevante.

**Herramienta:** Unstructured.io (open source con API de nube). Ver §7.

---

### 4.5 Estrategia 5 — By-clause/section chunking (por dominio)

Define separadores específicos del dominio: `CLÁUSULA N.` (contratos), `ATA-XX-YY-ZZ` (manuales aeronáuticos), `Artículo N.` (normativas), `SECCIÓN N.` (políticas).

**Es la estrategia más precisa cuando el dominio tiene estructura predecible.**

```
Contrato legal:
CLÁUSULA 1. OBJETO  ←── separador de dominio
  texto...
CLÁUSULA 2. DURACIÓN  ←── separador de dominio
  texto...
CLÁUSULA 3. PAGO  ←── separador de dominio
  texto...

→ 3 chunks perfectos, sin overhead de overlap
```

**Cuándo usar:**
- Contratos (por cláusula) — template 05-legal.
- Manuales técnicos con numeración ATA — template 08-manufacturing.
- Normativas y reglamentos con artículos numerados.
- Políticas de empresa con secciones nombradas.

**Cuándo NO usar:**
- Documentos sin estructura semántica clara (texto narrativo).
- Cuando los separadores no son consistentes en todos los documentos del corpus.

**Config en RAGorbit:**
```json
{ "strategy": "by-clause", "chunkSize": 900, "overlap": 120 }
```

---

### 4.6 El parámetro overlap

El overlap es el número de caracteres (o tokens) compartidos entre chunks consecutivos. Su función es preservar el contexto en la frontera entre chunks.

```
Sin overlap:
  Chunk 0: "...La cláusula establece que el plazo"
  Chunk 1: "será de 30 días naturales. La penalización..."
  ← La oración queda partida; el retriever puede devolver solo Chunk 1
    y el LLM no sabe qué plazo son "30 días".

Con overlap de 50 chars:
  Chunk 0: "...La cláusula establece que el plazo"
  Chunk 1: "...que el plazo será de 30 días naturales. La penalización..."
  ← El contexto "que el plazo" se repite en Chunk 1, dando coherencia.
```

**Regla empírica:**
- Overlap de 10-15% del `chunkSize` para texto narrativo (ej: `chunkSize: 1000`, `overlap: 150`).
- Overlap bajo o cero para chunks semánticos (by-clause, by-section): las cláusulas ya son unidades autónomas.
- Overlap excesivo (>30%) aumenta el tamaño del índice sin beneficio proporcional.

---

### 4.7 Comparativa de estrategias de chunking

| Estrategia | Determinista | Requiere estructura | Metadata natural | Caso ideal |
|-----------|-------------|--------------------|--------------------|-----------|
| Fixed | sí | no | no | Prototipo rápido, texto libre |
| Recursive | sí | párrafos | no | Artículos, informes, políticas |
| Semantic | no | no (usa embeddings) | no | Textos narrativos densos |
| By-layout | sí (con Unstructured) | estructura visual | tipo de bloque | Informes con tablas, PDFs ricos |
| By-clause/section | sí | estructura de dominio | clausula_id, tipo | Contratos, manuales técnicos, normativas |

---

## 5. Metadata y su rol en filtros duros

### 5.1 Qué es metadata en chunks

Cada chunk en el vector store es más que texto + embedding. Lleva un diccionario de metadata que el retriever puede usar como filtro **antes** de calcular similitud. Esto es lo que los docs de RAGorbit llaman "filtros duros como guardrail".

```python
chunk = {
    "text": "CLÁUSULA 9. CONFIDENCIALIDAD ...",
    "embedding": [0.023, -0.117, ...],   # generado por model.embedding
    "metadata": {
        "clausula_id": 9,
        "tipo": "confidencialidad",
        "contrato": "CSP-2024-0087",
        "fecha": "2024-01-15",
        "source": "contrato_muestra.txt"
    }
}
```

### 5.2 Filtros duros vs. filtros blandos

- **Filtro duro (hard filter):** condición `WHERE` en la consulta al vector store. Los chunks que no cumplen la condición no se calculan, independientemente de su similitud.
- **Filtro blando:** se recuperan N chunks por similitud y luego se filtra. Los chunks "incorrectos" aún consumen topK.

**Ejemplo de filtro duro en RAGorbit:**
```json
{
  "type": "retrieval.vector",
  "config": {
    "topK": 5,
    "hardFilters": ["aircraft_type", "ata_chapter"]
  }
}
```

En tiempo de consulta, la query SQL a pgvector es:
```sql
SELECT * FROM chunks
WHERE aircraft_type = 'A320' AND ata_chapter = '32'
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

Un técnico del A320 nunca verá límites de torque del 787, aunque el embedding sea similar.

### 5.3 Campos de metadata por dominio

Cada dominio tiene sus campos canónicos. La tabla del `ingest.metadata` en RAGorbit soporta cualquier campo:

| Dominio | Campos de metadata | Para qué filtrar |
|---------|-------------------|-----------------|
| Aeronáutico (template 08) | `aircraft_type`, `ata_chapter`, `revision_date` | Solo chunks del avión correcto y el capítulo correcto |
| Financiero (template 02) | `doc_type`, `period` | Solo documentos del período fiscal del solicitante |
| Legal (template 05) | `clausula_id`, `tipo` | Solo cláusulas de un tipo específico |
| Seguros (template 04) | `fare_class`, `cobertura` | Solo pólizas de la clase de tarifa contratada |
| RRHH (template 09) | `departamento`, `nivel`, `version` | Solo políticas vigentes del departamento |

### 5.4 Cómo el nodo `ingest.metadata` produce estos campos

En RAGorbit, el nodo `ingest.metadata` recibe `Documents` del chunker y etiqueta cada chunk. Puede enriquecer la metadata de tres formas:

1. **Propagación del loader:** el loader ya añade `source`, `page_number`, etc.
2. **Extracción del texto:** regex o patrones del dominio (ej: extraer el número de cláusula del texto del chunk).
3. **Contexto de sesión:** metadata del tiempo de ejecución (ej: `aircraft_type` viene del contexto de la sesión del usuario).

### 5.5 Metadata y reproducibilidad

Los campos `contrato`, `fecha` y `revision_date` permiten re-ejecutar exactamente la misma consulta histórica. Si un auditor pregunta "¿qué versión del manual respondió al técnico el 15 de marzo de 2024?", el sistema puede filtrar por `revision_date <= 2024-03-15` y reproducir la respuesta.

---

## 6. Multimodal: tablas y diagramas

### 6.1 El problema con PDFs ricos

Un PDF de manual técnico no es solo texto. Contiene:
- **Tablas de tolerancias:** "torque máximo del perno: 45 Nm ± 5%"
- **Diagramas hidráulicos:** números de línea, válvulas, sensores
- **Figuras con leyenda:** "Fig. 32-11-00-991-010"

Si solo extraes el texto, pierdes el contenido semántico de tablas y diagramas. El retriever no podrá encontrar "torque del perno" porque esa información está en una celda de tabla que el extractor de texto convirtió en "45 Nm ± 5%" sin contexto de fila/columna.

### 6.2 Tablas → JSON

`loader.multimodal` con `extractTables: true` detecta tablas en el PDF y las convierte en JSON estructurado:

```json
{
  "tipo": "tabla",
  "titulo": "Límites de tolerancia — Tren de aterrizaje principal",
  "datos": [
    {"parametro": "juego_lateral_pivote", "min": "0.00 mm", "max": "0.35 mm", "unidad": "mm"},
    {"parametro": "torque_perno_superior", "nominal": "45", "tolerancia": "±5%", "unidad": "Nm"}
  ],
  "referencia": "Tabla 32-11-00-991-001"
}
```

Este JSON se indexa como texto. Ahora la query "¿cuál es el juego lateral máximo del pivote?" puede recuperar este chunk y el LLM puede responder "0.35 mm" con cita exacta.

### 6.3 Diagramas → visión → texto

Para los diagramas, `loader.multimodal` con `describeImages: true` envía cada figura a `model.vision` (Claude Opus 4.8 u otro modelo multimodal). El modelo devuelve una descripción en texto:

```
"Diagrama del sistema hidráulico del tren de aterrizaje principal del A320.
Muestra el actuador hidráulico (referencia 10-43200-00) conectado a la línea
hidráulica verde (sistema 1) mediante dos válvulas de cierre. La presión
nominal del sistema es 3000 PSI. Figura 32-21-11-991-020."
```

Esta descripción se indexa y recupera como texto normal. El retriever puede encontrar "actuador hidráulico" aunque la figura no tenga ese texto explícito.

### 6.4 sectionScheme: ATA

El parámetro `sectionScheme: ATA` le indica al loader que preserve la jerarquía numérica ATA (Capítulo-Sección-Tema: `32-11-00`). Esto permite:

- **Chunking por sección ATA:** cada sección es un chunk autónomo con `metadata.ata_chapter`.
- **Filtros duros:** `retrieval.vector` puede filtrar por `ata_chapter: "32"` antes de buscar.

**Cuándo usar `sectionScheme`:** siempre que el documento tenga una jerarquía de numeración estándar (ATA, ISO, normativa con artículos).

### 6.5 Limitaciones y cuándo escalar

El pipeline multimodal es más lento y costoso:
- Extracción de tablas: +50-200ms por página con tablas.
- Visión por diagrama: 1-3s por llamada al modelo de visión, coste por token adicional.

**Regla:** solo usa `extractTables: true` y `describeImages: true` cuando el contenido tabular o visual es esencial para responder las preguntas del usuario. Para un chatbot de políticas de RRHH, no necesitas visión. Para el RAG de manuales de mantenimiento aeronáutico, es imprescindible.

---

## 7. Comparativa de frameworks de ingesta

### 7.1 LangChain loaders

LangChain incluye más de 100 loaders en `langchain-community`. Son generalmente simples envoltorios de bibliotecas Python:

```python
from langchain_community.document_loaders import PyPDFLoader, CSVLoader, WebBaseLoader

# PDF
loader = PyPDFLoader("contrato.pdf")
docs = loader.load()  # una página = un Document

# CSV
loader = CSVLoader("datos.csv", metadata_columns=["doc_type", "period"])
docs = loader.load()  # una fila = un Document

# Web
loader = WebBaseLoader(["https://example.com/politica"])
docs = loader.load()
```

**Pros:** fácil de instalar, se integra con el ecosistema LangChain (splitters, stores).
**Contras:** calidad de extracción variable según la biblioteca subyacente; no incluye visión por defecto; el multimodal requiere extensiones.

### 7.2 LlamaIndex readers

LlamaIndex usa el término "reader" en lugar de "loader". El ecosistema `llama-hub` tiene readers para decenas de fuentes:

```python
from llama_index.readers.file import PDFReader, CSVReader
from llama_index.core import SimpleDirectoryReader

# PDF con metadatos por página
reader = PDFReader()
docs = reader.load_data("contrato.pdf")  # carga con page_label

# Directorio completo (detecta tipo de archivo automáticamente)
reader = SimpleDirectoryReader("data/contracts/", recursive=True)
docs = reader.load_data()
```

**Pros:** la abstracción `Node` de LlamaIndex lleva metadata más rica por defecto; integración nativa con sus índices y splitters.
**Contras:** ecosistema separado de LangChain; la curva de aprendizaje es mayor.

### 7.3 Unstructured.io

Unstructured es una herramienta especializada en parsing de documentos no estructurados. Categoriza cada elemento del documento:

```python
from unstructured.partition.pdf import partition_pdf

elements = partition_pdf("manual_tecnico.pdf", strategy="hi_res")
# elements es una lista de objetos tipados:
# Title("Capítulo 32 Landing Gear")
# NarrativeText("El tren de aterrizaje principal...")
# Table(text="| Parámetro | Min | Max |...", metadata={"page_number": 47})
# Image(metadata={"filename": "fig_32-11.png"})
```

**Pros:** mejor calidad de extracción para PDFs complejos; detecta tablas, listas, títulos, figuras; modo `hi_res` usa visión por computadora para layouts complicados.
**Contras:** más lento que los loaders simples; el modo `hi_res` requiere `detectron2` (pesado) o la API de nube.

### 7.4 Cuándo usar cada uno

| Herramienta | Mejor para | Evitar si |
|------------|-----------|----------|
| LangChain loaders | PDFs simples, CSVs, webs; ecosistema LangChain | Necesitas calidad de extracción muy alta |
| LlamaIndex readers | Ecosistema LlamaIndex; metadata rica; múltiples formatos en un directorio | Solo usas LangChain |
| Unstructured.io | PDFs ricos (tablas complejas, columnas múltiples, figuras); calidad máxima | Tienes recursos limitados o el PDF es simple |
| `loader.multimodal` de RAGorbit | Manuales técnicos con `sectionScheme`; tablas → JSON; diagramas → visión | El documento es solo texto sin tablas/imágenes |

---

## 8. Pipelining completo en RAGorbit

### 8.1 Nodo `ingest.chunker`

El nodo recibe `Documents` del loader y produce `Documents` (chunks). La config clave:

```json
{
  "type": "ingest.chunker",
  "config": {
    "strategy": "by-clause",
    "chunkSize": 900,
    "overlap": 120
  }
}
```

Las tres estrategias que soporta el nodo:
- `recursive` — RecursiveCharacterTextSplitter (default).
- `by-section` — corta por encabezados de sección (`#`, `##`, o patrones de dominio).
- `by-clause` — corta por cláusulas numeradas (`CLÁUSULA N.`, `Artículo N.`).

### 8.2 Nodo `ingest.metadata`

Recibe `Documents` del chunker y añade metadata:

```json
{
  "type": "ingest.metadata",
  "config": {
    "fields": ["doc_type", "period", "aircraft_type", "ata_chapter"]
  }
}
```

Los campos se pueden poblar de tres fuentes:
1. **Propagados del loader** (ej: `source`, `page_number`).
2. **Extraídos del texto** del chunk con regex (ej: `clausula_id` del encabezado).
3. **Inyectados en tiempo de ejecución** desde el contexto de sesión (ej: `aircraft_type` del JWT del usuario).

### 8.3 Pipeline típico

```
[loader.pdf]          [ingest.chunker]       [ingest.metadata]
  Documents ─────────▶   Documents ──────────▶  Documents
                          strategy: by-clause    fields: [clausula_id,
                          chunkSize: 900              tipo, contrato,
                          overlap: 120                fecha]
                                                       │
                                              ┌────────┘
                                              ▼
                                       [store.pgvector]  ◀── [model.embedding]
                                         Embeddings
                                         Documents
                                              │
                                              ▼
                                         Retriever ──▶ [retrieval.vector]
                                                        hardFilters: [tipo]
```

### 8.4 Conexión con el template 09 (RRHH)

El template `09-hr-policy-assistant` (visto en M1) usa el pipeline más simple:

```
loader.pdf → ingest.chunker (strategy: recursive) → store.chroma
```

Sin `ingest.metadata` explícito porque el chatbot no necesita filtrar por tipo de documento — todo es política de RRHH. El filtro de relevancia lo hace el retriever por similitud.

Cuando agregas múltiples departamentos o versiones de políticas, sí necesitas metadata:
```json
{ "fields": ["departamento", "vigente_desde", "version"] }
```

---

## 9. Cuándo usar / cuándo no / alternativas

### Cuándo **sí** invertir en un pipeline de ingesta robusto

- El corpus tiene más de ~1000 documentos y crece.
- Los documentos tienen estructura de dominio específica (contratos, manuales técnicos, normativas).
- Los usuarios hacen preguntas que requieren filtrar por tipo/fecha/contexto.
- La precisión de las respuestas tiene consecuencias regulatorias o de seguridad (aeronáutica, medicina, crédito).

### Cuándo **no** sobreingeniería el pipeline

- El corpus es pequeño (<100 documentos) y estático: un `RecursiveCharacterTextSplitter` con `chunkSize: 1000` es suficiente.
- Estás en fase de prototipo: primero valida que RAG resuelve el problema; luego optimiza el chunking.
- Los documentos son texto continuo sin estructura (novelas, artículos de blog): el chunking semántico o fijo funciona bien.

### Alternativas al pipeline estándar

| Alternativa | Cuándo elegirla | Tradeoff |
|------------|----------------|---------|
| **Unstructured.io API** | Necesitas calidad máxima sin implementar parsing propio | Coste por llamada, dependencia externa |
| **LlamaIndex SimpleDirectoryReader** | Múltiples tipos de archivo en un directorio | Menos flexible para metadata de dominio |
| **Apache Tika** | Corpus heterogéneo con formatos raros (DOCX, ODT, PPT) | Java como dependencia |
| **Sin chunking (contexto completo)** | Documentos cortos (<4000 tokens) y LLM con ventana grande | No escala; caro en tokens |
| **Fine-tuning en lugar de RAG** | Documentos muy estables + preguntas muy repetitivas | Costoso actualizar; sin trazabilidad de fuentes |

---

## 10. La capa ③ explicada: chunking con LangChain desde cero

> **Prerrequisito:** en M1 aprendiste qué es LangChain, el objeto `Document` (`page_content` + `metadata`), los loaders (`TextLoader`) y el pipeline `loader → splitter → store`. Si no lo recuerdas, lee primero [§11 de la guía de M1](../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero) (5 minutos). **Aquí solo enseñamos lo nuevo de M2:** los *text splitters* de LangChain y cómo escribir uno custom para chunking por dominio.

Esta sección es la puente entre lo que hiciste a mano en el taller (`solucion_scratch.py`) y lo que verás en producción con LangChain (`lab/solucion_framework.py`). Al terminarla, deberías poder **escribir** el Enfoque A y el Enfoque B del lab, no solo leerlos.

### 10.1 Tabla puente: scratch → LangChain

| Lo que hiciste a mano (capa ②) | Pieza equivalente en LangChain (capa ③) |
|-------------------------------|----------------------------------------|
| `open(path).read()` | `TextLoader(path).load()` → lista de `Document` |
| Tu dataclass `Chunk` | `Document(page_content=..., metadata={...})` |
| `re.compile(r'^CLÁUSULA...', re.MULTILINE)` | Lógica dentro de `split_text()` de un splitter custom |
| Bucle `matches[i].start()` → `matches[i+1].start()` | Mismo algoritmo, pero encapsulado en `ClauseSplitter` |
| `clasificar_clausula(titulo)` | `_clasificar(titulo)` dentro del splitter custom |
| `chunk.metadata["source"] = "contrato_muestra.txt"` | Metadata del `Document` padre propagada en `split_documents()` |
| `print(json.dumps(chunk))` | `splitter.split_documents(docs)` → lista lista para `Chroma.from_documents()` |

```
Capa ② (scratch)                    Capa ③ (LangChain)
─────────────────                   ─────────────────────
texto = open(...).read()     →      docs = TextLoader(...).load()
regex + bucle manual         →      splitter.split_documents(docs)
dict metadata a mano         →      Document.metadata automático
script suelto                →      integración con vector stores
```

### 10.2 `RecursiveCharacterTextSplitter`: el algoritmo recursivo

Es el splitter **genérico** por defecto de LangChain. No conoce tu dominio (cláusulas, ATA, artículos); solo intenta cortar texto respetando separadores de mayor a menor semántica hasta que cada trozo quepa en `chunk_size`.

**Instalación:** `pip install langchain-text-splitters`

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", ". ", " ", ""],  # orden: más semántico → menos
    chunk_size=1000,
    chunk_overlap=150,
    keep_separator=True,
)
chunks = splitter.create_documents([texto_largo])
# chunks[i] es un Document(page_content=..., metadata={})
```

#### El algoritmo, paso a paso

Imagina un texto de 2500 caracteres y `chunk_size=1000`. El splitter trabaja **recursivamente** sobre cada fragmento:

```
                    TEXTO (2500 chars)
                           │
              ¿Cabe en chunk_size=1000?  NO
                           │
         Prueba separador[0] = "\n\n" (párrafos)
                           │
              ┌────────────┴────────────┐
         Párrafo A (400)          Párrafo B (2100)
         ¿Cabe? SÍ → chunk 0      ¿Cabe? NO
                                        │
                         Prueba separador[1] = "\n" (líneas)
                                        │
                         ┌──────────────┴──────────────┐
                    Línea 1 (500)              Resto (1600)
                    ¿Cabe? SÍ → chunk 1        ¿Cabe? NO
                                                    │
                                    Prueba separador[2] = ". " (oraciones)
                                                    │
                                    ... y así hasta que cada trozo ≤ 1000
```

**Reglas del algoritmo:**

1. Recibe un bloque de texto y la lista de separadores (de mayor a menor semántica).
2. Intenta dividir con el **primer** separador de la lista.
3. Para cada sub-bloque resultante:
   - Si `len(sub_bloque) ≤ chunk_size` → es un chunk candidato.
   - Si `len(sub_bloque) > chunk_size` → **recursión**: vuelve al paso 2 con el **siguiente** separador de la lista.
4. Si se agotan los separadores, corta por caracteres (el separador `""` fuerza corte duro).
5. Aplica `chunk_overlap` entre chunks consecutivos (deslizamiento; ver [§4.6](#46-el-parámetro-overlap)).

**Mini-ejemplo concreto:**

```python
texto = (
    "Párrafo corto.\n\n"
    "Párrafo larguísimo que supera el límite. " * 30  # ~1500 chars
)

splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", ". ", " "],
    chunk_size=500,
    chunk_overlap=0,
)
chunks = splitter.create_documents([texto])
# Resultado aproximado:
#   Chunk 0: "Párrafo corto."           ← cabía entero tras split por "\n\n"
#   Chunk 1: primeras oraciones del párrafo largo  ← el largo se partió por ". "
#   Chunk 2: oraciones siguientes...
```

#### Parámetros que debes entender

| Parámetro | Qué hace | Gotcha común |
|-----------|----------|--------------|
| `separators` | Lista ordenada de cortes preferidos | El orden importa: `["\nCLÁUSULA ", "\n\n", "\n", " "]` prioriza cláusulas sobre párrafos |
| `chunk_size` | Máximo de caracteres por chunk | Si es muy pequeño, fragmenta en exceso; si es muy grande, llena la ventana del LLM |
| `chunk_overlap` | Caracteres repetidos entre chunks vecinos | Con separadores de dominio (cláusulas), suele ser `0` — ver [§4.6](#46-el-parámetro-overlap) |
| `keep_separator` | Si `True`, el separador queda al inicio del chunk siguiente | Con `"\nCLÁUSULA "` y `keep_separator=True`, cada chunk empieza con `CLÁUSULA N.` |

#### `.create_documents()` vs `.split_documents()`

```python
# Desde texto crudo (sin metadata de origen):
chunks = splitter.create_documents([texto])
# metadata vacía: {}

# Desde Documents que ya trajo un loader (con source, page, etc.):
from langchain_community.document_loaders import TextLoader
docs = TextLoader("contrato.txt").load()
chunks = splitter.split_documents(docs)
# cada chunk hereda metadata del Document padre (source, etc.)
```

Para ingesta real, casi siempre usas `split_documents()` porque el loader ya añadió `source` y otros campos. Ver [§7.1](#71-langchain-loaders) para la comparativa de loaders.

### 10.3 Escribir tu propio splitter: heredar de `TextSplitter`

Cuando el dominio tiene estructura predecible (cláusulas, artículos, secciones ATA), un splitter genérico no basta: necesitas **metadata rica** (`clausula_id`, `tipo`, `contrato`) que solo puedes extraer con regex de dominio. La solución es heredar de `TextSplitter`.

#### La interfaz que debes implementar

```python
from langchain_text_splitters import TextSplitter
from langchain_core.documents import Document

class MiSplitter(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        """OBLIGATORIO: recibe texto, devuelve lista de strings."""
        ...

    def split_documents(self, documents: list[Document]) -> list[Document]:
        """OPCIONAL pero recomendado: override para metadata rica."""
        ...
```

| Método | Entrada | Salida | Cuándo se usa |
|--------|---------|--------|---------------|
| `split_text(text)` | Un string | `list[str]` | API base; otros métodos lo llaman internamente |
| `split_documents(docs)` | `list[Document]` | `list[Document]` | Pipeline real: preserva y enriquece metadata |

**Por qué sobreescribir `split_documents()`:** la implementación por defecto de `TextSplitter` llama a `split_text()` y envuelve cada string en un `Document` con metadata mínima. Si solo implementas `split_text()`, pierdes la oportunidad de añadir `clausula_id`, `tipo`, etc. El override te permite devolver `Document` ya completos.

#### Esqueleto mínimo conectado al lab

```python
class ClauseSplitter(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        # Delega al método que construye Documents completos
        return [d.page_content for d in self._split_to_docs(text)]

    def _split_to_docs(self, text: str) -> list[Document]:
        matches = list(self._PATRON.finditer(text))
        docs = []
        for i, m in enumerate(matches):
            inicio = m.start()
            fin = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            docs.append(Document(
                page_content=text[inicio:fin].strip(),
                metadata={
                    "clausula_id": int(m.group(1)),
                    "titulo": m.group(2).strip(),
                    "tipo": self._clasificar(m.group(2)),
                    # ...
                },
            ))
        return docs

    def split_documents(self, documents: list[Document]) -> list[Document]:
        all_docs = []
        for doc in documents:
            for chunk in self._split_to_docs(doc.page_content):
                # Preservar metadata del padre (source del loader)
                chunk.metadata["source"] = doc.metadata.get("source", "")
                all_docs.append(chunk)
        return all_docs
```

Este es exactamente el patrón del `ClauseSplitter` en `lab/solucion_framework.py` — la misma lógica de regex que `solucion_scratch.py`, pero empaquetada para el ecosistema LangChain.

### 10.4 Integración loader → splitter (pipeline completo)

```
┌─────────────┐     load()      ┌──────────────────┐   split_documents()   ┌─────────────┐
│ TextLoader  │ ──────────────▶ │ list[Document]   │ ────────────────────▶ │ list[Document│
│ contrato.txt│                 │ metadata: source │                       │ chunks con  │
└─────────────┘                 └──────────────────┘                       │ metadata    │
                                                                           └─────────────┘
```

```python
from langchain_community.document_loaders import TextLoader

loader = TextLoader("datos/contrato_muestra.txt")
docs = loader.load()
# docs[0].page_content = texto completo del archivo
# docs[0].metadata = {"source": "datos/contrato_muestra.txt"}

splitter = ClauseSplitter(contract_id="CSP-2024-0087", fecha="2024-01-15")
chunks = splitter.split_documents(docs)
# 13 Documents, cada uno con clausula_id, titulo, tipo, contrato, fecha, source
```

**Dónde encaja cada framework de ingesta** (resumen; detalle en [§7](#7-comparativa-de-frameworks-de-ingesta)):

| Framework | Rol en este pipeline | Pieza equivalente |
|-----------|---------------------|-------------------|
| LangChain `TextLoader` | Cargar el archivo | `open().read()` en scratch |
| LangChain `TextSplitter` | Trocear + metadata | Tu bucle regex en scratch |
| LlamaIndex `SimpleDirectoryReader` | Alternativa al loader; detecta tipo de archivo | Varios loaders LangChain a mano |
| Unstructured | Parsing avanzado de PDFs ricos | No sustituye al splitter; va **antes** (mejor texto de entrada) |

En M2 el foco es el **splitter**. Los loaders los comparaste en [§7](#7-comparativa-de-frameworks-de-ingesta); en el lab usamos `TextLoader` porque el contrato ya es `.txt` plano.

### 10.5 Recorrido bloque a bloque de `solucion_framework.py`

Abre `lab/solucion_framework.py` y síguelo junto a esta sección. El archivo tiene tres bloques.

#### Bloque 1 — Enfoque A: `RecursiveCharacterTextSplitter`

```python
splitter_a = RecursiveCharacterTextSplitter(
    separators=["\nCLÁUSULA ", "\n\n", "\n", " "],
    chunk_size=1200,
    chunk_overlap=0,
    keep_separator=True,
)
chunks_a = splitter_a.create_documents([texto_contrato])
```

| Línea / decisión | Qué hace | Por qué |
|------------------|----------|---------|
| `"\nCLÁUSULA "` primero | Intenta cortar antes de cada encabezado de cláusula | Aprovecha la estructura del contrato sin regex custom |
| `chunk_size=1200` | Límite por chunk | Si una cláusula supera 1200 chars, el algoritmo baja al siguiente separador (`\n\n`, `\n`, ` `) y la parte en trozos más pequeños |
| `chunk_overlap=0` | Sin solapamiento | Las cláusulas son unidades autónomas — ver [§4.6](#46-el-parámetro-overlap) |
| `keep_separator=True` | Conserva `CLÁUSULA N.` al inicio del chunk | El retriever devuelve contexto identificable |
| `create_documents([texto])` | Trocea texto crudo | No hay loader intermedio; metadata queda vacía |

**Limitación pedagógica:** el Enfoque A no produce `clausula_id` ni `tipo`. Es un buen *baseline* para comparar, no la solución de producción para contratos.

#### Bloque 2 — Enfoque B: `ClauseSplitter` custom

| Componente | Equivalente en scratch | Función |
|------------|------------------------|---------|
| `_PATRON` con `re.MULTILINE` | `_PATRON_CLAUSULA` | Detectar solo encabezados al inicio de línea |
| Bucle `matches[i].start()` → `fin` | Mismo bucle en `parsear_clausulas()` | Delimitar texto de cada cláusula |
| `_clasificar(titulo)` | `clasificar_clausula(titulo)` | Inferir `tipo` por keywords |
| `split_documents([doc_base])` | `main()` que lee y trocea | Integración con metadata de `source` |

```python
doc_base = Document(
    page_content=texto_contrato,
    metadata={"source": "contrato_muestra.txt"},
)
chunks_b = splitter_b.split_documents([doc_base])
# Esperado: 13 chunks, mismos metadatos que solucion_scratch.py
```

#### Bloque 3 — Integración con vector store (comentado)

```python
# vectordb = Chroma.from_documents(documents=chunks_b, embedding=OpenAIEmbeddings(), ...)
# results = vectordb.similarity_search(query="...", k=3, filter={"tipo": "responsabilidad"})
```

Este bloque cierra el pipeline `loader → splitter → store` que viste en [§8.3](#83-pipeline-típico). Los chunks del Enfoque B llevan `tipo` en metadata, lo que habilita el **filtro duro** de [§5](#5-metadata-y-su-rol-en-filtros-duros): solo chunks con `tipo="responsabilidad"` compiten en la búsqueda.

### 10.6 Cuándo usar splitter genérico vs custom por dominio

| Situación | Splitter recomendado | Razón |
|-----------|---------------------|-------|
| Prototipo rápido, texto sin estructura | `RecursiveCharacterTextSplitter` | Cero código custom; suficiente para validar RAG |
| Políticas de RRHH (párrafos) | `RecursiveCharacterTextSplitter` con `separators=["\n\n", "\n", ". "]` | Estructura genérica de párrafos — ver [§4.2](#42-estrategia-2--recursive-chunking-separadores-jerárquicos) |
| Contratos, normativas, manuales ATA | Splitter custom (`ClauseSplitter`, `ATASplitter`, etc.) | Metadata de dominio + cero falsos positivos |
| PDFs con tablas complejas | Unstructured **antes** + splitter genérico o custom **después** | Mejor parsing de entrada; ver [§7.3](#73-unstructuredio) |

#### Gotchas que aparecen en producción

**1. `keep_separator` y el primer chunk**

Con `keep_separator=True` y separador `"\nCLÁUSULA "`, el texto *antes* de la primera cláusula (encabezado del contrato, fecha, partes) puede quedar como chunk 0 suelto. En contratos reales, descarta o fusiona ese prefacio en postprocesado.

**2. Overlap en chunks de dominio**

Con `by-clause`, el overlap suele ser **0**: repetir el final de la Cláusula 3 al inicio de la Cláusula 4 no aporta contexto útil y duplica embeddings. Reserva overlap para texto narrativo continuo ([§4.6](#46-el-parámetro-overlap)).

**3. Metadata que se pierde**

```python
# ❌ Solo split_text — metadata del padre no se propaga bien
chunks = splitter.split_text(doc.page_content)

# ✅ split_documents — preserva source y enriquece
chunks = splitter.split_documents([doc])
```

Si llamas solo a `split_text()` y construyes `Document` a mano olvidando `doc.metadata`, pierdes `source` y cualquier campo que el loader añadió. El retriever no podrá filtrar ni citar el archivo de origen.

**4. `RecursiveCharacterTextSplitter` sin ancla `^`**

El separador `"\nCLÁUSULA "` no distingue encabezados de referencias como `"conforme a la Cláusula 9..."` si esa referencia empieza tras un salto de línea. Por eso el Enfoque A puede generar chunks espurios; el Enfoque B con `^` en el regex no.

### 10.7 Ejercicio guiado: escribe tu versión antes de mirar la solución

Sigue este orden en el [taller](lab/enunciado.md#capa-③--chunking-con-langchain-tarea-guiada):

1. Termina la capa ② (`solucion_scratch.py`) y verifica 13 chunks contra `expected.md`.
2. Con pip disponible, instala `langchain-text-splitters langchain-community`.
3. Escribe el Enfoque A con `RecursiveCharacterTextSplitter` — imprime cuántos chunks produce y compara con 13.
4. Escribe el Enfoque B: clase `ClauseSplitter` heredando de `TextSplitter`.
5. Compara tu código con `lab/solucion_framework.py` línea a línea.

---

## 11. Checkpoint

### Lo sabes si puedes…

1. Explicar la diferencia entre un PDF seleccionable y uno escaneado, y cuándo usar OCR.
2. Elegir la estrategia de chunking correcta dado un tipo de documento (contrato, manual técnico, artículo, CSV).
3. Calcular cuántos chunks produce un texto de 5000 chars con `chunkSize: 1000` y `overlap: 150`.
4. Explicar por qué `re.MULTILINE` con `^` evita falsos positivos en el chunker por cláusula.
5. Definir qué campos de metadata añadirías al template 08 (manufactura) y para qué filtros sirven.
6. Comparar LangChain loaders vs. Unstructured.io para un PDF con tablas complejas.
7. Trazar el pipeline completo `loader → chunker → metadata → store` para el template 02 (banca).
8. Explicar el algoritmo recursivo de `RecursiveCharacterTextSplitter` y cuándo usarlo vs un splitter custom.
9. Implementar `split_text()` y `split_documents()` al heredar de `TextSplitter`.
10. Identificar por qué se pierde metadata si solo usas `split_text()` sin propagar la del documento padre.

### Qué repasar si no lo tienes claro

- Sección 4 completa si el chunking sigue siendo confuso.
- Sección 5 si no entiendes cómo los filtros duros usan metadata.
- Sección 10 si la capa ③ (LangChain splitters) te resulta abrupta.
- `Document` y loaders básicos: [M1 §11](../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero).
- `docs/02-node-catalog.md` §loaders y §ingestion del repo ragorbit.
- READMEs de `examples/05-legal-contract-review/` y `examples/08-manufacturing-maintenance-rag/`.

### Siguiente paso

1. Haz el taller (`lab/enunciado.md`): trocea el contrato con la capa ② (`solucion_scratch.py`) y verifica 13 chunks contra `lab/expected.md`.
2. Sigue la [tarea guiada de la capa ③](lab/enunciado.md#capa-③--chunking-con-langchain-tarea-guiada): escribe el Enfoque A y el `ClauseSplitter` del Enfoque B usando [§10](guia.md#10-la-capa--explicada-chunking-con-langchain-desde-cero), y compara con `solucion_framework.py`.
3. Resuelve los ejercicios 28–30 sobre splitters de LangChain.

Cuando termines, continúa con **M3 — Embeddings y Vector Stores** (`03-embeddings-y-stores/`).
