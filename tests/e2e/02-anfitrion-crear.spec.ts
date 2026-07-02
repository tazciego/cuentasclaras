import { test, expect } from '@playwright/test'
import { mockApi } from './helpers/mocks'

test('anfitrión llena el formulario y llega a CompartirQR con el código del evento', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')

  // Ir a crear evento (botón en tarjeta de rol)
  await page.getByRole('button', { name: /Crear evento/i }).first().click()

  // Rellenar formulario
  await page.getByPlaceholder(/Fer, Ana, El Chivo/i).fill('Carlos')
  await page.getByPlaceholder(/Cena de cumpleaños/i).fill('Cena de prueba')

  // Seleccionar tipo "Restaurante o bar"
  await page.getByText('Restaurante o bar').click()

  // Enviar
  await page.getByRole('button', { name: /Crear evento y generar QR/i }).click()

  // Debe llegar a CompartirQR y mostrar el código
  await expect(page.getByText('CC-123456')).toBeVisible({ timeout: 6000 })
})
