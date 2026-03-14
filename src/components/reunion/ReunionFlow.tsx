import { useState } from "react"
import ReunionCrear from "./ReunionCrear"
import ReunionGastos from "./ReunionGastos"
import ReunionAgregarGasto from "./ReunionAgregarGasto"
import ReunionBalances from "./ReunionBalances"
import ReunionCierre from "./ReunionCierre"

// ─── Tipos compartidos ────────────────────────────────────────────────────────

export interface ParticipanteReunion {
  id: number
  nombre: string
  colorIndex: number
  esYo: boolean
}

export interface EventoReunion {
  nombre: string
  tipo: "reunion" | "viaje"
  fechaInicio: string
  fechaFin: string
  participantes: ParticipanteReunion[]
}

export interface PagadorMonto {
  participanteId: number
  monto: number
}

export interface Gasto {
  id: number
  descripcion: string
  monto: number
  fecha: string
  pagadores: PagadorMonto[]
  division: PagadorMonto[]
  tienesFoto: boolean
}

export interface Transferencia {
  deId: number
  aId: number
  monto: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

export const COLORES_REUNION = [
  { bg: "bg-[#534AB7]",   ring: "ring-[#534AB7]"  },
  { bg: "bg-orange-400",  ring: "ring-orange-400"  },
  { bg: "bg-pink-400",    ring: "ring-pink-400"    },
  { bg: "bg-sky-400",     ring: "ring-sky-400"     },
  { bg: "bg-[#2EC4B6]",   ring: "ring-[#2EC4B6]"  },
  { bg: "bg-amber-400",   ring: "ring-amber-400"   },
  { bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { bg: "bg-rose-400",    ring: "ring-rose-400"    },
]

// ─── Utilidades de balance ────────────────────────────────────────────────────

export function calcularBalances(
  participantes: ParticipanteReunion[],
  gastos: Gasto[]
): Record<number, number> {
  const b: Record<number, number> = {}
  for (const p of participantes) b[p.id] = 0
  for (const g of gastos) {
    for (const pag of g.pagadores)
      b[pag.participanteId] = (b[pag.participanteId] ?? 0) + pag.monto
    for (const div of g.division)
      b[div.participanteId] = (b[div.participanteId] ?? 0) - div.monto
  }
  return b
}

export function calcularTransferencias(
  balances: Record<number, number>
): Transferencia[] {
  const c = Object.entries(balances).filter(([, v]) => v > 0.5).map(([id, v]) => ({ id: +id, m: v })).sort((a, b) => b.m - a.m).map(x => ({ ...x }))
  const d = Object.entries(balances).filter(([, v]) => v < -0.5).map(([id, v]) => ({ id: +id, m: -v })).sort((a, b) => b.m - a.m).map(x => ({ ...x }))
  const transfers: Transferencia[] = []
  let ci = 0, di = 0
  while (ci < c.length && di < d.length) {
    const amount = Math.min(c[ci].m, d[di].m)
    transfers.push({ deId: d[di].id, aId: c[ci].id, monto: Math.round(amount) })
    c[ci].m -= amount; d[di].m -= amount
    if (c[ci].m < 0.5) ci++
    if (d[di].m < 0.5) di++
  }
  return transfers
}

export function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

// ─── Header compartido ────────────────────────────────────────────────────────

export function HeaderReunion({
  titulo, subtitulo, onVolver, labelVolver, extra,
}: {
  titulo: string
  subtitulo?: string
  onVolver: () => void
  labelVolver: string
  extra?: React.ReactNode
}) {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={onVolver}
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#534AB7] transition-colors text-sm font-medium shrink-0">
          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {labelVolver}
        </button>
        <div className="h-4 w-px bg-gray-200 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-[#534AB7] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-[10px]">CC</span>
            </div>
            <p className="text-sm font-black text-[#534AB7] truncate">{titulo}</p>
          </div>
          {subtitulo && <p className="text-[11px] text-gray-400 truncate pl-7">{subtitulo}</p>}
        </div>
        {extra}
      </div>
    </header>
  )
}

// ─── Avatar util ──────────────────────────────────────────────────────────────

export function Avatar({
  nombre, colorIndex, size = "md", ring = false,
}: {
  nombre: string; colorIndex: number; size?: "xs" | "sm" | "md" | "lg"; ring?: boolean
}) {
  const c = COLORES_REUNION[colorIndex % COLORES_REUNION.length]
  const sz = { xs: "w-5 h-5 text-[9px]", sm: "w-7 h-7 text-[11px]", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-lg" }[size]
  return (
    <div className={`${sz} ${c.bg} rounded-full flex items-center justify-center font-bold text-white shrink-0 ${ring ? `ring-2 ring-offset-1 ${c.ring}` : ""}`}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

// ─── Props del flow ───────────────────────────────────────────────────────────

interface Props { onSalir: () => void }

type Pantalla = "crear" | "gastos" | "agregar" | "editar" | "balances" | "cierre"

// ─── Orquestador ──────────────────────────────────────────────────────────────

export default function ReunionFlow({ onSalir }: Props) {
  const [pantalla, setPantalla] = useState<Pantalla>("crear")
  const [evento, setEvento] = useState<EventoReunion | null>(null)
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [gastoAEditar, setGastoAEditar] = useState<Gasto | null>(null)
  const [nextId, setNextId] = useState(10)

  const yoId = evento?.participantes.find(p => p.esYo)?.id ?? 0

  const crearEvento = (ev: EventoReunion) => {
    setEvento(ev)
    const parts = ev.participantes
    const div = (total: number) => parts.map(p => ({ participanteId: p.id, monto: Math.round(total / parts.length) }))
    const p = (i: number) => parts[i]?.id ?? parts[0].id
    setGastos([
      { id: 1, descripcion: "Gasolina y combustible", monto: 600, fecha: "Hoy", pagadores: [{ participanteId: p(0), monto: 600 }], division: div(600), tienesFoto: true },
      { id: 2, descripcion: "Airbnb 2 noches",         monto: 900, fecha: "Ayer", pagadores: [{ participanteId: p(1), monto: 900 }], division: div(900), tienesFoto: false },
      { id: 3, descripcion: "Supermercado y snacks",   monto: 300, fecha: "Ayer", pagadores: [{ participanteId: p(2), monto: 300 }], division: div(300), tienesFoto: false },
    ])
    setPantalla("gastos")
  }

  const guardarGasto = (g: Omit<Gasto, "id">) => {
    setGastos(prev => [...prev, { ...g, id: nextId }])
    setNextId(n => n + 1)
    setPantalla("gastos")
  }

  const actualizarGasto = (g: Gasto) => {
    setGastos(prev => prev.map(x => x.id === g.id ? g : x))
    setPantalla("gastos")
  }

  const eliminarGasto = (id: number) => setGastos(prev => prev.filter(g => g.id !== id))

  if (pantalla === "crear") return <ReunionCrear onVolver={onSalir} onCreado={crearEvento} />
  if (!evento) return null

  if (pantalla === "gastos") return (
    <ReunionGastos evento={evento} gastos={gastos} yoId={yoId}
      onVolver={onSalir}
      onAgregar={() => { setGastoAEditar(null); setPantalla("agregar") }}
      onEditar={g => { setGastoAEditar(g); setPantalla("editar") }}
      onEliminar={eliminarGasto}
      onBalances={() => setPantalla("balances")}
      onCerrar={() => setPantalla("cierre")} />
  )

  if (pantalla === "agregar" || pantalla === "editar") return (
    <ReunionAgregarGasto evento={evento} yoId={yoId} gastoAEditar={gastoAEditar}
      onVolver={() => setPantalla("gastos")}
      onGuardar={pantalla === "agregar" ? guardarGasto : g => actualizarGasto(g as Gasto)} />
  )

  if (pantalla === "balances") return (
    <ReunionBalances evento={evento} gastos={gastos} yoId={yoId}
      onVolver={() => setPantalla("gastos")}
      onCerrar={() => setPantalla("cierre")} />
  )

  if (pantalla === "cierre") return (
    <ReunionCierre evento={evento} gastos={gastos} yoId={yoId}
      onVolver={() => setPantalla("balances")}
      onFinalizar={onSalir} />
  )

  return null
}
