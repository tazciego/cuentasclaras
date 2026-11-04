import { useState, useEffect } from "react"
import { listarInvitados, listarConsumos, eliminarConsumo } from "../../api"
import ReunionCrear from "./ReunionCrear"
import ReunionUnirse from "./ReunionUnirse"
import ReunionGastos from "./ReunionGastos"
import ReunionAgregarGasto from "./ReunionAgregarGasto"
import ReunionBalances from "./ReunionBalances"
import ReunionCierre from "./ReunionCierre"

// ─── Tipos nuevos (API-driven) ────────────────────────────────────────────────

export interface SesionReunion {
  eventoId: number
  eventoCodigo: string
  eventoNombre: string
  eventoTipo: "reunion" | "viaje"
  fechaInicio: string
  fechaFin: string | null
  miembroId: number
  miembroNombre: string
  miembroColorIndex: number
  miembroToken: string
}

export interface MiembroReunion {
  id: number
  nombre: string
  colorIndex: number
  esYo: boolean
}

export interface ConsumoReunion {
  id: number
  descripcion: string
  precio: number
  pagadoPorId: number | null   // null = pendiente/lista de compras
  asignadoAId: number | null   // quién va a comprar (shopping list assignment)
  creadoEn: string
}

// ─── Tipos legacy (para compatibilidad con ReunionBalances / ReunionCierre) ──

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

export function calcularBalancesReunion(
  miembros: MiembroReunion[],
  consumos: ConsumoReunion[]
): Record<number, number> {
  const n = miembros.length
  if (n === 0) return {}
  const b: Record<number, number> = {}
  for (const m of miembros) b[m.id] = 0

  const comprados = consumos.filter(c => c.pagadoPorId !== null && c.precio > 0)
  for (const c of comprados) {
    const pShare = c.precio / n
    if (c.pagadoPorId !== null) b[c.pagadoPorId] = (b[c.pagadoPorId] ?? 0) + c.precio
    for (const m of miembros) b[m.id] = (b[m.id] ?? 0) - pShare
  }
  return b
}

// Legacy version used by ReunionBalances/ReunionCierre
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

// ─── Componentes compartidos ─────────────────────────────────────────────────

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

interface Props {
  onSalir: () => void
  sesionInicial?: SesionReunion
  codigoParaUnirse?: string
}

type Pantalla = "crear" | "unirse" | "gastos" | "agregar" | "editar" | "balances" | "cierre"

// ─── Orquestador ──────────────────────────────────────────────────────────────

