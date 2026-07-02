import { test, expect } from '@playwright/test'
import { mockApi, CC_SESION_ANA, CONSUMO_HOST_ASIGNADO } from './helpers/mocks'

// REGRESIÓN: los botones de porcentaje rápido (5%, 10%, 15%) deben mover el slider a esa posición.
//
// Bug original: al hacer clic en un botón de % rápido, se actualizaba propinaPct
// pero NO se actualizaba sliderVal. El slider mantiene su posición como valor visual
// independiente → se quedaba en 0 aunque el % activo cambiara.
//
// Fix en commit d5452e9: handleBotonPropina ahora también llama setSliderVal(pct),
// y el slider usa value={pctActivo} (= propinaPct ó sliderVal según modo).

import type { Page } from '@playwright/test'

async function llegarAPasoResumen(page: Page) {
  await page.addInitScript((sesion) => {
    window.localStorage.setItem('cc_sesion', sesion)
  }, CC_SESION_ANA)

  // El item del host asignado tiene cantidad=1 en cantidades → habilita "Revisar →"
  await mockApi(page, { consumos: [CONSUMO_HOST_ASIGNADO] })
  await page.goto('/')

  await expect(page.getByText('Tacos al pastor')).toBeVisible({ timeout: 8000 })
  await page.getByRole('button', { name: /Revisar/i }).click()
  await expect(page.getByText(/Resumen de Ana/i)).toBeVisible({ timeout: 8000 })
}

test('los botones de % rápido sincronizan el slider a la posición correcta', async ({ page }) => {
  await llegarAPasoResumen(page)

  const slider = page.locator('input[type="range"]')

  // Estado inicial: slider en 0
  await expect(slider).toHaveValue('0')

  // Clic en 10%
  await page.getByRole('button', { name: '10%' }).click()
  await expect(slider).toHaveValue('10')

  // Clic en 5% (exact: true para no matchear "15%")
  await page.getByRole('button', { name: '5%', exact: true }).click()
  await expect(slider).toHaveValue('5')

  // Clic en 15%
  await page.getByRole('button', { name: '15%', exact: true }).click()
  await expect(slider).toHaveValue('15')

  // Volver a Sin propina
  await page.getByRole('button', { name: 'Sin propina' }).click()
  await expect(slider).toHaveValue('0')
})

test('el total cambia al seleccionar propina con botón de %', async ({ page }) => {
  await llegarAPasoResumen(page)

  // Subtotal = 150 / 3 piezas × 1 cantidad = $50
  // Con 10%: total = $50 + $5 = $55
  await page.getByRole('button', { name: '10%' }).click()

  // El total debe reflejar la propina (buscar $55 en el resumen)
  await expect(page.getByText('$55')).toBeVisible({ timeout: 3000 })
})

test('el slider personalizado actualiza el porcentaje mostrado', async ({ page }) => {
  await llegarAPasoResumen(page)

  // Activar modo slider haciendo clic en "Personalizado"
  await page.getByText('Personalizado').click()

  const slider = page.locator('input[type="range"]')
  await slider.fill('20')

  // El porcentaje debe aparecer en el label del slider (span con font-black junto al botón "Personalizado")
  // Hay múltiples "20%" en la UI (marcas del slider, propina), tomamos el label específico
  await expect(page.locator('span.font-black').filter({ hasText: '20%' })).toBeVisible({ timeout: 3000 })
})
