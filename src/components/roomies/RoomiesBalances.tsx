import { useState } from "react"
import type { Casa, GastoRoomie } from "./RoomiesFlow"
import { HeaderRoomies, AvatarR, fmt, calcularBalancesR, calcularTransferenciasR } from "./RoomiesFlow"
import Confetti from "../Confetti"

interface Props {
  casa: Casa
  gastos: GastoRoomie[]
  yoId: number
  onVolver: () => void
}

// ─── Pantalla de celebración roomies ─────────────────────────────────────────

function PantallaCelebracion({ casa, onVolver }: { casa: Casa; onVolver: () => void }) {
  return (
    <div className="min-h-screen bg-[#8B1A3A] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <Confetti colores={["#ffffff", "#f9a8d4", "#fde68a", "#a78bfa", "#6ee7b7"]} cantidad={55} />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="w-28 h-28 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-6xl shadow-xl">
          🏠
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-white leading-tight">¡Cuentas saldadas!</h1>
          <p className="text-white/70 text-sm">{casa.nombre}</p>
        </div>

        <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-5 border border-white/20 w-full">
          <p className="text-white text-base font-bold leading-relaxed italic">
            "Cuentas claras, amistades largas."
          </p>
          <p className="text-white/60 text-xs mt-2">— CuentasClaras</p>
        </div>

        <div className="flex -space-x-2">
          {casa.roomies.map(r => (
            <div key={r.id} className="ring-2 ring-[#8B1A3A] rounded-full">
              <AvatarR nombre={r.nombre} colorIndex={r.colorIndex} size="md" />
            </div>
          ))}
        </div>

        <button type="button" onClick={onVolver}
          className="w-full py-3.5 rounded-xl bg-white text-[#8B1A3A] font-black text-sm hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg">
          Volver al inicio
        </button>
      </div>
    </div>
  )
}

