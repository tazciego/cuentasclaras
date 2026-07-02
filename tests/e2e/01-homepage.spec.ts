import { test, expect } from '@playwright/test'

test('pantalla de inicio carga con logo y botones de rol', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('CuentasClaras').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Crear evento/i }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Entrar con código/i })).toBeVisible()
})
