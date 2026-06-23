# M6 · Ejercicios — Agentes I

> **Instrucciones:** Responde sin mirar las soluciones. Para ejercicios de código, escribe tu respuesta antes de ejecutarla.
>
> Las respuestas razonadas están en `soluciones.md`.

---

## Ejercicio 14 · Opción múltiple — ¿Agente o pipeline?

Para cada escenario, indica si usarías un agente ReAct o un pipeline determinista, y justifica en una frase.

**(a)** Una empresa quiere generar automáticamente el PDF del boletín mensual a partir de un repositorio de artículos. El proceso es siempre el mismo: extraer artículos del mes, resumirlos, formatear y generar PDF.

**(b)** Un usuario de banca escribe: "Necesito transferir dinero, pero primero dime si tengo fondos suficientes y si la cuenta destino está activa."

**(c)** Un bot de e-commerce debe responder "¿Cuándo llega mi pedido?" consultando el estado de envío por el número de orden que ya viene en el JWT del usuario.

**(d)** Un asistente de RRHH responde preguntas sobre políticas de vacaciones, permisos y beneficios, buscando siempre en el mismo documento de política.

**(e)** Un agente de soporte técnico debe diagnosticar un problema de red: puede necesitar consultar logs, hacer ping a servicios, revisar tickets anteriores del mismo cliente, y cada paso depende del anterior.

---

## Ejercicio 15 · "Traza el bucle ReAct"

El usuario escribe a un bot de retail:
> "Quiero devolver el pedido ORD-0998. Es que llegó incompleto."

El agente tiene acceso a estas tools:
- `OrderService(order_id)` → devuelve estado y monto del pedido.
- `PolicyRAG(query)` → busca en la política de devoluciones.
- `ReturnService(order_id, reason, amount)` → inicia la devolución.

**Traza los pasos del bucle ReAct:** para cada paso escribe:
1. **Thought:** qué razona el agente.
2. **Action:** qué tool llama y con qué argumentos.
3. **Observation:** qué devuelve la tool (invéntalo coherentemente; asume monto $240).

Indica en qué paso aplica el `guardrail.confirm` (umbral $200) y qué mensaje ve el usuario antes de que el agente llame a `ReturnService`.

---

## Ejercicio 16 · "Predice la salida"

Dado este fragmento de código Python que implementa un agente ReAct minimalista:

```python
memory = [
    {"role": "system", "content": "Eres asistente de vuelos."},
    {"role": "user",   "content": "¿Cuánto cuesta cambiar mi vuelo?"}
]

def fake_llm(messages):
    last = messages[-1]["content"]
    if "cuánto cuesta" in last.lower():
        return {"action": "policy_rag", "args": {"query": "penalidad cambio vuelo"}}
    if "policy_rag" in str(last):
        return {"final": "La penalidad es USD 50 según §3.2."}
    return {"final": "No entendí la pregunta."}

def policy_rag(query):
    return [{"text": "Penalidad de cambio: USD 50.", "source": "§3.2"}]

TOOLS = {"policy_rag": policy_rag}

step = 0
while step < 5:
    response = fake_llm(memory)
    if "final" in response:
        print("Respuesta:", response["final"])
        break
    tool_name = response["action"]
    tool_result = TOOLS[tool_name](**response["args"])
    memory.append({"role": "assistant", "content": str(response)})
    memory.append({"role": "tool", "name": tool_name, "content": str(tool_result)})
    step += 1
```

**(a)** ¿Cuántas iteraciones del bucle se ejecutan antes del `break`?

**(b)** ¿Qué se imprime en pantalla?

**(c)** Si el usuario preguntara en un **segundo turno** "¿y si soy premium?" (sin agregar nada al historial), ¿el agente recordaría que antes preguntó sobre el costo del cambio?

**(d)** ¿Qué habría que cambiar para que el segundo turno recuerde el primero?

---

## Ejercicio 17 · "Diseña la memoria"

Tienes un agente de servicio al cliente de aerolínea. En la sesión actual el usuario ha dicho:

1. "Mi PNR es SCL-BOG-001."
2. "Quiero cambiar al 17 de junio."
3. [El agente consultó ReservationService: fare_class=ECONOMY_FLEX, penalidad=USD 50]
4. [El agente calculó delta=USD 80, total=USD 130]
5. "Sí, confirmo el cambio."

