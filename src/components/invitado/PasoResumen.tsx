import { useState, useEffect } from "react"
import type { InfoEvento, PerfilInvitado, ItemElegido } from "./InvitadoFlow"
import { HeaderInvitado } from "./InvitadoFlow"
import { COLORES_AVATAR } from "./PasoRegistro"
import { listarConsumos } from "../../api"

interface Props {
  evento: InfoEvento
  perfil: PerfilInvitado
  items: ItemElegido[]
  onVolver: () => void
  onContinuar: (propinaPct: number) => void
}

// ─── Opciones de propina ──────────────────────────────────────────────────────

const PROPINAS = [
  { label: "Sin propina", pct: 0 },
  { label: "5%",          pct: 5 },
  { label: "10%",         pct: 10 },
  { label: "15%",         pct: 15 },
]

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

export default function PasoResumen({ evento, perfil, items, onVolver, onContinuar }: Props) {
  const [propinaPct, setPropinaPct] = useState(0)
  const [modoSlider, setModoSlider] = useState(false)
  const [sliderVal, setSliderVal] = useState(0)
  const [itemsBD, setItemsBD] = useState<ItemElegido[] | null>(null)

  const color = COLORES_AVATAR[perfil.colorIndex]

  // Cargar items desde BD para incluir los asignados por el anfitrión
  useEffect(() => {
    listarConsumos(evento.eventoId)
      .then((consumos) => {
        const mis = consumos.filter((c) =>
          c.asignados.some((a) => a.invitado_id === perfil.invitadoId)
        )
        if (mis.length === 0) return
        const mapped: ItemElegido[] = mis.map((c) => {
          const asig = c.asignados.find((a) => a.invitado_id === perfil.invitadoId)
          return {
            id: c.id,
            nombre: c.descripcion,
            precioBase: parseFloat(c.precio) / Math.max(c.cantidad, 1),
            cantidad: asig?.cantidad ?? 1,
            compartidoConOtros: c.asignados.filter((a) => a.invitado_id !== perfil.invitadoId).length,
          }
        })
        setItemsBD(mapped)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.eventoId, perfil.invitadoId])

  // Usar items de BD si están disponibles, si no los del prop
  const itemsEfectivos = itemsBD ?? items

  // precioBase = precio unitario por pieza; total = precioBase × cantidad
  const subtotal = itemsEfectivos.reduce((s, it) => s + it.precioBase * it.cantidad, 0)

  const pctActivo = modoSlider ? sliderVal : propinaPct
  const montoPropinaAbsoluto = subtotal * (pctActivo / 100)
  const total = subtotal + montoPropinaAbsoluto

  const handleBotonPropina = (pct: number) => {
    setModoSlider(false)
    setPropinaPct(pct)
  }

  const handleSlider = (v: number) => {
    setModoSlider(true)
    setSliderVal(v)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderInvitado onVolver={onVolver} labelVolver="Consumos" paso={4} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 flex flex-col gap-6 pb-8">

        {/* Título + avatar */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center text-white font-black text-xl shrink-0`}>
            {perfil.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">{evento.nombre}</p>
            <h1 className="text-xl font-black text-gray-800">Resumen de {perfil.nombre}</h1>
          </div>
        </div>

        {/* Lista de consumos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">Mis consumos</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {itemsEfectivos.map((item) => {
              const totalItem = item.precioBase * item.cantidad
              return (
                <div key={item.id} className="flex items-start justify-between px-5 py-3.5 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 font-medium leading-snug">{item.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {item.cantidad > 1 ? `${item.cantidad} × ${fmt(item.precioBase)}` : fmt(item.precioBase)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-800 shrink-0">{fmt(totalItem)}</span>
                </div>
              )
            })}
          </div>
          {/* Subtotal */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-dashed border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500 font-medium">Subtotal</span>
            <span className="text-sm font-bold text-gray-800">{fmt(subtotal)}</span>
          </div>
        </div>

        {/* Propina */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">¿Dejas propina?</h2>
            {pctActivo > 0 && (
              <span className="text-xs font-bold text-[#2EC4B6]">+{fmt(montoPropinaAbsoluto)}</span>
            )}
          </div>

          {/* Botones de propina */}
          <div className="grid grid-cols-4 gap-2">
            {PROPINAS.map((op) => {
              const activo = !modoSlider && propinaPct === op.pct
              return (
                <button key={op.pct} type="button"
                  onClick={() => handleBotonPropina(op.pct)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all
                    ${activo
                      ? "border-[#2EC4B6] bg-[#2EC4B6]/10 text-[#2EC4B6]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }
                  `}>
                  {op.label}
                </button>
              )
            })}
          </div>

          {/* Slider personalizado */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button type="button"
                onClick={() => { setModoSlider(true); setPropinaPct(0) }}
                className={`text-xs font-semibold transition-colors ${modoSlider ? "text-[#2EC4B6]" : "text-gray-400 hover:text-gray-600"}`}>
                Personalizado
              </button>
              {modoSlider && (
                <span className="text-xs font-black text-[#2EC4B6]">{sliderVal}%</span>
              )}
            </div>
            <div className="relative">
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={modoSlider ? sliderVal : 0}
                onChange={(e) => handleSlider(Number(e.target.value))}
                onFocus={() => setModoSlider(true)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: modoSlider
                    ? `linear-gradient(to right, #2EC4B6 ${(sliderVal / 30) * 100}%, #e5e7eb ${(sliderVal / 30) * 100}%)`
                    : "#e5e7eb",
                  accentColor: "#2EC4B6",
                }}
              />
              {/* Marcas */}
              <div className="flex justify-between mt-1">
                {[0, 10, 20, 30].map((v) => (
                  <span key={v} className="text-[10px] text-gray-300">{v}%</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-[#2EC4B6]/5 border-2 border-[#2EC4B6]/20 rounded-2xl px-5 py-5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-700">{fmt(subtotal)}</span>
          </div>
          {pctActivo > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Propina ({pctActivo}%)</span>
              <span className="font-semibold text-gray-700">{fmt(montoPropinaAbsoluto)}</span>
            </div>
          )}
          <div className="border-t border-[#2EC4B6]/20 pt-3 flex items-center justify-between">
            <span className="text-base font-bold text-gray-700">Total a pagar</span>
            <span className="text-2xl font-black text-[#2EC4B6]">{fmt(total)}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pb-6">
          <button type="button"
            onClick={() => onContinuar(pctActivo)}
            className="w-full py-3.5 rounded-xl bg-[#2EC4B6] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#2EC4B6]/30">
            Ir a pagar →
          </button>
        </div>

      </main>
    </div>
  )
}
