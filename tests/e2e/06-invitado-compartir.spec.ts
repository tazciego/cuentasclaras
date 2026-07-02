import { test, expect } from '@playwright/test'
import { mockApi, CC_SESION_ANA, CONSUMO_LIBRE, INVITADOS } from './helpers/mocks'

// REGRESIÓN: el anfitrión debe aparecer en la lista "Compartir item".
//
// Bug original: la lista filtraba invitados con !inv.es_anfitrion, excluyendo al anfitrión.
// Fix en commit 6806348: se removió ese filtro y el anfitrión aparece primero con etiqueta "(anfitrión)".

test('el anfitrión aparece en la lista de compartir y con etiqueta "(anfitrión)"', async ({ page }) => {
  await page.addInitScript((sesion) => {
    window.localStorage.setItem('cc_sesion', sesion)
  }, CC_SESION_ANA)

  await mockApi(page, { consumos: [CONSUMO_LIBRE], invitados: INVITADOS })
  await page.goto('/')

  // Esperar a que cargue PasoElegir
  await expect(page.getByText('Tacos al pastor')).toBeVisible({ timeout: 8000 })

  // Seleccionar el item para activar el botón de compartir
  await page.getByText('Tacos al pastor').click()

  // Esperar a que aparezca el botón "Compartir con…"
  await expect(page.getByText(/Compartir con/i)).toBeVisible({ timeout: 3000 })
  await page.getByText(/Compartir con/i).click()

  // El modal debe abrirse y mostrar "Compartir item"
  await expect(page.getByRole('heading', { name: 'Compartir item' })).toBeVisible({ timeout: 3000 })

  // El anfitrión (Carlos) debe aparecer en la lista
  await expect(page.getByText('Carlos')).toBeVisible()

  // Debe tener la etiqueta "(anfitrión)"
  await expect(page.getByText('(anfitrión)')).toBeVisible()
})

test('la lista de compartir no contiene al invitado actual (Ana)', async ({ page }) => {
  await page.addInitScript((sesion) => {
    window.localStorage.setItem('cc_sesion', sesion)
  }, CC_SESION_ANA)

  await mockApi(page, { consumos: [CONSUMO_LIBRE], invitados: INVITADOS })
  await page.goto('/')

  await expect(page.getByText('Tacos al pastor')).toBeVisible({ timeout: 8000 })
  await page.getByText('Tacos al pastor').click()
  await expect(page.getByText(/Compartir con/i)).toBeVisible({ timeout: 3000 })
  await page.getByText(/Compartir con/i).click()

  await expect(page.getByRole('heading', { name: 'Compartir item' })).toBeVisible({ timeout: 3000 })

  // La lista tiene exactamente un botón (Carlos) — Ana no debe aparecer como opción
  const filaAnfitrion = page.locator('button').filter({ hasText: 'Carlos' })
  await expect(filaAnfitrion).toHaveCount(1)

  // Verificar explícitamente que Ana no está en la lista del modal
  // (Ana aparece en otros lugares de la UI, así que buscamos dentro del modal)
  const modal = page.locator('.fixed.inset-0').last()
  const nombresEnLista = modal.locator('button').filter({ hasText: 'Ana' })
  await expect(nombresEnLista).toHaveCount(0)
})