export default function RoomiesBalances({ casa, gastos, yoId, onVolver }: Props) {
  const [celebrando, setCelebrando] = useState(false)

  if (celebrando) return <PantallaCelebracion casa={casa} onVolver={onVolver} />

  const balances = calcularBalancesR(casa.roomies, gastos)
  const transferencias = calcularTransferenciasR(balances)

  const maxAbs = Math.max(...Object.values(balances).map(Math.abs), 1)
  const totalGastado = gastos.reduce((s, g) => s + g.monto, 0)
  const promedio = casa.roomies.length > 0 ? totalGastado / casa.roomies.length : 0

  const cobrarWhatsApp = (deId: number, monto: number) => {
    const deudor = casa.roomies.find(r => r.id === deId)
    if (!deudor) return
    const texto = encodeURIComponent(
      `Hola ${deudor.nombre} 👋, te recuerdo que me debes ${fmt(monto)} de los gastos de "${casa.nombre}" este mes. ` +
      `Puedes transferirme cuando puedas. ¡Gracias! 🏠`
    )
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderRoomies
        titulo="Balances"
        subtitulo={casa.nombre}
        onVolver={onVolver}
        labelVolver="Gastos"
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6 pb-8">

        <div>
          <h1 className="text-2xl font-black text-gray-800">Balances del mes</h1>
          <p className="text-gray-400 text-sm mt-1">Resumen de quién pagó qué y cuánto se debe.</p>
        </div>

        {/* Resumen total */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border-2 border-gray-100 px-4 py-4 text-center">
            <p className="text-xs text-gray-400 font-medium mb-1">Total del mes</p>
            <p className="text-xl font-black text-gray-800">{fmt(totalGastado)}</p>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-100 px-4 py-4 text-center">
            <p className="text-xs text-gray-400 font-medium mb-1">Por roomie</p>
            <p className="text-xl font-black text-[#8B1A3A]">{fmt(promedio)}</p>
          </div>
        </div>

        {/* Barras de balance */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">Balance por roomie</h2>
            <p className="text-xs text-gray-400">Positivo = le deben · Negativo = debe</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-5">
            {casa.roomies.map(r => {
              const b = balances[r.id] ?? 0
              const saldado = Math.abs(b) < 1
              const positivo = b > 0
              const pct = Math.min(Math.abs(b) / maxAbs, 1) * 100

              return (
                <div key={r.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <AvatarR nombre={r.nombre} colorIndex={r.colorIndex} size="sm" ring={r.id === yoId} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-800">{r.esYo ? "Tú" : r.nombre}</span>
                        {r.id === yoId && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B1A3A]/10 text-[#8B1A3A]">Tú</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-black shrink-0 ${
                      saldado ? "text-green-600" : positivo ? "text-[#8B1A3A]" : "text-orange-600"
                    }`}>
                      {saldado ? "✓ Saldado" : positivo ? `+${fmt(b)}` : fmt(b)}
                    </span>
                  </div>

                  {/* Barra */}
                  <div className="flex items-center gap-2">
                    {/* Lado negativo (izquierda) */}
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex justify-end">
                      {b < -0.5 && (
                        <div
                          className="h-full rounded-full bg-orange-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                    {/* Centro */}
                    <div className="w-px h-3 bg-gray-300 shrink-0" />
                    {/* Lado positivo (derecha) */}
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex justify-start">
                      {b > 0.5 && (
                        <div
                          className="h-full rounded-full bg-[#8B1A3A] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pagos sugeridos */}
        {transferencias.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="px-1">
              <h2 className="text-sm font-bold text-gray-700">Pagos sugeridos</h2>
              <p className="text-xs text-gray-400">El mínimo de transferencias para saldar todo.</p>
            </div>
            <div className="flex flex-col gap-3">
              {transferencias.map((t, i) => {
                const de = casa.roomies.find(r => r.id === t.deId)
                const a  = casa.roomies.find(r => r.id === t.aId)
                if (!de || !a) return null
                const esMiDeuda = t.deId === yoId
                const meDeben = t.aId === yoId

                return (
                  <div
                    key={i}
                    className={`bg-white rounded-2xl border-2 px-4 py-4 flex items-center gap-3 ${
                      esMiDeuda
                        ? "border-orange-200 bg-orange-50/50"
                        : meDeben
                        ? "border-[#8B1A3A]/30 bg-[#8B1A3A]/5"
                        : "border-gray-100"
                    }`}
                  >
                    <AvatarR nombre={de.nombre} colorIndex={de.colorIndex} size="md" />
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <svg viewBox="0 0 20 20" className="w-4 h-4 text-gray-400" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-black text-gray-800">{fmt(t.monto)}</span>
                    </div>
                    <AvatarR nombre={a.nombre} colorIndex={a.colorIndex} size="md" />
                    <div className="flex-1 min-w-0 pl-1">
                      <p className="text-sm font-semibold text-gray-800">
                        <span className={esMiDeuda ? "text-orange-700 font-black" : ""}>{de.esYo ? "Tú" : de.nombre}</span>
                        {" → "}
                        <span className={meDeben ? "text-[#8B1A3A] font-black" : ""}>{a.esYo ? "Tú" : a.nombre}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {esMiDeuda ? "Debes pagar" : meDeben ? "Te deben pagar" : "Transferencia pendiente"}
                      </p>
                    </div>
                    {meDeben && (
                      <button
                        type="button"
                        onClick={() => cobrarWhatsApp(t.deId, t.monto)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/10 border-2 border-[#25D366]/30 text-[#128C5E] text-xs font-bold hover:bg-[#25D366]/20 transition-colors"
                      >
                        <span>💬</span>
                        Cobrar
                      </button>
                    )}
                    {esMiDeuda && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg bg-orange-100 text-orange-600 border border-orange-200">
                        Pendiente
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl px-5 py-6 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm font-bold text-green-700">¡Todo saldado!</p>
            <p className="text-xs text-green-600 mt-1">No hay transferencias pendientes este mes.</p>
          </div>
        )}

        {/* Detalle por roomie */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">Detalle de gastos</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {casa.roomies.map(r => {
              const pagado = gastos.filter(g => g.pagadorId === r.id).reduce((s, g) => s + g.monto, 0)
              const adeudado = gastos.reduce((s, g) => {
                const d = g.division.find(x => x.roomieId === r.id)
                return s + (d?.monto ?? 0)
              }, 0)
              return (
                <div key={r.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <AvatarR nombre={r.nombre} colorIndex={r.colorIndex} size="sm" />
                    <span className="text-sm font-semibold text-gray-800">{r.esYo ? "Tú" : r.nombre}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pl-9">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pagó</p>
                      <p className="text-sm font-bold text-gray-800">{fmt(pagado)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Le corresponde</p>
                      <p className="text-sm font-bold text-gray-800">{fmt(adeudado)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Botón liquidar todo */}
        <div className="flex flex-col gap-2 pb-4">
          <button type="button" onClick={() => setCelebrando(true)}
            className="w-full py-3.5 rounded-xl bg-[#8B1A3A] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#8B1A3A]/25">
            ✓ Marcar todo como saldado
          </button>
          <button type="button" onClick={onVolver}
            className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors">
            Volver a gastos
          </button>
        </div>

      </main>
    </div>
  )
}
