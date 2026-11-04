export interface EntradaHistorial {
  id: string
  rol: 'anfitrion' | 'invitado'
  eventoNombre: string
  eventoCodigo: string
  eventoId: number
  eventoTipo: string
  fecha: string       // fecha del evento
  lugar: string
  guardadoEn: string  // ISO timestamp de cuando se guardó
  // Datos para restaurar sesión de anfitrión
  anfitrion?: {
    nombre: string
    hora: string
    pantalla: string
  }
  // Datos para restaurar sesión de invitado
  invitado?: {
    nombre: string
    colorIndex: number
    invitadoId: number
    token: string
    clabe_spei?: string | null
  }
}

const CLAVE = 'cc_historial'
const MAX = 10

export function guardarEnHistorial(entrada: Omit<EntradaHistorial, 'id' | 'guardadoEn'>): void {
  try {
    const actual = leerHistorial()
    // Evitar duplicados del mismo evento+rol
    const sinDuplicado = actual.filter(
      (e) => !(e.eventoCodigo === entrada.eventoCodigo && e.rol === entrada.rol)
    )
    const nueva: EntradaHistorial = {
      ...entrada,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      guardadoEn: new Date().toISOString(),
    }
    const resultado = [nueva, ...sinDuplicado].slice(0, MAX)
    localStorage.setItem(CLAVE, JSON.stringify(resultado))
  } catch { /* storage lleno o bloqueado */ }
}

export function leerHistorial(): EntradaHistorial[] {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export function eliminarDeHistorial(id: string): void {
  try {
    const filtrado = leerHistorial().filter((e) => e.id !== id)
    localStorage.setItem(CLAVE, JSON.stringify(filtrado))
  } catch { /* storage bloqueado */ }
}
