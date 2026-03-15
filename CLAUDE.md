# CLAUDE.md

Guía de contexto para Claude Code en este repositorio.

## Proyecto

**CuentasClaras** — *Cuentas claras, amistades largas.*

App web para dividir cuentas y gastos compartidos en restaurantes, reuniones en casa, viajes en grupo y entre roomies. Sin descarga, 100% desde el navegador. Idioma: **Español (México)**.

- **GitHub:** https://github.com/tazciego/cuentasclaras
- **Estado:** Frontend 100% completo · Backend PHP esqueleto listo · Pendiente integración front↔back

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript, Vite 8 |
| Estilos | Tailwind CSS 4, shadcn/ui |
| Navegación | `useState` con unión de tipos `Pantalla` (sin React Router) |
| Backend | PHP 8 + PDO (archivos en `/api`) |
| Base de datos | MySQL 8 / MariaDB 10.5 |
| Pagos (pendiente) | Conekta (tarjeta) + SPEI (transferencia bancaria) |
| Build | `npm run build` → carpeta `dist/` lista para subir al servidor |

---

## Roles y colores de marca

| Rol | Color | Hex |
|-----|-------|-----|
| Anfitrión | Morado | `#534AB7` |
| Invitado | Teal | `#2EC4B6` |
| Roomies | Guinda | `#8B1A3A` |

---

## Pantallas construidas y funcionando

### Pantalla de inicio
- `HomePage.tsx` — Hero, tarjetas de casos de uso, 3 botones de rol con features, pasos, campo de código de invitación

### Flujo Anfitrión (morado · 5 pasos)
| Archivo | Pantalla |
|---------|---------|
| `CrearEvento.tsx` | Nombre, tipo (restaurante/reunión/viaje), fecha, hora, lugar, participantes |
| `CompartirQR.tsx` | QR simulado, código CC-XXXX, compartir por WhatsApp/Telegram/copiar |
| `CargarConsumos.tsx` | Captura de ítems (foto/menú/manual), asignación de avatares |
| `VistaEnVivo.tsx` | Tabs por platillo / por invitado, estado de pagos en tiempo real |
| `CobrarYCerrar.tsx` | Barra de cobro, confirmar pagos en efectivo, modal cierre, **pantalla celebración confetti** |

### Flujo Invitado (teal · 5 pasos)
| Archivo | Pantalla |
|---------|---------|
| `PasoAcceso.tsx` | Escanear QR o ingresar código CC-XXXX |
| `PasoRegistro.tsx` | Nombre + selector de color de avatar |
| `PasoElegir.tsx` | Lista de ítems disponibles, toggle compartido, precio calculado en tiempo real |
| `PasoResumen.tsx` | Subtotal, slider de propina (0–30%), botones rápidos 5/10/15% |
| `PasoPago.tsx` | SPEI (CLABE), tarjeta (formulario completo), efectivo · **pantalla celebración confetti teal** |

### Flujo Reunión / Viaje (morado · 5 pantallas)
| Archivo | Pantalla |
|---------|---------|
| `ReunionCrear.tsx` | Nombre del grupo, tipo (reunión/viaje), agregar participantes con colores |
| `ReunionGastos.tsx` | Hub de gastos, tabs por platillo / por persona, modal foto |
| `ReunionAgregarGasto.tsx` | Descripción, monto, "varios pagamos" toggle, división igual/personalizada |
| `ReunionBalances.tsx` | Barras de balance, línea promedio, transferencias mínimas |
| `ReunionCierre.tsx` | Resumen tarjeta estilo app, estado pagos, enviar por WhatsApp, **pantalla celebración confetti** |

### Flujo Roomies (guinda · 4 pantallas)
| Archivo | Pantalla |
|---------|---------|
| `RoomiesCrear.tsx` | Nombre de la casa, lista de roomies con selector de color, invitar por WhatsApp |
| `RoomiesGastos.tsx` | Filtro por mes, sección recurrentes vs gastos del mes, tarjeta balance personal |
| `RoomiesAgregarGasto.tsx` | 5 categorías, toggle recurrente, división igual/personalizada |
| `RoomiesBalances.tsx` | Barras bidireccionales, transferencias mínimas, "Cobrar" por WhatsApp, **pantalla celebración** |

### Componentes globales
| Archivo | Función |
|---------|---------|
| `Calculadora.tsx` | FAB fijo `z-index:9999`, modal bottom-sheet, 3 tabs: General / Dividir / Propina |
| `Confetti.tsx` | Animación CSS reutilizable, configurable por colores y cantidad |
| `BarraProgreso.tsx` | Barra de 5 pasos para el flujo del anfitrión |

---

## Estructura de archivos

