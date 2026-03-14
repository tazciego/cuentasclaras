import { useState } from "react"
import type { TipoEvento, Participante, DatosEvento } from "../types"
import BarraProgreso from "./BarraProgreso"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onVolver: () => void
  onContinuar: (datos: DatosEvento) => void
}

// ─── Tarjeta de tipo de evento ────────────────────────────────────────────────

const TIPOS = {
  restaurante: {
    emoji: "🍽️",
    label: "Restaurante o bar",
    descripcion: "División de cuenta en el momento",
  },
  reunion: {
    emoji: "✈️",
    label: "Reunión o viaje",
    descripcion: "Gastos compartidos a lo largo del evento",
  },
}

function TarjetaTipo({
  tipo,
  seleccionado,
  onSeleccionar,
}: {
  tipo: TipoEvento
  seleccionado: TipoEvento | null
  onSeleccionar: (t: TipoEvento) => void
}) {
  const activo = seleccionado === tipo
  const info = TIPOS[tipo]
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(tipo)}
      className={`flex-1 rounded-xl border-2 p-4 text-left transition-all focus:outline-none
        ${activo
          ? "border-[#534AB7] bg-[#534AB7]/5 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
        }
      `}
    >
      <span className="text-2xl">{info.emoji}</span>
      <p className={`mt-2 font-bold text-sm ${activo ? "text-[#534AB7]" : "text-gray-700"}`}>
        {info.label}
      </p>
      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{info.descripcion}</p>
      {activo && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-[#534AB7] flex items-center justify-center">
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[10px] font-semibold text-[#534AB7]">Seleccionado</span>
        </div>
      )}
    </button>
  )
}

// ─── Chip de participante ──────────────────────────────────────────────────────

function ChipParticipante({
  nombre,
  esTu,
  onEliminar,
}: {
  nombre: string
  esTu: boolean
  onEliminar?: () => void
}) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border
      ${esTu ? "bg-[#534AB7]/10 border-[#534AB7]/30 text-[#534AB7]" : "bg-gray-100 border-gray-200 text-gray-700"}
    `}>
      <span className="text-base leading-none">{esTu ? "👑" : "👤"}</span>
      <span>{nombre}</span>
      {!esTu && onEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          className="ml-0.5 text-gray-400 hover:text-red-400 transition-colors leading-none"
          aria-label={`Eliminar a ${nombre}`}
        >
          ×
        </button>
      )}
    </div>
  )
}

// ─── Modal para agregar participante ──────────────────────────────────────────

function ModalAgregarParticipante({
  onAgregar,
  onCerrar,
}: {
  onAgregar: (nombre: string) => void
  onCerrar: () => void
}) {
  const [nombre, setNombre] = useState("")
  const submit = () => {
    const n = nombre.trim()
    if (n) { onAgregar(n); setNombre("") }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-gray-800 mb-4">Agregar participante</h3>
        <input
          autoFocus
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nombre del participante"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#534AB7] transition-colors"
        />
        <p className="text-xs text-gray-400 mt-2">
          El invitado recibirá el QR para unirse sin necesidad de cuenta.
        </p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!nombre.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#534AB7] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Generador de código de invitación ────────────────────────────────────────

function generarCodigo(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `CC-${num}`
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CrearEvento({ onVolver, onContinuar }: Props) {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<TipoEvento | null>(null)
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")
  const [lugar, setLugar] = useState("")
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [errores, setErrores] = useState<{ nombre?: string; tipo?: string }>({})

  const agregarParticipante = (n: string) => {
    setParticipantes((prev) => [...prev, { id: nextId, nombre: n }])
    setNextId((id) => id + 1)
    setModalAbierto(false)
  }

  const eliminarParticipante = (id: number) => {
    setParticipantes((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevosErrores: typeof errores = {}
    if (!nombre.trim()) nuevosErrores.nombre = "El nombre del evento es obligatorio."
    if (!tipo) nuevosErrores.tipo = "Selecciona el tipo de evento."
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length === 0 && tipo) {
      onContinuar({
        nombre: nombre.trim(),
        tipo,
        fecha,
        hora,
        lugar,
        participantes,
        codigo: generarCodigo(),
      })
    }
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
            Inicio
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
      <BarraProgreso pasoActual={1} />

      {/* Formulario */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-800">Crear evento</h1>
          <p className="text-gray-400 text-sm mt-1">
            Completa la información para generar el QR de invitación.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

          {/* Nombre del evento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Nombre del evento <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrores((err) => ({ ...err, nombre: undefined })) }}
              placeholder="Ej. Cena de cumpleaños de Fer"
              className={`border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
                ${errores.nombre ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#534AB7]"}
              `}
            />
            {errores.nombre && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span>⚠</span> {errores.nombre}
              </p>
            )}
          </div>

          {/* Tipo de evento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Tipo de evento <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-3">
              <TarjetaTipo tipo="restaurante" seleccionado={tipo} onSeleccionar={(t) => { setTipo(t); setErrores((err) => ({ ...err, tipo: undefined })) }} />
              <TarjetaTipo tipo="reunion" seleccionado={tipo} onSeleccionar={(t) => { setTipo(t); setErrores((err) => ({ ...err, tipo: undefined })) }} />
            </div>
            {errores.tipo && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span>⚠</span> {errores.tipo}
              </p>
            )}
          </div>

          {/* Fecha y hora */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-semibold text-gray-700">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-[#534AB7] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-36">
              <label className="text-sm font-semibold text-gray-700">
                Hora <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-[#534AB7] transition-colors"
              />
            </div>
          </div>

          {/* Lugar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Lugar <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Ej. La Docena, Guadalajara"
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#534AB7] transition-colors"
            />
          </div>

          {/* Participantes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Participantes</label>
              <span className="text-xs text-gray-400">{1 + participantes.length} persona{participantes.length !== 0 ? "s" : ""}</span>
            </div>

            <div className="bg-white border-2 border-gray-100 rounded-xl p-4 flex flex-wrap gap-2">
              <ChipParticipante nombre="Tú" esTu={true} />
              {participantes.map((p) => (
                <ChipParticipante
                  key={p.id}
                  nombre={p.nombre}
                  esTu={false}
                  onEliminar={() => eliminarParticipante(p.id)}
                />
              ))}
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-sm font-medium hover:border-[#534AB7] hover:text-[#534AB7] transition-colors"
              >
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Agregar
              </button>
            </div>

            <div className="flex items-start gap-2 bg-[#2EC4B6]/8 border border-[#2EC4B6]/25 rounded-xl px-4 py-3">
              <span className="text-lg leading-none mt-0.5">💡</span>
              <p className="text-xs text-teal-700 leading-relaxed">
                <span className="font-semibold">Los invitados no necesitan crear cuenta.</span>{" "}
                Solo escanean el QR y listo.
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3 pt-2 pb-8">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#534AB7] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#534AB7]/25"
            >
              Crear evento y generar QR →
            </button>
            <button
              type="button"
              onClick={onVolver}
              className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>

        </form>
      </main>

      {modalAbierto && (
        <ModalAgregarParticipante
          onAgregar={agregarParticipante}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
