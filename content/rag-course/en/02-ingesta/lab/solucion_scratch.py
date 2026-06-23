"""
Taller M2 — Chunker de contrato legal por cláusula (stdlib pura)
Trocea el contrato de muestra por cláusula numerada y etiqueta metadata.

Uso (desde la raíz del repo ragorbit):
    python3 rag-training/02-ingesta/lab/solucion_scratch.py

Salida: lista de chunks con {text, metadata, source} impresa en pantalla.
No requiere ningún paquete externo — solo re, pathlib y json de la stdlib.
"""

import re
import pathlib
import json
import sys
from dataclasses import dataclass


# ---------------------------------------------------------------------------
# Tipos de dato
# ---------------------------------------------------------------------------

@dataclass
class Chunk:
    text: str
    metadata: dict
    source: str

    def to_dict(self) -> dict:
        return {"text": self.text, "metadata": self.metadata, "source": self.source}


# ---------------------------------------------------------------------------
# Clasificador de tipo de cláusula (determinista, sin LLM)
# ---------------------------------------------------------------------------

_TIPOS_CLAUSULA: list[tuple[list[str], str]] = [
    (["objeto", "servicios"], "objeto"),
    (["duraci", "vigencia", "plazo"], "vigencia"),
    (["pago", "contraprestaci", "precio"], "pago"),
    (["obligaciones del prestador"], "obligaciones_prestador"),
    (["obligaciones del cliente"], "obligaciones_cliente"),
    (["propiedad intelectual"], "propiedad_intelectual"),
    (["penaliz", "penalidad"], "penalizacion"),
    (["responsabilidad", "limitaci"], "responsabilidad"),
    (["confidencialidad", "secreto"], "confidencialidad"),
    (["disputas", "arbitraje"], "disputas"),
    (["rescisi", "terminaci", "rescision"], "rescision"),
    (["datos personales", "protecci"], "datos_personales"),
    (["generales", "miscel"], "general"),
]


def clasificar_clausula(titulo: str) -> str:
    """Devuelve el tipo de cláusula según keywords en el título."""
    titulo_lower = titulo.lower()
    for keywords, tipo in _TIPOS_CLAUSULA:
        if any(kw in titulo_lower for kw in keywords):
            return tipo
    return "otro"


# ---------------------------------------------------------------------------
# Parser por cláusula
# ---------------------------------------------------------------------------

# Patrón: línea que EMPIEZA con "CLÁUSULA N." o "CLÁUSULA N -"
# El ^ al inicio (con re.MULTILINE) asegura que es inicio de línea, no referencia en texto.
_PATRON_CLAUSULA = re.compile(
    r'^CL[AÁ]USULA\s+(\d+)[\.:\-–—]?\s+([A-ZÁÉÍÓÚÑÜ][^\n]+)',
    re.IGNORECASE | re.MULTILINE
)


def parsear_clausulas(texto: str, fuente: str) -> list[Chunk]:
    """
    Extrae un chunk por cláusula numerada.

    Estrategia:
    1. Buscar todos los encabezados de cláusula al inicio de línea (re.MULTILINE).
    2. Cortar el texto entre posición[i] y posición[i+1].
    3. Construir metadata con clausula_id, titulo, tipo, contrato y fecha.
    4. Normalizar espacios: colapsar líneas continuas en un párrafo coherente.
    """
    matches = list(_PATRON_CLAUSULA.finditer(texto))

    if not matches:
        return []

    # Ordenar por posición en el texto (determinista)
    matches.sort(key=lambda m: m.start())

    chunks: list[Chunk] = []

    for i, match in enumerate(matches):
        numero = int(match.group(1))
        titulo = match.group(2).strip()

        # Texto del chunk: desde el inicio del match hasta el siguiente (o fin)
        inicio = match.start()
        fin = matches[i + 1].start() if i + 1 < len(matches) else len(texto)
        contenido_raw = texto[inicio:fin].strip()

        # Normalizar: unir líneas de continuación en párrafos;
        # una línea en blanco separa párrafos.
        parrafos = re.split(r'\n\s*\n', contenido_raw)
        parrafos_limpios = []
        for p in parrafos:
            lineas = [l.strip() for l in p.splitlines() if l.strip()]
            if lineas:
                parrafos_limpios.append(" ".join(lineas))
        contenido = "\n\n".join(parrafos_limpios)

        tipo = clasificar_clausula(titulo)

        chunk = Chunk(
            text=contenido,
            metadata={
                "clausula_id": numero,
                "titulo": titulo,
                "tipo": tipo,
                "contrato": "CSP-2024-0087",
                "fecha": "2024-01-15",
            },
            source=fuente,
        )
        chunks.append(chunk)

    # Ordenar por número de cláusula (por si el texto no fuera lineal)
    chunks.sort(key=lambda c: c.metadata["clausula_id"])
    return chunks


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    script_dir = pathlib.Path(__file__).resolve().parent          # lab/
    datos_dir = script_dir / "datos"
    archivo = datos_dir / "contrato_muestra.txt"

    if not archivo.exists():
        sys.exit(f"ERROR: no encuentro {archivo}")

    texto = archivo.read_text(encoding="utf-8")
    fuente = archivo.name

    chunks = parsear_clausulas(texto, fuente)

    print(f"Contrato: CSP-2024-0087")
    print(f"Chunks generados: {len(chunks)}")
    print("=" * 60)

    for c in chunks:
        print(f"\n--- Chunk {c.metadata['clausula_id']} ---")
        print(f"titulo   : {c.metadata['titulo']}")
        print(f"tipo     : {c.metadata['tipo']}")
        print(f"contrato : {c.metadata['contrato']}")
        print(f"fecha    : {c.metadata['fecha']}")
        print(f"source   : {c.source}")
        # Mostrar primeros 120 caracteres del texto del chunk
        texto_preview = c.text[:120].replace("\n", " ")
        if len(c.text) > 120:
            texto_preview += "..."
        print(f"text     : {texto_preview}")

    print("\n" + "=" * 60)
    print("JSON completo del primer chunk (verificable):")
    print(json.dumps(chunks[0].to_dict(), ensure_ascii=False, indent=2))

    print("\n" + "=" * 60)
    print("Resumen de tipos detectados:")
    tipos: dict[str, int] = {}
    for c in chunks:
        t = c.metadata["tipo"]
        tipos[t] = tipos.get(t, 0) + 1
    for tipo, count in sorted(tipos.items()):
        print(f"  {tipo:<30} {count}")


if __name__ == "__main__":
    main()
