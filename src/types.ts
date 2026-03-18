export type TipoEvento = "restaurante" | "reunion"

export interface Participante {
  id: number
  nombre: string
}

export interface DatosEvento {
  eventoId: number  // ID real de la BD (lo asigna el servidor)
  nombre: string
  tipo: TipoEvento
  fecha: string
  hora: string
  lugar: string
  nombreAnfitrion: string
  participantes: Participante[]
  codigo: string // Ej. CC-4829
}
