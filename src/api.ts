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
  estado: 'aceptado' | 'pendiente' | 'rechazado'
  solicitado_por: number | null
  solicitante_nombre: string | null
}

export interface NotificacionCompartir {
  consumo_id: number
  invitado_id: number
  cantidad: number
  estado: 'pendiente' | 'rechazado'
  solicitado_por: number
  consumo_nombre: string
  precio: string
  invitado_nombre: string
  solicitante_nombre: string
}

export interface ConsumoAPI {
  id: number
  descripcion: string
  precio: string   // DECIMAL viene como string en JSON de PHP
  cantidad: number
  creado_en: string
  asignados: ConsumoAsignado[]
}

export type AsignadoConCantidad = { invitado_id: number; cantidad: number }

export function listarConsumos(eventoId: number): Promise<ConsumoAPI[]> {
  return apiFetch<ConsumoAPI[]>(`consumos.php?evento_id=${eventoId}`)
}

export function eliminarConsumo(consumoId: number): Promise<{ mensaje: string }> {
  return apiFetch(`consumos.php?id=${consumoId}`, { method: "DELETE" })
}

export function actualizarConsumo(datos: {
  id: number
  descripcion: string
  precio: number
  cantidad: number
  asignados?: AsignadoConCantidad[]
}): Promise<{ mensaje: string }> {
  return apiFetch("consumos.php", { method: "PUT", body: JSON.stringify(datos) })
}

export function guardarConsumo(datos: {
  evento_id: number
  descripcion: string
  precio: number
  cantidad: number
  asignados?: AsignadoConCantidad[]
}): Promise<{ id: number; mensaje: string }> {
  return apiFetch("consumos.php", { method: "POST", body: JSON.stringify(datos) })
}

export function asignarseConsumo(datos: {
  consumo_id: number
  invitado_id: number
  cantidad: number
  estado?: 'aceptado' | 'pendiente'
  solicitado_por?: number
}): Promise<{ mensaje: string }> {
  return apiFetch("consumos.php", { method: "POST", body: JSON.stringify(datos) })
}

export function listarNotificacionesCompartir(eventoId: number, invitadoId: number): Promise<NotificacionCompartir[]> {
  return apiFetch<NotificacionCompartir[]>(
    `consumos.php?notificaciones=1&evento_id=${eventoId}&invitado_id=${invitadoId}`
  )
}

export function actualizarEstadoAsignacion(datos: {
  consumo_id: number
  invitado_id: number
  estado: 'aceptado' | 'rechazado'
}): Promise<{ mensaje: string }> {
  return apiFetch("consumos.php", { method: "PUT", body: JSON.stringify(datos) })
}

// ─── Pagos ────────────────────────────────────────────────────────────────────

export interface PagoAPI {
  id: number
  invitado_id: number
  invitado_nombre: string
  monto: string
  metodo: string
  estado: "pendiente" | "confirmado" | "rechazado" | "solicitando_pago" | "revisar"
  referencia: string | null
  nota: string | null
  creado_en: string
  confirmado_en: string | null
}

export function listarPagos(eventoId: number): Promise<PagoAPI[]> {
  return apiFetch<PagoAPI[]>(`pagos.php?evento_id=${eventoId}`)
}

export function listarPagosInvitado(eventoId: number, invitadoId: number): Promise<PagoAPI[]> {
  return apiFetch<PagoAPI[]>(`pagos.php?evento_id=${eventoId}&invitado_id=${invitadoId}`)
}

export function registrarPago(datos: {
  evento_id: number
  invitado_id: number
  monto: number
  metodo: "spei" | "tarjeta" | "efectivo" | "otro"
  referencia?: string
  nota?: string
  estado?: string
}): Promise<{ id: number; mensaje: string }> {
  return apiFetch("pagos.php", { method: "POST", body: JSON.stringify(datos) })
}

export function confirmarPago(pagoId: number): Promise<{ mensaje: string }> {
  return apiFetch("pagos.php", {
    method: "PUT",
    body: JSON.stringify({ id: pagoId, estado: "confirmado" }),
  })
}

export function actualizarEstadoPago(
  id: number,
  estado: PagoAPI["estado"],
  nota?: string
): Promise<{ mensaje: string }> {
  return apiFetch("pagos.php", {
    method: "PUT",
    body: JSON.stringify({ id, estado, ...(nota !== undefined ? { nota } : {}) }),
  })
}

export function eliminarPago(pagoId: number): Promise<{ mensaje: string }> {
  return apiFetch(`pagos.php?id=${pagoId}`, { method: "DELETE" })
}

export function cerrarEvento(eventoId: number): Promise<{ mensaje: string }> {
  return apiFetch("eventos.php", {
    method: "PUT",
    body: JSON.stringify({ id: eventoId, estado: "cerrado" }),
  })
}

// ─── Solicitudes de items ─────────────────────────────────────────────────────

export interface SolicitudAPI {
  id: number
  evento_id: number
  invitado_id: number
  invitado_nombre: string
  nombre_item: string
  cantidad: number
  precio_unitario: number
  estado: 'pendiente' | 'autorizado' | 'rechazado'
  creado_en: string
}

export function crearSolicitud(datos: {
  evento_id: number
  invitado_id: number
  nombre_item: string
  cantidad: number
  precio_unitario: number
}): Promise<{ id: number; mensaje: string }> {
  return apiFetch('solicitudes.php', { method: 'POST', body: JSON.stringify(datos) })
}

export function listarSolicitudes(eventoId: number): Promise<SolicitudAPI[]> {
  return apiFetch<SolicitudAPI[]>(`solicitudes.php?evento_id=${eventoId}`)
}

export function listarSolicitudesInvitado(eventoId: number, invitadoId: number): Promise<SolicitudAPI[]> {
  return apiFetch<SolicitudAPI[]>(`solicitudes.php?evento_id=${eventoId}&invitado_id=${invitadoId}`)
}

export function actualizarSolicitud(
  id: number,
  estado: 'autorizado' | 'rechazado'
): Promise<{ mensaje: string }> {
  return apiFetch('solicitudes.php', {
    method: 'PUT',
    body: JSON.stringify({ id, estado }),
  })
}
