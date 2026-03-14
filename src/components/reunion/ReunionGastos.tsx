import { useState } from "react"
import type { EventoReunion, Gasto } from "./ReunionFlow"
import { HeaderReunion, Avatar, fmt, calcularBalances } from "./ReunionFlow"

interface Props {
  evento: EventoReunion
  gastos: Gasto[]
  yoId: number
  onVolver: () => void
  onAgregar: () => void
  onEditar: (g: Gasto) => void
  onEliminar: (id: number) => void
  onBalances: () => void
  onCerrar: () => void
}

// ─── Chip de balance en "Por persona" ────────────────────────────────────────

function BadgeBalance({ monto }: { monto: number }) {
  const positivo = monto >= 0
  if (Math.abs(monto) < 1) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-400">Saldado</span>
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
      ${positivo ? "bg-green-50 border-green-200 text-green-600" : "bg-red-50 border-red-200 text-red-500"}`}>
      {positivo ? "+" : ""}{fmt(monto)}
    </span>
  )
}

// ─── Foto placeholder ────────────────────────────────────────────────────────

function BotonVerFoto({ onVer }: { onVer: () => void }) {
  return (
    <button type="button" onClick={onVer}
      className="flex items-center gap-1 text-[10px] font-semibold text-[#534AB7] bg-[#534AB7]/8 px-2 py-1 rounded-lg hover:bg-[#534AB7]/15 transition-colors">
      📷 Ver foto
    </button>
  )
}

function ModalFoto({ descripcion, onCerrar }: { descripcion: string; onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-2">
          <span className="text-5xl">🧾</span>
          <p className="text-sm text-gray-500 font-medium">{descripcion}</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">Evidencia del gasto</span>
          <button type="button" onClick={onCerrar}
            className="text-sm font-bold text-[#534AB7] hover:underline">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Fila de gasto ────────────────────────────────────────────────────────────

function FilaGasto({
  gasto, evento, yoId, esMio, onEditar, onEliminar,
}: {
  gasto: Gasto; evento: EventoReunion; yoId: number; esMio: boolean
  onEditar: () => void; onEliminar: () => void
}) {
  const [fotoAbierta, setFotoAbierta] = useState(false)
  const pagador = evento.participantes.find(p => gasto.pagadores[0]?.participanteId === p.id)
  const totalPagadores = gasto.pagadores.length

  return (
    <>
      <div className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all
        ${esMio ? "border-[#2EC4B6]/40 bg-[#2EC4B6]/3" : "border-gray-100 bg-white"}`}>
        {pagador && <Avatar nombre={pagador.nombre} colorIndex={pagador.colorIndex} size="sm" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 leading-snug">{gasto.descripcion}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pagador ? (
                  <>
                    Pagó <span className="font-medium text-gray-600">
                      {pagador.id === yoId ? "Tú" : pagador.nombre}
                      {totalPagadores > 1 ? ` y ${totalPagadores - 1} más` : ""}
                    </span>
                  </>
                ) : "Varios pagaron"} · {gasto.fecha}
              </p>
            </div>
            <span className="text-base font-black text-gray-800 shrink-0">{fmt(gasto.monto)}</span>
          </div>
          {/* Acciones */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {gasto.tienesFoto && <BotonVerFoto onVer={() => setFotoAbierta(true)} />}
            {esMio && (
              <>
                <button type="button" onClick={onEditar}
                  className="text-[10px] font-semibold text-gray-400 hover:text-[#534AB7] transition-colors">
                  ✏️ Editar
                </button>
                <button type="button" onClick={onEliminar}
                  className="text-[10px] font-semibold text-gray-400 hover:text-red-400 transition-colors">
                  × Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {fotoAbierta && <ModalFoto descripcion={gasto.descripcion} onCerrar={() => setFotoAbierta(false)} />}
    </>
  )
}

// ─── Tab por persona ──────────────────────────────────────────────────────────

function TabPorPersona({
  evento, gastos, yoId, onEditar,
}: {
  evento: EventoReunion; gastos: Gasto[]; yoId: number
  onEditar: (g: Gasto) => void
}) {
  const [abiertos, setAbiertos] = useState<Record<number, boolean>>({})
  const balances = calcularBalances(evento.participantes, gastos)

  const toggle = (id: number) => setAbiertos(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="flex flex-col gap-3">
      {evento.participantes.map(p => {
        const balance = balances[p.id] ?? 0
        const misGastos = gastos.filter(g => g.pagadores.some(pag => pag.participanteId === p.id))
        const esYo = p.id === yoId
        const abierto = abiertos[p.id] ?? false

        return (
          <div key={p.id} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all
            ${esYo ? "border-[#534AB7]/30" : "border-gray-100"}`}>
            <button type="button" onClick={() => toggle(p.id)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none">
              <Avatar nombre={p.nombre} colorIndex={p.colorIndex} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-800">{esYo ? "Tú" : p.nombre}</span>
                  <BadgeBalance monto={balance} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{misGastos.length} pago{misGastos.length !== 1 ? "s" : ""} registrado{misGastos.length !== 1 ? "s" : ""}</p>
              </div>
              <svg viewBox="0 0 20 20" className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {abierto && (
              <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
                {misGastos.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">No ha pagado nada aún.</p>
                ) : (
                  misGastos.map(g => {
                    const [fotoAbierta, setFotoAbierta] = useState(false)
                    const esMio = g.pagadores.some(pag => pag.participanteId === yoId)
                    return (
                      <div key={g.id}>
                        <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 font-medium leading-snug">{g.descripcion}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-gray-400">{g.fecha}</span>
                              {g.tienesFoto && <BotonVerFoto onVer={() => setFotoAbierta(true)} />}
                              {esMio && (
                                <button type="button" onClick={() => onEditar(g)}
                                  className="text-[10px] font-semibold text-gray-400 hover:text-[#534AB7] transition-colors">
                                  ✏️ Editar
                                </button>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-800 shrink-0">{fmt(g.monto)}</span>
                        </div>
                        {fotoAbierta && <ModalFoto descripcion={g.descripcion} onCerrar={() => setFotoAbierta(false)} />}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ReunionGastos({ evento, gastos, yoId, onVolver, onAgregar, onEditar, onEliminar, onBalances, onCerrar }: Props) {
  const [tab, setTab] = useState<"todos" | "persona">("todos")
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
  const gastosMios = gastos.filter(g => g.pagadores.some(p => p.participanteId === yoId))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderReunion
        titulo={evento.nombre}
        subtitulo={`${evento.participantes.length} personas · ${evento.tipo === "reunion" ? "Reunión" : "Viaje"}`}
        onVolver={onVolver}
        labelVolver="Inicio"
        extra={
          <button type="button" onClick={onCerrar}
            className="shrink-0 text-xs font-bold text-gray-400 hover:text-[#534AB7] transition-colors">
            Cerrar →
          </button>
        }
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5 pb-32">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total gastado", valor: fmt(totalGastos), color: "text-gray-800" },
            { label: "Mis pagos",     valor: fmt(gastosMios.reduce((s, g) => s + g.monto, 0)), color: "text-[#534AB7]" },
            { label: "Gastos",        valor: `${gastos.length}`, color: "text-gray-800" },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3">
              <p className={`text-base font-black ${m.color}`}>{m.valor}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([["todos", "📋 Todos"], ["persona", "👤 Por persona"]] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                ${tab === k ? "bg-white text-[#534AB7] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {tab === "todos" ? (
          <div className="flex flex-col gap-2.5">
            {gastos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 flex flex-col items-center gap-2 text-gray-400">
                <span className="text-4xl">💸</span>
                <p className="text-sm">No hay gastos aún.</p>
                <p className="text-xs">Toca "+ Agregar" para registrar el primero.</p>
              </div>
            ) : (
              gastos.map(g => (
                <FilaGasto key={g.id} gasto={g} evento={evento} yoId={yoId}
                  esMio={g.pagadores.some(p => p.participanteId === yoId)}
                  onEditar={() => onEditar(g)}
                  onEliminar={() => onEliminar(g.id)} />
              ))
            )}
          </div>
        ) : (
          <TabPorPersona evento={evento} gastos={gastos} yoId={yoId} onEditar={onEditar} />
        )}
      </main>

      {/* Barra flotante inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 shadow-lg z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={onBalances}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#534AB7]/30 text-[#534AB7] text-sm font-bold hover:bg-[#534AB7]/5 transition-colors">
            <span>📊</span> Balances
          </button>
          <button type="button" onClick={onAgregar}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#534AB7] text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25">
            <span>+</span> Agregar gasto
          </button>
        </div>
      </div>
    </div>
  )
}