**(a)** ¿Qué información va en la **memoria conversacional** (historial de mensajes)?

**(b)** ¿Qué información va en el **estado del agente** (working memory / diccionario de estado)?

**(c)** Si el usuario ahora pregunta "¿y si en vez de FL305 elijo FL301?", ¿qué pasos del ReAct tendría que repetir el agente? ¿Cuáles no?

**(d)** ¿Qué pasaría si el agente no tuviera memoria y el usuario dijera "sí, confirmo" en un segundo turno separado?

---

## Ejercicio 18 · "Encuentra el bug"

El siguiente código intenta implementar un agente con memoria simple:

```python
class AgentWithMemory:
    def __init__(self, tools):
        self.tools = tools
        self.memory = []  # ← historial de mensajes

    def chat(self, user_message):
        # Bug 1: ¿hay algo mal en cómo se agrega el mensaje del usuario?
        self.memory = [{"role": "user", "content": user_message}]

        response = fake_llm(self.memory)

        if "action" in response:
            tool = self.tools[response["action"]]
            result = tool(**response["args"])
            # Bug 2: ¿qué falta aquí?
            response = fake_llm(self.memory)

        return response.get("final", "Sin respuesta")

agent = AgentWithMemory({"policy_rag": policy_rag})
r1 = agent.chat("¿Cuánto cuesta cambiar mi vuelo?")
r2 = agent.chat("¿Y si soy premium?")  # ¿recuerda el contexto?
```

**(a)** Identifica y describe los dos bugs marcados.

**(b)** Escribe el código corregido de los dos fragmentos defectuosos.

**(c)** Después de la corrección, ¿el agente recuerda la primera pregunta cuando responde la segunda? ¿Por qué?

---

## Ejercicio 19 · Comparativa de arquitecturas

Tienes que construir un asistente para un call center de seguros. El asistente debe:
- Responder preguntas sobre coberturas (base de conocimiento estática).
- Consultar el estado de una póliza específica (servicio HTTP).
- Crear un ticket de reclamo si el cliente lo solicita (servicio HTTP con confirmación).

**(a)** Diseña el flujo como **pipeline determinista** (sin `agent.react`). Dibuja un diagrama simple con los nodos RAGorbit necesarios y el orden. ¿Qué supuesto debes hacer sobre el flujo del usuario?

**(b)** Diseña el flujo como **agente ReAct**. ¿Qué nodos usarías? ¿Qué tools tendría el agente?

**(c)** ¿Cuál elegiría para producción y por qué? Considera: costo, mantenibilidad, robustez ante preguntas fuera del flujo feliz.

---

## Ejercicio 20 · LangGraph conceptual

Dado el siguiente grafo de un agente (pseudocódigo):

```python
class State(TypedDict):
    query:     str
    pnr:       str
    has_pnr:   bool
    policy:    str
    confirmed: bool
    result:    str

builder = StateGraph(State)
builder.add_node("A", node_extract_pnr)    # extrae PNR del query
builder.add_node("B", node_get_reservation) # llama ReservationService
builder.add_node("C", node_check_policy)   # llama PolicyRAG
builder.add_node("D", node_ask_confirm)    # pregunta confirmación
builder.add_node("E", node_execute)        # ejecuta el cambio

builder.set_entry_point("A")
builder.add_conditional_edges("A", lambda s: "B" if s["has_pnr"] else "D")
builder.add_edge("B", "C")
builder.add_conditional_edges("C", lambda s: "E" if s["confirmed"] else "D")
builder.add_edge("D", END)
builder.add_edge("E", END)
```

**(a)** Dibuja el grafo (nodos y aristas condicionales).

**(b)** Si el usuario escribe "Cambiar vuelo" (sin PNR), ¿qué camino sigue el grafo?

**(c)** Si el usuario escribe "Cambiar vuelo PNR=SCL001" y ya tiene `confirmed=True` en el estado, ¿qué camino sigue?

**(d)** ¿Qué ventaja tiene este diseño explícito vs. un ReAct libre que también podría hacer esto?

---

## Ejercicio 21 · Reflection práctica

Un agente ReAct genera la siguiente respuesta tentativa para "¿puedo llevar baterías de litio en mi maleta?":

> "Sí, puedes llevar baterías de litio."

Un evaluador interno (otro llamado al LLM) recibe esta respuesta junto al contexto recuperado:

