# Expected output — M2 Lab

Run from the repo root:

```
python3 rag-training/02-ingesta/lab/solucion_scratch.py
```

---

## Console output

```
Contract: CSP-2024-0087
Chunks generated: 13
============================================================

--- Chunk 1 ---
title    : OBJETO DEL CONTRATO
type     : objeto
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 1. OBJETO DEL CONTRATO El presente contrato tiene por objeto la prestación de servicios de desarrollo de softwa...

--- Chunk 2 ---
title    : DURACIÓN Y VIGENCIA
type     : vigencia
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 2. DURACIÓN Y VIGENCIA El presente contrato tendrá una vigencia de doce (12) meses contados a partir de la fech...

--- Chunk 3 ---
title    : CONTRAPRESTACIÓN Y FORMA DE PAGO
type     : pago
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 3. CONTRAPRESTACIÓN Y FORMA DE PAGO EL CLIENTE se obliga a pagar a EL CLIENTE la cantidad de $480,000.00 (cua...

--- Chunk 4 ---
title    : OBLIGACIONES DEL PRESTADOR
type     : obligaciones_prestador
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 4. OBLIGACIONES DEL PRESTADOR EL PRESTADOR se obliga a: (a) Ejecutar los servicios descritos en el Anexo A con ...

--- Chunk 5 ---
title    : OBLIGACIONES DEL CLIENTE
type     : obligaciones_cliente
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 5. OBLIGACIONES DEL CLIENTE EL CLIENTE se obliga a: (a) Proporcionar acceso a los sistemas, datos e infraestruc...

--- Chunk 6 ---
title    : PROPIEDAD INTELECTUAL
type     : propiedad_intelectual
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 6. PROPIEDAD INTELECTUAL Todos los desarrollos, códigos fuente, documentación técnica, diseños y demás creacion...

--- Chunk 7 ---
title    : PENALIZACIONES POR INCUMPLIMIENTO
type     : penalizacion
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 7. PENALIZACIONES POR INCUMPLIMIENTO En caso de que EL PRESTADOR no entregue los hitos establecidos en el Anexo...

--- Chunk 8 ---
title    : LIMITACIÓN DE RESPONSABILIDAD
type     : responsabilidad
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 8. LIMITACIÓN DE RESPONSABILIDAD La responsabilidad total de EL PRESTADOR derivada del presente contrato, ya se...

--- Chunk 9 ---
title    : CONFIDENCIALIDAD
type     : confidencialidad
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 9. CONFIDENCIALIDAD Ambas partes acuerdan mantener estricta confidencialidad respecto de toda la información in...

--- Chunk 10 ---
title    : RESOLUCIÓN DE DISPUTAS
type     : disputas
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 10. RESOLUCIÓN DE DISPUTAS Cualquier controversia o reclamación derivada del presente contrato que no pueda res...

--- Chunk 11 ---
title    : CAUSAS DE RESCISIÓN
type     : rescision
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 11. CAUSAS DE RESCISIÓN El presente contrato podrá rescindirse sin responsabilidad para la parte afectada en lo...

--- Chunk 12 ---
title    : PROTECCIÓN DE DATOS PERSONALES
type     : datos_personales
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 12. PROTECCIÓN DE DATOS PERSONALES EL PRESTADOR se obliga a tratar los datos personales a los que tenga acceso ...

--- Chunk 13 ---
title    : DISPOSICIONES GENERALES
type     : general
contract : CSP-2024-0087
date     : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 13. DISPOSICIONES GENERALES El presente contrato constituye el acuerdo íntegro entre las partes respecto de su ...
```

---

## Verifiable concrete chunk — Chunk 1 (full JSON)

This is the exact chunk that `solucion_scratch.py` must emit for Clause 1:

```json
{
  "text": "CLÁUSULA 1. OBJETO DEL CONTRATO El presente contrato tiene por objeto la prestación de servicios de desarrollo de software a medida, incluyendo diseño, implementación, pruebas y despliegue de un sistema de gestión de inventarios para EL CLIENTE. Los entregables específicos se detallan en el Anexo A adjunto al presente instrumento, el cual forma parte integrante de este contrato.",
  "metadata": {
    "clausula_id": 1,
    "titulo": "OBJETO DEL CONTRATO",
    "tipo": "objeto",
    "contrato": "CSP-2024-0087",
    "fecha": "2024-01-15"
  },
  "source": "contrato_muestra.txt"
}
```

---

## Type summary at the end

```
============================================================
Detected types summary:
  confidencialidad               1
  datos_personales               1
  disputas                       1
  general                        1
  objeto                         1
  obligaciones_cliente           1
  obligaciones_prestador         1
  pago                           1
  penalizacion                   1
  propiedad_intelectual          1
  rescision                      1
  responsabilidad                1
  vigencia                       1
```

---

## Grading criteria

| Criterion | Expected value |
|----------|---------------|
| Total chunks | **13** |
| No false positives (e.g. "Clause 9 of this instrument") | 0 false positives |
| `chunks[0].metadata["clausula_id"]` | `1` |
| `chunks[0].metadata["tipo"]` | `"objeto"` |
| `chunks[8].metadata["tipo"]` | `"confidencialidad"` (index 8 = Clause 9) |
| `chunks[0].source` | `"contrato_muestra.txt"` |
| Order | ascending by `clausula_id` |

---

## Why 13 chunks and not 15 or more

The contract contains 13 explicitly numbered clauses (`CLÁUSULA 1` … `CLÁUSULA 13`). The regex uses `re.MULTILINE` with `^` so it only matches at the start of a line, preventing mid-text references ("conforme a la Cláusula 9 del presente instrumento", "Cláusula 3. CLÁUSULA 6…") from generating spurious chunks. That is the key difference between correct and incorrect clause chunking.
