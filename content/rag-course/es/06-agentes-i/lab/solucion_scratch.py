"""
Agente ReAct con Memoria — Cambio de Vuelo
===========================================
Capa ②: implementación desde cero, solo stdlib, determinista.

Simula el bucle ReAct (Razonar → Actuar → Observar) con:
  - LLM fake determinista (lee el historial y decide el siguiente paso)
  - Tools reales que leen datos mock de lab/datos/
  - Memoria conversacional como lista de mensajes
  - Dos turnos: solicitud de cambio + confirmación

Ejecutar: python3 solucion_scratch.py
"""

import json
import os

# ---------------------------------------------------------------------------
# Paths a los datos (relativos al directorio de este script)
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_DATOS = os.path.join(_HERE, "datos")

# ---------------------------------------------------------------------------
# Carga de datos mock
# ---------------------------------------------------------------------------
def _load(filename):
    with open(os.path.join(_DATOS, filename), encoding="utf-8") as f:
        return json.load(f)

RESERVAS = _load("reservas.json")
POLITICA = _load("politica.json")
VUELOS   = _load("vuelos.json")

# ---------------------------------------------------------------------------
# TOOLS — funciones Python puras (sin red, sin pip)
# ---------------------------------------------------------------------------

def consultar_reserva(pnr: str) -> dict:
    """Devuelve el itinerario de una reserva dado su PNR."""
    reserva = RESERVAS.get(pnr)
    if not reserva:
        return {"error": f"No se encontró reserva con PNR {pnr!r}"}
    return reserva


def consultar_politica(fare_class: str, route_type: str) -> dict:
    """Devuelve la política de cambio para una clase tarifaria y tipo de ruta."""
    for regla in POLITICA["penalidades"]:
        if regla["fare_class"] == fare_class and regla["route_type"] == route_type:
            return regla
    return {"error": f"No hay política para {fare_class!r} / {route_type!r}"}


TOOLS = {
    "consultar_reserva": consultar_reserva,
    "consultar_politica": consultar_politica,
}

# ---------------------------------------------------------------------------
# Helpers para inspeccionar la memoria
# ---------------------------------------------------------------------------

def _tools_called(messages: list) -> list:
    """Devuelve la lista de nombres de tools ya llamadas en esta sesión."""
    return [m["name"] for m in messages if m.get("role") == "tool"]


def _last_user_message(messages: list) -> str:
    """Devuelve el contenido del último mensaje del usuario."""
    for m in reversed(messages):
        if m.get("role") == "user":
            return m.get("content", "")
    return ""


def _tool_result(messages: list, tool_name: str):
    """Devuelve el contenido (parseado) del resultado de una tool ya llamada."""
    for m in messages:
        if m.get("role") == "tool" and m.get("name") == tool_name:
            try:
                return json.loads(m["content"])
            except (json.JSONDecodeError, TypeError):
                return m["content"]
    return None


def _find_in_memory(messages: list, key: str):
    """Busca un valor guardado como 'key:valor' en cualquier mensaje del asistente."""
    prefix = f"{key}:"
    for m in reversed(messages):
        if m.get("role") == "assistant":
            content = m.get("content", "")
            for line in content.splitlines():
                if line.startswith(prefix):
                    return line[len(prefix):].strip()
    return None

# ---------------------------------------------------------------------------
# LLM FAKE DETERMINISTA
# ---------------------------------------------------------------------------
# Implementa la lógica de razonamiento del bucle ReAct de forma determinista.
# No hay aleatoriedad: para el mismo historial siempre produce la misma acción.

CONFIRM_WORDS = ("sí", "si,", "si ", "confirmo", "acepto", "de acuerdo",
                 "adelante", "procede", "ok", "okay")


