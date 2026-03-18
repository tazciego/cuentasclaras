// ─── URL base ─────────────────────────────────────────────────────────────────

const API_BASE = "https://easysplit.omegatecnos.com/api"

// ─── Error tipado ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  mensaje: string
  status: number
  constructor(mensaje: string, status: number) {
    super(mensaje)
    this.name = "ApiError"
    this.mensaje = mensaje
    this.status = status
  }
}

// ─── Fetch base ───────────────────────────────────────────────────────────────

async function apiFetch<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/${ruta}`, {
      headers: { "Content-Type": "application/json" },
      ...opciones,
    })
  } catch {
    throw new ApiError("Sin conexión. Revisa tu internet e intenta de nuevo.", 0)
  }

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(json.error ?? "Error inesperado en el servidor.", res.status)
  }

  return json as T
}

// ─── Tipos de respuesta ───────────────────────────────────────────────────────

export interface EventoAPI {
  id: number
  nombre: string
  tipo: "restaurante" | "reunion" | "viaje" | "roomies"
  fecha: string | null
  hora: string | null
  lugar: string | null
  codigo: string
  estado: "activo" | "cerrado"
  creado_en: string
}

export interface InvitadoCreado {
  id: number
  evento_id: number
  nombre: string
  token: string
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export function crearEvento(datos: {
  nombre: string
  tipo: string
  fecha?: string
  hora?: string
  lugar?: string
}): Promise<{ id: number; codigo: string }> {
  return apiFetch("eventos.php", {
    method: "POST",
    body: JSON.stringify(datos),
  })
}

export function buscarEventoPorCodigo(codigo: string): Promise<EventoAPI> {
  return apiFetch<EventoAPI>(`eventos.php?codigo=${encodeURIComponent(codigo)}`)
}

// ─── Invitados ────────────────────────────────────────────────────────────────

export interface InvitadoListado {
  id: number
  nombre: string
  color_index: number
  es_anfitrion: number
  unido_en: string
}

export function listarInvitados(eventoId: number): Promise<InvitadoListado[]> {
  return apiFetch<InvitadoListado[]>(`invitados.php?evento_id=${eventoId}`)
}

export function unirseAEvento(datos: {
  codigo: string
  nombre: string
  color_index: number
  es_anfitrion?: number
}): Promise<InvitadoCreado> {
  return apiFetch("invitados.php", {
    method: "POST",
    body: JSON.stringify(datos),
  })
}

// ─── Consumos ─────────────────────────────────────────────────────────────────

export interface ConsumoAsignado {
  consumo_id: number
  invitado_id: number
  cantidad: number
  invitado_nombre: string
}

export interface ConsumoAPI {
  id: number
  descripcion: string
  precio: string   // DECIMAL viene como string en JSON de PHP
  cantidad: number
  creado_en: string
  asignados: ConsumoAsignado[]
}

export function listarConsumos(eventoId: number): Promise<ConsumoAPI[]> {
  return apiFetch<ConsumoAPI[]>(`consumos.php?evento_id=${eventoId}`)
}
