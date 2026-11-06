import { useState, useEffect, useRef } from "react"
import RoomiesCrear from "./RoomiesCrear"
import RoomiesGastos from "./RoomiesGastos"
import RoomiesAgregarGasto from "./RoomiesAgregarGasto"
import RoomiesBalances from "./RoomiesBalances"
import RoomiesUnirse from "./RoomiesUnirse"
import {
  listarInvitados, listarGastosRoomie, guardarGastoRoomie,
  actualizarGastoRoomie, eliminarConsumo,
  type InvitadoListado, type ConsumoRoomieAPI,
} from "../../api"

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
  mes: string
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

export interface SesionRoomies {
  casaId: number
  casaCodigo: string
  casaNombre: string
  miembroId: number
  miembroNombre: string
  miembroColorIndex: number
  miembroToken: string | null
}

// ─── Constantes ───────────────────────────────────────────────────────────────

export const COLORES_ROOMIES = [
  { bg: "bg-[#8B1A3A]",   ring: "ring-[#8B1A3A]"   },
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

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

export function getMesActual(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMesesRecientes(n = 3): string[] {
  const meses: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return meses
}

export function labelMes(mes: string): string {
  const [y, m] = mes.split('-')
  const fecha = new Date(Number(y), Number(m) - 1, 1)
  return fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
    .replace('.', '')
    .replace(/^\w/, c => c.toUpperCase())
}

// ─── Utilidades de balance ────────────────────────────────────────────────────

export function calcularBalancesR(roomies: Roomie[], gastos: GastoRoomie[]): Record<number, number> {
  const b: Record<number, number> = {}
  for (const r of roomies) b[r.id] = 0
  for (const g of gastos) {
    b[g.pagadorId] = (b[g.pagadorId] ?? 0) + g.monto
    for (const d of g.division)
      b[d.roomieId] = (b[d.roomieId] ?? 0) - d.monto
  }
  return b
}

export function calcularTransferenciasR(balances: Record<number, number>): TransferenciaR[] {
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

export function AvatarR({ nombre, colorIndex, size = "md", ring = false }: {
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

export function HeaderRoomies({ titulo, subtitulo, onVolver, labelVolver, extra }: {
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

// ─── Helpers de conversión API ────────────────────────────────────────────────

function invitadoARoomie(inv: InvitadoListado, miembroId: number): Roomie {
  return {
    id: Number(inv.id),
    nombre: inv.nombre,
    colorIndex: Number(inv.color_index),
    esYo: Number(inv.id) === miembroId,
  }
}

function apiAGasto(c: ConsumoRoomieAPI): GastoRoomie {
  return {
    id: Number(c.id),
    descripcion: c.descripcion,
    categoria: c.categoria ?? 'otros',
    monto: Number(c.precio),
    mes: c.mes ?? getMesActual(),
    pagadorId: Number(c.pagado_por_invitado_id ?? 0),
    division: c.asignados.map(a => ({
      roomieId: Number(a.invitado_id),
      monto: Number(a.monto),
    })),
    recurrente: Number(c.recurrente) === 1,
    tienesFoto: false,
  }
}

// ─── Orquestador ──────────────────────────────────────────────────────────────

type Pantalla = "crear" | "unirse" | "cargando" | "gastos" | "agregar" | "editar" | "balances"

const LS_KEY = "cc_sesion_roomies"

interface Props {
  onSalir: () => void
  sesionInicial?: SesionRoomies
  codigoParaUnirse?: string
}

export default function RoomiesFlow({ onSalir, sesionInicial, codigoParaUnirse }: Props) {
  const [pantalla, setPantalla] = useState<Pantalla>(() => {
    if (sesionInicial) return "cargando"
    if (codigoParaUnirse) return "unirse"
    return "crear"
  })
  const [sesion, setSesion] = useState<SesionRoomies | null>(sesionInicial ?? null)
  const [roomies, setRoomies] = useState<Roomie[]>([])
  const [gastos, setGastos] = useState<GastoRoomie[]>([])
  const [gastoAEditar, setGastoAEditar] = useState<GastoRoomie | null>(null)
  const [errorDatos, setErrorDatos] = useState("")
  const [fetchKey, setFetchKey] = useState(0)
  const isInitialLoad = useRef(true)

  const yoId = Number(sesion?.miembroId ?? 0)
  const casa: Casa = { nombre: sesion?.casaNombre ?? "", roomies }

  // ─── Cargar y sondear datos ────────────────────────────────────────────────

  useEffect(() => {
    if (!sesion) return
    let mounted = true
    isInitialLoad.current = true

    const fetchTodo = async () => {
      try {
        const [invitados, consumos] = await Promise.all([
          listarInvitados(sesion.casaId),
          listarGastosRoomie(sesion.casaId),
        ])
        if (!mounted) return
        setRoomies(invitados.map(inv => invitadoARoomie(inv, sesion.miembroId)))
        setGastos(consumos.map(apiAGasto))
        setErrorDatos("")
        if (isInitialLoad.current) {
          isInitialLoad.current = false
          setPantalla(p => p === "cargando" ? "gastos" : p)
        }
      } catch {
        if (mounted && isInitialLoad.current) {
          setErrorDatos("No se pudo cargar. Revisa tu conexión.")
        }
      }
    }

    fetchTodo()
    const id = setInterval(fetchTodo, 5000)
    return () => { mounted = false; clearInterval(id) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion?.casaId, fetchKey])

  // ─── Acciones ─────────────────────────────────────────────────────────────

  const entrarConSesion = (s: SesionRoomies) => {
    localStorage.setItem(LS_KEY, JSON.stringify(s))
    setSesion(s)
    setFetchKey(0)
    setPantalla("cargando")
  }

  const guardarGasto = (g: Omit<GastoRoomie, "id">) => {
    if (!sesion) return
    const tempId = -Date.now()
    setGastos(prev => [...prev, { ...g, id: tempId }])
    setPantalla("gastos")
    guardarGastoRoomie({
      evento_id: sesion.casaId,
      descripcion: g.descripcion,
      precio: g.monto,
      pagado_por_invitado_id: g.pagadorId,
      categoria: g.categoria,
      recurrente: g.recurrente,
      mes: g.mes,
      division: g.division.map(d => ({ invitado_id: d.roomieId, monto: d.monto })),
    })
      .then(({ id }) => setGastos(prev => prev.map(x => x.id === tempId ? { ...x, id } : x)))
      .catch(() => setGastos(prev => prev.filter(x => x.id !== tempId)))
  }

  const actualizarGasto = (g: GastoRoomie) => {
    if (!sesion) return
    const anterior = gastos.find(x => x.id === g.id)
    setGastos(prev => prev.map(x => x.id === g.id ? g : x))
    setPantalla("gastos")
    actualizarGastoRoomie({
      id: g.id,
      descripcion: g.descripcion,
      precio: g.monto,
      pagado_por_invitado_id: g.pagadorId,
      categoria: g.categoria,
      recurrente: g.recurrente,
      mes: g.mes,
      division: g.division.map(d => ({ invitado_id: d.roomieId, monto: d.monto })),
    })
      .catch(() => {
        if (anterior) setGastos(prev => prev.map(x => x.id === g.id ? anterior : x))
      })
  }

  const eliminarGasto = (id: number) => {
    if (!sesion) return
    const removed = gastos.find(x => x.id === id)
    setGastos(prev => prev.filter(x => x.id !== id))
    eliminarConsumo(id)
      .catch(() => {
        if (removed) setGastos(prev => [...prev, removed].sort((a, b) => a.id - b.id))
      })
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (pantalla === "crear") return (
    <RoomiesCrear onVolver={onSalir} onCreado={entrarConSesion} />
  )

  if (pantalla === "unirse") return (
    <RoomiesUnirse
      codigo={codigoParaUnirse ?? ""}
      onVolver={onSalir}
      onUnido={entrarConSesion}
    />
  )

  if (pantalla === "cargando") return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderRoomies titulo="CuentasClaras" onVolver={onSalir} labelVolver="Inicio" />
      {errorDatos ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-5 max-w-sm w-full text-center">
            <p className="text-sm text-red-600 font-medium mb-3">⚠ {errorDatos}</p>
            <button type="button"
              onClick={() => { setErrorDatos(""); setFetchKey(k => k + 1) }}
              className="text-sm font-bold text-[#8B1A3A] hover:underline">
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#8B1A3A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )

  if (pantalla === "gastos") return (
    <RoomiesGastos
      casa={casa}
      casaCodigo={sesion?.casaCodigo ?? ""}
      gastos={gastos}
      yoId={yoId}
      onVolver={onSalir}
      onAgregar={() => { setGastoAEditar(null); setPantalla("agregar") }}
      onEditar={g => { setGastoAEditar(g); setPantalla("editar") }}
      onEliminar={eliminarGasto}
      onBalances={() => setPantalla("balances")}
    />
  )

  if (pantalla === "agregar" || pantalla === "editar") return (
    <RoomiesAgregarGasto
      casa={casa}
      yoId={yoId}
      gastoAEditar={gastoAEditar}
      onVolver={() => setPantalla("gastos")}
      onGuardar={pantalla === "agregar" ? guardarGasto : g => actualizarGasto({ ...g, id: gastoAEditar!.id })}
    />
  )

  if (pantalla === "balances") return (
    <RoomiesBalances
      casa={casa}
      gastos={gastos}
      yoId={yoId}
      onVolver={() => setPantalla("gastos")}
    />
  )

  return null
}
