import { useState, useRef } from "react"
import { QRCodeCanvas } from "qrcode.react"

export function BotonCompartir({ codigo }: { codigo: string }) {
  const [abierto, setAbierto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  const urlInvitacion = `${window.location.origin}/unirse/${codigo}`

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigo).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const compartirWhatsApp = () => {
    const texto = encodeURIComponent(
      `¡Únete a mi evento en CuentasClaras con el código ${codigo}! 🎉\n${urlInvitacion}`
    )
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  const compartirTelegram = () => {
    const texto = encodeURIComponent(`¡Únete a mi evento en CuentasClaras con el código ${codigo}!`)
    const url = encodeURIComponent(urlInvitacion)
    window.open(`https://t.me/share/url?url=${url}&text=${texto}`, "_blank")
  }

  const guardarQR = () => {
    const canvas = qrContainerRef.current?.querySelector("canvas")
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `CuentasClaras-${codigo}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
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

            {/* QR grande */}
            <div className="flex flex-col items-center gap-2 py-1">
              <div ref={qrContainerRef} className="inline-block p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
                <QRCodeCanvas
                  value={urlInvitacion}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#534AB7"
                  level="M"
                />
              </div>
              <p className="text-xs text-gray-400 text-center">Escanea para unirte</p>
            </div>

            {/* Código */}
            <div className="bg-[#534AB7]/5 border-2 border-[#534AB7]/20 rounded-2xl px-5 py-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Código de invitación</p>
              <p className="text-3xl font-black text-[#534AB7] tracking-widest">{codigo}</p>
            </div>

            {/* Botones 2×2 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={compartirWhatsApp}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C5E] text-sm font-bold hover:bg-[#25D366]/20 transition-colors"
              >
                💬 WhatsApp
              </button>
              <button
                type="button"
                onClick={compartirTelegram}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/30 text-[#229ED9] text-sm font-bold hover:bg-[#229ED9]/20 transition-colors"
              >
                ✈️ Telegram
              </button>
              <button
                type="button"
                onClick={copiarCodigo}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all
                  ${copiado ? "bg-green-500 text-white" : "bg-[#534AB7] text-white hover:opacity-90"}`}
              >
                {copiado ? "✓ Copiado" : "Copiar código"}
              </button>
              <button
                type="button"
                onClick={guardarQR}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                📥 Guardar QR
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
