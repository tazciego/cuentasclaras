import { useState } from "react"
import type { DatosEvento } from "../types"
import BarraProgreso from "./BarraProgreso"

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
  precio: number          // lo que paga este invitado por el item
  compartidoCon: number   // 0 = solo suyo, >1 = dividido entre N
}

interface ItemVivo {
  id: number
  nombre: string
  precioTotal: number
  asignados: number[]     // ids de invitados (0 = anfitrión)
}

// ─── Datos de demo ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-[#534AB7]",   // 0 anfitrión
  "bg-orange-400",  // 1
  "bg-pink-400",    // 2
  "bg-sky-400",     // 3
  "bg-amber-400",   // 4
]

const ITEMS_VIVO: ItemVivo[] = [
  { id: 1, nombre: "Tacos de canasta x3",   precioTotal: 85,  asignados: [0] },
  { id: 2, nombre: "Orden de quesadillas",   precioTotal: 120, asignados: [1] },
  { id: 3, nombre: "Agua mineral 600ml",     precioTotal: 80,  asignados: [0, 1] },
  { id: 4, nombre: "Salsa verde extra",      precioTotal: 30,  asignados: [0, 1, 2] },
  { id: 5, nombre: "Postre del día",         precioTotal: 95,  asignados: [2] },
  { id: 6, nombre: "Horchata grande",        precioTotal: 55,  asignados: [] },       // sin elegir
  { id: 7, nombre: "Plato de guacamole",     precioTotal: 90,  asignados: [] },       // sin elegir
]