```
Contexto recuperado:
  - "Baterías de litio ≤100Wh: permitidas en equipaje de mano; prohibidas en bodega. [§4.2]"
  - "Baterías 100-160Wh: requieren autorización previa. [§4.3]"
  - "Baterías >160Wh: prohibidas. [§4.4]"
```

**(a)** ¿Qué problemas tiene la respuesta tentativa? Lista al menos 3.

**(b)** Escribe la respuesta mejorada que el agente debería entregar tras la reflexión.

**(c)** ¿Cuándo **no** valdría la pena hacer Reflection en este caso de uso? Proporciona al menos dos razones.

---

## Ejercicio 22 · Tool design

Estás diseñando las tools de un agente de servicio al cliente para un banco. El agente debe poder:
1. Consultar el saldo de una cuenta.
2. Listar los últimos N movimientos.
3. Hacer una transferencia.

**(a)** Escribe el JSON Schema de `inputSchema` para cada tool.

**(b)** La tool de transferencia necesita `guardrail.confirm` para montos > $500 e `guardrail.idempotency` con clave `(account_id, session_id)`. Dibuja la cadena de conexiones en RAGorbit (puertos Tool → Tool).

**(c)** ¿Qué description escribirías para la tool de transferencia para que el LLM la use en el momento correcto (no antes de confirmar saldo)?

---

## Ejercicio 23 · Agentic RAG vs RAG estándar

Tienes un asistente de seguros con dos bases de conocimiento:
- Índice A: coberturas generales.
- Índice B: exclusiones específicas por póliza.

**(a)** Con RAG estándar, diseña cómo responderías a "¿mi póliza cubre daños por inundación?". ¿Qué problema tiene cuando el usuario pregunta algo fuera de los documentos?

**(b)** Con Agentic RAG, ¿cómo usaría el agente los dos índices para la misma pregunta? ¿Qué haría si ninguno de los dos índices tiene la respuesta?

**(c)** En RAGorbit, ¿cómo expondrías los dos índices como tools? Escribe los dos nodos `tool.retriever` con su descripción.

---

## Ejercicio 24 · "Elige la tecnología"

Para cada caso, elige entre ReAct, Plan-and-Execute, Reflexion o LangGraph StateGraph, y justifica en 2-3 frases.

**(a)** Un chatbot de soporte que responde 1000 conversaciones por minuto, con respuestas esperadas en < 2 segundos. El flujo siempre involucra: buscar FAQ, consultar estado de ticket, responder.

**(b)** Un sistema de investigación que, dada una pregunta de negocio, hace 15-20 búsquedas web, lee documentos, y sintetiza un informe. Corre en batch, no en tiempo real.

**(c)** Un agente de trading que ejecuta órdenes en bolsa. El número de pasos es variable pero el estado (cuenta, portfolio, riesgo) debe persistir entre llamadas y ser auditado.

**(d)** Un sistema que genera código Python para un cliente, lo ejecuta en un sandbox, evalúa si el output es correcto, y mejora el código si no lo es. Se permiten hasta 3 intentos.

---

## Ejercicio 25 · Integración RAGorbit

Revisa el `flow.json` del template `01-airline-flight-change` (en `examples/01-airline-flight-change/flow.json`).

**(a)** Cuenta cuántos nodos `tool.*` hay y lista sus nombres e IDs.

**(b)** ¿Por qué el pago tiene tres guardrails en cadena? Explica qué hace cada uno en orden.

**(c)** La arista del agente hacia sí mismo (`"loop": true`) ¿qué representa en el bucle ReAct?

**(d)** Si quisieras agregar un segundo índice RAG (por ejemplo, procedimientos de excepción para vuelos internacionales cancelados), ¿qué nodos agregarías y cómo los conectarías? Describe los cambios al `flow.json`.

**(e)** El `system` prompt del `agent.react` dice: "Flujo obligatorio: (1) Obtén itinerario... (2) Consulta PolicyRAG...". ¿Eso convierte al agente en un pipeline? ¿Por qué sí o por qué no?

---

## Ejercicio 26 · Diseño end-to-end

Tienes el siguiente brief de negocio:

> **Asistente de reservas de hotel.** Un huésped puede preguntar por disponibilidad ("¿hay habitaciones el 20 de julio?"), hacer una reserva, o cancelarla. La cancelación tiene penalidad si es con menos de 48 h de anticipación. El asistente debe recordar el contexto durante la conversación (el huésped no debería repetir su número de reserva en cada turno).

