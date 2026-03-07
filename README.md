# BarberPro Monorepo

BarberPro.my is a premium Malaysia-first barber shop management SaaS built as a multi-tenant platform.

## Apps

- `apps/web` - Main BarberPro product (marketing + operator workflows)
- `apps/web-admin` - Super-admin console for platform-level management
- `apps/mobile` - Expo React Native mobile app (TypeScript strict)

## Packages

- `packages/config` - Shared TypeScript base config
- `packages/env` - Shared typed environment schema helpers
- `packages/types` - Shared type placeholders
- `packages/ui` - Shared brand and design tokens

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment files:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/web-admin/.env.example apps/web-admin/.env.local
```

3. Run main web:

```bash
pnpm dev:web
```

4. Run admin web (super-admin):

```bash
pnpm dev:admin
```

5. Run mobile app:

```bash
pnpm dev:mobile
```

## Workspace Scripts

- `pnpm dev:web` - Start main web app (port 3000)
- `pnpm dev:admin` - Start super-admin app (port 3002)
- `pnpm build:web|build:admin` - Build each web app
- `pnpm start:web|start:admin` - Run each web app
- `pnpm lint:web|lint:admin` - Lint each web app
- `pnpm typecheck:web|typecheck:admin` - Typecheck each web app
- `pnpm dev:mobile` - Start Expo dev server
- `pnpm typecheck:mobile` - Run mobile TypeScript checks

## Structure

```text
apps/
  web/
    src/
      app/
  web-admin/
    src/app/
  mobile/
packages/
  config/
  env/
  types/
  ui/
docs/
```
