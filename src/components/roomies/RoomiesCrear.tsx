import { useState } from "react"
import type { Casa, Roomie } from "./RoomiesFlow"
import { COLORES_ROOMIES, HeaderRoomies, AvatarR } from "./RoomiesFlow"

interface Props {
  onVolver: () => void
  onCreado: (casa: Casa) => void
}

function ModalAgregarRoomie({
  nextId, onAgregar, onCerrar,
}: {
  nextId: number; onAgregar: (r: Roomie) => void; onCerrar: () => void
}) {
  const [nombre, setNombre] = useState("")
  const [colorIndex, setColorIndex] = useState(nextId % COLORES_ROOMIES.length)
  const submit = () => { if (nombre.trim()) onAgregar({ id: nextId, nombre: nombre.trim(), colorIndex, esYo: false }) }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-gray-800 mb-4">Agregar roomie</h3>
        <input autoFocus type="text" value={nombre}
          onChange={e => setNombre(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Nombre o apodo"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B1A3A] transition-colors mb-3" />
        <div className="grid grid-cols-8 gap-2 mb-5">
          {COLORES_ROOMIES.map((c, i) => (
            <button key={i} type="button" onClick={() => setColorIndex(i)}
              className={`w-full aspect-square rounded-full ${c.bg} transition-all ${colorIndex === i ? "ring-2 ring-offset-2 ring-gray-600 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={!nombre.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#8B1A3A] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RoomiesCrear({ onVolver, onCreado }: Props) {
  const [nombre, setNombre] = useState("")
  const [roomies, setRoomies] = useState<Roomie[]>([
    { id: 0, nombre: "Tú",    colorIndex: 0, esYo: true  },
    { id: 1, nombre: "Ana",   colorIndex: 1, esYo: false },
    { id: 2, nombre: "Carlos",colorIndex: 2, esYo: false },
  ])
  const [modal, setModal] = useState(false)
  const [nextId, setNextId] = useState(3)
  const [error, setError] = useState("")
  const [linkCopiado, setLinkCopiado] = useState(false)

  const agregar = (r: Roomie) => { setRoomies(prev => [...prev, r]); setNextId(n => n + 1); setModal(false) }
  const eliminar = (id: number) => setRoomies(prev => prev.filter(r => r.id !== id))

  const submit = () => {
    if (!nombre.trim()) { setError("El nombre de la casa es obligatorio."); return }
    onCreado({ nombre: nombre.trim(), roomies })
  }

  const invitarWhatsApp = () => {
    const texto = encodeURIComponent(`¡Hola! Te invito a unirte a nuestra casa "${nombre || "Casa compartida"}" en CuentasClaras para llevar el control de los gastos del hogar.\n🏠 https://cuentasclaras.mx/roomies/unirse/RO-1234`)
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  const copiarLink = () => {
    navigator.clipboard.writeText("https://cuentasclaras.mx/roomies/unirse/RO-1234").catch(() => {})
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderRoomies titulo="CuentasClaras" onVolver={onVolver} labelVolver="Inicio" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Nueva casa compartida</h1>
          <p className="text-gray-400 text-sm mt-1">Lleva el control de los gastos del hogar con tus roomies.</p>
        </div>

        {/* Nombre de la casa */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Nombre de la casa <span className="text-red-400">*</span></label>
          <input type="text" value={nombre}
            onChange={e => { setNombre(e.target.value); setError("") }}
            placeholder="Ej. Casa Condesa, Depa Roma Norte…"
            className={`border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
              ${error ? "border-red-400" : "border-gray-200 focus:border-[#8B1A3A]"}`} />
          {error && <p className="text-xs text-red-400">⚠ {error}</p>}
        </div>

        {/* Roomies */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Roomies</label>
            <span className="text-xs text-gray-400">{roomies.length} persona{roomies.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-xl p-4 flex flex-wrap gap-2">
            {roomies.map(r => (
              <div key={r.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium
                ${r.esYo ? "bg-[#8B1A3A]/10 border-[#8B1A3A]/30 text-[#8B1A3A]" : "bg-gray-100 border-gray-200 text-gray-700"}`}>
                <AvatarR nombre={r.nombre} colorIndex={r.colorIndex} size="xs" />
                <span>{r.nombre}</span>
                {!r.esYo && (
                  <button type="button" onClick={() => eliminar(r.id)}
                    className="ml-0.5 text-gray-400 hover:text-red-400 transition-colors leading-none">×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-xs font-medium hover:border-[#8B1A3A] hover:text-[#8B1A3A] transition-colors">
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Agregar
            </button>
          </div>
        </div>

        {/* Invitar */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Invitar roomies</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={invitarWhatsApp}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border-2 border-[#25D366]/30 text-[#128C5E] text-sm font-bold hover:bg-[#25D366]/20 transition-colors">
              <span>💬</span> Por WhatsApp
            </button>
            <button type="button" onClick={copiarLink}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all
                ${linkCopiado ? "border-green-400 bg-green-50 text-green-600" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
              <span>{linkCopiado ? "✓" : "🔗"}</span>
              {linkCopiado ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Tus roomies recibirán un código para unirse sin necesidad de crear cuenta.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pb-8">
          <button type="button" onClick={submit}
            className="w-full py-3.5 rounded-xl bg-[#8B1A3A] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#8B1A3A]/25">
            Crear casa compartida 🏠
          </button>
          <button type="button" onClick={onVolver}
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 transition-colors">
            Cancelar
          </button>
        </div>
      </main>

      {modal && <ModalAgregarRoomie nextId={nextId} onAgregar={agregar} onCerrar={() => setModal(false)} />}
    </div>
  )
}
