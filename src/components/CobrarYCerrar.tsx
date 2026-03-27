import { useState, useEffect, useCallback } from "react"
import type { DatosEvento } from "../types"
import BarraProgreso from "./BarraProgreso"
import Confetti from "./Confetti"
import { listarConsumos, listarInvitados, listarPagos, confirmarPago, cerrarEvento, actualizarEstadoPago } from "../api"
import type { ConsumoAPI, InvitadoListado, PagoAPI } from "../api"
import { COLORES_AVATAR } from "./invitado/PasoRegistro"
import { BotonCompartir } from "./BotonCompartir"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  evento: DatosEvento
  onVolver: () => void
  onCerrar: () => void
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type StatusPago = "listo" | "pagado" | "pendiente" | "solicitando" | "revisar"

interface PagoInvitado {
  invitadoId: number
  pagoId: number | null
  nombre: string
  color: string
  monto: number
  metodo: string | null
  status: StatusPago
  esAnfitrion: boolean
  subtotal: number | null
  propinaMonto: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

function parseNota(nota: string | null): { subtotal: number | null; propina: number | null } {
  if (!nota) return { subtotal: null, propina: null }
  try {
    const obj = JSON.parse(nota)
    return { subtotal: obj.subtotal ?? null, propina: obj.propina ?? null }
  } catch {
    return { subtotal: null, propina: null }
  }
}

function buildPagos(
  consumos: ConsumoAPI[],
  invitados: InvitadoListado[],
  pagos: PagoAPI[]
): PagoInvitado[] {
  return invitados.map((inv) => {
    const misConsumos = consumos.filter((c) =>
      c.asignados.some((a) => a.invitado_id === inv.id)
    )

    const miPago = pagos.find((p) => p.invitado_id === inv.id)

    // Bug 2: si hay pago registrado usar su monto real (no recalcular desde consumos)
    // Bug 3: si no hay pago, calcular correctamente con precioUnitario × miCantidad
    const monto = miPago
      ? parseFloat(miPago.monto)
      : misConsumos.reduce((s, c) => {
          const precioUnitario = parseFloat(c.precio) / Math.max(c.cantidad, 1)
          const miAsignacion = c.asignados.find((a) => a.invitado_id === inv.id)
          const miQty = miAsignacion?.cantidad ?? 1
          return s + precioUnitario * miQty
        }, 0)
    const status: StatusPago =
      inv.es_anfitrion === 1 ? "listo"
      : miPago?.estado === "confirmado" ? "pagado"
      : miPago?.estado === "solicitando_pago" ? "solicitando"
      : miPago?.estado === "revisar" ? "revisar"
      : miPago ? "pendiente"
      : "pendiente"

    const metodoLabel: Record<string, string> = {
      spei: "Transferencia",
      tarjeta: "Tarjeta",
      efectivo: "Efectivo",
      otro: "Otro",
    }

    const { subtotal, propina } = parseNota(miPago?.nota ?? null)

    return {
      invitadoId: inv.id,
      pagoId: miPago?.id ?? null,
      nombre: inv.nombre,
      color: COLORES_AVATAR[inv.color_index]?.bg ?? COLORES_AVATAR[0].bg,
      monto,
      metodo: miPago ? (metodoLabel[miPago.metodo] ?? miPago.metodo) : null,
      status,
      esAnfitrion: inv.es_anfitrion === 1,
      subtotal,
      propinaMonto: propina,
    }
  })
}

const STATUS_META: Record<StatusPago, { label: string; bg: string; text: string; border: string }> = {
  listo:       { label: "Listo",        bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200" },
  pagado:      { label: "Pagado ✓",     bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200" },
  pendiente:   { label: "Pendiente",    bg: "bg-orange-50", text: "text-orange-500", border: "border-orange-200" },
  solicitando: { label: "Quiere pagar", bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200" },
  revisar:     { label: "En revisión",  bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-300" },
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ nombre, color }: { nombre: string; color: string }) {
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

// ─── Barra de cobro ───────────────────────────────────────────────────────────

function BarraCobro({ cobrado, total }: { cobrado: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((cobrado / total) * 100)) : 0
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Pagos recibidos</span>
        <span className="text-sm font-black text-gray-800">
          {fmt(cobrado)} <span className="font-normal text-gray-400">de</span> {fmt(total)}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-green-600">{fmt(cobrado)} cobrado</span>
        <span className="text-orange-500">{fmt(total - cobrado)} pendiente</span>
      </div>
    </div>
  )
}

// ─── Fila de pago ─────────────────────────────────────────────────────────────

function FilaPago({ pago, confirmando, onConfirmar, onRevisar }: {
  pago: PagoInvitado
  confirmando: boolean
  onConfirmar: () => void
  onRevisar: () => void
}) {
  const meta = STATUS_META[pago.status]
  const puedeConfirmar = pago.status === "pendiente" && pago.pagoId !== null && !pago.esAnfitrion

  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <Avatar nombre={pago.nombre} color={pago.color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-800">{pago.nombre}</span>
          {pago.esAnfitrion && <span className="text-[10px] text-gray-400 font-medium">(anfitrión)</span>}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {pago.esAnfitrion
            ? "Tu parte de la cuenta"
            : pago.metodo
              ? pago.metodo
              : "Sin pago registrado"}
        </p>
        {/* Desglose subtotal + propina — visible para cualquier estado con pago registrado */}
        {pago.subtotal !== null && pago.subtotal > 0 && (
          <p className={`text-[10px] mt-0.5 ${pago.status === "solicitando" ? "text-blue-500" : "text-gray-400"}`}>
            Items {fmt(pago.subtotal)}
            {pago.propinaMonto !== null && pago.propinaMonto > 0
              ? ` · Propina ${Math.round((pago.propinaMonto / pago.subtotal) * 100)}% (${fmt(pago.propinaMonto)})`
              : ""}
          </p>
        )}
        {/* Botones para solicitando_pago */}
        {pago.status === "solicitando" && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <button type="button" onClick={onConfirmar} disabled={confirmando}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
              ✓ Confirmar pago
            </button>
            <button type="button" onClick={onRevisar} disabled={confirmando}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs font-bold hover:bg-yellow-200 transition-colors disabled:opacity-50">
              Revisar
            </button>
          </div>
        )}
        {/* Botones para revisar */}
        {pago.status === "revisar" && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <button type="button" onClick={onConfirmar} disabled={confirmando}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
              ✓ Confirmar pago
            </button>
            <button type="button" onClick={onConfirmar} disabled={confirmando}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-300 text-xs font-bold hover:bg-blue-200 transition-colors disabled:opacity-50">
              Ya revisamos, confirmar
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-black text-gray-800">{fmt(pago.monto)}</span>
        {puedeConfirmar ? (
          <button type="button" onClick={onConfirmar} disabled={confirmando}
            title="Confirmar pago en efectivo"
            className="w-7 h-7 rounded-full border-2 border-orange-300 bg-orange-50 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all flex items-center justify-center disabled:opacity-50">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l3.5 3.5L13 4.5" />
            </svg>
          </button>
        ) : (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
            {meta.label}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Modal de confirmación de cierre ─────────────────────────────────────────

function ModalCerrar({ cerrando, onConfirmar, onCancelar }: {
  cerrando: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-2xl">🔒</div>
          <h3 className="font-black text-gray-800 text-lg">¿Cerrar el evento?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">El QR dejará de funcionar y no podrás registrar más pagos.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={onConfirmar} disabled={cerrando}
            className="w-full py-3 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
            {cerrando ? "Cerrando…" : "Sí, cerrar evento"}
          </button>
          <button type="button" onClick={onCancelar} disabled={cerrando}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors disabled:opacity-40">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pantalla de celebración ──────────────────────────────────────────────────

function PantallaCelebracion({ evento, onCerrar }: { evento: DatosEvento; onCerrar: () => void }) {
  return (
    <div className="min-h-screen bg-[#534AB7] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <Confetti colores={["#ffffff", "#2EC4B6", "#FFD166", "#F4A261", "#a78bfa"]} cantidad={60} />
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="w-28 h-28 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-6xl shadow-xl">🎉</div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-white leading-tight">¡Evento cerrado!</h1>
          <p className="text-white/70 text-sm">{evento.nombre}</p>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-5 border border-white/20 w-full">
          <p className="text-white text-base font-bold leading-relaxed italic">
            "La mejor noche siempre termina con las cuentas al día. ¡Hasta la próxima!"
          </p>
        </div>
        <button type="button" onClick={onCerrar}
          className="w-full py-3.5 rounded-xl bg-white text-[#534AB7] font-black text-sm hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg">
          Volver al inicio
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CobrarYCerrar({ evento, onVolver, onCerrar }: Props) {
  const [consumos, setConsumos] = useState<ConsumoAPI[]>([])
  const [invitados, setInvitados] = useState<InvitadoListado[]>([])
  const [pagos, setPagos] = useState<PagoAPI[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [celebrando, setCelebrando] = useState(false)
  const [confirmando, setConfirmando] = useState<number | null>(null)
  const [cerrando, setCerrando] = useState(false)

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
    const intervalo = setInterval(cargar, 1000)
    return () => clearInterval(intervalo)
  }, [cargar])

  if (celebrando) return <PantallaCelebracion evento={evento} onCerrar={onCerrar} />

  const pagosInvitados = buildPagos(consumos, invitados, pagos)
  const totalTicket = consumos.reduce((s, c) => s + parseFloat(c.precio), 0)
  const cobrado = pagosInvitados.filter((p) => p.status === "pagado" || p.status === "listo").reduce((s, p) => s + p.monto, 0)
  const pendientes = pagosInvitados.filter((p) => p.status === "pendiente" && !p.esAnfitrion)
  const solicitando = pagosInvitados.filter((p) => p.status === "solicitando")
  const enRevision = pagosInvitados.filter((p) => p.status === "revisar")
  const bloqueandoCierre = solicitando.length + enRevision.length
  const miParte = pagosInvitados.find((p) => p.esAnfitrion)?.monto ?? 0

  const handleConfirmarPago = async (pagoId: number) => {
    setConfirmando(pagoId)
    try {
      await confirmarPago(pagoId)
      await cargar()
    } catch {
      setError("Error al confirmar el pago.")
    } finally {
      setConfirmando(null)
    }
  }

  const handleRevisarPago = async (pagoId: number) => {
    setConfirmando(pagoId)
    try {
      await actualizarEstadoPago(pagoId, "revisar")
      await cargar()
    } catch {
      setError("Error al actualizar el pago.")
    } finally {
      setConfirmando(null)
    }
  }

  const handleCerrarEvento = async () => {
    setCerrando(true)
    try {
      await cerrarEvento(evento.eventoId)
      setModalAbierto(false)
      setCelebrando(true)
    } catch {
      setError("Error al cerrar el evento. Intenta de nuevo.")
      setCerrando(false)
      setModalAbierto(false)
    }
  }

  const recordarWhatsApp = (pago: PagoInvitado) => {
    const texto = encodeURIComponent(
      `Hola ${pago.nombre}! 😊 Te recuerdo que tu parte de "${evento.nombre}" es ${fmt(pago.monto)}. ¡Gracias!`
    )
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button type="button" onClick={onVolver}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#534AB7] transition-colors text-sm font-medium">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Vista en vivo
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-[#534AB7] flex items-center justify-center">
              <span className="text-white font-black text-xs">CC</span>
            </div>
            <span className="font-black text-[#534AB7] text-base tracking-tight">CuentasClaras</span>
          </div>
          <BotonCompartir codigo={evento.codigo} />
        </div>
      </header>

      <BarraProgreso pasoActual={5} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-black text-gray-800">Cobrar y cerrar</h1>
          <p className="text-gray-400 text-sm mt-1 truncate">{evento.nombre}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span>⚠️</span>
            <p className="text-sm text-red-600 flex-1">{error}</p>
            <button type="button" onClick={cargar} className="text-xs font-bold text-red-500 hover:underline">Reintentar</button>
          </div>
        )}

        {cargando && !error ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Cargando…</span>
          </div>
        ) : (
          <>
            <BarraCobro cobrado={cobrado} total={totalTicket} />

            {/* Sección destacada: quieren pagar ahora */}
            {solicitando.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-blue-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-blue-700">
                    {solicitando.length === 1
                      ? `${solicitando[0].nombre} quiere pagar`
                      : `${solicitando.length} personas quieren pagar`}
                  </h2>
                </div>
                <div className="divide-y divide-blue-100">
                  {solicitando.map((pago) => (
                    <FilaPago
                      key={pago.invitadoId}
                      pago={pago}
                      confirmando={confirmando === pago.pagoId}
                      onConfirmar={() => pago.pagoId && handleConfirmarPago(pago.pagoId)}
                      onRevisar={() => pago.pagoId && handleRevisarPago(pago.pagoId)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-700">Detalle de pagos</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {pagosInvitados.map((pago) => (
                  <FilaPago
                    key={pago.invitadoId}
                    pago={pago}
                    confirmando={confirmando === pago.pagoId}
                    onConfirmar={() => pago.pagoId && handleConfirmarPago(pago.pagoId)}
                    onRevisar={() => pago.pagoId && handleRevisarPago(pago.pagoId)}
                  />
                ))}
                {pagosInvitados.length === 0 && (
                  <p className="px-5 py-8 text-sm text-gray-400 text-center">
                    Aún no hay invitados en este evento.
                  </p>
                )}
              </div>
            </div>

            {pendientes.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <span className="text-xl leading-none mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-bold text-orange-700">
                      {pendientes.length === 1
                        ? `${pendientes[0].nombre} aún no ha pagado`
                        : `${pendientes.length} personas aún no han pagado`}
                    </p>
                    <p className="text-xs text-orange-600 mt-0.5">¿Qué quieres hacer?</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {pendientes.map((p) => (
                    <button key={p.invitadoId} type="button" onClick={() => recordarWhatsApp(p)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C5E] text-xs font-bold hover:bg-[#25D366]/20 transition-colors">
                      <span>💬</span>
                      Recordar a {p.nombre}
                    </button>
                  ))}
                  <button type="button" onClick={() => setModalAbierto(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-200 transition-colors">
                    Cerrar de todos modos
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-700">Resumen</h2>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total del ticket</span>
                  <span className="font-bold text-gray-800">{fmt(totalTicket)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Cobrado</span>
                  <span className="font-bold text-green-600">{fmt(cobrado)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pendiente</span>
                  <span className={`font-bold ${totalTicket - cobrado > 0 ? "text-red-500" : "text-gray-400"}`}>
                    {fmt(Math.max(0, totalTicket - cobrado))}
                  </span>
                </div>
                <div className="border-t border-dashed border-gray-100 pt-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6l2.5 2.5L10 3.5" />
                    </svg>
                  </div>
                  <span className="text-xs text-green-700 font-semibold">Tu parte ya cubierta · {fmt(miParte)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pb-8">
              {bloqueandoCierre > 0 ? (
                <div className="flex items-start gap-2 bg-orange-50 border border-orange-300 rounded-xl px-4 py-3">
                  <span className="text-base mt-0.5">⏳</span>
                  <p className="text-xs text-orange-700 leading-snug">
                    <span className="font-semibold">
                      Hay {bloqueandoCierre} invitado{bloqueandoCierre !== 1 ? "s" : ""} con pagos pendientes de confirmar.
                    </span>{" "}
                    Resuelve todos antes de cerrar.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
                  <span className="text-base">🔒</span>
                  <p className="text-xs text-gray-500 leading-snug">
                    <span className="font-semibold text-gray-700">Al cerrar el evento el QR dejará de funcionar</span>{" "}
                    y no se podrán registrar más pagos.
                  </p>
                </div>
              )}
              <button type="button"
                onClick={() => { if (!bloqueandoCierre) setModalAbierto(true) }}
                disabled={bloqueandoCierre > 0}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all
                  ${bloqueandoCierre > 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#534AB7] text-white hover:opacity-90 active:scale-[0.98] shadow-md shadow-[#534AB7]/25"
                  }`}>
                {bloqueandoCierre > 0 ? "Cerrar evento (bloqueado)" : "Confirmar y cerrar evento 🔒"}
              </button>
              <button type="button" onClick={onVolver}
                className="w-full py-3 rounded-xl border-2 border-red-200 text-red-400 font-semibold text-sm hover:border-red-300 hover:text-red-500 transition-colors">
                Cancelar — seguir cobrando
              </button>
            </div>
          </>
        )}

      </main>

      {modalAbierto && (
        <ModalCerrar
          cerrando={cerrando}
          onConfirmar={handleCerrarEvento}
          onCancelar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
