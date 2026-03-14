import { useState } from "react"
import type { DatosEvento } from "./types"
import HomePage from "./components/HomePage"
import CrearEvento from "./components/CrearEvento"
import CompartirQR from "./components/CompartirQR"
import CargarConsumos from "./components/CargarConsumos"
import VistaEnVivo from "./components/VistaEnVivo"
import CobrarYCerrar from "./components/CobrarYCerrar"
import InvitadoFlow from "./components/invitado/InvitadoFlow"
import ReunionFlow from "./components/reunion/ReunionFlow"
import RoomiesFlow from "./components/roomies/RoomiesFlow"
import Calculadora from "./components/Calculadora"

type Pantalla =
  | "inicio"
  | "crear-evento"
  | "compartir-qr"
  | "cargar-consumos"
  | "vista-en-vivo"
  | "cobrar-y-cerrar"
  | "invitado"
  | "reunion"
  | "roomies"

function App() {
  const [pantalla, setPantalla] = useState<Pantalla>("inicio")
  const [evento, setEvento] = useState<DatosEvento | null>(null)
  const [codigoInvitado, setCodigoInvitado] = useState<string | undefined>()

  const irAInvitado = (codigo?: string) => {
    setCodigoInvitado(codigo)
    setPantalla("invitado")
  }

  const renderPantalla = () => {
    if (pantalla === "invitado") return (
      <InvitadoFlow
        codigoInicial={codigoInvitado}
        onSalir={() => { setCodigoInvitado(undefined); setPantalla("inicio") }}
      />
    )

    if (pantalla === "reunion")
      return <ReunionFlow onSalir={() => setPantalla("inicio")} />

    if (pantalla === "roomies")
      return <RoomiesFlow onSalir={() => setPantalla("inicio")} />

    if (pantalla === "crear-evento") return (
      <CrearEvento
        onVolver={() => setPantalla("inicio")}
        onContinuar={(datos) => { setEvento(datos); setPantalla("compartir-qr") }}
      />
    )

    if (pantalla === "compartir-qr" && evento) return (
      <CompartirQR
        evento={evento}
        onVolver={() => setPantalla("crear-evento")}
        onContinuar={() => setPantalla("cargar-consumos")}
      />
    )

    if (pantalla === "cargar-consumos" && evento) return (
      <CargarConsumos
        evento={evento}
        onVolver={() => setPantalla("compartir-qr")}
        onContinuar={() => setPantalla("vista-en-vivo")}
      />
    )

    if (pantalla === "vista-en-vivo" && evento) return (
      <VistaEnVivo
        evento={evento}
        onVolver={() => setPantalla("cargar-consumos")}
        onEditar={() => setPantalla("cargar-consumos")}
        onContinuar={() => setPantalla("cobrar-y-cerrar")}
      />
    )

    if (pantalla === "cobrar-y-cerrar" && evento) return (
      <CobrarYCerrar
        evento={evento}
        onVolver={() => setPantalla("vista-en-vivo")}
        onCerrar={() => setPantalla("inicio")}
      />
    )

    return (
      <HomePage
        onCrearEvento={() => setPantalla("crear-evento")}
        onSoyInvitado={irAInvitado}
        onCrearReunion={() => setPantalla("reunion")}
        onCrearRoomies={() => setPantalla("roomies")}
      />
    )
  }

  return (
    <>
      {renderPantalla()}
      <Calculadora />
    </>
  )
}

export default App
