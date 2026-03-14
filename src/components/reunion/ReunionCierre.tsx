import { useState } from "react"
import type { EventoReunion, Gasto } from "./ReunionFlow"
import { HeaderReunion, Avatar, fmt, calcularBalances, calcularTransferencias } from "./ReunionFlow"
import Confetti from "../Confetti"

interface Props {
  evento: EventoReunion
  gastos: Gasto[]
  yoId: number
  onVolver: () => void
  onFinalizar: () => void
}

// ─── Pantalla de celebración ──────────────────────────────────────────────────

function PantallaCelebracion({ evento, onFinalizar }: { evento: EventoReunion; onFinalizar: () => void }) {
  const emoji = evento.tipo === "viaje" ? "✈️" : "🎉"
  const mensaje = evento.tipo === "viaje"
    ? "A tomar fuerza para la siguiente aventura. ¡Este grupo sí sabe viajar!"
    : "¡La pasamos increíble! Ya tienen todo listo para la siguiente reunión."

  return (
    <div className="min-h-screen bg-[#534AB7] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <Confetti colores={["#ffffff", "#2EC4B6", "#FFD166", "#F4A261", "#a78bfa"]} cantidad={60} />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="w-28 h-28 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-6xl shadow-xl">
          {emoji}
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-white leading-tight">¡Evento cerrado!</h1>
          <p className="text-white/70 text-sm">{evento.nombre}</p>
        </div>

        <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-5 border border-white/20 w-full">
          <p className="text-white text-base font-bold leading-relaxed italic">
            "{mensaje}"
          </p>
        </div>

        {/* Avatares del grupo */}
        <div className="flex -space-x-2">
          {evento.participantes.map(p => (
            <div key={p.id} className="ring-2 ring-[#534AB7] rounded-full">
              <Avatar nombre={p.nombre} colorIndex={p.colorIndex} size="md" />
            </div>
          ))}
        </div>

        <button type="button" onClick={onFinalizar}
          className="w-full py-3.5 rounded-xl bg-white text-[#534AB7] font-black text-sm hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg">
          Volver al inicio
        </button>
      </div>
    </div>
  )
}

// ─── Tarjeta de resumen (estilo app) ─────────────────────────────────────────

