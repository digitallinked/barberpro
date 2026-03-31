# Mobile Strategy

## Overview

BarberPro has two planned mobile apps, built with Expo (React Native). Both target the Expo SDK 53+ ecosystem and use EAS Build for production builds.

**Guiding principle:** Validate features on web first, then bring them to mobile. The customer portal at `barberpro.my` ships before `apps/mobile-customer`. This ensures we build the right mobile experience, not a guess.

---

## Apps

### `apps/mobile-customer` — Customer App
**Target:** iOS 16+, Android 10+
**Audiences:** End customers who visit barber shops

The primary reason to build this app is **push notifications** — telling customers "You're #2 in queue, head over now" is a native-only capability that drives shop adoption and customer satisfaction.

**Feature priority:**

| Priority | Feature | Notes |
|---|---|---|
| P0 | Push notification: queue position update | Core value prop |
| P0 | Live queue position screen | Uses Supabase Realtime |
| P0 | Customer signup / login | Supabase Auth |
| P1 | Shop discovery (list + map) | Browse shops near me |
| P1 | Shop profile page | Services, barbers, hours, live queue badge |
| P1 | Book appointment | Pick service → barber → time |
| P1 | Upcoming & past bookings | |
| P2 | Loyalty points wallet | Points balance, history |
| P2 | QR code scanner | Scan shop QR to join queue |
| P2 | Push notification: booking reminder | Day before + 1 hour before |
| P3 | Rewards redemption | |
| P3 | Customer subscription | Premium plan (future) |

---

### `apps/mobile-staff` — Staff App
**Target:** iOS 16+, Android 10+
**Audience:** Barbers and shop staff (not owners — they use the web dashboard)

Build this **after** `apps/mobile-customer`. Staff primarily work on in-shop tablets where the web dashboard works fine. The main value of a staff native app is push notifications and quick queue management from personal phones.

**Feature priority:**

| Priority | Feature | Notes |
|---|---|---|
| P0 | Login (role detection) | Same Supabase Auth |
| P0 | Today's schedule | Appointments assigned to me |
| P0 | Queue view | Current branch queue status |
| P1 | Clock in / clock out | Attendance recording |
| P1 | Mark serving / done | Quick queue actions |
| P1 | Commission dashboard | Today, week, month summary |
| P2 | Push notification: new booking assigned | |
| P2 | Push notification: queue approaching | |

---

## Technology Stack

### Core Framework
- **Expo SDK 53+** with **Expo Router** (file-based routing, same mental model as Next.js App Router)
- **React Native 0.79+**
- **TypeScript** strict mode

### UI
- **NativeWind** — Tailwind CSS for React Native. Keeps the same design vocabulary as the web apps.
- **`packages/ui-native`** — shared design tokens and base components

### Data & Auth
- **`@supabase/supabase-js`** — same Supabase project as web
- **`expo-secure-store`** — secure token storage (replaces cookies on native)
- **`@tanstack/react-query`** — same data fetching patterns as web apps
- **Supabase Realtime** — live queue updates via WebSocket

### Notifications
- **`expo-notifications`** — local and push notifications
- **`packages/notifications`** — shared push token registration and notification helpers
- **Expo Push Notification Service** — handles APNs (iOS) and FCM (Android) delivery
- **Trigger:** Supabase Edge Function or Vercel Cron monitors queue state changes and calls the Expo Push API

### Navigation
- **Expo Router** with tab navigator as the root layout:
  ```
  app/
    (auth)/
      login.tsx
      signup.tsx
    (app)/
      _layout.tsx        — tab navigator
      index.tsx          — home / queue status
      discover.tsx       — shop discovery
      bookings.tsx       — my bookings
      profile.tsx        — account settings
    shop/[slug].tsx      — shop profile
    queue/[ticketId].tsx — live queue screen
  ```

### Build & Distribution
- **EAS Build** — cloud builds for iOS and Android
- **EAS Update** — over-the-air JS updates (no App Store review for JS-only changes)
- **EAS Submit** — automated App Store and Play Store submission

---

## Shared Code Strategy

Maximize reuse between web and mobile via shared packages:

