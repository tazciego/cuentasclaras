import { useState } from "react"

export function BotonCompartir({ codigo }: { codigo: string }) {
  const [abierto, setAbierto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const copiar = () => {
    navigator.clipboard.writeText(codigo).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1 text-[11px] font-bold text-[#534AB7] bg-[#534AB7]/10 border border-[#534AB7]/20 px-2.5 py-1 rounded-full hover:bg-[#534AB7]/20 transition-colors shrink-0"
      >
        📲 {codigo}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-xl p-6 flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-800">Compartir evento</h3>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-base leading-none"
              >
                ×
              </button>
            </div>

            <div className="bg-[#534AB7]/5 border-2 border-[#534AB7]/20 rounded-2xl px-5 py-5 text-center">
              <p className="text-xs text-gray-400 mb-1">Código de invitación</p>
              <p className="text-3xl font-black text-[#534AB7] tracking-widest">{codigo}</p>
            </div>

            <button
              type="button"
              onClick={copiar}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all
                ${copiado ? "bg-green-500 text-white" : "bg-[#534AB7] text-white hover:opacity-90"}`}
            >
              {copiado ? "✓ Copiado" : "Copiar código"}
            </button>

            <p className="text-center text-xs text-gray-400">
              Comparte este código para que tus invitados puedan unirse.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
