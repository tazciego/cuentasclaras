import { useState } from "react"
import type { InfoEvento, PerfilInvitado } from "./InvitadoFlow"
import { HeaderInvitado } from "./InvitadoFlow"
import { COLORES_AVATAR } from "./PasoRegistro"
import Confetti from "../Confetti"

interface Props {
  evento: InfoEvento
  perfil: PerfilInvitado
  subtotal: number
  propinaPct: number
  onVolver: () => void
  onFinalizar: () => void
}

type Metodo = "spei" | "tarjeta" | "efectivo"

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

// ─── Formateo de tarjeta ──────────────────────────────────────────────────────

function fmtCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
}

function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

// ─── SPEI ─────────────────────────────────────────────────────────────────────

function PagoSPEI({ total, onConfirmar }: { total: number; onConfirmar: () => void }) {
  const [copiado, setCopiado] = useState(false)
  const clabe = "····  ····  ····  3847"
  const clabeReal = "012345678901233847"

  const copiar = () => {
    navigator.clipboard.writeText(clabeReal).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏦</span>
          <div>
            <p className="text-sm font-bold text-gray-800">Transferencia SPEI</p>
            <p className="text-xs text-gray-400">Banco: CuentasClaras SAPI</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">CLABE</p>
            <p className="text-lg font-black text-gray-800 tracking-widest">{clabe}</p>
          </div>
          <button type="button" onClick={copiar}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all
              ${copiado
                ? "border-green-400 bg-green-50 text-green-600"
                : "border-[#2EC4B6]/30 bg-[#2EC4B6]/5 text-[#2EC4B6] hover:bg-[#2EC4B6]/10"
              }
            `}>
            {copiado ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
        <div className="flex items-center justify-between bg-[#2EC4B6]/5 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-600 font-medium">Monto exacto</span>
          <span className="text-lg font-black text-[#2EC4B6]">{fmt(total)}</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <span>ℹ️</span>
          <p>Realiza la transferencia y toca "Ya pagué" para notificar al anfitrión.</p>
        </div>
      </div>
      <button type="button" onClick={onConfirmar}
        className="w-full py-3.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#2EC4B6]/30">
        Ya pagué ✓
      </button>
    </div>
  )
}

// ─── Tarjeta ──────────────────────────────────────────────────────────────────

function PagoTarjeta({ total, onConfirmar }: { total: number; onConfirmar: () => void }) {
  const [numero, setNumero] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [nombre, setNombre] = useState("")
  const [procesando, setProcesando] = useState(false)

  const valid = numero.replace(/\s/g, "").length === 16 && expiry.length === 5 && cvv.length >= 3 && nombre.trim()

  const pagar = () => {
    if (!valid) return
    setProcesando(true)
    setTimeout(() => { setProcesando(false); onConfirmar() }, 1800)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">💳</span>
          <p className="text-sm font-bold text-gray-800">Pago con tarjeta</p>
        </div>

        {/* Número de tarjeta */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Número de tarjeta</label>
          <input type="text" inputMode="numeric" value={numero}
            onChange={(e) => setNumero(fmtCard(e.target.value))}
            placeholder="0000 0000 0000 0000"
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-gray-800 placeholder:text-gray-300 placeholder:tracking-normal focus:outline-none focus:border-[#2EC4B6] transition-colors" />
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre en la tarjeta</label>
          <input type="text" value={nombre}
            onChange={(e) => setNombre(e.target.value.toUpperCase())}
            placeholder="TAL CUAL APARECE"
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm tracking-wide text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#2EC4B6] transition-colors" />
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</label>
            <input type="text" inputMode="numeric" value={expiry}
              onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
              placeholder="MM/AA"
              maxLength={5}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#2EC4B6] transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CVV</label>
            <input type="password" inputMode="numeric" value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="•••"
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#2EC4B6] transition-colors" />
          </div>
        </div>
      </div>

      <button type="button" onClick={pagar}
        disabled={!valid || procesando}
        className="w-full py-3.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#2EC4B6]/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {procesando ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Procesando…
          </>
        ) : (
          `Pagar ${fmt(total)}`
        )}
      </button>
    </div>
  )
}

// ─── Efectivo ─────────────────────────────────────────────────────────────────

function PagoEfectivo({ total, onConfirmar }: { total: number; onConfirmar: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 items-center text-center">
        <span className="text-5xl">💵</span>
        <div>
          <p className="text-base font-bold text-gray-800">Pago en efectivo</p>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Entrégale <span className="font-black text-gray-800">{fmt(total)}</span> directamente al anfitrión.
            Él confirmará tu pago en su app.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 w-full text-left">
          <span>⚠️</span>
          <p className="text-xs text-orange-700">Tu lugar quedará como Pendiente hasta que el anfitrión confirme.</p>
        </div>
      </div>
      <button type="button" onClick={onConfirmar}
        className="w-full py-3.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#2EC4B6]/30">
        Listo, ya le di mi parte ✓
      </button>
    </div>
  )
}

// ─── Pantalla de confirmación ─────────────────────────────────────────────────

function PantallaConfirmacion({
  perfil,
  evento,
  total,
  onFinalizar,
}: {
  perfil: PerfilInvitado
  evento: InfoEvento
  total: number
  onFinalizar: () => void
}) {
  const color = COLORES_AVATAR[perfil.colorIndex]
  return (
    <div className="min-h-screen bg-[#2EC4B6] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <Confetti colores={["#ffffff", "#534AB7", "#FFD166", "#F4A261", "#06D6A0"]} cantidad={55} />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm">
        {/* Avatar + check */}
        <div className="relative">
          <div className={`w-28 h-28 rounded-full ${color.bg} ring-4 ring-white/40 flex items-center justify-center text-white font-black text-5xl shadow-xl`}>
            {perfil.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#2EC4B6]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        {/* Mensaje */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-white leading-tight">
            ¡Listo, {perfil.nombre}! 🎉
          </h1>
          <p className="text-white/80 text-sm font-medium">
            Pagaste <span className="font-black text-white">{fmt(total)}</span> en {evento.nombre}
          </p>
        </div>

        {/* Mensaje de despedida */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-5 border border-white/20">
          <p className="text-white text-sm leading-relaxed italic">
            "Gracias por venir. Ve con cuidado a casa, nos vemos en la siguiente."
          </p>
          <p className="text-white/60 text-xs mt-2">— {evento.anfitrion}</p>
        </div>

        <button type="button" onClick={onFinalizar}
          className="mt-2 w-full py-3.5 rounded-xl bg-white text-[#2EC4B6] font-black text-sm hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg">
          Volver al inicio
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PasoPago({ evento, perfil, subtotal, propinaPct, onVolver, onFinalizar }: Props) {
  const [metodo, setMetodo] = useState<Metodo>("spei")
  const [pagado, setPagado] = useState(false)

  const propina = subtotal * (propinaPct / 100)
  const total = subtotal + propina
  const color = COLORES_AVATAR[perfil.colorIndex]

  if (pagado) {
    return (
      <PantallaConfirmacion
        perfil={perfil}
        evento={evento}
        total={total}
        onFinalizar={onFinalizar}
      />
    )
  }

  const METODOS = [
    { key: "spei" as Metodo,    emoji: "🏦", label: "SPEI" },
    { key: "tarjeta" as Metodo, emoji: "💳", label: "Tarjeta" },
    { key: "efectivo" as Metodo,emoji: "💵", label: "Efectivo" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderInvitado onVolver={onVolver} labelVolver="Resumen" paso={5} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 flex flex-col gap-6 pb-8">

        {/* Total grande */}
        <div className="bg-[#2EC4B6] rounded-2xl px-6 py-6 flex flex-col items-center gap-1 shadow-lg shadow-[#2EC4B6]/30">
          <div className={`w-12 h-12 rounded-full ${color.bg} ring-3 ring-white/40 flex items-center justify-center text-white font-black text-xl mb-1`}>
            {perfil.nombre.charAt(0).toUpperCase()}
          </div>
          <p className="text-white/80 text-sm font-medium">Total a pagar</p>
          <p className="text-4xl font-black text-white">{fmt(total)}</p>
          {propinaPct > 0 && (
            <p className="text-white/60 text-xs mt-1">
              Incluye propina {propinaPct}% ({fmt(propina)})
            </p>
          )}
        </div>

        {/* Selector de método */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700">Método de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {METODOS.map((m) => (
              <button key={m.key} type="button"
                onClick={() => setMetodo(m.key)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${metodo === m.key
                    ? "border-[#2EC4B6] bg-[#2EC4B6]/5 text-[#2EC4B6]"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }
                `}>
                <span className="text-xl">{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido del método */}
        {metodo === "spei"     && <PagoSPEI     total={total} onConfirmar={() => setPagado(true)} />}
        {metodo === "tarjeta"  && <PagoTarjeta  total={total} onConfirmar={() => setPagado(true)} />}
        {metodo === "efectivo" && <PagoEfectivo total={total} onConfirmar={() => setPagado(true)} />}

      </main>
    </div>
  )
}