def fake_llm(messages: list) -> dict:
    """
    LLM determinista que simula el razonamiento ReAct.

    Retorna:
      {"action": "tool_name", "args": {...}, "thought": "..."}  — llama una tool
      {"final": "texto de respuesta", "thought": "..."}          — respuesta lista
    """
    called = _tools_called(messages)
    last_user = _last_user_message(messages).lower()
    is_confirm = any(w in last_user for w in CONFIRM_WORDS)

    # ----------------------------------------------------------------
    # CASO: el usuario está CONFIRMANDO (turno 2)
    # ----------------------------------------------------------------
    if is_confirm:
        # Recuperar datos del turno anterior desde la memoria
        pnr = _find_in_memory(messages, "pnr")
        total_str = _find_in_memory(messages, "total_usd")
        vuelo = _find_in_memory(messages, "vuelo_nuevo")
        fecha = _find_in_memory(messages, "fecha_nueva")

        if pnr and total_str:
            total = float(total_str)
            return {
                "thought": (
                    f"El usuario confirmó el cambio. Recuerdo del turno anterior: "
                    f"PNR={pnr}, vuelo nuevo={vuelo}, fecha={fecha}, total=USD {total}. "
                    f"Procedo a confirmar el cambio."
                ),
                "final": (
                    f"Cambio confirmado para la reserva **{pnr}**.\n\n"
                    f"- Vuelo nuevo: **{vuelo}** el {fecha}\n"
                    f"- Costo total cobrado: **USD {total:.2f}**\n\n"
                    f"Recibirás el nuevo itinerario por email. ¡Buen viaje!"
                )
            }
        else:
            return {
                "thought": "El usuario confirma pero no hay contexto previo de cambio de vuelo.",
                "final": "No encontré ningún cambio pendiente para confirmar. "
                         "Por favor, dime tu PNR y el vuelo que deseas."
            }

    # ----------------------------------------------------------------
    # FLUJO NORMAL (turno 1: solicitud de cambio)
    # ----------------------------------------------------------------

    # PASO 1 — No tenemos la reserva todavía → llamar consultar_reserva
    if "consultar_reserva" not in called:
        # Intentar extraer el PNR del mensaje del usuario
        # El PNR tiene el formato XXX-XXX-NNN (ej: SCL-BOG-001)
        pnr = _extract_pnr(messages)
        if not pnr:
            return {
                "thought": "El usuario quiere cambiar su vuelo pero no veo un PNR claro. "
                           "Necesito el PNR para consultar la reserva.",
                "final": "Para gestionar tu cambio de vuelo, necesito tu número de "
                         "reserva (PNR). ¿Puedes proporcionármelo?"
            }
        return {
            "thought": f"Necesito obtener el itinerario del pasajero. PNR extraído: {pnr}",
            "action": "consultar_reserva",
            "args":   {"pnr": pnr}
        }

    # PASO 2 — Tenemos la reserva pero no la política → llamar consultar_politica
    if "consultar_politica" not in called:
        reserva = _tool_result(messages, "consultar_reserva")
        if isinstance(reserva, dict) and "error" not in reserva:
            fare_class = reserva.get("fare_class", "")
            route_type = reserva.get("route_type", "")
            return {
                "thought": (
                    f"Tengo el itinerario: vuelo {reserva.get('flight_id')}, "
                    f"tarifa {fare_class}, ruta {route_type}. "
                    f"Ahora necesito verificar la penalidad de cambio."
                ),
                "action": "consultar_politica",
                "args":   {"fare_class": fare_class, "route_type": route_type}
            }
        else:
            return {
                "thought": "La consulta de reserva devolvió error.",
                "final": f"No pude encontrar tu reserva: "
                         f"{reserva.get('error', 'error desconocido') if isinstance(reserva, dict) else reserva}"
            }

    # PASO 3 — Tenemos reserva + política → calcular precio y responder
    reserva  = _tool_result(messages, "consultar_reserva")
    politica = _tool_result(messages, "consultar_politica")

    if isinstance(politica, dict) and not politica.get("cambio_permitido", True) \
       and politica.get("cambio_permitido") is False:
        return {
            "thought": "La tarifa no permite cambios.",
            "final": (
                f"Lo siento, la tarifa **{reserva.get('fare_class')}** no permite "
                f"cambios de vuelo. {politica.get('nota', '')}"
            )
        }

    penalidad = float(politica.get("penalidad_usd") or 0)

    # Buscar vuelos disponibles en la ruta y fecha destino
    fecha_nueva = _extract_date(messages)  # ej: "2026-06-17"
    origen      = reserva.get("origin", "")
    destino     = reserva.get("destination", "")
    precio_base = float(reserva.get("base_price", 0))

    vuelos_candidatos = [
        v for v in VUELOS["vuelos_disponibles"]
        if v["origin"] == origen
        and v["destination"] == destino
        and (fecha_nueva in v["date"] if fecha_nueva else True)
        and v["available_seats"] > 0
        and reserva.get("fare_class") in v.get("fare_classes_available", [])
    ]

    if not vuelos_candidatos:
        return {
            "thought": "No hay vuelos disponibles en esa ruta/fecha.",
            "final": (
                f"No encontré vuelos disponibles en la ruta "
                f"{origen}→{destino} para la fecha solicitada."
            )
        }

    # Elegir el vuelo más económico
    mejor_vuelo = min(vuelos_candidatos, key=lambda v: v["price"])
    diferencial = max(0.0, mejor_vuelo["price"] - precio_base)
    total = penalidad + diferencial

    return {
        "thought": (
            f"Tengo toda la información. "
            f"Penalidad: USD {penalidad}. "
            f"Vuelo más económico: {mejor_vuelo['flight_id']} a USD {mejor_vuelo['price']}. "
            f"Diferencial: USD {diferencial}. Total: USD {total}."
        ),
        "final": (
            f"Encontré tu reserva **{reserva['pnr']}** "
            f"({reserva['passenger']}, vuelo {reserva['flight_id']}, "
            f"{reserva['departure_date']}).\n\n"
            f"Para cambiar al **{mejor_vuelo['date']}**, el vuelo disponible es:\n"
            f"- **{mejor_vuelo['flight_id']}** — salida {mejor_vuelo['departure_time']} — "
            f"USD {mejor_vuelo['price']:.2f}\n\n"
            f"**Desglose del costo:**\n"
            f"- Penalidad de cambio ({reserva['fare_class']}): USD {penalidad:.2f}\n"
            f"- Diferencial de tarifa: USD {diferencial:.2f}\n"
            f"- **Total: USD {total:.2f}**\n\n"
            f"¿Confirmas el cambio?\n\n"
            # Datos para memoria (el turno 2 los recuperará)
            f"pnr:{reserva['pnr']}\n"
            f"vuelo_nuevo:{mejor_vuelo['flight_id']}\n"
            f"fecha_nueva:{mejor_vuelo['date']}\n"
            f"total_usd:{total:.2f}"
        )
    }