| Shared from | Package | What's shared |
|---|---|---|
| DB queries | `@barberpro/db` | Supabase client creation, typed queries |
| Auth helpers | `@barberpro/auth` | Auth context, role checking |
| Types | `@barberpro/types` | DB types, shared interfaces |
| Push notifications | `@barberpro/notifications` | Push token registration, notification helpers |
| UI tokens | `@barberpro/ui-native` | Colors, spacing, typography primitives |

Business logic (API call, Supabase query, validation) should be written once in `packages/` and consumed by both web and mobile.

---

## Authentication Flow (Mobile)

```
App launch
  └── Check expo-secure-store for existing session token
      ├── Token found → restore Supabase session → navigate to (app)
      └── No token → navigate to (auth)/login

Login screen
  └── supabase.auth.signInWithPassword(email, password)
      ├── Success → store session in expo-secure-store → detect role
      │   ├── role: customer → navigate to (app) customer tabs
      │   └── role: barber/staff → navigate to (app) staff tabs
      └── Error → show error message

Session expiry
  └── Supabase JS auto-refreshes the token using the stored refresh token
```

**Never store tokens in AsyncStorage** — use `expo-secure-store` which uses the iOS Keychain and Android Keystore.

---

## Push Notification Architecture

```
1. User installs app → expo-notifications.getExpoPushTokenAsync()
2. App saves token to Supabase: customers.expo_push_token or staff_profiles.expo_push_token
3. Event occurs (queue position changes, booking confirmed, etc.)
4. Supabase Edge Function / Vercel Cron detects the event
5. Edge Function calls Expo Push API: https://exp.host/--/api/v2/push/send
6. Expo routes to APNs (iOS) or FCM (Android)
7. User receives notification
```

### Token Storage (DB Migration Required)
```sql
alter table public.customers add column if not exists expo_push_token text;
alter table public.staff_profiles add column if not exists expo_push_token text;
```

### Notification Types

| Trigger | Audience | Message |
|---|---|---|
| Queue position ≤ 3 | Customer | "You're #2 in queue — head to the shop now!" |
| Queue position called | Customer | "It's your turn at [Shop Name]!" |
| Booking confirmed | Customer | "Your booking at [Shop Name] is confirmed for [date]" |
| Booking reminder | Customer | "Reminder: You have an appointment in 1 hour at [Shop Name]" |
| New booking assigned | Staff | "New appointment: [Customer] at [time] for [Service]" |
| Queue approaching | Staff | "Next customer [Customer Name] is ready" |

---

## `app.json` Configuration

Both mobile apps share the base scheme `barberpro://` for deep links:

**Customer app (`apps/mobile-customer/app.json`):**
```json
{
  "expo": {
    "name": "BarberPro",
    "slug": "barberpro-customer",
    "scheme": "barberpro",
    "version": "1.0.0",
    "ios": { "bundleIdentifier": "my.barberpro.customer" },
    "android": { "package": "my.barberpro.customer" },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-notifications", { "color": "#1a1a2e" }]
    ]
  }
}
```

**Staff app (`apps/mobile-staff/app.json`):**
```json
{
  "expo": {
    "name": "BarberPro Staff",
    "slug": "barberpro-staff",
    "scheme": "barberpro-staff",
    "version": "1.0.0",
    "ios": { "bundleIdentifier": "my.barberpro.staff" },
    "android": { "package": "my.barberpro.staff" },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-notifications", { "color": "#1a1a2e" }]
    ]
  }
}
```

---

## EAS Configuration (`eas.json`)

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "team@barberpro.my", "ascAppId": "XXXXX" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json" }
    }
  }
}
```

---

## Development Workflow

```bash
# Start Expo dev server
pnpm dev:mobile-customer

# Build development client (first time / when native deps change)
eas build --profile development --platform ios
eas build --profile development --platform android

# Push OTA update (JS-only changes)
eas update --branch production --message "Fix queue display"

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## Current State

The existing `apps/mobile` is a blank Expo scaffold (only `expo`, `expo-status-bar`, `react`, `react-native` dependencies). When ready to start Phase 4:

1. Rename `apps/mobile/` → `apps/mobile-customer/`
2. Update `package.json` name to `@barberpro/mobile-customer`
3. Update root `package.json` workspace scripts
4. Add all required Expo packages
5. Set up Expo Router file structure
6. Configure EAS project
