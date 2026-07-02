import type { Page } from '@playwright/test'

// ── Datos fijos de prueba ─────────────────────────────────────────────────────

export const EVENTO = {
  id: 1,
  nombre: 'Cena de prueba',
  tipo: 'restaurante',
  fecha: '2026-07-02',
  hora: '20:00',
  lugar: 'Restaurante Central',
  codigo: 'CC-123456',
  estado: 'activo',
  clabe_spei: null,
  creado_en: '2026-07-02T00:00:00',
}

export const INVITADOS = [
  { id: 1, nombre: 'Carlos', color_index: 4, es_anfitrion: 1, unido_en: '2026-07-02T00:00:00' },
  { id: 2, nombre: 'Ana',    color_index: 2, es_anfitrion: 0, unido_en: '2026-07-02T00:00:00' },
]

const CONSUMO_BASE = {
  id: 10,
  descripcion: 'Tacos al pastor',
  precio: '150.00',
  cantidad: 3,
  creado_en: '2026-07-02T00:00:00',
}

// solicitado_por = null → asignado por el anfitrión → se muestra en morado/bloqueado
export const CONSUMO_HOST_ASIGNADO = {
  ...CONSUMO_BASE,
  asignados: [{
    consumo_id: 10, invitado_id: 2, cantidad: 1,
    invitado_nombre: 'Ana', estado: 'aceptado',
    solicitado_por: null, solicitante_nombre: null,
  }],
}

// solicitado_por = 2 (= invitado_id de Ana) → elegido por el propio invitado → NO debe aparecer morado
export const CONSUMO_INVITADO_PROPIO = {
  ...CONSUMO_BASE,
  asignados: [{
    consumo_id: 10, invitado_id: 2, cantidad: 1,
    invitado_nombre: 'Ana', estado: 'aceptado',
    solicitado_por: 2, solicitante_nombre: 'Ana',
  }],
}

// Sin asignaciones → invitado puede elegirlo libremente
export const CONSUMO_LIBRE = { ...CONSUMO_BASE, asignados: [] }

// ── Sesiones localStorage ─────────────────────────────────────────────────────

export const CC_SESION_ANA = JSON.stringify({
  eventoId: 1,
  codigo: 'CC-123456',
  eventoNombre: 'Cena de prueba',
  eventoTipo: 'restaurante',
  fecha: '2026-07-02',
  lugar: 'Restaurante Central',
  clabe_spei: null,
  nombre: 'Ana',
  colorIndex: 2,
  invitadoId: 2,
  token: 'test-token-ana',
})

// pantalla puede ser cualquier string; "crear-evento" fuerza la pantalla de edición directo
export const CC_SESION_ANFITRION = (pantalla = 'compartir-qr') => JSON.stringify({
  eventoId: 1,
  codigo: 'CC-123456',
  nombre: 'Cena de prueba',
  tipo: 'restaurante',
  fecha: '2026-07-02',
  hora: '20:00',
  lugar: 'Restaurante Central',
  nombreAnfitrion: 'Carlos',
  pantalla,
})

// ── Helper principal: intercepta toda la API con respuestas mock ──────────────

export async function mockApi(
  page: Page,
  opts?: {
    consumos?: unknown[]
    invitados?: unknown[]
    eventoMock?: typeof EVENTO
  }
) {
  const consumos  = opts?.consumos  ?? []
  const invitados = opts?.invitados ?? INVITADOS
  const evento    = opts?.eventoMock ?? EVENTO

  await page.route('**/api/eventos.php**', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({ json: evento })
    } else if (method === 'POST') {
      await route.fulfill({
        json: { id: 1, codigo: 'CC-123456', mensaje: 'Evento creado.' },
        status: 201,
      })
    } else {
      await route.fulfill({ json: { mensaje: 'Evento actualizado.' } })
    }
  })

  await page.route('**/api/consumos.php**', async (route) => {
    const method = route.request().method()
    const url    = route.request().url()
    if (method === 'GET' && url.includes('notificaciones=1')) {
      await route.fulfill({ json: [] })
    } else if (method === 'GET') {
      await route.fulfill({ json: consumos })
    } else {
      await route.fulfill({ json: { mensaje: 'ok' }, status: 201 })
    }
  })

  await page.route('**/api/invitados.php**', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({ json: invitados })
    } else {
      await route.fulfill({
        json: { id: 2, evento_id: 1, nombre: 'Ana', token: 'test-token-ana' },
        status: 201,
      })
    }
  })

  await page.route('**/api/solicitudes.php**', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/pagos.php**',       (route) => route.fulfill({ json: [] }))
}
