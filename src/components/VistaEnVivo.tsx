import { useState, useEffect, useCallback } from "react"
import type { DatosEvento } from "../types"
import BarraProgreso from "./BarraProgreso"
import {
  listarConsumos, listarInvitados, listarPagos,
  eliminarConsumo, actualizarConsumo,
} from "../api"
import type { ConsumoAPI, InvitadoListado, PagoAPI } from "../api"
import { COLORES_AVATAR } from "./invitado/PasoRegistro"
import { BotonCompartir } from "./BotonCompartir"
import { ModalAgregarItem } from "./CargarConsumos"
import type { ItemConsumo } from "./CargarConsumos"
import { guardarConsumo, listarSolicitudes, actualizarSolicitud } from "../api"
import type { SolicitudAPI } from "../api"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  evento: DatosEvento
  onVolver: () => void
  onContinuar: () => void
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type StatusPago = "pagado" | "pendiente" | "eligiendo" | "solicitando" | "revisar"
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
  cantidad: number
}

interface ItemVivo {
  id: number
  nombre: string
  precioTotal: number
  cantidadTotal: number
  stockDisponible: number
  asignadosIds: number[]
  asignadosNombres: string[]
  asignadosCantidades: number[]
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
  const itemsVivos: ItemVivo[] = consumos.map((c) => {
    const totalAsignado = c.asignados.reduce((s, a) => s + a.cantidad, 0)
    return {
      id: c.id,
      nombre: c.descripcion,
      precioTotal: parseFloat(c.precio),
      cantidadTotal: c.cantidad,
      stockDisponible: Math.max(0, c.cantidad - totalAsignado),
      asignadosIds: c.asignados.map((a) => a.invitado_id),
      asignadosNombres: c.asignados.map((a) => a.invitado_nombre),
      asignadosCantidades: c.asignados.map((a) => a.cantidad),
    }
  })

