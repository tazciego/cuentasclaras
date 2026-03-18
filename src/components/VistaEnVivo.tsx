import { useState, useEffect, useCallback } from "react"
import type { DatosEvento } from "../types"
import BarraProgreso from "./BarraProgreso"
import { listarConsumos, listarInvitados, listarPagos } from "../api"
import type { ConsumoAPI, InvitadoListado, PagoAPI } from "../api"
import { COLORES_AVATAR } from "./invitado/PasoRegistro"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  evento: DatosEvento
  onVolver: () => void
  onEditar: () => void
  onContinuar: () => void
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type StatusPago = "pagado" | "pendiente" | "eligiendo"
type Tab = "platillo" | "invitado"

interface InvitadoVivo {
  id: number
  nombre: string
  color: string
  status: StatusPago
  items: ConsumoInvitado[]
}

interface ConsumoInvitado {
  nombre: string
  precio: number
  compartidoCon: number
}

interface ItemVivo {
  id: number
  nombre: string
  precioTotal: number
  asignadosIds: number[]
  asignadosNombres: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

function buildDatos(
  consumos: ConsumoAPI[],
  invitados: InvitadoListado[],
  pagos: PagoAPI[]
): { invitadosVivos: InvitadoVivo[]; itemsVivos: ItemVivo[] } {
  const itemsVivos: ItemVivo[] = consumos.map((c) => ({
    id: c.id,
    nombre: c.descripcion,
    precioTotal: parseFloat(c.precio),
    asignadosIds: c.asignados.map((a) => a.invitado_id),
    asignadosNombres: c.asignados.map((a) => a.invitado_nombre),
  }))

  const invitadosVivos: InvitadoVivo[] = invitados.map((inv) => {
    const color = COLORES_AVATAR[inv.color_index]?.bg ?? COLORES_AVATAR[0].bg
    const misConsumos = consumos.filter((c) =>
      c.asignados.some((a) => a.invitado_id === inv.id)
    )
    const items: ConsumoInvitado[] = misConsumos.map((c) => ({
      nombre: c.descripcion,
      precio: parseFloat(c.precio) / Math.max(1, c.asignados.length),
      compartidoCon: c.asignados.length,
    }))

    const miPago = pagos.find((p) => p.invitado_id === inv.id)
    const status: StatusPago =
      inv.es_anfitrion === 1 ? "pagado"
      : miPago?.estado === "confirmado" ? "pagado"
      : miPago ? "pendiente"
      : "eligiendo"

    return { id: inv.id, nombre: inv.nombre, color, status, items }
  })

  return { invitadosVivos, itemsVivos }
}

// ─── Componentes pequeños ─────────────────────────────────────────────────────

function Avatar({ inicial, color, size = "md" }: { inicial: string; color: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-bold text-white shrink-0`}>
      {inicial.charAt(0).toUpperCase()}
    </div>
  )
}

const STATUS_META: Record<StatusPago, { label: string; cls: string }> = {
  pagado:    { label: "Pagado",    cls: "bg-green-50 border-green-200 text-green-600" },
  pendiente: { label: "Pendiente", cls: "bg-orange-50 border-orange-200 text-orange-500" },
  eligiendo: { label: "Eligiendo", cls: "bg-gray-100 border-gray-200 text-gray-500" },
}

function BadgeStatus({ status }: { status: StatusPago }) {
  const { label, cls } = STATUS_META[status]
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
}

function Metrica({ label, valor, colorValor }: { label: string; valor: string; colorValor?: string }) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-0.5">
      <span className={`text-base font-black leading-tight ${colorValor ?? "text-gray-800"}`}>{valor}</span>
      <span className="text-[11px] text-gray-400 font-medium leading-tight">{label}</span>
    </div>
  )
}

// ─── Tab: Por platillo ────────────────────────────────────────────────────────

function TabPlatillo({ items, invitados }: { items: ItemVivo[]; invitados: InvitadoVivo[] }) {
  const mapaInv = Object.fromEntries(invitados.map((inv) => [inv.id, inv]))

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 py-10 text-gray-400">
        <span className="text-3xl">🧾</span>
        <p className="text-sm">No hay consumos registrados aún.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {items.map((item, idx) => {
        const sinDueno = item.asignadosIds.length === 0
        const compartido = item.asignadosIds.length > 1
        const precioCada = compartido ? Math.round(item.precioTotal / item.asignadosIds.length) : null

        return (
          <div key={item.id} className={`flex items-start gap-3 px-5 py-4 ${idx < items.length - 1 ? "border-b border-gray-100" : ""}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 leading-snug">{item.nombre}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm font-bold text-gray-700">{fmt(item.precioTotal)}</span>
                {precioCada !== null && (
                  <span className="text-xs text-[#534AB7] font-semibold bg-[#534AB7]/8 px-1.5 py-0.5 rounded-md">
                    {fmt(precioCada)} c/u
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {sinDueno ? (
                <div className="flex items-center gap-1.5">
                  {[0, 1].map((i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-gray-300 text-sm">?</span>
                    </div>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">sin elegir</span>
                </div>
              ) : (
                <div className="flex -space-x-1.5">
                  {item.asignadosIds.map((id, i) => {
                    const inv = mapaInv[id]
                    const nombre = inv?.nombre ?? item.asignadosNombres[i] ?? "?"
                    const color = inv?.color ?? "bg-gray-400"
                    return (
                      <div key={id} title={nombre} className="ring-2 ring-white rounded-full">
                        <Avatar inicial={nombre} color={color} size="sm" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Por invitado ────────────────────────────────────────────────────────

function TarjetaInvitado({ inv }: { inv: InvitadoVivo }) {
  const [abierta, setAbierta] = useState(false)
  const total = inv.items.reduce((s, it) => s + it.precio, 0)

  const whatsapp = () => {
    const lineas = inv.items.map((it) => `• ${it.nombre}: ${fmt(it.precio)}`).join("\n")
    const texto = encodeURIComponent(
      `Hola ${inv.nombre}! 🧾\nTu parte de la cuenta:\n${lineas}\n\nTotal: ${fmt(total)}`
    )
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setAbierta((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none">
        <Avatar inicial={inv.nombre} color={inv.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800">{inv.nombre}</span>
            <BadgeStatus status={inv.status} />
          </div>
          <span className="text-sm font-black text-[#534AB7]">{fmt(total)}</span>
        </div>
        <svg viewBox="0 0 20 20" className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${abierta ? "rotate-180" : ""}`} fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {abierta && (
        <div className="border-t border-gray-100">
          {inv.items.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400 italic">No ha elegido items aún.</p>
          ) : (
            <div className="px-5 py-2">
              {inv.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700">{it.nombre}</span>
                    {it.compartidoCon > 1 && (
                      <span className="ml-2 text-[10px] text-gray-400">(entre {it.compartidoCon})</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 shrink-0">{fmt(it.precio)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</span>
                <span className="text-base font-black text-[#534AB7]">{fmt(total)}</span>
              </div>
            </div>
          )}
          {inv.id !== 0 && (
            <div className="px-5 pb-4">
              <button type="button" onClick={whatsapp}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C5E] text-sm font-bold hover:bg-[#25D366]/20 transition-colors">
                <span className="text-base">💬</span>
                Enviar cuenta por WhatsApp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function VistaEnVivo({ evento, onVolver, onEditar, onContinuar }: Props) {
  const [tab, setTab] = useState<Tab>("platillo")
  const [consumos, setConsumos] = useState<ConsumoAPI[]>([])
  const [invitados, setInvitados] = useState<InvitadoListado[]>([])
  const [pagos, setPagos] = useState<PagoAPI[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")

  const cargar = useCallback(async () => {
    try {
      const [c, inv, p] = await Promise.all([
        listarConsumos(evento.eventoId),
        listarInvitados(evento.eventoId),
        listarPagos(evento.eventoId),
      ])
      setConsumos(c)
      setInvitados(inv)
      setPagos(p)
      setError("")
    } catch {
      setError("Error al cargar datos.")
    } finally {
      setCargando(false)
    }
  }, [evento.eventoId])

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 5000)
    return () => clearInterval(intervalo)
  }, [cargar])

  const { invitadosVivos, itemsVivos } = buildDatos(consumos, invitados, pagos)

  const totalAsignado = invitadosVivos.reduce(
    (s, inv) => s + inv.items.reduce((si, it) => si + it.precio, 0),
    0
  )
  const totalTicket = consumos.reduce((s, c) => s + parseFloat(c.precio), 0)
  const totalPendiente = Math.max(0, totalTicket - totalAsignado)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button type="button" onClick={onVolver}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#534AB7] transition-colors text-sm font-medium">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Consumos
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-[#534AB7] flex items-center justify-center">
              <span className="text-white font-black text-xs">CC</span>
            </div>
            <span className="font-black text-[#534AB7] text-base tracking-tight">CuentasClaras</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            En vivo
          </span>
        </div>
      </header>

      <BarraProgreso pasoActual={4} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-black text-gray-800">Vista en vivo</h1>
          <p className="text-gray-400 text-sm mt-1 truncate">{evento.nombre}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span>⚠️</span>
            <p className="text-sm text-red-600">{error}</p>
            <button type="button" onClick={cargar} className="ml-auto text-xs font-bold text-red-500 hover:underline">
              Reintentar
            </button>
          </div>
        )}

        {cargando && !error ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Cargando…</span>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <Metrica valor={`${invitadosVivos.length}`} label="Personas" />
              <Metrica valor={fmt(totalAsignado)} label="Asignado" colorValor="text-[#534AB7]" />
              <Metrica valor={fmt(totalPendiente)} label="Pendiente" colorValor="text-green-600" />
            </div>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {([["platillo", "🍽️ Por platillo"], ["invitado", "👥 Por invitado"]] as const).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setTab(key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === key ? "bg-white text-[#534AB7] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "platillo" ? (
              <TabPlatillo items={itemsVivos} invitados={invitadosVivos} />
            ) : (
              <div className="flex flex-col gap-3">
                {invitadosVivos.map((inv) => <TarjetaInvitado key={inv.id} inv={inv} />)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setTab("invitado")}
                className="py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-[#534AB7] hover:text-[#534AB7] transition-colors">
                👥 Ver por invitado
              </button>
              <button type="button" onClick={onEditar}
                className="py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 transition-colors">
                ✏️ Editar consumos
              </button>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 pb-8">
          <button type="button" onClick={onContinuar}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25">
            Ir a cobrar y cerrar →
          </button>
          <p className="text-center text-xs text-gray-400">Podrás editar consumos hasta que cierres el evento.</p>
        </div>

      </main>
    </div>
  )
}