# ---------------------------------------------------------------------------
# Helpers de extracción del mensaje del usuario
# ---------------------------------------------------------------------------

def _extract_pnr(messages: list) -> str:
    """Extrae el PNR del historial (formato: 3 mayúsculas-3mayusculas-3digits)."""
    import re
    for m in messages:
        if m.get("role") == "user":
            match = re.search(r'\b([A-Z]{2,3}-[A-Z]{2,3}-\d{3})\b', m["content"])
            if match:
                return match.group(1)
    return ""


def _extract_date(messages: list) -> str:
    """
    Extrae la fecha destino del historial.
    Soporta patrones comunes: 'al 17', 'el 17 de junio', 'día 17'.
    Siempre asume año 2026.
    """
    import re
    MESES = {
        "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
        "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
        "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12"
    }
    for m in messages:
        if m.get("role") == "user":
            text = m["content"].lower()
            # "al 17 de junio" o "el 17 de junio"
            match = re.search(
                r'(?:al|el|día|dia)\s+(\d{1,2})\s+de\s+(\w+)', text
            )
            if match:
                dia = match.group(1).zfill(2)
                mes = MESES.get(match.group(2), "")
                if mes:
                    return f"2026-{mes}-{dia}"
            # Formato numérico: 17/06 o 17-06
            match = re.search(r'(\d{1,2})[/-](\d{2})', text)
            if match:
                dia = match.group(1).zfill(2)
                mes = match.group(2)
                return f"2026-{mes}-{dia}"
    return ""


# ---------------------------------------------------------------------------
# BUCLE REACT
# ---------------------------------------------------------------------------

MAX_STEPS = 8


