import { useState } from "react"

const problemCards = [
  {
    emoji: "🍽️",
    title: "Restaurante o bar",
    subtitle: "Cada quien paga lo suyo",
    description: "Escanea el ticket, elige tus consumos y paga exactamente lo que pediste. Sin cálculos, sin drama.",
  },
  {
    emoji: "✈️",
    title: "Reunión o viaje",
    subtitle: "Siempre sabes quién puso qué",
    description: "Registra los gastos del grupo y la app calcula automáticamente quién le debe a quién.",
  },
  {
    emoji: "🏠",
    title: "Roomies",
    subtitle: "El hogar sin discusiones",
    description: "Lleva el control de renta, despensa y servicios. Balances claros para todos.",
  },
]

const roles = [
  {
    key: "anfitrion",
    label: "Soy anfitrión",
    subtitle: "Crea y administra el gasto",
    bg: "bg-[#534AB7]",
    border: "border-[#534AB7]",
    ring: "focus:ring-[#534AB7]",
    badgeBg: "bg-[#534AB7]/10",
    badgeText: "text-[#534AB7]",
    emoji: "👑",
    features: [
      "Crea el grupo del evento",
      "Agrega y divide gastos",
      "Cobra lo que te deben",
      "Ve el resumen en tiempo real",
    ],
  },
  {
    key: "invitado",
    label: "Soy invitado",
    subtitle: "Únete y lleva el control",
    bg: "bg-[#2EC4B6]",
    border: "border-[#2EC4B6]",
    ring: "focus:ring-[#2EC4B6]",
    badgeBg: "bg-[#2EC4B6]/10",
    badgeText: "text-[#2EC4B6]",
    emoji: "🙋",
    features: [
      "Entra con código de invitación",
      "Ve tu parte del gasto",
      "Paga en línea fácilmente",
      "Historial de tus pagos",
    ],
  },
  {
    key: "roomies",
    label: "Somos roomies",
    subtitle: "Sin drama en el hogar",
    bg: "bg-[#8B1A3A]",
    border: "border-[#8B1A3A]",
    ring: "focus:ring-[#8B1A3A]",
    badgeBg: "bg-[#8B1A3A]/10",
    badgeText: "text-[#8B1A3A]",
    emoji: "🤝",
    features: [
      "Gastos recurrentes del hogar",
      "Recordatorios de pago",
      "Balance mensual automático",
      "Historial compartido",
    ],
  },
]

const steps = [
  {
    number: "1",
    title: "Crea un grupo",
    description: "El anfitrión abre la app y crea un grupo para el evento o el hogar.",
    emoji: "📋",
  },
  {
    number: "2",
    title: "Agrega los gastos",
    description: "Registra quién pagó qué y cuánto. La app lleva la cuenta por ti.",
    emoji: "💸",
  },
  {
    number: "3",
    title: "Divide automático",
    description: "CuentasClaras calcula quién le debe a quién, sin discusiones.",
    emoji: "🧮",
  },
  {
    number: "4",
    title: "¡Cobra o paga!",
    description: "Salda cuentas con transferencia SPEI o tarjeta desde la app.",
    emoji: "✅",
  },
]

interface Props {
  onCrearEvento: () => void
  onSoyInvitado: (codigo?: string) => void
  onCrearRoomies: () => void
}

export default function HomePage({ onCrearEvento, onSoyInvitado, onCrearRoomies }: Props) {
  const [codigo, setCodigo] = useState("")

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#534AB7] flex items-center justify-center shadow">
            <span className="text-white font-black text-sm leading-none">CC</span>
          </div>
          <span className="text-xl font-black text-[#534AB7] tracking-tight">CuentasClaras</span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white pt-14 pb-16 px-4 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
          Sin descarga · 100% desde el navegador
        </p>
        <h1 className="text-4xl sm:text-5xl font-black text-[#534AB7] leading-tight mb-4">
          CuentasClaras
        </h1>
        <p className="text-xl sm:text-2xl font-semibold text-[#2EC4B6] mb-6">
          Cuentas claras, amistades largas.
        </p>
        <p className="text-gray-500 max-w-md mx-auto text-base leading-relaxed">
          Divide cuentas y gastos compartidos en restaurantes, viajes, reuniones y entre roomies. Sin drama.
        </p>
      </section>

      {/* Problem cards */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-center text-2xl font-bold text-gray-700 mb-2">
          Simple, rápido y sin drama
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          Para cada situación, una solución clara
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          {problemCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <span className="text-4xl">{card.emoji}</span>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {card.title}
                </p>
                <h3 className="text-lg font-bold text-gray-800">{card.subtitle}</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role buttons */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-gray-700 mb-2">
            ¿Cuál es tu rol?
          </h2>
          <p className="text-center text-gray-400 text-sm mb-10">
            Elige cómo quieres entrar a CuentasClaras
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {roles.map((role) => (
              <button
                key={role.key}
                onClick={
                  role.key === "anfitrion" ? onCrearEvento :
                  role.key === "invitado"  ? () => onSoyInvitado() :
                  role.key === "roomies"   ? onCrearRoomies : undefined
                }
                className={`group rounded-2xl border-2 ${role.border} p-6 text-left flex flex-col gap-4 hover:shadow-lg transition-all focus:outline-none focus:ring-2 ${role.ring} focus:ring-offset-2`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{role.emoji}</span>
                  <div>
                    <p className="font-black text-lg leading-tight text-gray-800">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.subtitle}</p>
                  </div>
                </div>
                <ul className="flex flex-col gap-2">
                  {role.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className={`mt-0.5 w-4 h-4 rounded-full ${role.badgeBg} ${role.badgeText} flex items-center justify-center shrink-0`}>
                        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="currentColor">
                          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <span className={`mt-auto w-full py-2 rounded-xl text-white text-sm font-bold text-center ${role.bg} group-hover:opacity-90 transition-opacity`}>
                  Entrar →
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-gray-700 mb-2">
          ¿Cómo funciona?
        </h2>
        <p className="text-center text-gray-400 text-sm mb-10">
          En cuatro pasos, sin complicaciones
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#534AB7]/10 flex items-center justify-center text-2xl shadow-sm">
                {step.emoji}
              </div>
              <div className="w-7 h-7 rounded-full bg-[#534AB7] text-white text-xs font-black flex items-center justify-center -mt-1">
                {step.number}
              </div>
              <h3 className="font-bold text-gray-800">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Connector line for large screens */}
        <div className="hidden lg:flex items-center justify-between max-w-3xl mx-auto -mt-[5.5rem] mb-10 px-14 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 border-t-2 border-dashed border-[#534AB7]/20 mx-2" />
          ))}
        </div>
      </section>

      {/* Invitation code */}
      <section className="bg-white py-12 px-4 border-t border-gray-100">
        <div className="max-w-md mx-auto text-center">
          <p className="text-2xl mb-2">🔑</p>
          <h2 className="text-xl font-bold text-gray-700 mb-1">¿Ya tienes código?</h2>
          <p className="text-gray-400 text-sm mb-6">
            El anfitrión te envió un código de invitación. Ingrésalo aquí para unirte.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej. CC-4829"
              maxLength={8}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest text-gray-700 focus:outline-none focus:border-[#2EC4B6] transition-colors placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-300"
            />
            <button
              disabled={codigo.length < 4}
              onClick={() => onSoyInvitado(codigo)}
              className="bg-[#2EC4B6] text-white font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Entrar
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-400 border-t border-gray-100">
        <span className="font-bold text-[#534AB7]">CuentasClaras</span> · Cuentas claras, amistades largas. · México 🇲🇽
      </footer>

    </div>
  )
}
