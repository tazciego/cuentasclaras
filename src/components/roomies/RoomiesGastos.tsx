import { useState } from "react"
import type { Casa, GastoRoomie } from "./RoomiesFlow"
import { CATEGORIA_META, HeaderRoomies, AvatarR, fmt, calcularBalancesR } from "./RoomiesFlow"

interface Props {
  casa: Casa
  gastos: GastoRoomie[]
  yoId: number
  onVolver: () => void
  onAgregar: () => void
  onEditar: (g: GastoRoomie) => void
  onEliminar: (id: number) => void
  onBalances: () => void
}

const MESES = ["2026-03", "2026-02", "2026-01"]
const LABELS_MES: Record<string, string> = {
  "2026-03": "Mar 2026",
  "2026-02": "Feb 2026",
  "2026-01": "Ene 2026",
}

function FilaGasto({
  gasto, casa, yoId, onEditar, onEliminar,
}: {
  gasto: GastoRoomie
  casa: Casa
  yoId: number
  onEditar: (g: GastoRoomie) => void
  onEliminar: (id: number) => void
}) {
  const [expandido, setExpandido] = useState(false)
  const pagador = casa.roomies.find(r => r.id === gasto.pagadorId)
  const esMio = gasto.pagadorId === yoId
  const cat = CATEGORIA_META[gasto.categoria]
  const miDivision = gasto.division.find(d => d.roomieId === yoId)

  return (
    <div className={`bg-white rounded-xl border-2 transition-all ${esMio ? "border-[#8B1A3A]/30" : "border-gray-100"}`}>
      <button
        type="button"
        onClick={() => setExpandido(e => !e)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
      >
        <span className="text-xl shrink-0">{cat.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-800 truncate">{gasto.descripcion}</p>
            {gasto.recurrente && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B1A3A]/10 text-[#8B1A3A]">↻ Recurrente</span>
            )}
            {esMio && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B1A3A]/10 text-[#8B1A3A]">Tú pagaste</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {cat.label} · {pagador?.nombre ?? "?"} pagó
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-gray-800">{fmt(gasto.monto)}</p>
          {miDivision && (
            <p className="text-xs text-gray-400">mi parte: {fmt(miDivision.monto)}</p>
          )}
        </div>
        <svg
          viewBox="0 0 20 20" className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expandido ? "rotate-180" : ""}`}
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {expandido && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">División</p>
          <div className="flex flex-col gap-1.5 mb-3">
            {gasto.division.map(d => {
              const r = casa.roomies.find(x => x.id === d.roomieId)
              if (!r) return null
              return (
                <div key={d.roomieId} className="flex items-center gap-2 text-xs text-gray-600">
                  <AvatarR nombre={r.nombre} colorIndex={r.colorIndex} size="xs" />
                  <span className={r.id === yoId ? "font-bold text-[#8B1A3A]" : ""}>{r.id === yoId ? "Tú" : r.nombre}</span>
                  <span className="ml-auto font-semibold text-gray-800">{fmt(d.monto)}</span>
                </div>
              )
            })}
          </div>
          {esMio && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEditar(gasto)}
                className="flex-1 py-2 rounded-lg border-2 border-[#8B1A3A]/30 text-[#8B1A3A] text-xs font-bold hover:bg-[#8B1A3A]/5 transition-colors"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onEliminar(gasto.id)}
                className="px-3 py-2 rounded-lg border-2 border-red-200 text-red-400 text-xs font-bold hover:bg-red-50 transition-colors"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RoomiesGastos({ casa, gastos, yoId, onVolver, onAgregar, onEditar, onEliminar, onBalances }: Props) {
  const [mes, setMes] = useState(MESES[0])

  const gastosMes = gastos.filter(g => g.mes === mes)
  const recurrentes = gastosMes.filter(g => g.recurrente)
  const noRecurrentes = gastosMes.filter(g => !g.recurrente)

  const balances = calcularBalancesR(casa.roomies, gastosMes)
  const miBalance = balances[yoId] ?? 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderRoomies
        titulo={casa.nombre}
        subtitulo={`${casa.roomies.length} roomies`}
        onVolver={onVolver}
        labelVolver="Inicio"
        extra={
          <button
            type="button"
            onClick={onBalances}
            className="text-xs font-bold text-[#8B1A3A] px-3 py-1.5 rounded-lg bg-[#8B1A3A]/10 hover:bg-[#8B1A3A]/20 transition-colors shrink-0"
          >
            Balances
          </button>
        }
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5 pb-28">

        {/* Filtro de mes */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MESES.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMes(m)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                mes === m
                  ? "bg-[#8B1A3A] text-white shadow-sm"
                  : "bg-white border-2 border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {LABELS_MES[m]}
            </button>
          ))}
        </div>

        {/* Balance personal */}
        <div className={`rounded-2xl p-4 flex items-center gap-4 shadow-sm ${
          Math.abs(miBalance) < 1
            ? "bg-green-50 border-2 border-green-200"
            : miBalance > 0
            ? "bg-[#8B1A3A] text-white"
            : "bg-orange-50 border-2 border-orange-200"
        }`}>
          <div className="flex-1 min-w-0">
            {Math.abs(miBalance) < 1 ? (
              <>
                <p className="text-sm font-bold text-green-700">✓ Estás al corriente</p>
                <p className="text-xs text-green-600 mt-0.5">Todas las cuentas saldadas este mes.</p>
              </>
            ) : miBalance > 0 ? (
              <>
                <p className="text-sm font-bold text-white/80">Te deben</p>
                <p className="text-2xl font-black text-white">{fmt(miBalance)}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-orange-700">Debes</p>
                <p className="text-2xl font-black text-orange-800">{fmt(-miBalance)}</p>
              </>
            )}
          </div>
          {Math.abs(miBalance) >= 1 && (
            <button
              type="button"
              onClick={onBalances}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-black transition-colors ${
                miBalance > 0
                  ? "bg-white text-[#8B1A3A] hover:bg-white/90"
                  : "bg-orange-500 text-white hover:opacity-90"
              }`}
            >
              {miBalance > 0 ? "Cobrar" : "Liquidar"}
            </button>
          )}
        </div>

        {/* Gastos recurrentes */}
        {recurrentes.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">Gastos recurrentes</h2>
              <span className="text-xs text-gray-400">
                {fmt(recurrentes.reduce((s, g) => s + g.monto, 0))} total
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {recurrentes.map(g => (
                <FilaGasto key={g.id} gasto={g} casa={casa} yoId={yoId} onEditar={onEditar} onEliminar={onEliminar} />
              ))}
            </div>
          </div>
        )}

        {/* Gastos del mes */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">Gastos del mes</h2>
            <span className="text-xs text-gray-400">
              {noRecurrentes.length > 0
                ? `${fmt(noRecurrentes.reduce((s, g) => s + g.monto, 0))} total`
                : "Sin gastos"}
            </span>
          </div>
          {noRecurrentes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {noRecurrentes.map(g => (
                <FilaGasto key={g.id} gasto={g} casa={casa} yoId={yoId} onEditar={onEditar} onEliminar={onEliminar} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
              <p className="text-gray-400 text-sm">No hay gastos este mes.</p>
              <button type="button" onClick={onAgregar} className="mt-2 text-[#8B1A3A] text-sm font-bold hover:underline">
                + Agregar el primero
              </button>
            </div>
          )}
        </div>

        {/* Resumen roomies */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">Resumen del mes</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {casa.roomies.map(r => {
              const b = balances[r.id] ?? 0
              const saldado = Math.abs(b) < 1
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <AvatarR nombre={r.nombre} colorIndex={r.colorIndex} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{r.esYo ? "Tú" : r.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {saldado ? "Saldado" : b > 0 ? `Le deben ${fmt(b)}` : `Debe ${fmt(-b)}`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    saldado
                      ? "bg-green-50 border-green-200 text-green-600"
                      : b > 0
                      ? "bg-[#8B1A3A]/10 border-[#8B1A3A]/30 text-[#8B1A3A]"
                      : "bg-orange-50 border-orange-200 text-orange-600"
                  }`}>
                    {saldado ? "✓" : b > 0 ? `+${fmt(b)}` : fmt(b)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* FAB agregar */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-30">
        <button
          type="button"
          onClick={onAgregar}
          className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#8B1A3A] text-white font-bold text-sm shadow-xl shadow-[#8B1A3A]/30 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Agregar gasto
        </button>
      </div>
    </div>
  )
}