function buildInvitados(evento: DatosEvento): InvitadoVivo[] {
  const todos = [
    { id: 0, nombre: "Tú (anfitrión)", color: AVATAR_COLORS[0], status: "pagado" as StatusPago },
    ...evento.participantes.map((p, i) => ({
      id: p.id,
      nombre: p.nombre,
      color: AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length],
      status: (["pendiente", "eligiendo", "pendiente"] as StatusPago[])[i % 3],
    })),
    // Demo: si el evento no tiene participantes, forzamos 3
    ...(evento.participantes.length === 0
      ? [
          { id: 1, nombre: "Ana",    color: AVATAR_COLORS[1], status: "pendiente" as StatusPago },
          { id: 2, nombre: "Miguel", color: AVATAR_COLORS[2], status: "eligiendo" as StatusPago },
          { id: 3, nombre: "Rosa",   color: AVATAR_COLORS[3], status: "pendiente" as StatusPago },
        ]
      : []),
  ]

  return todos.map((inv) => {
    const misItems = ITEMS_VIVO.filter((it) => it.asignados.includes(inv.id))
    const consumos: ConsumoInvitado[] = misItems.map((it) => ({
      nombre: it.nombre,
      precio: it.asignados.length > 1 ? it.precioTotal / it.asignados.length : it.precioTotal,
      compartidoCon: it.asignados.length,
    }))
    return { ...inv, items: consumos }
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

// ─── Componentes pequeños ─────────────────────────────────────────────────────

function Avatar({
  inicial,
  color,
  size = "md",
  ring = false,
}: {
  inicial: string
  color: string
  size?: "sm" | "md"
  ring?: boolean
}) {
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
  return (
    <div
      className={`${sz} ${color} rounded-full flex items-center justify-center font-bold text-white shrink-0
        ${ring ? "ring-2 ring-[#534AB7] ring-offset-1" : ""}
      `}
    >
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
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

// ─── Métrica ──────────────────────────────────────────────────────────────────

function Metrica({ label, valor, colorValor }: { label: string; valor: string; colorValor?: string }) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-0.5">
      <span className={`text-base font-black leading-tight ${colorValor ?? "text-gray-800"}`}>
        {valor}
      </span>
      <span className="text-[11px] text-gray-400 font-medium leading-tight">{label}</span>
    </div>
  )
}

// ─── Tab: Por platillo ────────────────────────────────────────────────────────

function TabPlatillo({ invitados }: { invitados: InvitadoVivo[] }) {
  // mapa id → invitado para lookups rápidos
  const mapaInv = Object.fromEntries(invitados.map((inv) => [inv.id, inv]))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {ITEMS_VIVO.map((item, idx) => {
        const sinDueno = item.asignados.length === 0
        const compartido = item.asignados.length > 1
        const precioCada = compartido
          ? Math.round(item.precioTotal / item.asignados.length)
          : null

        return (
          <div
            key={item.id}
            className={`flex items-start gap-3 px-5 py-4 ${idx < ITEMS_VIVO.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            {/* Nombre y precio */}
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

            {/* Avatares o "sin elegir" */}
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {sinDueno ? (
                <div className="flex items-center gap-1.5">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center"
                    >
                      <span className="text-gray-300 text-sm">?</span>
                    </div>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">sin elegir</span>
                </div>
              ) : (
                <div className="flex -space-x-1.5">
                  {item.asignados.map((id) => {
                    const inv = mapaInv[id]
                    if (!inv) return null
                    return (
                      <div key={id} title={inv.nombre} className="ring-2 ring-white rounded-full">
                        <Avatar inicial={inv.nombre} color={inv.color} size="sm" />
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
      {/* Cabecera */}
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none"
      >
        <Avatar inicial={inv.nombre} color={inv.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800">{inv.nombre}</span>
            <BadgeStatus status={inv.status} />
          </div>
          <span className="text-sm font-black text-[#534AB7]">{fmt(total)}</span>
        </div>
        <svg
          viewBox="0 0 20 20"
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${abierta ? "rotate-180" : ""}`}
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Desglose */}
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
                      <span className="ml-2 text-[10px] text-gray-400">
                        (entre {it.compartidoCon})
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 shrink-0">{fmt(it.precio)}</span>
                </div>
              ))}
              {/* Subtotal */}
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</span>
                <span className="text-base font-black text-[#534AB7]">{fmt(total)}</span>
              </div>
            </div>
          )}

          {/* Botón WhatsApp */}
          {inv.id !== 0 && (
            <div className="px-5 pb-4">
              <button
                type="button"
                onClick={whatsapp}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C5E] text-sm font-bold hover:bg-[#25D366]/20 transition-colors"
              >
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
  const invitados = buildInvitados(evento)

  const totalAsignado = invitados.reduce(
    (s, inv) => s + inv.items.reduce((si, it) => si + it.precio, 0),
    0
  )
  const totalTicket = ITEMS_VIVO.reduce((s, it) => s + it.precioTotal, 0)
  const totalPendiente = totalTicket - totalAsignado

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onVolver}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#534AB7] transition-colors text-sm font-medium"
          >
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
          {/* Badge En vivo */}
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            En vivo
          </span>
        </div>
      </header>

      {/* Barra de progreso */}
      <BarraProgreso pasoActual={4} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* Título */}
        <div>
          <h1 className="text-2xl font-black text-gray-800">Vista en vivo</h1>
          <p className="text-gray-400 text-sm mt-1 truncate">
            {evento.nombre}
          </p>
        </div>

        {/* Métricas */}
        <div className="flex gap-3">
          <Metrica valor={`${invitados.length}`} label="Personas" />
          <Metrica valor={fmt(totalAsignado)} label="Asignado" colorValor="text-[#534AB7]" />
          <Metrica valor={fmt(Math.max(0, totalPendiente))} label="Pendiente" colorValor="text-green-600" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([ ["platillo", "🍽️ Por platillo"], ["invitado", "👥 Por invitado"] ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                ${tab === key
                  ? "bg-white text-[#534AB7] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Contenido del tab */}
        {tab === "platillo" ? (
          <TabPlatillo invitados={invitados} />
        ) : (
          <div className="flex flex-col gap-3">
            {invitados.map((inv) => (
              <TarjetaInvitado key={inv.id} inv={inv} />
            ))}
          </div>
        )}

        {/* Botones secundarios */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTab("invitado")}
            className="py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-[#534AB7] hover:text-[#534AB7] transition-colors"
          >
            👥 Ver por invitado
          </button>
          <button
            type="button"
            onClick={onEditar}
            className="py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 transition-colors"
          >
            ✏️ Editar consumos
          </button>
        </div>

        {/* Botón principal */}
        <div className="flex flex-col gap-2 pb-8">
          <button
            type="button"
            onClick={onContinuar}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25"
          >
            Ir a cobrar y cerrar →
          </button>
          <p className="text-center text-xs text-gray-400">
            Podrás editar consumos hasta que cierres el evento.
          </p>
        </div>

      </main>
    </div>
  )
}
