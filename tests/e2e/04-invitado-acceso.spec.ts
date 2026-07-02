import { test, expect } from '@playwright/test'
import { mockApi, EVENTO } from './helpers/mocks'

test('código válido muestra la tarjeta del evento y botón para entrar', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')

  // Ir al flujo invitado
  await page.getByRole('button', { name: /Entrar con código/i }).click()

  // Cambiar al tab de código manual
  await page.getByRole('button', { name: /Tengo código/i }).click()

  // Ingresar código (solo los 6 dígitos, sin el prefijo CC-)
  await page.getByPlaceholder('000000').fill('123456')
  await page.getByRole('button', { name: /Buscar evento/i }).click()

  // Debe aparecer el nombre del evento y el botón de confirmación
  await expect(page.getByText('Cena de prueba')).toBeVisible({ timeout: 6000 })
  await expect(page.getByRole('button', { name: /Confirmar y entrar/i })).toBeVisible()
})

test('código inválido muestra mensaje de error', async ({ page }) => {
  // Mock que devuelve 404 para cualquier búsqueda de código
  await page.route('**/api/eventos.php**', (route) =>
    route.fulfill({ json: { error: 'Evento no encontrado.' }, status: 404 })
  )

  await page.goto('/')

  await page.getByRole('button', { name: /Entrar con código/i }).click()
  await page.getByRole('button', { name: /Tengo código/i }).click()

  await page.getByPlaceholder('000000').fill('999999')
  await page.getByRole('button', { name: /Buscar evento/i }).click()

  // Debe aparecer un mensaje de error
  await expect(page.getByText(/No encontramos un evento con ese código/i)).toBeVisible({ timeout: 6000 })
})

test('evento cerrado muestra error descriptivo', async ({ page }) => {
  // Mock de evento cerrado
  await mockApi(page, {
    eventoMock: { ...EVENTO, estado: 'cerrado' as const },
  })

  await page.goto('/')

  await page.getByRole('button', { name: /Entrar con código/i }).click()
  await page.getByRole('button', { name: /Tengo código/i }).click()

  await page.getByPlaceholder('000000').fill('123456')
  await page.getByRole('button', { name: /Buscar evento/i }).click()

  await expect(page.getByText(/ya fue cerrado/i)).toBeVisible({ timeout: 6000 })
})
