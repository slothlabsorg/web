# Requiere: pip install langchain-text-splitters langchain-community

"""
Taller M2 — Chunker de contrato legal (versión framework)
Ilustra cómo usar LangChain para chunking con separadores personalizados.

Este archivo es ILUSTRATIVO — no se ejecuta en el entorno del curso (sin red/pip).
Estudia el código y compáralo con solucion_scratch.py para entender qué abstrae
cada framework.

Dos enfoques:
  A) RecursiveCharacterTextSplitter con separadores de cláusula.
  B) Splitter custom que imita la lógica by-clause de RAGorbit.
"""

from __future__ import annotations

# ── Enfoque A: RecursiveCharacterTextSplitter ─────────────────────────────────
# Tutorial: guía M2 §10.2 y §10.5 bloque 1. Compara el número de chunks con el
# Enfoque B — aquí no hay metadata clausula_id/tipo automática.

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

texto_contrato = open("rag-training/02-ingesta/lab/datos/contrato_muestra.txt").read()

# Separadores de mayor a menor semántica:
# 1. "CLÁUSULA " — cada cláusula es un chunk ideal
# 2. "\n\n"      — párrafos
# 3. "\n"        — líneas
# 4. " "         — palabras (fallback de último recurso)
splitter_a = RecursiveCharacterTextSplitter(
    separators=["\nCLÁUSULA ", "\n\n", "\n", " "],
    chunk_size=1200,
    chunk_overlap=0,
    keep_separator=True,
)

chunks_a = splitter_a.create_documents([texto_contrato])
print(f"Enfoque A — chunks generados: {len(chunks_a)}")
for i, c in enumerate(chunks_a[:3]):
    print(f"  [{i}] {c.page_content[:80].replace(chr(10),' ')}...")


# ── Enfoque B: Splitter custom by-clause ─────────────────────────────────────
# Tutorial: guía M2 §10.3–§10.5 bloque 2. Implementa split_text() + override de
# split_documents() para metadata rica — equivalente a solucion_scratch.py.

import re
from langchain_text_splitters import TextSplitter


class ClauseSplitter(TextSplitter):
    """
    Divide texto legal por cláusulas numeradas.
    Cada cláusula se convierte en un Document con metadata enriquecida.

    Ejemplo de uso con un loader:
        loader = TextLoader("contrato.txt")
        docs = loader.load()
        splitter = ClauseSplitter(contract_id="CSP-2024-0087", fecha="2024-01-15")
        chunks = splitter.split_documents(docs)
    """

    # Tabla de clasificación (idéntica a la de solucion_scratch.py)
    _TIPOS: list[tuple[list[str], str]] = [
        (["objeto", "servicios"], "objeto"),
        (["duraci", "vigencia"], "vigencia"),
        (["pago", "contraprestaci"], "pago"),
        (["obligaciones del prestador"], "obligaciones_prestador"),
        (["obligaciones del cliente"], "obligaciones_cliente"),
        (["propiedad intelectual"], "propiedad_intelectual"),
        (["penaliz"], "penalizacion"),
        (["responsabilidad"], "responsabilidad"),
        (["confidencialidad"], "confidencialidad"),
        (["disputas", "arbitraje"], "disputas"),
        (["rescisi"], "rescision"),
        (["datos personales"], "datos_personales"),
        (["generales"], "general"),
    ]

    _PATRON = re.compile(
        r'^CL[AÁ]USULA\s+(\d+)[\.:\-]?\s+([A-ZÁÉÍÓÚÑÜ][^\n]+)',
        re.IGNORECASE | re.MULTILINE,
    )

    def __init__(self, contract_id: str = "", fecha: str = "", **kwargs):
        super().__init__(**kwargs)
        self.contract_id = contract_id
        self.fecha = fecha

    def _clasificar(self, titulo: str) -> str:
        t = titulo.lower()
        for kws, tipo in self._TIPOS:
            if any(kw in t for kw in kws):
                return tipo
        return "otro"

    def split_text(self, text: str) -> list[str]:
        """Devuelve solo los textos (requerido por la interfaz base)."""
        return [c.page_content for c in self._split_to_docs(text)]

    def _split_to_docs(self, text: str) -> list[Document]:
        matches = sorted(self._PATRON.finditer(text), key=lambda m: m.start())
        docs = []
        for i, m in enumerate(matches):
            numero = int(m.group(1))
            titulo = m.group(2).strip()
            inicio = m.start()
            fin = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            contenido = text[inicio:fin].strip()
            # Normalizar espacios
            parrafos = [" ".join(l.strip() for l in p.splitlines() if l.strip())
                        for p in re.split(r'\n\s*\n', contenido)]
            contenido_norm = "\n\n".join(p for p in parrafos if p)
            docs.append(Document(
                page_content=contenido_norm,
                metadata={
                    "clausula_id": numero,
                    "titulo": titulo,
                    "tipo": self._clasificar(titulo),
                    "contrato": self.contract_id,
                    "fecha": self.fecha,
                },
            ))
        docs.sort(key=lambda d: d.metadata["clausula_id"])
        return docs

    def split_documents(self, documents):
        """Override para devolver Documents con metadata completa."""
        all_docs = []
        for doc in documents:
            chunks = self._split_to_docs(doc.page_content)
            # Preservar metadata del documento padre (e.g. source del loader)
            for c in chunks:
                c.metadata["source"] = doc.metadata.get("source", "")
            all_docs.extend(chunks)
        return all_docs


# ── Uso del splitter custom ───────────────────────────────────────────────────
splitter_b = ClauseSplitter(
    contract_id="CSP-2024-0087",
    fecha="2024-01-15",
)

# Simular lo que haría un TextLoader
doc_base = Document(
    page_content=texto_contrato,
    metadata={"source": "contrato_muestra.txt"},
)
chunks_b = splitter_b.split_documents([doc_base])

print(f"\nEnfoque B — chunks generados: {len(chunks_b)}")
for c in chunks_b[:3]:
    print(f"  clausula_id={c.metadata['clausula_id']}  tipo={c.metadata['tipo']}")
    print(f"    {c.page_content[:80].replace(chr(10),' ')}...")


# ── Diferencia clave entre A y B ─────────────────────────────────────────────
# Enfoque A (RecursiveCharacterTextSplitter):
#   - Genérico: no "sabe" que el separador es una cláusula legal.
#   - No produce metadata clausula_id/tipo automáticamente.
#   - Útil cuando no conoces el formato del documento de antemano.
#   - Puede producir más o menos chunks dependiendo de chunk_size.
#
# Enfoque B (ClauseSplitter custom):
#   - Específico: el regex detecta la estructura del dominio.
#   - Produce metadata rica sin postprocesado adicional.
#   - Determinista: mismo contrato → mismo número de chunks.
#   - Es lo que RAGorbit genera como ingest.chunker con strategy: "by-clause".
#
# En producción, el enfoque B es superior para documentos con estructura
# predecible (contratos, manuales técnicos, normativas).
# El enfoque A es el punto de partida para documentos sin estructura clara.


# ── Integración con un vector store (ilustrativo) ────────────────────────────
# from langchain_community.vectorstores import Chroma
# from langchain_openai import OpenAIEmbeddings
#
# vectordb = Chroma.from_documents(
#     documents=chunks_b,
#     embedding=OpenAIEmbeddings(),
#     collection_name="contratos",
# )
#
# # Búsqueda con filtro duro por tipo:
# results = vectordb.similarity_search(
#     query="¿hay limitación de responsabilidad?",
#     k=3,
#     filter={"tipo": "responsabilidad"},
# )