def react_loop(memory: list) -> str:
    """
    Ejecuta el bucle ReAct hasta obtener una respuesta final o alcanzar MAX_STEPS.
    Modifica `memory` in-place agregando los pasos del agente.
    Devuelve el texto de la respuesta final.
    """
    for step in range(MAX_STEPS):
        response = fake_llm(memory)
        thought = response.get("thought", "")

        if thought:
            print(f"  [Paso {step+1}] Thought: {thought}")

        # Respuesta final: el agente tiene toda la info
        if "final" in response:
            final_text = response["final"]
            memory.append({
                "role":    "assistant",
                "content": final_text
            })
            return final_text

        # Llamada a tool
        tool_name = response.get("action")
        tool_args = response.get("args", {})

        if tool_name and tool_name in TOOLS:
            print(f"  [Paso {step+1}] Action: {tool_name}({tool_args})")
            result = TOOLS[tool_name](**tool_args)
            result_str = json.dumps(result, ensure_ascii=False)
            print(f"  [Paso {step+1}] Observation: {result_str}")

            # Agregar a memoria: la acción del asistente y el resultado
            memory.append({
                "role":    "assistant",
                "content": f"[tool_call: {tool_name}({json.dumps(tool_args)})]"
            })
            memory.append({
                "role":    "tool",
                "name":    tool_name,
                "content": result_str
            })
        else:
            # No hay tool válida y no hay "final" → respuesta de error
            return "Error interno: el agente no pudo decidir la siguiente acción."

    return "Alcancé el límite de pasos sin poder responder."


# ---------------------------------------------------------------------------
# INTERFAZ DE CHAT (mantiene memoria entre turnos)
# ---------------------------------------------------------------------------

class Session:
    """Mantiene la memoria conversacional de una sesión."""

    SYSTEM = (
        "Eres un asistente especializado en cambios de vuelo. "
        "Ayuda al pasajero a rebooked su itinerario cumpliendo las políticas tarifarias. "
        "Flujo preferido: (1) Consulta el itinerario con consultar_reserva. "
        "(2) Verifica la penalidad con consultar_politica. "
        "(3) Calcula el costo total y presenta las opciones. "
        "(4) Ejecuta el cambio solo tras confirmación explícita."
    )

    def __init__(self):
        self.memory = [{"role": "system", "content": self.SYSTEM}]

    def chat(self, user_message: str) -> str:
        """Procesa un mensaje del usuario y devuelve la respuesta del agente."""
        self.memory.append({"role": "user", "content": user_message})
        response = react_loop(self.memory)
        return response


# ---------------------------------------------------------------------------
# DEMO — dos turnos de conversación
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("AGENTE REACT — CAMBIO DE VUELO (stdlib, determinista)")
    print("=" * 60)

    session = Session()

    # ------------------------------------------------------------------
    # TURNO 1 — Solicitud de cambio
    # ------------------------------------------------------------------
    print("\n>>> TURNO 1")
    turno1 = "Quiero cambiar mi vuelo SCL-BOG-001 del 15 al 17 de junio."
    print(f"USUARIO: {turno1}\n")

    respuesta1 = session.chat(turno1)

    # Mostrar solo las primeras líneas (ocultar las líneas de estado de memoria)
    lineas_respuesta = [
        l for l in respuesta1.splitlines()
        if not any(l.startswith(k) for k in ("pnr:", "vuelo_nuevo:", "fecha_nueva:", "total_usd:"))
    ]
    print(f"\nAGENTE:\n{chr(10).join(lineas_respuesta)}")

    # ------------------------------------------------------------------
    # TURNO 2 — Confirmación
    # ------------------------------------------------------------------
    print("\n" + "-" * 60)
    print(">>> TURNO 2")
    turno2 = "Sí, confirmo el cambio."
    print(f"USUARIO: {turno2}\n")

    respuesta2 = session.chat(turno2)
    print(f"\nAGENTE:\n{respuesta2}")

    print("\n" + "=" * 60)
    print("Conversación completada.")
    print(f"Mensajes en memoria: {len(session.memory)}")

    # Verificar que en el turno 2 NO se llamó consultar_reserva de nuevo
    tool_calls = [m["name"] for m in session.memory if m.get("role") == "tool"]
    print(f"Tool calls totales: {tool_calls}")

    # Verificar costo en la respuesta
    assert "130" in respuesta1, "ERROR: el costo total USD 130 no aparece en la respuesta del Turno 1"
    assert "SCL-BOG-001" in respuesta2, "ERROR: el turno 2 no recuerda el PNR"
    # En el turno 2 no debe haber nuevas llamadas a consultar_reserva
    # (las 2 calls del turno 1 son suficientes)
    calls_reserva = sum(1 for m in session.memory
                        if m.get("role") == "tool" and m.get("name") == "consultar_reserva")
    assert calls_reserva == 1, \
        f"ERROR: consultar_reserva se llamó {calls_reserva} veces (debería ser 1)"

    print("\nTodas las verificaciones pasaron.")


if __name__ == "__main__":
    main()