  const invitadosVivos: InvitadoVivo[] = invitados.map((inv) => {
    const color = COLORES_AVATAR[inv.color_index]?.bg ?? COLORES_AVATAR[0].bg
    const misConsumos = consumos.filter((c) =>
      c.asignados.some((a) => a.invitado_id === inv.id)
    )
    const items: ConsumoInvitado[] = misConsumos.map((c) => {
      const asig = c.asignados.find((a) => a.invitado_id === inv.id)
      const miCantidad = asig?.cantidad ?? 1
      const totalAsignados = c.asignados.length
      return {
        nombre: c.descripcion,
        precio: (parseFloat(c.precio) / Math.max(c.cantidad, 1)) * miCantidad,
        compartidoCon: totalAsignados,
        cantidad: miCantidad,
      }
    })
    const miPago = pagos.find((p) => p.invitado_id === inv.id)
    const status: StatusPago =
      inv.es_anfitrion === 1 ? "pagado"
      : miPago?.estado === "confirmado" ? "pagado"
      : miPago?.estado === "solicitando_pago" ? "solicitando"
      : miPago?.estado === "revisar" ? "revisar"
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
  pagado:      { label: "Pagado ✓",       cls: "bg-green-50 border-green-200 text-green-600" },
  pendiente:   { label: "Pendiente",      cls: "bg-orange-50 border-orange-200 text-orange-500" },
  eligiendo:   { label: "Eligiendo",      cls: "bg-gray-100 border-gray-200 text-gray-500" },
  solicitando: { label: "Quiere pagar 💳", cls: "bg-blue-50 border-blue-200 text-blue-600" },
  revisar:     { label: "En revisión ⚠️",  cls: "bg-yellow-50 border-yellow-300 text-yellow-600" },
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

function TabPlatillo({
  items,
  invitados,
  consumos,
  onAsignar,
}: {
  items: ItemVivo[]
  invitados: InvitadoVivo[]
  consumos: ConsumoAPI[]
  onAsignar: (consumo: ConsumoAPI) => void
}) {
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
        const agotado = item.stockDisponible === 0 && item.asignadosIds.length > 0
        return (
          <div key={item.id} className={`flex items-start gap-3 px-5 py-4 ${idx < items.length - 1 ? "border-b border-gray-100" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-800 leading-snug">{item.nombre}</p>
                {agotado ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-200">
                    Agotado
                  </span>
                ) : item.cantidadTotal > 1 ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">
                    {item.stockDisponible} disp.
                  </span>
                ) : null}
              </div>
              <span className="text-sm font-bold text-gray-700">{fmt(item.precioTotal)}</span>

              {/* Asignados con nombre y cantidad */}
              <div className="mt-1.5 flex flex-col gap-1">
                {sinDueno ? (
                  <span className="text-xs text-gray-400 italic">Sin asignar</span>
                ) : (
                  item.asignadosIds.map((id, i) => {
                    const inv = mapaInv[id]
                    const nombre = inv?.nombre ?? item.asignadosNombres[i] ?? "?"
                    const color = inv?.color ?? "bg-gray-400"
                    const cantidad = item.asignadosCantidades[i] ?? 1
                    return (
                      <div key={id} className="flex items-center gap-1.5">
                        <Avatar inicial={nombre} color={color} size="sm" />
                        <span className="text-xs text-gray-600 font-medium">
                          {nombre}
                          {cantidad > 1 ? (
                            <span className="ml-1 text-[#534AB7] font-bold">{cantidad} pzas</span>
                          ) : null}
                        </span>
                        {(() => {
                          const st = inv?.status
                          if (st === "pagado") return <span className="text-[10px] text-green-500 font-bold">✓</span>
                          if (st === "solicitando") return <span className="text-[10px] text-blue-500 font-bold">💳</span>
                          if (st === "revisar") return <span className="text-[10px] text-yellow-500 font-bold">⚠️</span>
                          return null
                        })()}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const c = consumos.find((c) => c.id === item.id)
                if (c) onAsignar(c)
              }}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#534AB7]/10 text-[#534AB7] hover:bg-[#534AB7]/20 transition-colors shrink-0 mt-0.5"
            >
              + Asignar
            </button>
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
    const lineas = inv.items.map((it) => `• ${it.nombre}${it.cantidad > 1 ? ` ×${it.cantidad}` : ""}: ${fmt(it.precio)}`).join("\n")
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
                    <span className="text-sm text-gray-700">
                      {it.nombre}
                      {it.cantidad > 1 && (
                        <span className="ml-1 text-xs font-bold text-[#534AB7]">×{it.cantidad}</span>
                      )}
                    </span>
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

// ─── Modal asignar item ────────────────────────────────────────────────────────

function ModalAsignarItem({
  consumo,
  invitados,
  guardando,
  onConfirmar,
  onCerrar,
}: {
  consumo: ConsumoAPI
  invitados: InvitadoListado[]
  guardando: boolean
  onConfirmar: (asignaciones: Array<{ invitado_id: number; cantidad: number }>) => void
  onCerrar: () => void
}) {
  const [seleccionados, setSeleccionados] = useState<number[]>(
    consumo.asignados.map((a) => a.invitado_id)
  )
  const [cantidades, setCantidades] = useState<Record<number, number>>(
    Object.fromEntries(consumo.asignados.map((a) => [a.invitado_id, a.cantidad]))
  )

  const toggle = (id: number) => {
    if (seleccionados.includes(id)) {
      setSeleccionados((prev) => prev.filter((i) => i !== id))
      setCantidades((prev) => { const n = { ...prev }; delete n[id]; return n })
    } else {
      setSeleccionados((prev) => [...prev, id])
      setCantidades((prev) => ({ ...prev, [id]: 1 }))
    }
  }

  const setCant = (id: number, delta: number) => {
    setCantidades((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }))
  }

  const guestInvitados = invitados.filter((inv) => !inv.es_anfitrion)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-black text-gray-800 text-base">Asignar item</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{consumo.descripcion}</p>
          </div>
          <button type="button" onClick={onCerrar}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-base leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
          {guestInvitados.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No hay invitados en el evento.</p>
          )}
          {guestInvitados.map((inv) => {
            const activo = seleccionados.includes(inv.id)
            const color = COLORES_AVATAR[inv.color_index % COLORES_AVATAR.length]
            const cant = cantidades[inv.id] ?? 1
            return (
              <div key={inv.id}>
                <button type="button" onClick={() => toggle(inv.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all
                    ${activo ? "border-[#534AB7] bg-[#534AB7]/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {inv.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className={`flex-1 text-sm font-medium ${activo ? "text-[#534AB7]" : "text-gray-700"}`}>
                    {inv.nombre}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                    ${activo ? "border-[#534AB7] bg-[#534AB7]" : "border-gray-300"}`}>
                    {activo && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                        <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>

                {activo && (
                  <div
                    className="flex items-center justify-between px-3 py-2 bg-[#534AB7]/5 rounded-xl mt-0.5 border border-[#534AB7]/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs font-medium text-[#534AB7]">
                      Piezas para {inv.nombre.split(" ")[0]}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCant(inv.id, -1)}
                        disabled={cant <= 1}
                        className="w-6 h-6 rounded-md border border-[#534AB7]/30 flex items-center justify-center text-[#534AB7] font-bold text-sm hover:bg-[#534AB7]/10 disabled:opacity-30 transition-colors leading-none"
                      >
                        −
                      </button>
                      <span className="text-sm font-black text-[#534AB7] w-4 text-center">{cant}</span>
                      <button
                        type="button"
                        onClick={() => setCant(inv.id, 1)}
                        className="w-6 h-6 rounded-md border border-[#534AB7]/30 flex items-center justify-center text-[#534AB7] font-bold text-sm hover:bg-[#534AB7]/10 transition-colors leading-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex gap-2 shrink-0">
          <button type="button" onClick={onCerrar} disabled={guardando}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 disabled:opacity-40">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirmar(seleccionados.map((id) => ({ invitado_id: id, cantidad: cantidades[id] ?? 1 })))}
            disabled={guardando}
            className="flex-1 py-3 rounded-xl bg-[#534AB7] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
            {guardando && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {guardando ? "Guardando…" : "Confirmar asignación"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal editar consumos ────────────────────────────────────────────────────

interface FormItem {
  nombre: string
  precio: string
  cantidad: number
  sinAsignar: boolean
  asignadosIds: number[]
}

function ModalEditarConsumos({
  consumos,
  invitados,
  onActualizado,
  onCerrar,
}: {
  consumos: ConsumoAPI[]
  invitados: InvitadoListado[]
  onActualizado: () => void
  onCerrar: () => void
}) {
  const [editando, setEditando] = useState<ConsumoAPI | null>(null)
  const [form, setForm] = useState<FormItem | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [error, setError] = useState("")

  const abrirEdicion = (consumo: ConsumoAPI) => {
    const asignadosIds = consumo.asignados.map((a) => a.invitado_id)
    setForm({
      nombre: consumo.descripcion,
      precio: consumo.precio,
      cantidad: consumo.cantidad,
      sinAsignar: asignadosIds.length === 0,
      asignadosIds,
    })
    setEditando(consumo)
    setError("")
  }

  const handleEliminar = async (consumoId: number) => {
    setEliminando(consumoId)
    try {
      await eliminarConsumo(consumoId)
      onActualizado()
    } catch {
      setError("Error al eliminar. Intenta de nuevo.")
    } finally {
      setEliminando(null)
    }
  }

  const handleGuardar = async () => {
    if (!editando || !form) return
    if (!form.nombre.trim() || parseFloat(form.precio) <= 0) return
    setGuardando(true)
    setError("")
    try {
      await actualizarConsumo({
        id: editando.id,
        descripcion: form.nombre.trim(),
        precio: parseFloat(form.precio) * form.cantidad,
        cantidad: form.cantidad,
        asignados: form.sinAsignar
          ? []
          : form.asignadosIds.map((id) => ({ invitado_id: id, cantidad: 1 })),
      })
      onActualizado()
      setEditando(null)
      setForm(null)
    } catch {
      setError("Error al guardar. Intenta de nuevo.")
    } finally {
      setGuardando(false)
    }
  }

  const toggleInvitado = (id: number) => {
    if (!form) return
    setForm((prev) => prev ? {
      ...prev,
      asignadosIds: prev.asignadosIds.includes(id)
        ? prev.asignadosIds.filter((i) => i !== id)
        : [...prev.asignadosIds, id],
    } : prev)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            {editando ? (
              <button type="button" onClick={() => { setEditando(null); setForm(null) }}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium">
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Volver a la lista
              </button>
            ) : (
              <h3 className="font-black text-gray-800 text-base">Editar consumos</h3>
            )}
          </div>
          <button type="button" onClick={onCerrar}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-base leading-none">
            ×
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Lista de consumos ── */}
          {!editando && (
            <div className="divide-y divide-gray-100">
              {consumos.length === 0 && (
                <p className="px-6 py-8 text-sm text-gray-400 text-center">No hay items para editar.</p>
              )}
              {error && <p className="px-6 py-3 text-xs text-red-400">⚠ {error}</p>}
              {consumos.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug truncate">{c.descripcion}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.cantidad} × ${(parseFloat(c.precio) / Math.max(c.cantidad, 1)).toFixed(0)} = ${Math.round(parseFloat(c.precio)).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => abrirEdicion(c)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#534AB7] hover:bg-[#534AB7]/10 transition-colors">
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button type="button"
                      onClick={() => handleEliminar(c.id)}
                      disabled={eliminando === c.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 text-lg leading-none">
                      {eliminando === c.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : "×"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Formulario de edición ── */}
          {editando && form && (
            <div className="px-6 py-5 flex flex-col gap-4">

              {/* Nombre */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre del item</label>
                <input
                  autoFocus
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => p ? { ...p, nombre: e.target.value } : p)}
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#534AB7] transition-colors"
                />
              </div>

              {/* Precio unitario */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio unitario</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number" min="0" step="0.50"
                    value={form.precio}
                    onChange={(e) => setForm((p) => p ? { ...p, precio: e.target.value } : p)}
                    className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-[#534AB7] transition-colors"
                  />
                </div>
              </div>

              {/* Cantidad */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setForm((p) => p ? { ...p, cantidad: Math.max(1, p.cantidad - 1) } : p)}
                    disabled={(form.cantidad) <= 1}
                    className="w-8 h-8 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7] disabled:opacity-30 transition-colors font-bold text-base leading-none">
                    −
                  </button>
                  <span className="text-base font-black text-gray-800 w-5 text-center">{form.cantidad}</span>
                  <button type="button"
                    onClick={() => setForm((p) => p ? { ...p, cantidad: p.cantidad + 1 } : p)}
                    className="w-8 h-8 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7] transition-colors font-bold text-base leading-none">
                    +
                  </button>
                </div>
              </div>

              {/* Asignados */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Asignar a:</p>
                <button type="button"
                  onClick={() => setForm((p) => p ? { ...p, sinAsignar: !p.sinAsignar, asignadosIds: [] } : p)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                    ${form.sinAsignar ? "border-[#534AB7] bg-[#534AB7]/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                    ${form.sinAsignar ? "border-[#534AB7] bg-[#534AB7]" : "border-gray-300"}`}>
                    {form.sinAsignar && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                        <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${form.sinAsignar ? "text-[#534AB7]" : "text-gray-700"}`}>
                    Los invitados eligen
                  </span>
                </button>

                {!form.sinAsignar && invitados.map((inv) => {
                  const activo = form.asignadosIds.includes(inv.id)
                  const color = COLORES_AVATAR[inv.color_index % COLORES_AVATAR.length]
                  return (
                    <button key={inv.id} type="button" onClick={() => toggleInvitado(inv.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all
                        ${activo ? "border-[#534AB7] bg-[#534AB7]/5" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className={`w-7 h-7 rounded-full ${color.bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {inv.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className={`flex-1 text-sm font-medium ${activo ? "text-[#534AB7]" : "text-gray-700"}`}>
                        {inv.nombre}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                        ${activo ? "border-[#534AB7] bg-[#534AB7]" : "border-gray-300"}`}>
                        {activo && (
                          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                            <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {error && <p className="text-xs text-red-400">⚠ {error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {editando && form && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex gap-2 shrink-0">
            <button type="button" onClick={() => { setEditando(null); setForm(null) }}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleGuardar} disabled={guardando || !form.nombre.trim() || parseFloat(form.precio) <= 0}
              className="flex-1 py-3 rounded-xl bg-[#534AB7] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40">
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function VistaEnVivo({ evento, onVolver, onContinuar }: Props) {
  const [tab, setTab] = useState<Tab>("platillo")
  const [consumos, setConsumos] = useState<ConsumoAPI[]>([])
  const [invitados, setInvitados] = useState<InvitadoListado[]>([])
  const [pagos, setPagos] = useState<PagoAPI[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [modalEditar, setModalEditar] = useState(false)
  const [solicitudes, setSolicitudes] = useState<SolicitudAPI[]>([])
  const [solicitudAutorizando, setSolicitudAutorizando] = useState<SolicitudAPI | null>(null)
  const [guardandoAutorizacion, setGuardandoAutorizacion] = useState(false)
  const [errorAutorizacion, setErrorAutorizacion] = useState("")
  const [itemAsignando, setItemAsignando] = useState<ConsumoAPI | null>(null)
  const [guardandoAsig, setGuardandoAsig] = useState(false)

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
    listarSolicitudes(evento.eventoId).then(setSolicitudes).catch(() => {})
  }, [evento.eventoId])

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 1000)
    return () => clearInterval(intervalo)
  }, [cargar])

  const autorizarSolicitud = async (datos: Omit<ItemConsumo, "id">) => {
    if (!solicitudAutorizando) return
    setGuardandoAutorizacion(true)
    setErrorAutorizacion("")
    try {
      await guardarConsumo({
        evento_id: evento.eventoId,
        descripcion: datos.nombre,
        precio: datos.precioUnitario * datos.cantidad,
        cantidad: datos.cantidad,
        asignados: datos.sinAsignar ? [] : datos.asignados,
      })
      await actualizarSolicitud(solicitudAutorizando.id, "autorizado")
      setSolicitudAutorizando(null)
      cargar()
    } catch {
      setErrorAutorizacion("Error al guardar. Intenta de nuevo.")
    } finally {
      setGuardandoAutorizacion(false)
    }
  }

  const confirmarAsignacion = async (asignaciones: Array<{ invitado_id: number; cantidad: number }>) => {
    if (!itemAsignando) return
    setGuardandoAsig(true)
    try {
      await actualizarConsumo({
        id: itemAsignando.id,
        descripcion: itemAsignando.descripcion,
        precio: parseFloat(itemAsignando.precio),
        cantidad: itemAsignando.cantidad,
        asignados: asignaciones,
      })
      setItemAsignando(null)
      cargar()
    } catch {
      // silently ignore
    } finally {
      setGuardandoAsig(false)
    }
  }

  const { invitadosVivos, itemsVivos } = buildDatos(consumos, invitados, pagos)

  const totalAsignado = invitadosVivos.reduce(
    (s, inv) => s + inv.items.reduce((si, it) => si + it.precio, 0), 0
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
          <BotonCompartir codigo={evento.codigo} />
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

            {/* Solicitudes pendientes */}
            {solicitudes.filter((s) => s.estado === "pendiente").length > 0 && (
              <div className="flex flex-col gap-2">
                {solicitudes
                  .filter((s) => s.estado === "pendiente")
                  .map((s) => (
                    <div key={s.id} className="flex items-start gap-3 px-4 py-3 rounded-2xl border-2 border-amber-200 bg-amber-50">
                      <span className="text-lg shrink-0 mt-0.5">⚠️</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-700">{s.invitado_nombre} solicita:</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{s.nombre_item}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {s.cantidad} {s.cantidad !== 1 ? "piezas" : "pieza"}
                          {s.precio_unitario > 0 ? ` · $${s.precio_unitario} c/u` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSolicitudAutorizando(s)}
                          className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                          ✓ Autorizar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            actualizarSolicitud(s.id, "rechazado")
                              .then(() => cargar())
                              .catch(() => {})
                          }
                          className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-bold hover:bg-red-200 transition-colors"
                        >
                          ✗ Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {([["platillo", "🍽️ Por platillo"], ["invitado", "👥 Por invitado"]] as const).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setTab(key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === key ? "bg-white text-[#534AB7] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "platillo" ? (
              <TabPlatillo items={itemsVivos} invitados={invitadosVivos} consumos={consumos} onAsignar={setItemAsignando} />
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
              <button type="button" onClick={() => setModalEditar(true)}
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

      {modalEditar && (
        <ModalEditarConsumos
          consumos={consumos}
          invitados={invitados}
          onActualizado={() => { cargar() }}
          onCerrar={() => setModalEditar(false)}
        />
      )}
      {solicitudAutorizando && (
        <ModalAgregarItem
          eventoId={evento.eventoId}
          tituloOverride="Autorizar solicitud"
          initialValues={{
            nombre: solicitudAutorizando.nombre_item,
            precioUnitario: solicitudAutorizando.precio_unitario,
            cantidad: solicitudAutorizando.cantidad,
            sinAsignar: true,
            asignados: [],
          }}
          guardando={guardandoAutorizacion}
          errorExterno={errorAutorizacion}
          onGuardar={autorizarSolicitud}
          onCerrar={() => { setSolicitudAutorizando(null); setErrorAutorizacion("") }}
        />
      )}
      {itemAsignando && (
        <ModalAsignarItem
          consumo={itemAsignando}
          invitados={invitados}
          guardando={guardandoAsig}
          onConfirmar={confirmarAsignacion}
          onCerrar={() => setItemAsignando(null)}
        />
      )}
    </div>
  )
}
