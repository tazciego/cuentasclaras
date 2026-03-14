# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

**CuentasClaras** — *Cuentas claras, amistades largas.*

App web para dividir cuentas y gastos compartidos en restaurantes, reuniones en casa, viajes en grupo y entre roomies. Sin descarga, 100% desde el navegador. Idioma: **Español (México)**.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript, Vite |
| Estilos | Tailwind CSS, shadcn/ui |
| Backend | Node.js + Express (por definir) |
| Base de datos | PostgreSQL o Firebase (por definir) |
| Pagos | Conekta (tarjeta de crédito/débito) y SPEI (transferencia bancaria) |

---

## Roles y colores

| Rol | Color | Hex |
|-----|-------|-----|
| Anfitrión | Morado | `#534AB7` |
| Invitado | Teal | `#2EC4B6` |
| Roomies | Guinda | `#8B1A3A` |

---

## Flujos principales

1. **Restaurante** — división de cuenta en el momento, en el lugar
2. **Reunión / Viaje** — gastos compartidos a lo largo de un evento
3. **Roomies** — gastos recurrentes entre compañeros de casa
4. **Calculadora** — herramienta rápida de división sin contexto de grupo

---

## Commands

> Completar cuando el proyecto esté inicializado.

### Instalar dependencias
```bash
npm install
```

### Servidor de desarrollo
```bash
npm run dev
```

### Build de producción
```bash
npm run build
```

### Tests
```bash
npm test
# Un solo archivo:
# npm test -- --testPathPattern=NombreDelArchivo
```

### Lint
```bash
npm run lint
```

---

## Arquitectura

> Describir la estructura en detalle conforme el proyecto avance. Puntos clave a documentar:
> - Estructura de carpetas del frontend (`src/`)
> - Contrato de la API REST (rutas, modelos)
> - Decisión final: PostgreSQL vs Firebase
> - Integración con Conekta y SPEI
