# Solución del Lab M6 — Agente ReAct con Memoria

---

## Capa ② — Solución desde cero (`solucion_scratch.py`)

### Arquitectura general

```
[Session.memory]  ← lista de mensajes compartida entre turnos
       ↓
[Session.chat(mensaje_usuario)]
       ↓ agrega mensaje a memoria
[react_loop(memory)]
       ↓ itera MAX_STEPS=8 veces
       ├─ [fake_llm(memory)]  → devuelve {"action":...} o {"final":...}
       │         ↓ si action
       │  [TOOLS[tool_name](**args)]  → ejecuta la tool real
       │         ↓ resultado
       │  [memory.append(tool_result)]  → agrega a historial
       │         ↓ vuelve al inicio del loop
       └─ si final → devuelve texto
```

### El LLM falso determinista

La clave de la capa ② es `fake_llm`, que implementa la lógica de razonamiento sin ningún LLM real. Su estrategia es simple pero efectiva:

1. **Inspecciona el historial** para ver qué tools ya se llamaron.
2. **Detecta si es una confirmación** (turno 2) buscando palabras clave.
3. **Sigue un flujo secuencial** basado en lo que falta:
   - ¿Falta `consultar_reserva`? → llamarla.
   - ¿Falta `consultar_politica`? → llamarla.
   - ¿Tenemos todo? → calcular y responder.

```python
def fake_llm(messages: list) -> dict:
    called = _tools_called(messages)
    is_confirm = any(w in last_user for w in CONFIRM_WORDS)

    if is_confirm:
        # Recuperar datos del turno anterior de la memoria
        pnr = _find_in_memory(messages, "pnr")
        ...
        return {"final": f"Cambio confirmado para **{pnr}**..."}

    if "consultar_reserva" not in called:
        pnr = _extract_pnr(messages)
        return {"action": "consultar_reserva", "args": {"pnr": pnr}}

    if "consultar_politica" not in called:
        reserva = _tool_result(messages, "consultar_reserva")
        return {"action": "consultar_politica",
                "args": {"fare_class": reserva["fare_class"],
                         "route_type": reserva["route_type"]}}

    # Todo listo → calcular y responder
    ...
    return {"final": f"...Total: USD {total:.2f}..."}
```

### La memoria como lista de mensajes

La memoria es simplemente una lista que crece con cada turno:

```python
# Estado de la memoria después del Turno 1 completo:
[
  {"role": "system",    "content": "Eres asistente de cambio de vuelo..."},
  {"role": "user",      "content": "Quiero cambiar mi vuelo SCL-BOG-001..."},
  {"role": "assistant", "content": "[tool_call: consultar_reserva({'pnr': 'SCL-BOG-001'})]"},
  {"role": "tool",      "name": "consultar_reserva",
                         "content": '{"pnr":"SCL-BOG-001","fare_class":"ECONOMY_FLEX",...}'},
  {"role": "assistant", "content": "[tool_call: consultar_politica(...)]"},
  {"role": "tool",      "name": "consultar_politica",
                         "content": '{"penalidad_usd":50,...}'},
  {"role": "assistant", "content": "Encontré tu reserva SCL-BOG-001...Total: USD 130.00...\npnr:SCL-BOG-001\ntotal_usd:130.00"}
]
```

El truco de la persistencia entre turnos: la **respuesta del Turno 1 incluye líneas de estado** (`pnr:...`, `total_usd:...`, `vuelo_nuevo:...`) que la función `_find_in_memory` puede recuperar en el Turno 2. Esto simula el estado del agente de forma minimalista sin un `TypedDict` formal.

En el Turno 2:
1. Se agrega el mensaje del usuario ("Sí, confirmo") a la misma lista.
2. `fake_llm` detecta la confirmación y llama a `_find_in_memory`.
3. Recupera PNR, vuelo y total del historial.
4. Responde sin llamar ninguna tool.

### Por qué funciona la extracción del PNR

```python
def _extract_pnr(messages: list) -> str:
    import re
    for m in messages:
        if m.get("role") == "user":
            match = re.search(r'\b([A-Z]{2,3}-[A-Z]{2,3}-\d{3})\b', m["content"])
            if match:
                return match.group(1)
    return ""
```

El regex `\b([A-Z]{2,3}-[A-Z]{2,3}-\d{3})\b` captura el formato estándar del PNR de la aerolínea. Si el usuario escribe "SCL-BOG-001" en cualquier lugar del mensaje, lo extrae.

### Cálculo del costo

```python
vuelos_candidatos = [
    v for v in VUELOS["vuelos_disponibles"]
    if v["origin"] == origen
    and v["destination"] == destino
    and (fecha_nueva in v["date"] if fecha_nueva else True)
    and v["available_seats"] > 0
    and reserva.get("fare_class") in v.get("fare_classes_available", [])
]

mejor_vuelo = min(vuelos_candidatos, key=lambda v: v["price"])
diferencial = max(0.0, mejor_vuelo["price"] - precio_base)
total = penalidad + diferencial
# = 50 + (295 - 215) = 50 + 80 = 130
```

El `max(0.0, ...)` evita un diferencial negativo si el vuelo nuevo es más barato que el actual.

---

## Capa ③ — Solución con LangGraph (`solucion_framework.py`)

