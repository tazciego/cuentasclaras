import { useState } from "react"
import type { SesionReunion, MiembroReunion, ConsumoReunion } from "./ReunionFlow"
import { HeaderReunion, Avatar, fmt, calcularBalancesReunion } from "./ReunionFlow"
import { asignarseConsumo, actualizarConsumo } from "../../api"

interface Props {
  sesion: SesionReunion
  miembros: MiembroReunion[]
  consumos: ConsumoReunion[]
  yoId: number
  onVolver: () => void
  onAgregar: () => void
  onEditar: (c: ConsumoReunion) => void
  onEliminar: (id: number) => void
  onBalances: () => void
  onCerrar: () => void
}

// ─── Chip de estado para lista de compras ────────────────────────────────────

function ChipEstado({ asignadoAId, miembros }: { asignadoAId: number | null; miembros: MiembroReunion[] }) {
  if (asignadoAId === null) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-400">
        Sin asignar
      </span>
    )
  }
  const quien = miembros.find(m => m.id === asignadoAId)
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600">
      Lo compra {quien ? (quien.esYo ? "Tú" : quien.nombre) : "alguien"}
    </span>
  )
}

// ─── Item de lista de compras ─────────────────────────────────────────────────

function ItemLista({
  consumo, miembros, yoId,
  onYoLoCompro, onYaLoCompre, onEditar, onEliminar,
}: {
  consumo: ConsumoReunion
  miembros: MiembroReunion[]
  yoId: number
  onYoLoCompro: () => void
  onYaLoCompre: (precio: number) => void
  onEditar: () => void
  onEliminar: () => void
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [precioStr, setPrecioStr]     = useState(consumo.precio > 0 ? String(consumo.precio) : "")
  const [errorPrecio, setErrorPrecio] = useState("")

  const esMioAsignado  = consumo.asignadoAId === yoId
  const otroAsignado   = consumo.asignadoAId !== null && consumo.asignadoAId !== yoId
  const sinAsignar     = consumo.asignadoAId === null

  const confirmarCompra = () => {
    const n = parseFloat(precioStr.replace(",", "."))
    if (!n || n <= 0) { setErrorPrecio("Ingresa el precio real."); return }
    onYaLoCompre(n)
    setConfirmando(false)
  }

  return (
    <div className={`bg-white rounded-2xl border-2 p-4 transition-all
      ${esMioAsignado ? "border-amber-200" : "border-gray-100"}`}>
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-sm">🛒</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-gray-800 leading-snug">{consumo.descripcion}</p>
            {consumo.precio > 0 && (
              <span className="text-xs font-semibold text-gray-400 shrink-0">~{fmt(consumo.precio)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <ChipEstado asignadoAId={consumo.asignadoAId} miembros={miembros} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      {!confirmando && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {sinAsignar && (
            <button type="button" onClick={onYoLoCompro}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#534AB7]/8 text-[#534AB7] hover:bg-[#534AB7]/15 transition-colors">
              🙋 Yo lo compro
            </button>
          )}
          {esMioAsignado && (
            <button type="button" onClick={() => setConfirmando(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors">
              ✓ Ya lo compré
            </button>
          )}
          {!otroAsignado && (
            <>
              <button type="button" onClick={onEditar}
                className="text-[10px] font-semibold text-gray-400 hover:text-[#534AB7] transition-colors ml-auto">
                ✏️ Editar
              </button>
              <button type="button" onClick={onEliminar}
                className="text-[10px] font-semibold text-gray-400 hover:text-red-400 transition-colors">
                × Eliminar
              </button>
            </>
          )}
        </div>
      )}

      {/* Formulario precio real */}
      {confirmando && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" min="0" step="1" autoFocus
                value={precioStr}
                onChange={e => { setPrecioStr(e.target.value); setErrorPrecio("") }}
                onKeyDown={e => e.key === "Enter" && confirmarCompra()}
                placeholder="Precio real"
                className={`w-full border-2 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none transition-colors
                  ${errorPrecio ? "border-red-400" : "border-gray-200 focus:border-[#534AB7]"}`} />
            </div>
            <button type="button" onClick={confirmarCompra}
              className="shrink-0 py-2.5 px-4 rounded-xl bg-green-500 text-white text-sm font-bold hover:opacity-90 transition-opacity">
              Confirmar
            </button>
            <button type="button" onClick={() => setConfirmando(false)}
              className="shrink-0 py-2.5 px-3 rounded-xl border-2 border-gray-200 text-gray-400 text-sm font-semibold hover:border-gray-300 transition-colors">
              ✕
            </button>
          </div>
          {errorPrecio && <p className="text-xs text-red-400">⚠ {errorPrecio}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Item de gasto registrado ─────────────────────────────────────────────────

function ItemGasto({
  consumo, miembros, yoId, onEditar, onEliminar,
}: {
  consumo: ConsumoReunion
  miembros: MiembroReunion[]
  yoId: number
  onEditar: () => void
  onEliminar: () => void
}) {
  const pagador = miembros.find(m => m.id === consumo.pagadoPorId)
  const esMio   = consumo.pagadoPorId === yoId

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all
      ${esMio ? "border-[#534AB7]/30 bg-[#534AB7]/3" : "border-gray-100 bg-white"}`}>
      {pagador && <Avatar nombre={pagador.nombre} colorIndex={pagador.colorIndex} size="sm" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 leading-snug">{consumo.descripcion}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Pagó <span className="font-medium text-gray-600">
                {pagador ? (esMio ? "Tú" : pagador.nombre) : "alguien"}
              </span>
            </p>
          </div>
          <span className="text-base font-black text-gray-800 shrink-0">{fmt(consumo.precio)}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
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
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ReunionGastos({
  sesion, miembros, consumos, yoId,
  onVolver, onAgregar, onEditar, onEliminar, onBalances, onCerrar,
}: Props) {
  const [tab, setTab] = useState<"lista" | "gastos">("lista")

  const compras   = consumos.filter(c => c.pagadoPorId === null)
  const gastos    = consumos.filter(c => c.pagadoPorId !== null)
  const totalGastos = gastos.reduce((s, c) => s + c.precio, 0)
  const balances  = calcularBalancesReunion(miembros, consumos)
  const miBalance = balances[yoId] ?? 0

  const handleYoLoCompro = (c: ConsumoReunion) => {
    asignarseConsumo({
      consumo_id: c.id,
      invitado_id: yoId,
      cantidad: 1,
      estado: "pendiente",
      solicitado_por: yoId,
    }).catch(() => {})
  }

  const handleYaLoCompre = (c: ConsumoReunion, precio: number) => {
    actualizarConsumo({
      id: c.id,
      precio,
      pagado_por_invitado_id: yoId,
    }).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderReunion
        titulo={sesion.eventoNombre}
        subtitulo={`${miembros.length} personas · ${sesion.eventoTipo === "reunion" ? "Reunión" : "Viaje"}`}
        onVolver={onVolver}
        labelVolver="Inicio"
        extra={
          <button type="button" onClick={onCerrar}
            className="shrink-0 text-xs font-bold text-gray-400 hover:text-[#534AB7] transition-colors">
            Cerrar →
          </button>
        }
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 flex flex-col gap-5 pb-32">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total gastado", valor: fmt(totalGastos), color: "text-gray-800" },
            { label: "Mi balance",    valor: (miBalance >= 0 ? "+" : "") + fmt(miBalance),
              color: miBalance >= 0 ? "text-green-600" : "text-red-500" },
            { label: "Miembros", valor: `${miembros.length}`, color: "text-[#534AB7]" },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3">
              <p className={`text-base font-black ${m.color}`}>{m.valor}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([
            ["lista",  `🛒 Lista (${compras.length})`],
            ["gastos", `💸 Gastos (${gastos.length})`],
          ] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                ${tab === k ? "bg-white text-[#534AB7] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Lista de compras */}
        {tab === "lista" && (
          <div className="flex flex-col gap-2.5">
            {compras.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 flex flex-col items-center gap-2 text-gray-400">
                <span className="text-4xl">🛒</span>
                <p className="text-sm">Lista de compras vacía.</p>
                <p className="text-xs text-center px-6">Agrega ítems con "+ Agregar" y elige "Lista de compras".</p>
              </div>
            ) : (
              compras.map(c => (
                <ItemLista
                  key={c.id}
                  consumo={c}
                  miembros={miembros}
                  yoId={yoId}
                  onYoLoCompro={() => handleYoLoCompro(c)}
                  onYaLoCompre={(precio) => handleYaLoCompre(c, precio)}
                  onEditar={() => onEditar(c)}
                  onEliminar={() => onEliminar(c.id)}
                />
              ))
            )}
          </div>
        )}

        {/* Tab: Gastos registrados */}
        {tab === "gastos" && (
          <div className="flex flex-col gap-2.5">
            {gastos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 flex flex-col items-center gap-2 text-gray-400">
                <span className="text-4xl">💸</span>
                <p className="text-sm">No hay gastos registrados aún.</p>
                <p className="text-xs text-center px-6">Agrega un gasto directo o marca ítems de la lista como comprados.</p>
              </div>
            ) : (
              gastos.map(c => (
                <ItemGasto
                  key={c.id}
                  consumo={c}
                  miembros={miembros}
                  yoId={yoId}
                  onEditar={() => onEditar(c)}
                  onEliminar={() => onEliminar(c.id)}
                />
              ))
            )}
          </div>
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
            <span>+</span> Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
