export type TipoEvento = "restaurante" | "reunion"

export interface Participante {
  id: number
  nombre: string
}

export interface DatosEvento {
  nombre: string
  tipo: TipoEvento
  fecha: string
  hora: string
  lugar: string
  participantes: Participante[]
  codigo: string // Ej. CC-4829
}
