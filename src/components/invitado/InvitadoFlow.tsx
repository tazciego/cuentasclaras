import { useState } from "react"
import PasoAcceso from "./PasoAcceso"
import PasoRegistro from "./PasoRegistro"
import PasoElegir from "./PasoElegir"
import PasoResumen from "./PasoResumen"
import PasoPago from "./PasoPago"

// ─── Tipos compartidos ────────────────────────────────────────────────────────

export interface InfoEvento {
  eventoId: number   // ID real de la BD
  codigo: string
  nombre: string
  tipo: "restaurante" | "reunion"
  anfitrion?: string
  fecha: string
  lugar: string
}

export interface PerfilInvitado {
  nombre: string
  colorIndex: number
  invitadoId: number  // ID real de la BD
  token: string       // Token de sesión guardado en localStorage
}

export interface ItemElegido {
  id: number
  nombre: string
  precioBase: number         // precio total del item
  cantidad: number
  compartidoConOtros: number // cuántos más lo eligieron antes que yo
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  codigoInicial?: string
  sesionInicial?: { evento: InfoEvento; perfil: PerfilInvitado; pagoId?: number }
  onSalir: () => void
}

// ─── Pasos ────────────────────────────────────────────────────────────────────

type Paso = 1 | 2 | 3 | 4 | 5

// ─── Header compartido del flujo invitado ─────────────────────────────────────

export function HeaderInvitado({
  onVolver,
  labelVolver,
  paso,
}: {
  onVolver: () => void
  labelVolver: string
  paso: Paso
}) {
  const pasos = ["Acceso", "Registro", "Consumos", "Resumen", "Pago"]
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#2EC4B6] transition-colors text-sm font-medium"
        >
          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {labelVolver}
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg bg-[#2EC4B6] flex items-center justify-center">
            <span className="text-white font-black text-xs">CC</span>
          </div>
          <span className="font-black text-[#2EC4B6] text-base tracking-tight">CuentasClaras</span>
        </div>
        {/* Dots de progreso */}
        <div className="flex items-center gap-1">
          {pasos.map((_, i) => (
            <div
              key={i}
              title={pasos[i]}
              className={`rounded-full transition-all duration-300 ${
                i + 1 === paso
                  ? "w-4 h-2 bg-[#2EC4B6]"
                  : i + 1 < paso
                  ? "w-2 h-2 bg-[#2EC4B6]/50"
                  : "w-2 h-2 bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
    </header>
  )
}

// ─── Orquestador principal ────────────────────────────────────────────────────

export default function InvitadoFlow({ codigoInicial, sesionInicial, onSalir }: Props) {
  const [paso, setPaso] = useState<Paso>(
    sesionInicial?.pagoId ? 5 : sesionInicial ? 3 : 1
  )
  const [evento, setEvento] = useState<InfoEvento | null>(sesionInicial?.evento ?? null)
  const [perfil, setPerfil] = useState<PerfilInvitado | null>(sesionInicial?.perfil ?? null)
  const [itemsElegidos, setItemsElegidos] = useState<ItemElegido[]>([])
  const [cantidadesGuardadas, setCantidadesGuardadas] = useState<Record<number, number>>({})
  const [propinaPct, setPropinaPct] = useState(0)
  const [pagoIdGuardado, setPagoIdGuardado] = useState<number | null>(sesionInicial?.pagoId ?? null)

  const ir = (p: Paso) => setPaso(p)

  if (paso === 1) {
    return (
      <PasoAcceso
        codigoInicial={codigoInicial}
        onVolver={onSalir}
        onContinuar={(ev) => { setEvento(ev); ir(2) }}
      />
    )
  }

  if (paso === 2 && evento) {
    return (
      <PasoRegistro
        evento={evento}
        onVolver={() => ir(1)}
        onContinuar={(p) => { setPerfil(p); ir(3) }}
      />
    )
  }

  if (paso === 3 && evento && perfil) {
    return (
      <PasoElegir
        evento={evento}
        perfil={perfil}
        cantidadesIniciales={cantidadesGuardadas}
        onVolver={() => ir(2)}
        onContinuar={(items, cantidades) => {
          setItemsElegidos(items)
          setCantidadesGuardadas(cantidades)
          ir(4)
        }}
      />
    )
  }

  if (paso === 4 && evento && perfil) {
    return (
      <PasoResumen
        evento={evento}
        perfil={perfil}
        items={itemsElegidos}
        onVolver={() => ir(3)}
        onContinuar={(pct) => { setPropinaPct(pct); ir(5) }}
      />
    )
  }

  if (paso === 5 && evento && perfil) {
    const subtotal = itemsElegidos.reduce((s, it) => s + it.precioBase * it.cantidad, 0)
    return (
      <PasoPago
        evento={evento}
        perfil={perfil}
        subtotal={subtotal}
        propinaPct={propinaPct}
        pagoInicialId={pagoIdGuardado ?? undefined}
        onVolver={() => ir(4)}
        onRevisar={() => ir(3)}
        onCancelar={() => {
          setPagoIdGuardado(null)
          localStorage.removeItem("cc_pago_pendiente")
          ir(3)
        }}
        onPagoRegistrado={(id) => {
          setPagoIdGuardado(id)
          localStorage.setItem("cc_pago_pendiente", String(id))
        }}
        onFinalizar={() => {
          setPagoIdGuardado(null)
          localStorage.removeItem("cc_pago_pendiente")
          onSalir()
        }}
      />
    )
  }

  return null
}