function TarjetaResumen({ evento, gastos }: { evento: EventoReunion; gastos: Gasto[] }) {
  const total = gastos.reduce((s, g) => s + g.monto, 0)
  const promedio = evento.participantes.length > 0 ? total / evento.participantes.length : 0
  const balances = calcularBalances(evento.participantes, gastos)
  const transferencias = calcularTransferencias(balances)

  return (
    <div className="bg-white rounded-2xl border-2 border-[#534AB7]/20 overflow-hidden shadow-sm">
      {/* Header de la tarjeta */}
      <div className="bg-[#534AB7] px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
            <span className="text-white font-black text-[10px]">CC</span>
          </div>
          <span className="text-white/80 text-xs font-semibold">CuentasClaras</span>
        </div>
        <h3 className="text-white font-black text-lg leading-tight">{evento.nombre}</h3>
        <p className="text-white/70 text-xs mt-0.5">
          {evento.tipo === "viaje" ? "✈️ Viaje en grupo" : "🏠 Reunión"} · {evento.participantes.length} personas
        </p>
      </div>

      {/* Totales */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium">Total del grupo</p>
            <p className="text-xl font-black text-gray-800">{fmt(total)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Por persona</p>
            <p className="text-xl font-black text-[#534AB7]">{fmt(promedio)}</p>
          </div>
        </div>
      </div>

      {/* Gastos */}
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Gastos registrados</p>
        {gastos.map(g => {
          const pagador = evento.participantes.find(p => g.pagadores[0]?.participanteId === p.id)
          return (
            <div key={g.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                {pagador && <Avatar nombre={pagador.nombre} colorIndex={pagador.colorIndex} size="xs" />}
                <span className="text-xs text-gray-700 truncate">{g.descripcion}</span>
              </div>
              <span className="text-xs font-bold text-gray-800 shrink-0 ml-2">{fmt(g.monto)}</span>
            </div>
          )
        })}
      </div>

      {/* Transferencias */}
      {transferencias.length > 0 && (
        <div className="px-5 py-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Pagos pendientes</p>
          {transferencias.map((t, i) => {
            const de = evento.participantes.find(p => p.id === t.deId)
            const a  = evento.participantes.find(p => p.id === t.aId)
            if (!de || !a) return null
            return (
              <div key={i} className="flex items-center gap-2 py-1 text-xs text-gray-600">
                <Avatar nombre={de.nombre} colorIndex={de.colorIndex} size="xs" />
                <span className="font-medium">{de.nombre}</span>
                <span className="text-gray-400">→</span>
                <Avatar nombre={a.nombre} colorIndex={a.colorIndex} size="xs" />
                <span className="font-medium">{a.nombre}</span>
                <span className="ml-auto font-bold text-gray-800">{fmt(t.monto)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer de la tarjeta */}
      <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">Generado con CuentasClaras</span>
        <span className="text-[10px] text-gray-400">{new Date().toLocaleDateString("es-MX")}</span>
      </div>
    </div>
  )
}

// ─── Estado de pagos ──────────────────────────────────────────────────────────

function EstadoPagos({ evento, gastos }: { evento: EventoReunion; gastos: Gasto[] }) {
  const balances = calcularBalances(evento.participantes, gastos)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-700">Estado de pagos</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {evento.participantes.map(p => {
          const b = balances[p.id] ?? 0
          const saldado = Math.abs(b) < 1
          const positivo = b > 0
          return (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar nombre={p.nombre} colorIndex={p.colorIndex} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{p.esYo ? "Tú" : p.nombre}</p>
                <p className="text-xs text-gray-400">
                  {saldado ? "Saldado" : positivo ? `Le deben ${fmt(b)}` : `Debe ${fmt(-b)}`}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                ${saldado
                  ? "bg-green-50 border-green-200 text-green-600"
                  : positivo
                  ? "bg-[#534AB7]/10 border-[#534AB7]/30 text-[#534AB7]"
                  : "bg-red-50 border-red-200 text-red-500"
                }`}>
                {saldado ? "✓ Saldado" : positivo ? `+${fmt(b)}` : fmt(b)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ReunionCierre({ evento, gastos, yoId: _, onVolver, onFinalizar }: Props) {
  const [cerrado, setCerrado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const whatsapp = () => {
    const total = gastos.reduce((s, g) => s + g.monto, 0)
    const promedio = total / evento.participantes.length
    const balances = calcularBalances(evento.participantes, gastos)
    const transferencias = calcularTransferencias(balances)

    const lineasGastos = gastos.map(g => `  • ${g.descripcion}: ${fmt(g.monto)}`).join("\n")
    const lineasPagos = transferencias.map(t => {
      const de = evento.participantes.find(p => p.id === t.deId)?.nombre ?? "?"
      const a  = evento.participantes.find(p => p.id === t.aId)?.nombre ?? "?"
      return `  • ${de} → ${a}: ${fmt(t.monto)}`
    }).join("\n")

    const texto = encodeURIComponent(
      `📋 *Resumen: ${evento.nombre}*\n\n` +
      `💸 Total del grupo: ${fmt(total)}\n` +
      `👤 Por persona: ${fmt(promedio)}\n\n` +
      `*Gastos:*\n${lineasGastos}\n\n` +
      (transferencias.length > 0 ? `*Pagos pendientes:*\n${lineasPagos}\n\n` : "") +
      `_Generado con CuentasClaras_ 🧾`
    )
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  if (cerrado) return <PantallaCelebracion evento={evento} onFinalizar={onFinalizar} />

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderReunion titulo="Cerrar evento" subtitulo={evento.nombre} onVolver={onVolver} labelVolver="Balances" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6 pb-8">

        <div>
          <h1 className="text-2xl font-black text-gray-800">Cerrar el grupo</h1>
          <p className="text-gray-400 text-sm mt-1">Revisa el resumen antes de cerrar definitivamente.</p>
        </div>

        <EstadoPagos evento={evento} gastos={gastos} />

        {/* Vista previa del resumen */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Vista previa del resumen</p>
            <span className="text-xs text-gray-400">Estilo app</span>
          </div>
          <TarjetaResumen evento={evento} gastos={gastos} />
        </div>

        {/* Aviso */}
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <span className="text-lg mt-0.5">🔒</span>
          <p className="text-xs text-orange-700 leading-relaxed">
            <span className="font-semibold">Al cerrar, el grupo queda archivado.</span>{" "}
            No se podrán registrar más gastos ni modificar el historial.
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 pb-8">
          <button type="button" onClick={whatsapp}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border-2 border-[#25D366]/30 text-[#128C5E] text-sm font-bold hover:bg-[#25D366]/20 transition-colors">
            <span>💬</span>
            Enviar resumen al grupo por WhatsApp
          </button>

          {!confirmando ? (
            <button type="button" onClick={() => setConfirmando(true)}
              className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25">
              Confirmar y cerrar evento 🔒
            </button>
          ) : (
            <div className="bg-[#534AB7]/5 border-2 border-[#534AB7]/20 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm font-bold text-center text-gray-700">¿Estás seguro?</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmando(false)}
                  className="py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-semibold hover:border-gray-300 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={() => setCerrado(true)}
                  className="py-2.5 rounded-xl bg-[#534AB7] text-white text-sm font-bold hover:opacity-90 transition-opacity">
                  Sí, cerrar
                </button>
              </div>
            </div>
          )}

          <button type="button" onClick={onVolver}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors">
            Volver a balances
          </button>
        </div>
      </main>
    </div>
  )
}
