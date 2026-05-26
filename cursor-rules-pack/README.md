# Next.js web rules pack (Myth Delivery baseline)

**Web-first** Next.js conventions for product apps that also work well on **phones and tablets**. Based on **myth-delivery-web**; borrows selective patterns from **brewlab** (route constants, shared form chrome, core bootstrap) without Flutter-mirror boilerplate.

## Install on any project

```text
cursor-rules-pack/.cursor/rules/*  →  YOUR_PROJECT/.cursor/rules/
cursor-rules-pack/AGENTS.template.md  →  YOUR_PROJECT/AGENTS.md  (edit placeholders)
```

This repo (**myth-delivery-web**) already has rules active under **`.cursor/rules/`** (copied from this pack). Re-copy from `cursor-rules-pack/` after you change the pack to refresh other projects.

## Rule index

| File | Scope |
|------|--------|
| `nextjs-web-architecture-always.mdc` | Always — layering, folders |
| `nextjs-feature-layering-always.mdc` | Always — `src/features/*` |
| `nextjs-controller-boundary-always.mdc` | Always — hooks, use cases, repos |
| `nextjs-lib-and-api.mdc` | `src/lib/**` |
| `nextjs-performance-query.mdc` | Query, bundles, lists |
| `nextjs-ui-mobile-shell.mdc` | Layout, responsive, shadcn |
| `nextjs-routes-auth.mdc` | App Router, auth, route constants |
| `nextjs-forms-fields.mdc` | Forms, validation, shared fields |

## Standard layout

```text
src/
  app/                 # routes (thin pages)
  components/          # shared layout + ui (shadcn)
  features/<feature>/
    domain/
    repositories/
    usecases/
    controllers/       # useXPageController hooks
    views/             # presentational
    components/        # feature-only UI
  lib/                 # apiJson, env, queryKeys, roles
  stores/              # client session (Zustand)
  providers/
  hooks/               # cross-feature hooks (optional)
```

## When to add brewlab-style extras

| Pattern | Add when |
|---------|----------|
| `src/core/` + `ApiService` class | Multiple backends, retries, shared interceptors beyond `apiJson` |
| `data/datasources/` split | Real offline cache ≠ remote API |
| `createAppContainer()` | Many features and strict DI testing |
| `widgets/unified_inputs/` | Many forms must match mobile field chrome |
| `max-w-[600px]` phone shell | Consumer app; desktop shows phone column |

Default: **stay on 4 layers** (no DataSource) until one of the above applies.
