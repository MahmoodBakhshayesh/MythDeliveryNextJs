# {{APP_NAME}} — Agent guide (Next.js web)

Web-first Next.js app. Optimized for **performance**, **reuse**, and **mobile-friendly** layouts (responsive shell + touch targets). Not a Flutter port unless noted.

## Architecture (default: 4 layers)

`View → Controller (hook) → UseCase → Repository`

| Layer | Location | Rules |
|-------|----------|--------|
| Page | `src/app/**/page.tsx` | Thin: `const vm = useXController(); return <XView {...vm} />` |
| View | `features/*/views/*.view.tsx` | Presentational; props from controller VM |
| Controller | `features/*/controllers/*.controller.ts` | `useXController()` — Query/Mutation + UI state; **calls use cases only** |
| Use case | `features/*/usecases/*.usecase.ts` | One operation; unwrap `AppResponse` / throw |
| Repository | `features/*/repositories/*.repository.ts` | `apiJson` only; no React |

Optional 5th layer **`data/datasources/`** only for offline/cache splits.

## Shared infrastructure

- **`src/lib/api-client.ts`** — `apiJson`, auth refresh (do not duplicate `fetch` in features).
- **`src/lib/query-keys.ts`** — all TanStack Query keys.
- **`src/lib/env.ts`** — `NEXT_PUBLIC_*` access.
- **`src/stores/`** — client session (e.g. Zustand); not server lists.
- **`src/components/ui/`** — shadcn primitives; extend, don’t fork.
- **`src/components/layout/`** — `MainShell`, guards, mobile nav Sheet.

## Routes

- Prefer **`src/lib/route-paths.ts`** (or `core/constants/appRoutePaths.ts`) for path strings used in more than one file.
- Role-based home: centralize in `lib/roles.ts` (or equivalent).

## Mobile on web

- Shell: sidebar `md+`, header + **Sheet** nav `< md` (see `MainShell`).
- Content: `min-w-0`, `max-w-*` main column, adequate tap targets (`size="icon"` ≥ 44px touch area).
- Optional **phone column** `max-w-[600px] mx-auto` for consumer flows.
- Use `env(safe-area-inset-*)` on sticky headers when supporting notched devices.

## Commands

- `npm run dev` / `npm run build` / `npm run lint`

## New feature checklist

1. `domain/*.types.ts`
2. `repositories/*.repository.ts` → `apiJson`
3. `usecases/*.usecase.ts`
4. `controllers/*-page.controller.ts` → `useQuery` / `useMutation`
5. `views/*-page.view.tsx`
6. `app/.../page.tsx`
7. Register `queryKeys` entries

## Cursor rules

Copy from **`cursor-rules-pack/.cursor/rules/`** in this repo (or sibling projects using the same pack).