> **Antes de leer esta sección:** intenta escribir `solucion_framework.py` tú mismo siguiendo [guia.md §8](../guia.md#8-la-capa--explicada-langgraph-desde-cero-de-tu-bucle-react-al-grafo) y el [enunciado Parte B](enunciado.md#parte-b--agente-con-langgraph-capa--tarea-guiada). Esta explicación confirma lo que deberías haber descubierto.

### Diferencias clave con la capa ②

| Aspecto | Scratch (②) | LangGraph (③) |
|---------|-------------|---------------|
| LLM | `fake_llm` determinista | Claude real via API |
| Memory | lista manual + `_find_in_memory` | `MemorySaver` automático |
| Tool format | funciones Python normales | decoradas con `@tool` |
| Tool calling | parseo manual del dict | protocolo JSON nativo del LLM |
| Loop | `while` manual | manejado por `create_react_agent` |
| Estado entre turnos | `_find_in_memory` en texto | checkpointer con `thread_id` |

### `create_react_agent` de LangGraph

```python
agent = create_react_agent(
    model=llm,          # cualquier ChatModel de LangChain
    tools=TOOLS,        # lista de @tool
    prompt=system_prompt,
    checkpointer=checkpointer,  # MemorySaver para persistencia
)
```

Internamente, `create_react_agent` construye un `StateGraph` con:
- Nodo `agent`: el LLM con las tools vinculadas.
- Nodo `tools`: ejecuta las tool calls del último mensaje.
- Arista condicional: si hay tool calls → `tools`; si no → `END`.

### Memoria con checkpointer

```python
config = {"configurable": {"thread_id": "demo-001"}}
# Turno 1:
agent.invoke({"messages": [HumanMessage("Cambiar vuelo...")]}, config=config)
# Turno 2 — recupera automáticamente el estado del Turno 1:
agent.invoke({"messages": [HumanMessage("Sí, confirmo.")]}, config=config)
```

El `thread_id` identifica la sesión. LangGraph serializa el estado completo (historial de mensajes, estado del grafo) en `MemorySaver` (en memoria) o en un backend persistente (SQLite, Postgres).

### Descripción de tools importa mucho

```python
@tool
def consultar_reserva(pnr: str) -> dict:
    """
    Obtiene el itinerario completo de una reserva dado su PNR.
    Úsala cuando el pasajero proporcione su número de reserva (PNR).
    ...
    """
```

El docstring **es la descripción que el LLM recibe**. Claude lee "Úsala cuando el pasajero proporcione su número de reserva" y aprende a llamarla en el momento correcto. Una descripción pobre lleva a herramientas mal usadas.

### Recorrido bloque a bloque

Para el mapa completo línea por línea, ver guía §8.8. Resumen:

| Bloque en `solucion_framework.py` | Equivalente scratch |
|-----------------------------------|---------------------|
| `@tool` + `TOOLS = [...]` | `TOOLS = {"nombre": fn}` |
| `build_agent()` + `create_react_agent` | `react_loop` + `fake_llm` + `while` |
| `config` con `thread_id` | `Session` con `memory` compartida |
| `agent.invoke({"messages": [...]})` | `chat(session, mensaje)` |
| Sección comentada `StateGraph` | Bucle `while` desglosado en nodos `agent`↔`tools` |

### StateGraph explícito (sección comentada)

La alternativa al final del archivo descompone el bucle ReAct en nodos visibles. Ver guía §8.7 para la anatomía completa. Si la descomentas, necesitas además `llm_with_tools = llm.bind_tools(TOOLS)` para que el nodo `agent` emita `tool_calls`.

## Lecciones del taller

1. **El bucle ReAct es simple:** un `while` con un LLM que decide y tools que ejecutan. La complejidad aparece en la lógica del LLM, no en el framework.

2. **La memoria conversacional es una lista:** pasar todo el historial al LLM en cada llamada es la implementación más simple y efectiva para conversaciones cortas (<50 mensajes). Para contextos largos, necesitas summarization o recuperación semántica.

3. **El estado entre turnos requiere diseño explícito:** en scratch lo hacemos embutiendo datos en el texto de la respuesta; en LangGraph el checkpointer lo maneja automáticamente. En producción, siempre usa un checkpointer.

4. **El fake_llm enseña la lógica:** al implementar el LLM a mano, entiendes exactamente qué decisiones toma en cada paso. Esto ayuda a depurar agentes reales cuando el LLM se "porta mal".

5. **Las tools son la interfaz con el mundo real:** su definición (nombre, descripción, schema) es tan importante como su implementación. Un nombre confuso o una descripción incompleta hace que el LLM las use incorrectamente.

---

## Conexión con RAGorbit

El agente scratch de este taller corresponde exactamente a este subgrafo de RAGorbit:

```
model.llm ──(Model)──▶┐
                      │
io.input ──(Message)──▶ agent.react ──(Message)──▶ io.output
                      │  ↑ (loop)
tool.service "consultar_reserva" ──(Tool)──▶┘
tool.service "consultar_politica" ──(Tool)──▶┘
```

La diferencia con el template 01 (aerolínea) es que éste agrega:
- `tool.service "InventoryService"` y `"PricingService"` (que aquí calculamos localmente).
- `tool.retriever "PolicyRAG"` (que aquí simulamos con `consultar_politica`).
- `guardrail.confirm` + `guardrail.idempotency` + `guardrail.resilience` sobre el pago.
- `observability.audit` para trazabilidad en Kafka.

Los principios del bucle ReAct y la memoria son idénticos.
