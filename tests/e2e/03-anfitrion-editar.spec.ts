import { test, expect } from '@playwright/test'
import { mockApi, CC_SESION_ANFITRION } from './helpers/mocks'

// REGRESIÓN: al editar un evento, el formulario debe aparecer pre-llenado con los datos existentes.
// Bug original: los campos del formulario aparecían en blanco al entrar a editar.
// Fix en commit 24529da

test('el formulario de edición aparece pre-llenado con los datos del evento', async ({ page }) => {
  // Inyectar sesión de anfitrión con pantalla="crear-evento" para ir directo al form de edición
  await page.addInitScript((sesion) => {
    window.localStorage.setItem('cc_sesion_anfitrion', sesion)
  }, CC_SESION_ANFITRION('crear-evento'))

  await mockApi(page)
  await page.goto('/')

  // El form debe mostrar el título de edición
  await expect(page.getByRole('heading', { name: 'Editar evento' })).toBeVisible({ timeout: 6000 })

  // El campo nombre debe estar pre-llenado (placeholder del input de nombre de evento)
  await expect(page.getByPlaceholder(/Cena de cumpleaños/i)).toHaveValue('Cena de prueba')

  // El campo lugar debe estar pre-llenado
  await expect(page.getByPlaceholder(/La Docena/i)).toHaveValue('Restaurante Central')

  // El botón de acción debe decir "Guardar cambios" y NO "Crear evento"
  await expect(page.getByRole('button', { name: /Guardar cambios/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Crear evento y generar QR/i })).not.toBeVisible()
})

test('al guardar cambios se actualiza el evento sin error', async ({ page }) => {
  await page.addInitScript((sesion) => {
    window.localStorage.setItem('cc_sesion_anfitrion', sesion)
  }, CC_SESION_ANFITRION('crear-evento'))

  await mockApi(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Editar evento' })).toBeVisible({ timeout: 6000 })

  // Cambiar el nombre
  const inputNombre = page.getByPlaceholder(/Cena de cumpleaños/i)
  await inputNombre.fill('Cena editada')

  // Guardar
  await page.getByRole('button', { name: /Guardar cambios/i }).click()

  // Debe llegar a CompartirQR (el paso siguiente después de editar)
  await expect(page.getByText('CC-123456')).toBeVisible({ timeout: 6000 })
})
