import { useState } from "react"
import RoomiesCrear from "./RoomiesCrear"
import RoomiesGastos from "./RoomiesGastos"
import RoomiesAgregarGasto from "./RoomiesAgregarGasto"
import RoomiesBalances from "./RoomiesBalances"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CategoriaRoomie = "renta" | "servicios" | "despensa" | "suscripciones" | "otros"

export interface Roomie {
  id: number
  nombre: string
  colorIndex: number
  esYo: boolean
}

export interface Casa {
  nombre: string
  roomies: Roomie[]
}

export interface GastoRoomie {
  id: number
  descripcion: string
  categoria: CategoriaRoomie
  monto: number
  mes: string        // "2026-03"
  pagadorId: number
  division: { roomieId: number; monto: number }[]
  recurrente: boolean
  tienesFoto: boolean
}

export interface TransferenciaR {
  deId: number
  aId: number
  monto: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

export const COLORES_ROOMIES = [
  { bg: "bg-[#8B1A3A]",   ring: "ring-[#8B1A3A]"   }, // 0 yo (guinda)
  { bg: "bg-orange-400",  ring: "ring-orange-400"   },
  { bg: "bg-sky-400",     ring: "ring-sky-400"      },
  { bg: "bg-[#534AB7]",   ring: "ring-[#534AB7]"    },
  { bg: "bg-[#2EC4B6]",   ring: "ring-[#2EC4B6]"   },
  { bg: "bg-amber-400",   ring: "ring-amber-400"    },
  { bg: "bg-emerald-500", ring: "ring-emerald-500"  },
  { bg: "bg-pink-400",    ring: "ring-pink-400"     },
]

export const CATEGORIA_META: Record<CategoriaRoomie, { emoji: string; label: string }> = {
  renta:         { emoji: "🏠", label: "Renta" },
  servicios:     { emoji: "💡", label: "Servicios" },
  despensa:      { emoji: "🛒", label: "Despensa" },
  suscripciones: { emoji: "📱", label: "Suscripciones" },
  otros:         { emoji: "📦", label: "Otros" },
}

// ─── Utilidades de balance ────────────────────────────────────────────────────

export function calcularBalancesR(
  roomies: Roomie[],
  gastos: GastoRoomie[]
): Record<number, number> {
  const b: Record<number, number> = {}
  for (const r of roomies) b[r.id] = 0
  for (const g of gastos) {
    b[g.pagadorId] = (b[g.pagadorId] ?? 0) + g.monto
    for (const d of g.division)
      b[d.roomieId] = (b[d.roomieId] ?? 0) - d.monto
  }
  return b
}

export function calcularTransferenciasR(
  balances: Record<number, number>
): TransferenciaR[] {
  const c = Object.entries(balances).filter(([, v]) => v > 0.5).map(([id, v]) => ({ id: +id, m: v })).sort((a, b) => b.m - a.m).map(x => ({ ...x }))
  const d = Object.entries(balances).filter(([, v]) => v < -0.5).map(([id, v]) => ({ id: +id, m: -v })).sort((a, b) => b.m - a.m).map(x => ({ ...x }))
  const out: TransferenciaR[] = []
  let ci = 0, di = 0
  while (ci < c.length && di < d.length) {
    const amt = Math.min(c[ci].m, d[di].m)
    out.push({ deId: d[di].id, aId: c[ci].id, monto: Math.round(amt) })
    c[ci].m -= amt; d[di].m -= amt
    if (c[ci].m < 0.5) ci++
    if (d[di].m < 0.5) di++
  }
  return out
}

export function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

// ─── Componentes compartidos ──────────────────────────────────────────────────

export function AvatarR({
  nombre, colorIndex, size = "md", ring = false,
}: {
  nombre: string; colorIndex: number
  size?: "xs" | "sm" | "md" | "lg"; ring?: boolean
}) {
  const c = COLORES_ROOMIES[colorIndex % COLORES_ROOMIES.length]
  const sz = { xs: "w-5 h-5 text-[9px]", sm: "w-7 h-7 text-[11px]", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-lg" }[size]
  return (
    <div className={`${sz} ${c.bg} rounded-full flex items-center justify-center font-bold text-white shrink-0 ${ring ? `ring-2 ring-offset-1 ${c.ring}` : ""}`}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

export function HeaderRoomies({
  titulo, subtitulo, onVolver, labelVolver, extra,
}: {
  titulo: string; subtitulo?: string; onVolver: () => void; labelVolver: string; extra?: React.ReactNode
}) {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={onVolver}
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#8B1A3A] transition-colors text-sm font-medium shrink-0">
          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {labelVolver}
        </button>
        <div className="h-4 w-px bg-gray-200 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-[#8B1A3A] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-[10px]">CC</span>
            </div>
            <p className="text-sm font-black text-[#8B1A3A] truncate">{titulo}</p>
          </div>
          {subtitulo && <p className="text-[11px] text-gray-400 truncate pl-7">{subtitulo}</p>}
        </div>
        {extra}
      </div>
    </header>
  )
}

// ─── Orquestador ──────────────────────────────────────────────────────────────

type Pantalla = "crear" | "gastos" | "agregar" | "editar" | "balances"

const MES_ACTUAL = "2026-03"

export default function RoomiesFlow({ onSalir }: { onSalir: () => void }) {
  const [pantalla, setPantalla] = useState<Pantalla>("crear")
  const [casa, setCasa] = useState<Casa | null>(null)
  const [gastos, setGastos] = useState<GastoRoomie[]>([])
  const [gastoAEditar, setGastoAEditar] = useState<GastoRoomie | null>(null)
  const [nextId, setNextId] = useState(10)

  const yoId = casa?.roomies.find(r => r.esYo)?.id ?? 0

  const crearCasa = (c: Casa) => {
    setCasa(c)
    const rs = c.roomies
    const divIgual = (total: number) => rs.map(r => ({ roomieId: r.id, monto: Math.round(total / rs.length) }))
    setGastos([
      { id: 1, descripcion: "Renta mensual",      categoria: "renta",         monto: 3000, mes: MES_ACTUAL, pagadorId: rs[0].id, division: divIgual(3000), recurrente: true,  tienesFoto: false },
      { id: 2, descripcion: "Internet Telmex",     categoria: "servicios",     monto: 450,  mes: MES_ACTUAL, pagadorId: rs[0].id, division: divIgual(450),  recurrente: true,  tienesFoto: false },
      { id: 3, descripcion: "Netflix",             categoria: "suscripciones", monto: 220,  mes: MES_ACTUAL, pagadorId: rs[1]?.id ?? rs[0].id, division: divIgual(220),  recurrente: true,  tienesFoto: false },
      { id: 4, descripcion: "Gas y electricidad",  categoria: "servicios",     monto: 180,  mes: MES_ACTUAL, pagadorId: rs[1]?.id ?? rs[0].id, division: divIgual(180),  recurrente: false, tienesFoto: false },
      { id: 5, descripcion: "Despensa semanal",    categoria: "despensa",      monto: 800,  mes: MES_ACTUAL, pagadorId: rs[2]?.id ?? rs[0].id, division: divIgual(800),  recurrente: false, tienesFoto: true  },
    ])
    setPantalla("gastos")
  }

  const guardarGasto = (g: Omit<GastoRoomie, "id">) => {
    setGastos(prev => [...prev, { ...g, id: nextId }])
    setNextId(n => n + 1)
    setPantalla("gastos")
  }

  const actualizarGasto = (g: GastoRoomie) => {
    setGastos(prev => prev.map(x => x.id === g.id ? g : x))
    setPantalla("gastos")
  }

  const eliminarGasto = (id: number) => setGastos(prev => prev.filter(g => g.id !== id))

  if (pantalla === "crear") return <RoomiesCrear onVolver={onSalir} onCreado={crearCasa} />
  if (!casa) return null

  if (pantalla === "gastos") return (
    <RoomiesGastos casa={casa} gastos={gastos} yoId={yoId}
      onVolver={onSalir}
      onAgregar={() => { setGastoAEditar(null); setPantalla("agregar") }}
      onEditar={g => { setGastoAEditar(g); setPantalla("editar") }}
      onEliminar={eliminarGasto}
      onBalances={() => setPantalla("balances")} />
  )

  if (pantalla === "agregar" || pantalla === "editar") return (
    <RoomiesAgregarGasto casa={casa} yoId={yoId} gastoAEditar={gastoAEditar}
      onVolver={() => setPantalla("gastos")}
      onGuardar={pantalla === "agregar" ? guardarGasto : g => actualizarGasto(g as GastoRoomie)} />
  )

  if (pantalla === "balances") return (
    <RoomiesBalances casa={casa} gastos={gastos} yoId={yoId}
      onVolver={() => setPantalla("gastos")} />
  )

  return null
}
