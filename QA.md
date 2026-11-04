# QA — CuentasClaras

## Grupo A — Mejoras flujo restaurante (v13)

Evento de prueba: **"Prueba QA"** · código `CC-599528` · evento_id=39  
Invitados: **Invitado QA** (id=83) · **Invitado QA 2** (id=84)  
URL producción: https://easysplit.omegatecnos.com

---

## Estado de fixes — v12

| # | Fix | Estado | Notas |
|---|-----|--------|-------|
| 1 | Candado de edición host/guest (`bloqueado`) | ✅ Probado OK | Badge "El anfitrión bloqueó este ítem" visible; ítem no clickable |
| 2 | Historial solicitudes en VistaEnVivo | ✅ Verificado en código | `HistorialSolicitudes` colapsable (VistaEnVivo.tsx:749); sección peticionesUnirse en :997 |
| 3 | Botón "Revisar →" gris hasta seleccionar | ✅ Probado OK | Se activa en teal con precio al seleccionar Cerveza |
| 4 | Compartir con anfitrión / botón "Todos" | ✅ Probado OK | ModalAsignarItem muestra "Todos"; invitado ve badge "eligió" |
| 5 | "También consumí" para ítems agotados | ✅ Probado OK | Badge "⏳ Solicitud enviada al anfitrión" persiste tras polling. Fix: `PasoRegistro.tsx:50,64` `Number(invitado.id)` |
| 6 | Recuperación sesión duplicada | ✅ Probado OK | Mismo nombre recupera sesión existente con consumos intactos |
| 7 | Compartir al crear ítem (default "Los invitados eligen") | ✅ Verificado en código | `ModalAgregarItem` CargarConsumos.tsx:243 — `sinAsignar` default `true` |
| 8 | Conciliar total cuenta en CobrarYCerrar | ✅ Verificado en código | Sección "Conciliación de la cuenta" CobrarYCerrar.tsx:544 con badge "✓ Cuadrado" |

---

## Bug Fix Log

### Fix 5 — Bug `invitadoId` string vs number
**Archivo:** `src/components/invitado/PasoRegistro.tsx` líneas 50 y 64  
**Causa raíz:** PHP/PDO devuelve IDs como string; `invitado.id` llegaba como `"84"` y se guardaba así en localStorage y en `perfil`. La comparación `a.invitado_id === perfil.invitadoId` → `84 === "84"` → `false` hacía que el polling de `tambienConsumi` siempre devolviera Set vacío, revirtiendo el badge "⏳ Solicitud enviada" en <1s.  
**Fix:** Agregar `Number()` en ambas asignaciones de `invitadoId`.  
**Build generado:** `index-DWMyMPAy.js` (2026-11-04)  
**Estado:** Pendiente subir via Core FTP LE + retest

---

## Nuevas features — v13 (2026-11-04)

| # | Feature | Archivo | Estado |
|---|---------|---------|--------|
| A1 | Historial de eventos en localStorage | `src/historial.ts`, `App.tsx`, `HomePage.tsx`, `PasoRegistro.tsx` | ✅ Implementado |
| A2 | Botón "Yo no pedí esto" para invitado | `PasoElegir.tsx` — función `disputar()` | ✅ Implementado |
| A3 | Notificación del navegador al anfitrión | `VistaEnVivo.tsx` — `useEffect` con Notification API | ✅ Implementado |

---

## Checklist de deploy v13

- [ ] `dist/index.html`
- [ ] `dist/assets/index-Ce_H7hAP.js`
- [ ] `dist/assets/index-BdbS6n1X.css`
- [ ] Borrar `index-DWMyMPAy.js` del servidor (bundle v12, ya huérfano)
- [ ] Borrar `api/migrar.php` del servidor (ya ejecutado, riesgo de seguridad)

---

## Notas de arquitectura QA

- Polling cada 1s — verificar que no haya doble-disparo de efectos
- `solicitado_por: null` = asignado por anfitrión · `solicitado_por: invitado_id` = auto-asignado
- `estado: 'pendiente'` = esperando aprobación del anfitrión
- `consumos.bloqueado = 1` = anfitrión bloqueó; invitado no puede elegir

---

## Cómo retomar QA en nueva sesión

1. Leer este archivo para saber estado actual
2. Abrir https://easysplit.omegatecnos.com en browser
3. Host entra con código CC-599528
4. Invitado QA entra con código CC-599528 + nombre "Invitado QA"
5. Invitado QA 2 entra con código CC-599528 + nombre "Invitado QA 2"
6. Probar los items marcados ⏳