export default function ReunionFlow({ onSalir, sesionInicial, codigoParaUnirse }: Props) {
  const [pantalla, setPantalla] = useState<Pantalla>(() => {
    if (sesionInicial) return "gastos"
    if (codigoParaUnirse) return "unirse"
    return "crear"
  })
  const [sesion, setSesion] = useState<SesionReunion | null>(sesionInicial ?? null)
  const [miembros, setMiembros] = useState<MiembroReunion[]>([])
  const [consumos, setConsumos] = useState<ConsumoReunion[]>([])
  const [gastoAEditar, setGastoAEditar] = useState<ConsumoReunion | null>(null)

  // ── Guardar sesión en localStorage cuando cambia ────────────────────────────
  useEffect(() => {
    if (sesion) {
      localStorage.setItem("cc_sesion_reunion", JSON.stringify(sesion))
    }
  }, [sesion])

  // ── Polling de datos mientras estamos en gastos ─────────────────────────────
  useEffect(() => {
    if (!sesion || pantalla !== "gastos") return
    let activo = true

    const fetchData = () => {
      Promise.all([
        listarInvitados(sesion.eventoId),
        listarConsumos(sesion.eventoId),
      ]).then(([invs, cons]) => {
        if (!activo) return
        setMiembros(invs.map(i => ({
          id: Number(i.id),
          nombre: i.nombre,
          colorIndex: Number(i.color_index),
          esYo: Number(i.id) === sesion.miembroId,
        })))
        setConsumos(cons.map(c => ({
          id: c.id,
          descripcion: c.descripcion,
          precio: Number(c.precio),
          pagadoPorId: c.pagado_por_invitado_id ? Number(c.pagado_por_invitado_id) : null,
          asignadoAId: c.asignados.find(
            a => a.estado === "pendiente" && a.solicitado_por === a.invitado_id
          )?.invitado_id ?? null,
          creadoEn: c.creado_en,
        })))
      }).catch(() => { /* red caída — mantener datos previos */ })
    }

    fetchData()
    const id = setInterval(fetchData, 3000)
    return () => { activo = false; clearInterval(id) }
  }, [sesion?.eventoId, pantalla])

  const salir = () => {
    localStorage.removeItem("cc_sesion_reunion")
    setSesion(null)
    setMiembros([])
    setConsumos([])
    onSalir()
  }

  // ── Adaptadores para ReunionBalances / ReunionCierre (usan tipos legacy) ────
  const eventoLegacy: EventoReunion = {
    nombre: sesion?.eventoNombre ?? "",
    tipo: sesion?.eventoTipo ?? "reunion",
    fechaInicio: sesion?.fechaInicio ?? "",
    fechaFin: sesion?.fechaFin ?? "",
    participantes: miembros,
  }

  const gastosLegacy: Gasto[] = consumos
    .filter(c => c.pagadoPorId !== null && c.precio > 0)
    .map(c => {
      const nMiembros = miembros.length || 1
      return {
        id: c.id,
        descripcion: c.descripcion,
        monto: c.precio,
        fecha: new Date(c.creadoEn).toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
        pagadores: [{ participanteId: c.pagadoPorId!, monto: c.precio }],
        division: miembros.map(m => ({ participanteId: m.id, monto: c.precio / nMiembros })),
        tienesFoto: false,
      }
    })

  const yoId = sesion?.miembroId ?? 0

  // ── Pantallas ────────────────────────────────────────────────────────────────

  if (pantalla === "crear") {
    return (
      <ReunionCrear
        onVolver={salir}
        onCreado={(s) => { setSesion(s); setPantalla("gastos") }}
      />
    )
  }

  if (pantalla === "unirse") {
    return (
      <ReunionUnirse
        codigo={codigoParaUnirse ?? ""}
        onVolver={salir}
        onUnido={(s) => { setSesion(s); setPantalla("gastos") }}
      />
    )
  }

  if (!sesion) return null

  if (pantalla === "gastos") {
    return (
      <ReunionGastos
        sesion={sesion}
        miembros={miembros}
        consumos={consumos}
        yoId={yoId}
        onVolver={salir}
        onAgregar={() => { setGastoAEditar(null); setPantalla("agregar") }}
        onEditar={c => { setGastoAEditar(c); setPantalla("editar") }}
        onEliminar={id => {
          eliminarConsumo(id).catch(() => {})
          setConsumos(prev => prev.filter(c => c.id !== id))
        }}
        onBalances={() => setPantalla("balances")}
        onCerrar={() => setPantalla("cierre")}
      />
    )
  }

  if (pantalla === "agregar" || pantalla === "editar") {
    return (
      <ReunionAgregarGasto
        sesion={sesion}
        miembros={miembros}
        yoId={yoId}
        consumoAEditar={gastoAEditar}
        onVolver={() => setPantalla("gastos")}
        onGuardado={() => setPantalla("gastos")}
      />
    )
  }

  if (pantalla === "balances") {
    return (
      <ReunionBalances
        evento={eventoLegacy}
        gastos={gastosLegacy}
        yoId={yoId}
        onVolver={() => setPantalla("gastos")}
        onCerrar={() => setPantalla("cierre")}
      />
    )
  }

  if (pantalla === "cierre") {
    return (
      <ReunionCierre
        evento={eventoLegacy}
        gastos={gastosLegacy}
        yoId={yoId}
        onVolver={() => setPantalla("balances")}
        onFinalizar={salir}
      />
    )
  }

  return null
}
