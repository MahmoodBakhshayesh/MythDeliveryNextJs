# Myth Delivery Web — Agent guide

Web-first Next.js client for the Myth Delivery API. **Mobile-friendly** (responsive shell + optional narrow phone column). Architecture matches production code in this repo; portable rules live in **`cursor-rules-pack/`**.

## Architecture (4 layers)

`View → Controller (hook) → UseCase → Repository → apiJson`

| Layer | Location | Rules |
|-------|----------|--------|
| Page | `src/app/**/page.tsx` | Thin: controller + view |
| View | `features/*/views/*.view.tsx` | Presentational only |
| Controller | `features/*/controllers/*.controller.ts` | `use*Controller` — Query/Mutation + UI state; **use cases only** |
| Use case | `features/*/usecases/*.usecase.ts` | Unwrap `AppResponse`; throw on error |
| Repository | `features/*/repositories/*.repository.ts` | `apiJson` only |

No separate **DataSource** layer unless you add offline/local cache splits.

## Infrastructure

- **`src/lib/api-client.ts`** — `apiJson`, token refresh
- **`src/lib/query-keys.ts`** — TanStack Query keys
- **`src/lib/env.ts`**, **`api-types.ts`**, **`roles.ts`**, JWT helpers
- **`src/stores/auth-store.ts`** — session (Zustand)
- **`src/providers/app-providers.tsx`** — QueryClient, theme, toaster
- **`src/components/layout/main-shell.tsx`** — sidebar (desktop) + Sheet nav (mobile)

## Mobile on web

- Default shell: **`MainShell`** — `md:` sidebar, mobile header + drawer.
- Main content: `max-w-6xl` centered column.
- Consumer/driver flows may use **`max-w-[600px]`** single column when UX should feel app-like.

## Commands

- `npm run dev` — http://127.0.0.1:3000
- `npm run build`
- `npm run lint`

## New feature checklist

1. `domain/*.types.ts`
2. `repositories/*.repository.ts`
3. `usecases/*.usecase.ts`
4. `controllers/*-page.controller.ts`
5. `views/*-page.view.tsx`
6. `app/.../page.tsx`
7. `queryKeys` in `@/lib/query-keys`

## Cursor rules

- **Active rules:** `.cursor/rules/` (synced from pack)
- **Copy to other projects:** `cursor-rules-pack/README.md`
- **Brewlab-style extras** (route-paths module, unified form widgets, DI container): only when the pack’s “When to add brewlab-style extras” table applies

## API backend

ASP.NET **MythDeliveryWebApi** — responses use `AppResponse` envelope; mirror types in `@/lib/api-types` and `@/types/api`.
