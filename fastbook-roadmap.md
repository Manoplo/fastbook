# Fastbook — Roadmap

## Visión

Aplicación **multitenant** de reserva de citas, con plan **gratuito** y **features premium**.

## Fase 0 — Bootstrap (actual)

- [x] Proyecto React + Vite + TypeScript
- [x] Dependencias FE: TanStack Query, React Router, Zustand
- [x] Reglas del agente Cursor (`.cursor/rules/`)
- [x] Vitest + Testing Library (tests unitarios)
- [x] CI: workflow `verify` (lint + tests en push)
- [ ] Enganche con MCP Google Stitch (diseño de pantallas)
- [ ] Enganche con MCP Supabase (BBDD / BE)

## Fase 1 — MVP de reserva (lo más simple)

Interfaz web que permita:

1. Seleccionar un **servicio**
2. Seleccionar un **día**
3. Seleccionar una **hora**
4. **Apuntarse** a esa cita

Sin paneles avanzados, pagos ni lógica premium todavía. Multitenant desde el modelo de datos (cada negocio/tenant con sus servicios y slots).

## Fase 2 — (pendiente de definir)

- Auth y roles (cliente / negocio)
- Gestión de disponibilidad del tenant
- Features premium (por definir)

## Notas

- FE: Stitch → implementación React.
- BE: Supabase (tablas, RLS, clientes).
- Stack FE ya instalado: `@tanstack/react-query`, `react-router-dom`, `zustand`.
- Tests: `pnpm test` (watch) / `pnpm test:run` (CI). Archivos `*.test.ts(x)` / `*.spec.ts(x)` en `src/`.
