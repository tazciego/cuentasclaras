import type { EventoReunion, Gasto } from "./ReunionFlow"
import { HeaderReunion, Avatar, fmt, calcularBalances, calcularTransferencias } from "./ReunionFlow"

interface Props {
  evento: EventoReunion
  gastos: Gasto[]
  yoId: number
  onVolver: () => void
  onCerrar: () => void
}

export default function ReunionBalances({ evento, gastos, yoId, onVolver, onCerrar }: Props) {
  const parts = evento.participantes
  const balances = calcularBalances(parts, gastos)
  const transferencias = calcularTransferencias(balances)

  const totalGastado = gastos.reduce((s, g) => s + g.monto, 0)
  const promedio = parts.length > 0 ? totalGastado / parts.length : 0

  // Lo más pagado por cualquier persona (para escalar las barras)
  const maxPagado = Math.max(1, ...parts.map(p =>
    gastos.reduce((s, g) => s + g.pagadores.filter(pag => pag.participanteId === p.id).reduce((ss, pag) => ss + pag.monto, 0), 0)
  ))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderReunion
        titulo="Balances"
        subtitulo={evento.nombre}
        onVolver={onVolver}
        labelVolver="Gastos"
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6 pb-8">

        <div>
          <h1 className="text-2xl font-black text-gray-800">Balances del grupo</h1>
          <p className="text-gray-400 text-sm mt-1">
            Promedio por persona: <span className="font-semibold text-gray-600">{fmt(promedio)}</span>
          </p>
        </div>

        {/* Barras por persona */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">¿Quién puso qué?</h2>
          </div>
          <div className="px-5 py-4 flex flex-col gap-5">
            {parts.map(p => {
              const pagado = gastos.reduce((s, g) =>
                s + g.pagadores.filter(pag => pag.participanteId === p.id).reduce((ss, pag) => ss + pag.monto, 0), 0)
              const balance = balances[p.id] ?? 0
              const esYo = p.id === yoId
              const positivo = balance >= 0
              const pctPagado  = Math.min(100, (pagado  / maxPagado) * 100)
              const pctPromedio = Math.min(100, (promedio / maxPagado) * 100)

              return (
                <div key={p.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar nombre={p.nombre} colorIndex={p.colorIndex} size="sm" />
                      <span className="text-sm font-semibold text-gray-800">{esYo ? "Tú" : p.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700">{fmt(pagado)}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border
                        ${positivo
                          ? "bg-green-50 border-green-200 text-green-600"
                          : "bg-red-50 border-red-200 text-red-500"
                        } ${esYo ? "ring-1 ring-offset-1 ring-[#534AB7]" : ""}`}>
                        {positivo ? "+" : ""}{fmt(balance)}
                      </span>
                    </div>
                  </div>

                  {/* Barra visual */}
                  <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                    {/* Barra de lo pagado */}
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${esYo ? "bg-[#534AB7]" : "bg-[#534AB7]/40"}`}
                      style={{ width: `${pctPagado}%` }}
                    />
                    {/* Línea del promedio */}
                    <div
                      className="absolute inset-y-0 w-0.5 bg-orange-400 z-10"
                      style={{ left: `${pctPromedio}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>$0</span>
                    <span className="text-orange-500">⬆ Promedio {fmt(promedio)}</span>
                    <span>{fmt(maxPagado)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pagos optimizados */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">Pagos optimizados</h2>
            <span className="text-xs text-gray-400">{transferencias.length} transferencia{transferencias.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            {transferencias.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <span className="text-2xl">🎉</span>
                <p className="text-sm text-green-600 font-semibold">¡Todo está saldado!</p>
              </div>
            ) : (
              transferencias.map((t, i) => {
                const de = parts.find(p => p.id === t.deId)
                const a  = parts.find(p => p.id === t.aId)
                if (!de || !a) return null
                const esYo = t.deId === yoId
                return (
                  <div key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                      ${esYo ? "border-[#2EC4B6]/40 bg-[#2EC4B6]/5" : "border-gray-100"}`}>
                    <Avatar nombre={de.nombre} colorIndex={de.colorIndex} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">
                        <span className={esYo ? "text-[#2EC4B6]"  : ""}>{de.id === yoId ? "Tú" : de.nombre}</span>
                        <span className="text-gray-400 font-normal mx-1">le paga a</span>
                        {a.id === yoId ? "Ti" : a.nombre}
                      </p>
                    </div>
                    <span className={`text-base font-black shrink-0 ${esYo ? "text-[#2EC4B6]" : "text-gray-800"}`}>
                      {fmt(t.monto)}
                    </span>
                    <Avatar nombre={a.nombre} colorIndex={a.colorIndex} size="sm" />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Nota */}
        <div className="flex items-start gap-2 bg-[#534AB7]/5 border border-[#534AB7]/20 rounded-xl px-4 py-3">
          <span>💡</span>
          <p className="text-xs text-[#534AB7] leading-relaxed">
            Los pagos en <span className="font-semibold text-[#2EC4B6]">teal</span> son los que tú necesitas hacer o recibir. El mínimo de transferencias ya está calculado.
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 pb-8">
          <button type="button" onClick={onCerrar}
            className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25">
            Listo — cerrar el evento →
          </button>
          <button type="button" onClick={onVolver}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors">
            Volver a gastos
          </button>
        </div>

      </main>
    </div>
  )
}