**(a)** Lista las tools que necesitaría este agente (nombres, descripción de 1 línea, esquema de entrada simplificado).

**(b)** ¿Qué guardrails colocarías y sobre qué tools?

**(c)** ¿Qué información guardarías en el estado del agente (working memory)?

**(d)** Escribe el `system` prompt del `agent.react` (3-5 oraciones, guiando el flujo preferido sin hacerlo completamente determinista).

**(e)** ¿Hay algún caso donde este agente debería escalar a un humano (`hitl.escalate`)? ¿Cuál?

---

## Ejercicio 27 · "Predice qué tool llama el agente"

Un agente tiene estas dos tools decoradas con `@tool`:

```python
@tool
def consultar_saldo(account_id: str) -> dict:
    """
    Devuelve el saldo actual de una cuenta bancaria.
    Úsala SOLO cuando el cliente pregunte por su saldo o disponibilidad de fondos.
    Requiere el account_id del cliente.
    """
    ...

@tool
def hacer_transferencia(from_account: str, to_account: str, amount: float) -> dict:
    """
    Ejecuta una transferencia entre cuentas.
    ÚSALA ÚNICAMENTE después de confirmar saldo suficiente y obtener
    confirmación explícita del cliente sobre el monto y la cuenta destino.
    """
    ...
```

El usuario escribe en el **primer turno**: *"¿Cuánto tengo en mi cuenta ACC-4421?"*

**(a)** ¿Qué tool debería llamar el agente en su primera iteración? ¿Por qué?

**(b)** El usuario responde en un **segundo turno** (misma sesión): *"Transfiere $200 a la cuenta ACC-9900."* Sin haber consultado saldo en este turno, ¿qué tools debería llamar el agente y en qué orden? Justifica usando los docstrings.

**(c)** Si el docstring de `hacer_transferencia` dijera solo `"Transfiere dinero"`, ¿qué problema podría ocurrir?

---

## Ejercicio 28 · "Completa la arista condicional"

Estás construyendo un `StateGraph` explícito para el agente del lab. Tienes este esqueleto incompleto:

```python
def should_continue(state: FlightChangeState) -> str:
    last = state["messages"][-1]
    # TODO: completar — ¿hay tool_calls pendientes?
    ...

builder = StateGraph(FlightChangeState)
builder.add_node("agent", node_agent)
builder.add_node("tools", node_call_tools)
builder.set_entry_point("agent")
builder.add_conditional_edges("agent", should_continue, {
    # TODO: completar el mapa de destinos
})
builder.add_edge("tools", "agent")
graph = builder.compile(checkpointer=MemorySaver())
```

**(a)** Completa el cuerpo de `should_continue` para que devuelva `"tools"` si el último mensaje tiene `tool_calls`, y `"end"` si no.

**(b)** Completa el diccionario del tercer argumento de `add_conditional_edges` (mapeo de valores de retorno → nombres de nodo o `END`).

**(c)** ¿Por qué `add_edge("tools", "agent")` es necesaria? ¿Qué pasaría si solo tuvieras la arista condicional desde `agent` sin esa arista de vuelta?

**(d)** Dibuja el grafo resultante (nodos + aristas) en ASCII.

---

## Ejercicio 29 · "Mapea scratch → StateGraph y memoria con thread_id"

Compara tu implementación scratch del lab con el `StateGraph` de LangGraph.

**(a)** Completa esta tabla de correspondencia:

| Paso en `solucion_scratch.py` | Nodo/arista en LangGraph |
|-------------------------------|--------------------------|
| `fake_llm(memory)` decide acción | ? |
| `TOOLS[name](**args)` | ? |
| `memory.append({"role": "tool", ...})` | ? |
| `if "final" in response: break` | ? |
| `session.memory` persiste entre turnos | ? |

**(b)** ¿Por qué el mismo `thread_id` en dos `invoke` consecutivos hace que el agente recuerde el Turno 1? Explica qué guarda `MemorySaver` y qué pasa si cambias el `thread_id` en el Turno 2.

**(c)** En scratch usaste `_find_in_memory` para recuperar `pnr` y `total` del Turno 1. Con `create_react_agent` + `MemorySaver`, ¿necesitas esa función? ¿Por qué sí o por qué no?