```
cuentasclaras/
├── api/                          # Backend PHP
│   ├── conexion.php              # Config DB (llenar credenciales) + helpers PDO
│   ├── eventos.php               # CRUD eventos
│   ├── invitados.php             # Unirse a evento, registro con token
│   ├── consumos.php              # Ítems + tabla pivot consumos_invitados
│   ├── pagos.php                 # Registrar y confirmar pagos
│   └── schema.sql                # CREATE TABLE completo para MySQL
│
├── src/
│   ├── App.tsx                   # Router central con useState<Pantalla>
│   ├── types.ts                  # Tipos compartidos del flujo anfitrión
│   ├── main.tsx
│   ├── index.css
│   │
│   └── components/
│       ├── HomePage.tsx
│       ├── Calculadora.tsx       # FAB global, siempre visible
│       ├── Confetti.tsx          # Animación reutilizable
│       ├── BarraProgreso.tsx
│       ├── CrearEvento.tsx
│       ├── CompartirQR.tsx
│       ├── CargarConsumos.tsx
│       ├── VistaEnVivo.tsx
│       ├── CobrarYCerrar.tsx
│       │
│       ├── invitado/
│       │   ├── InvitadoFlow.tsx  # Orquestador + tipos + Header + Avatar
│       │   ├── PasoAcceso.tsx
│       │   ├── PasoRegistro.tsx
│       │   ├── PasoElegir.tsx
│       │   ├── PasoResumen.tsx
│       │   └── PasoPago.tsx
│       │
│       ├── reunion/
│       │   ├── ReunionFlow.tsx   # Orquestador + tipos + utilidades
│       │   ├── ReunionCrear.tsx
│       │   ├── ReunionGastos.tsx
│       │   ├── ReunionAgregarGasto.tsx
│       │   ├── ReunionBalances.tsx
│       │   └── ReunionCierre.tsx
│       │
│       └── roomies/
│           ├── RoomiesFlow.tsx   # Orquestador + tipos + COLORES_ROOMIES
│           ├── RoomiesCrear.tsx
│           ├── RoomiesGastos.tsx
│           ├── RoomiesAgregarGasto.tsx
│           └── RoomiesBalances.tsx
│
├── public/
│   └── .htaccess                 # SPA routing + caché assets + gzip (Apache)
│
├── dist/                         # Build de producción (no en git)
├── .gitignore
├── .gitattributes                # LF unificado
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Patrón de arquitectura frontend

Todos los flujos siguen el mismo patrón:

```tsx
// 1. El orquestador (XxxFlow.tsx) exporta tipos, constantes y componentes compartidos
export type Pantalla = "crear" | "gastos" | "agregar" | "balances"
export interface MiTipo { ... }
export function HeaderXxx(...) { ... }
export function calcularBalances(...) { ... }

// 2. Navegación sin React Router
const [pantalla, setPantalla] = useState<Pantalla>("crear")
if (pantalla === "crear") return <XxxCrear onVolver={...} onCreado={...} />

// 3. La Calculadora vive en App.tsx y se inyecta globalmente
return <> {renderPantalla()} <Calculadora /> </>
```

---

## Backend PHP — Contrato de la API

| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `api/eventos.php` | GET, POST, PUT, DELETE | CRUD de eventos |
| `api/invitados.php` | GET, POST, PUT, DELETE | Participantes por evento |
| `api/consumos.php` | GET, POST, PUT, DELETE | Ítems + asignaciones |
| `api/pagos.php` | GET, POST, PUT, DELETE | Pagos y confirmaciones |

Todas las respuestas son JSON. Headers CORS abiertos (`*`). Ver `conexion.php` para helpers.

---

## Despliegue

### Servidor FTP
```
Host:     <!-- COMPLETAR -->
Usuario:  <!-- COMPLETAR -->
Puerto:   21
Carpeta:  <!-- COMPLETAR, ej: /public_html o /www -->
```

### Pasos para deploy
1. `npm run build` → genera `dist/`
2. Subir contenido de `dist/` a la raíz web del servidor
3. Subir carpeta `api/` al servidor (misma raíz o subdirectorio)
4. Ejecutar `api/schema.sql` en MySQL
5. Completar credenciales en `api/conexion.php`:
   ```php
   define('DB_HOST',     'localhost');
   define('DB_NAME',     'nombre_bd');
   define('DB_USER',     'usuario');
   define('DB_PASSWORD', 'contraseña');
   ```

### Build output actual
```
dist/assets/index.css    37 kB  (gzip: 7 kB)
dist/assets/index.js    393 kB  (gzip: 99 kB)
```

---

## Lo que falta por hacer

### Alta prioridad
- [ ] **Conectar frontend con API PHP** — reemplazar datos mock por fetch/axios a los endpoints
- [ ] **Autenticación** — token de invitado en `localStorage`, validación en cada request
- [ ] **Estados de carga** — skeletons y spinners mientras se consulta la API
- [ ] **Manejo de errores** — toasts o mensajes cuando falla una petición

### Media prioridad
- [ ] **Pagos reales** — integrar Conekta SDK para tarjeta y generar referencias SPEI
- [ ] **QR funcional** — generar QR real con la URL del evento (`qrcode` npm o API)
- [ ] **Cámara real** — conectar `PasoAcceso` y `CargarConsumos` a `getUserMedia`
- [ ] **Notificaciones** — avisar al anfitrión cuando un invitado se une o paga
- [ ] **Flujo Restaurante** — está en `HomePage` pero no tiene flujo propio todavía

### Baja prioridad
- [ ] **Tests** — Vitest + Testing Library para componentes críticos
- [ ] **PWA** — `vite-plugin-pwa` para instalar en móvil
- [ ] **Modo oscuro** — ya hay variables Tailwind, falta implementar el toggle
- [ ] **Historial** — pantalla de eventos pasados por usuario

---

## Commands

```bash
# Desarrollo
npm install
npm run dev

# Verificar tipos
npx tsc --noEmit

# Build de producción
npm run build

# Lint
npm run lint
```

---

## Git

```bash
# Repositorio
git remote: https://github.com/tazciego/cuentasclaras.git
rama principal: main

# Flujo de trabajo
git add <archivos>
git commit -m "tipo: descripción"
git push
```
