# Salida esperada — Taller M2

Ejecutar desde la raíz del repo:

```
python3 rag-training/02-ingesta/lab/solucion_scratch.py
```

---

## Salida en consola

```
Contrato: CSP-2024-0087
Chunks generados: 13
============================================================

--- Chunk 1 ---
titulo   : OBJETO DEL CONTRATO
tipo     : objeto
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 1. OBJETO DEL CONTRATO El presente contrato tiene por objeto la prestación de servicios de desarrollo de softwa...

--- Chunk 2 ---
titulo   : DURACIÓN Y VIGENCIA
tipo     : vigencia
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 2. DURACIÓN Y VIGENCIA El presente contrato tendrá una vigencia de doce (12) meses contados a partir de la fech...

--- Chunk 3 ---
titulo   : CONTRAPRESTACIÓN Y FORMA DE PAGO
tipo     : pago
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 3. CONTRAPRESTACIÓN Y FORMA DE PAGO EL CLIENTE se obliga a pagar a EL CLIENTE la cantidad de $480,000.00 (cua...

--- Chunk 4 ---
titulo   : OBLIGACIONES DEL PRESTADOR
tipo     : obligaciones_prestador
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 4. OBLIGACIONES DEL PRESTADOR EL PRESTADOR se obliga a: (a) Ejecutar los servicios descritos en el Anexo A con ...

--- Chunk 5 ---
titulo   : OBLIGACIONES DEL CLIENTE
tipo     : obligaciones_cliente
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 5. OBLIGACIONES DEL CLIENTE EL CLIENTE se obliga a: (a) Proporcionar acceso a los sistemas, datos e infraestruc...

--- Chunk 6 ---
titulo   : PROPIEDAD INTELECTUAL
tipo     : propiedad_intelectual
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 6. PROPIEDAD INTELECTUAL Todos los desarrollos, códigos fuente, documentación técnica, diseños y demás creacion...

--- Chunk 7 ---
titulo   : PENALIZACIONES POR INCUMPLIMIENTO
tipo     : penalizacion
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 7. PENALIZACIONES POR INCUMPLIMIENTO En caso de que EL PRESTADOR no entregue los hitos establecidos en el Anexo...

--- Chunk 8 ---
titulo   : LIMITACIÓN DE RESPONSABILIDAD
tipo     : responsabilidad
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 8. LIMITACIÓN DE RESPONSABILIDAD La responsabilidad total de EL PRESTADOR derivada del presente contrato, ya se...

--- Chunk 9 ---
titulo   : CONFIDENCIALIDAD
tipo     : confidencialidad
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 9. CONFIDENCIALIDAD Ambas partes acuerdan mantener estricta confidencialidad respecto de toda la información in...

--- Chunk 10 ---
titulo   : RESOLUCIÓN DE DISPUTAS
tipo     : disputas
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 10. RESOLUCIÓN DE DISPUTAS Cualquier controversia o reclamación derivada del presente contrato que no pueda res...

--- Chunk 11 ---
titulo   : CAUSAS DE RESCISIÓN
tipo     : rescision
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 11. CAUSAS DE RESCISIÓN El presente contrato podrá rescindirse sin responsabilidad para la parte afectada en lo...

--- Chunk 12 ---
titulo   : PROTECCIÓN DE DATOS PERSONALES
tipo     : datos_personales
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 12. PROTECCIÓN DE DATOS PERSONALES EL PRESTADOR se obliga a tratar los datos personales a los que tenga acceso ...

--- Chunk 13 ---
titulo   : DISPOSICIONES GENERALES
tipo     : general
contrato : CSP-2024-0087
fecha    : 2024-01-15
source   : contrato_muestra.txt
text     : CLÁUSULA 13. DISPOSICIONES GENERALES El presente contrato constituye el acuerdo íntegro entre las partes respecto de su ...
```

---

## Chunk concreto verificable — Chunk 1 (JSON completo)

Este es el chunk exacto que `solucion_scratch.py` debe emitir para la Cláusula 1:

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

## Resumen de tipos al final

```
============================================================
Resumen de tipos detectados:
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

## Criterios de corrección

| Criterio | Valor esperado |
|----------|---------------|
| Total de chunks | **13** |
| Ningún falso positivo (ej. "Cláusula 9 del presente instrumento") | 0 falsos positivos |
| `chunks[0].metadata["clausula_id"]` | `1` |
| `chunks[0].metadata["tipo"]` | `"objeto"` |
| `chunks[8].metadata["tipo"]` | `"confidencialidad"` (índice 8 = Cláusula 9) |
| `chunks[0].source` | `"contrato_muestra.txt"` |
| Orden | ascendente por `clausula_id` |

---

## Por qué 13 chunks y no 15 ni más

El contrato contiene 13 cláusulas numeradas explícitamente (`CLÁUSULA 1` … `CLÁUSULA 13`). El regex usa `re.MULTILINE` con `^` para que solo haga match al inicio de línea, evitando que referencias en medio del texto ("conforme a la Cláusula 9 del presente instrumento", "Cláusula 3. CLÁUSULA 6…") generen chunks espurios. Esa es la diferencia clave entre chunking por cláusula correcto e incorrecto.
