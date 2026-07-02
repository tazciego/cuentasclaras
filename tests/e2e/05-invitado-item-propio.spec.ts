import { test, expect } from '@playwright/test'
import { mockApi, CC_SESION_ANA, CONSUMO_HOST_ASIGNADO, CONSUMO_INVITADO_PROPIO } from './helpers/mocks'

// REGRESIÓN: un item elegido por el propio invitado NO debe aparecer en morado/bloqueado.
//
// Bug original: consumos.php PUT (llamado por el anfitrión al confirmar asignaciones)
// borraba el campo solicitado_por al hacer DELETE + INSERT, convirtiendo el valor
// del invitado (solicitado_por = invitado_id) en NULL. El frontend interpreta
// solicitado_por = NULL como "asignado por anfitrión" → muestra badge morado y bloquea.
//
// Fix en commit 303ffac: consumos.php PUT preserva los valores de solicitado_por antes
// de borrar y los restaura al reinsertar.

test('item con solicitado_por = invitado_id NO muestra badge morado', async ({ page }) => {
  await page.addInitScript((sesion) => {
    window.localStorage.setItem('cc_sesion', sesion)
  }, CC_SESION_ANA)

  // solicitado_por = 2 (Ana misma elegió este item)
  await mockApi(page, { consumos: [CONSUMO_INVITADO_PROPIO] })
  await page.goto('/')

  // Esperar a que carguen los items en PasoElegir
  await expect(page.getByText('Tacos al pastor')).toBeVisible({ timeout: 8000 })

  // NO debe aparecer el badge de "El anfitrión te asignó este item"
  await expect(page.getByText(/El anfitrión te asignó este item/)).not.toBeVisible()
})

test('item con solicitado_por = null SÍ muestra badge morado (comportamiento esperado)', async ({ page }) => {
  await page.addInitScript((sesion) => {
    window.localStorage.setItem('cc_sesion', sesion)
  }, CC_SESION_ANA)

  // solicitado_por = null → asignado por el anfitrión → debe bloquearse
  await mockApi(page, { consumos: [CONSUMO_HOST_ASIGNADO] })
  await page.goto('/')

  await expect(page.getByText('Tacos al pastor')).toBeVisible({ timeout: 8000 })

  // SÍ debe aparecer el badge
  await expect(page.getByText(/El anfitrión te asignó este item/)).toBeVisible({ timeout: 5000 })
})
