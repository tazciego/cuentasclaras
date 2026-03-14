import { useState } from "react"
import type { DatosEvento } from "../types"
import BarraProgreso from "./BarraProgreso"
import Confetti from "./Confetti"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  evento: DatosEvento
  onVolver: () => void
  onCerrar: () => void
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type StatusPago = "listo" | "pagado" | "pendiente"
type MetodoPago = "Transferencia" | "Efectivo" | "Tarjeta" | null

interface PagoInvitado {
  id: number
  nombre: string
  color: string
  monto: number
  metodo: MetodoPago
  tiempoInfo: string | null   // "hace 3 min", "hace 10 min", "pendiente"…
  status: StatusPago
  esAnfitrion: boolean
}

// ─── Datos de demo ────────────────────────────────────────────────────────────

const TOTAL_TICKET = 847

const PAGOS_DEMO: PagoInvitado[] = [
  {
    id: 0,
    nombre: "Tú",
    color: "bg-[#534AB7]",
    monto: 283,
    metodo: null,
    tiempoInfo: null,
    status: "listo",
    esAnfitrion: true,
  },
  {
    id: 1,
    nombre: "Mariana",
    color: "bg-orange-400",
    monto: 197,
    metodo: "Transferencia",
    tiempoInfo: "hace 3 min",
    status: "pagado",
    esAnfitrion: false,
  },
  {
    id: 2,
    nombre: "Luis",
    color: "bg-pink-400",
    monto: 207,
    metodo: "Efectivo",
    tiempoInfo: "pendiente",
    status: "pendiente",
    esAnfitrion: false,
  },
  {
    id: 3,
    nombre: "Rosa",
    color: "bg-sky-400",
    monto: 160,
    metodo: "Transferencia",
    tiempoInfo: "hace 10 min",
    status: "pagado",
    esAnfitrion: false,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${n.toLocaleString("es-MX")}`
}

const STATUS_META: Record<StatusPago, { label: string; dot?: string; bg: string; text: string; border: string }> = {
  listo:    { label: "Listo",    bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200" },
  pagado:   { label: "Pagado ✓", bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200" },
  pendiente:{ label: "Pendiente",bg: "bg-orange-50", text: "text-orange-500", border: "border-orange-200" },
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ nombre, color }: { nombre: string; color: string }) {
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

// ─── Barra de progreso de cobro ───────────────────────────────────────────────

function BarraCobro({ cobrado, total }: { cobrado: number; total: number }) {
  const pct = Math.min(100, Math.round((cobrado / total) * 100))
  const pendiente = total - cobrado

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Pagos recibidos</span>
        <span className="text-sm font-black text-gray-800">
          {fmt(cobrado)} <span className="font-normal text-gray-400">de</span> {fmt(total)}
        </span>
      </div>

      {/* Track */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Etiquetas */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-green-600">{fmt(cobrado)} cobrado</span>
        <span className="text-orange-500">{fmt(pendiente)} pendiente</span>
      </div>
    </div>
  )
}

// ─── Fila de pago ─────────────────────────────────────────────────────────────

function FilaPago({
  pago,
  onConfirmar,
}: {
  pago: PagoInvitado
  onConfirmar: () => void
}) {
  const meta = STATUS_META[pago.status]

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Avatar nombre={pago.nombre} color={pago.color} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-800">{pago.nombre}</span>
          {pago.esAnfitrion && (
            <span className="text-[10px] text-gray-400 font-medium">(anfitrión)</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {pago.esAnfitrion
            ? "Tu parte de la cuenta"
            : pago.metodo
              ? `${pago.metodo} · ${pago.tiempoInfo}`
              : pago.tiempoInfo ?? "—"}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-black text-gray-800">{fmt(pago.monto)}</span>

        {/* Badge o botón confirmar */}
        {pago.status === "pendiente" ? (
          <button
            type="button"
            onClick={onConfirmar}
            title="Confirmar pago en efectivo"
            className="w-7 h-7 rounded-full border-2 border-orange-300 bg-orange-50 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all flex items-center justify-center"
          >
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

function ModalCerrar({ onConfirmar, onCancelar }: { onConfirmar: () => void; onCancelar: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-2xl">
            🔒
          </div>
          <h3 className="font-black text-gray-800 text-lg">¿Cerrar el evento?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            El QR dejará de funcionar y no podrás registrar más pagos. Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirmar}
            className="w-full py-3 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Sí, cerrar evento
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors"
          >
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
        <div className="w-28 h-28 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-6xl shadow-xl">
          🎉
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-white leading-tight">¡Evento cerrado!</h1>
          <p className="text-white/70 text-sm">{evento.nombre}</p>
        </div>

        <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-5 border border-white/20 w-full">
          <p className="text-white text-base font-bold leading-relaxed italic">
            "La mejor noche siempre termina con las cuentas al día. ¡Hasta la próxima!"
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-4 py-2">
          <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
            <span className="text-white font-black text-[9px]">CC</span>
          </div>
          <span className="text-white/80 text-xs font-semibold">CuentasClaras</span>
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
  const [pagos, setPagos] = useState<PagoInvitado[]>(PAGOS_DEMO)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [celebrando, setCelebrando] = useState(false)

  if (celebrando) return <PantallaCelebracion evento={evento} onCerrar={onCerrar} />

  const cobrado = pagos
    .filter((p) => p.status === "pagado" || p.status === "listo")
    .reduce((s, p) => s + p.monto, 0)

  const pendientes = pagos.filter((p) => p.status === "pendiente")
  const miParte = pagos.find((p) => p.esAnfitrion)?.monto ?? 0

  const confirmarPago = (id: number) => {
    setPagos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "pagado", tiempoInfo: "ahora" } : p))
    )
  }

  const recordarWhatsApp = (pago: PagoInvitado) => {
    const texto = encodeURIComponent(
      `Hola ${pago.nombre}! 😊 Te recuerdo que tu parte de "${evento.nombre}" es ${fmt(pago.monto)}. ¡Gracias!`
    )
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

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
            Vista en vivo
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#534AB7] flex items-center justify-center">
              <span className="text-white font-black text-xs">CC</span>
            </div>
            <span className="font-black text-[#534AB7] text-base tracking-tight">CuentasClaras</span>
          </div>
        </div>
      </header>

      {/* Barra de progreso */}
      <BarraProgreso pasoActual={5} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* Título */}
        <div>
          <h1 className="text-2xl font-black text-gray-800">Cobrar y cerrar</h1>
          <p className="text-gray-400 text-sm mt-1 truncate">{evento.nombre}</p>
        </div>

        {/* Barra de progreso de cobro */}
        <BarraCobro cobrado={cobrado} total={TOTAL_TICKET} />

        {/* Lista de pagos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">Detalle de pagos</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {pagos.map((pago) => (
              <FilaPago
                key={pago.id}
                pago={pago}
                onConfirmar={() => confirmarPago(pago.id)}
              />
            ))}
          </div>
        </div>

        {/* Alerta de pendientes */}
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
                <button
                  key={p.id}
                  type="button"
                  onClick={() => recordarWhatsApp(p)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C5E] text-xs font-bold hover:bg-[#25D366]/20 transition-colors"
                >
                  <span>💬</span>
                  Recordar a {p.nombre}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                Cerrar de todos modos
              </button>
            </div>
          </div>
        )}

        {/* Caja de totales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">Resumen</h2>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal del ticket</span>
              <span className="font-bold text-gray-800">{fmt(TOTAL_TICKET)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Cobrado</span>
              <span className="font-bold text-green-600">{fmt(cobrado)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Pendiente</span>
              <span className={`font-bold ${TOTAL_TICKET - cobrado > 0 ? "text-red-500" : "text-gray-400"}`}>
                {fmt(Math.max(0, TOTAL_TICKET - cobrado))}
              </span>
            </div>
            <div className="border-t border-dashed border-gray-100 pt-3 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 12 12" className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6l2.5 2.5L10 3.5" />
                </svg>
              </div>
              <span className="text-xs text-green-700 font-semibold">
                Tu parte ya cubierta · {fmt(miParte)}
              </span>
            </div>
          </div>
        </div>

        {/* Aviso + botones */}
        <div className="flex flex-col gap-3 pb-8">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
            <span className="text-base">🔒</span>
            <p className="text-xs text-gray-500 leading-snug">
              <span className="font-semibold text-gray-700">Al cerrar el evento el QR dejará de funcionar</span>{" "}
              y no se podrán registrar más pagos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25"
          >
            Confirmar y cerrar evento 🔒
          </button>

          <button
            type="button"
            onClick={onVolver}
            className="w-full py-3 rounded-xl border-2 border-red-200 text-red-400 font-semibold text-sm hover:border-red-300 hover:text-red-500 transition-colors"
          >
            Cancelar — seguir cobrando
          </button>
        </div>

      </main>

      {/* Modal de confirmación */}
      {modalAbierto && (
        <ModalCerrar
          onConfirmar={() => setCelebrando(true)}
          onCancelar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
