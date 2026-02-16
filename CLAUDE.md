# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Primark Changing Room Tracker - A barcode-scanning web app for tracking items entering/exiting changing rooms with real-time discrepancy detection and inventory management.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (PostgreSQL)

## Development Commands

```bash
# Development
npm run dev          # Start dev server on port 3000
npm run build        # TypeScript check + production build
npm run preview      # Preview production build
npm run lint         # ESLint with TypeScript

# Database setup (run in Supabase SQL Editor, in order)
supabase/schema.sql    # Create tables and triggers
supabase/indexes.sql   # Add performance indexes
supabase/seed.sql      # Load test accounts
```

## Environment Setup

**Required:** Create `.env` from `.env.example` with Supabase credentials:
- `VITE_SUPABASE_URL` - Project URL from Supabase dashboard
- `VITE_SUPABASE_ANON_KEY` - anon/public key (NOT service_role)

**Note:** The app uses Supabase as a database only. Authentication is custom PIN-based (stored in `team_members` table), not Supabase Auth. The Supabase client has `persistSession: false` configured.

## Architecture Overview

### Authentication Flow
- **No traditional auth system** - Uses PIN codes stored in database
- Auth state stored in `sessionStorage` via `AuthContext` (src/context/AuthContext.tsx)
- Login flow: Store selection → PIN entry → Validate against `team_members` table
- Protected routes check `isAuthenticated` and role-based access via `ProtectedRoute` component
- Three roles: `team_member`, `manager`, `admin` (stored in database, not JWT)

### Session State Machine
Sessions have a defined lifecycle managed through status transitions:

```
in_progress → exiting → complete/flagged
```

- **in_progress**: Entry flow complete, items scanned in
- **exiting**: Exit flow started, items being matched
- **complete**: All items accounted for, session closed successfully
- **flagged**: Items marked as lost, logged in shrinkage_log

**Critical business rule:** Once a session moves to `exiting`, the `exit_start_time` is set. If discrepancies are detected during exit, the session MUST transition to DiscrepancyScreen before closing.

### Data Flow Pattern

The app uses **custom hooks** (not Redux/Zustand) for all data operations:

- `useSessions` - Session CRUD, duplicate tag prevention
- `useSessionItems` - Item tracking within sessions
- `useBackOfHouse` - Restocked item management
- `useShrinkage` - Lost item logging
- `useStats` - Dashboard aggregations

**Important:** All hooks interact directly with Supabase. State is component-local. Mutations trigger re-fetches rather than optimistic updates.

### Barcode Scanning Architecture

Scanning is handled through a two-layer system:

1. **BarcodeScanner component** (src/components/scanner/BarcodeScanner.tsx)
   - Wraps html5-qrcode library
   - Manages camera lifecycle
   - Provides manual entry fallback

2. **useBarcodeScan hook** (src/hooks/useBarcodeScan.ts)
   - Debounces duplicate scans (2 second window)
   - Triggers `playBeep()` from utils on successful scan
   - Used by all screens requiring scan input

**Manual entry is always available** - The app is designed for environments where camera access may fail.

## Critical Business Logic

### Entry Flow (EntryScanScreen)
Two-step process with state management:
1. **Scan tag** → `createSession()` → Check for duplicate open tags (prevents multiple sessions with same tag)
2. **Scan items** → `addSessionItem()` per item → Can remove accidental scans → DONE updates `total_items_in`

**Key validation:** Tag barcode must be unique among `in_progress` and `exiting` sessions (enforced in `useSessions.createSession`).

### Exit Flow (ExitScanScreen)
Session can be loaded two ways:
- Fresh scan of tag barcode
- Direct navigation with sessionId param (from HomeScreen)

**Item resolution logic:**
- Each scanned item is matched against session's `session_items`
- User chooses: RESTOCK or PURCHASE
- RESTOCK → Creates `back_of_house` record + marks item as `restocked`
- PURCHASE → Marks item as `purchased`
- When all items resolved → Success screen OR Discrepancy screen if items remain unresolved

### Discrepancy Flow (DiscrepancyScreen)
**Trigger condition:** `getUnresolvedItems()` returns items with status `in_room` after user taps "All Done"

**Red alert screen provides:**
1. Scan more items (recovery attempt)
2. Mark all unresolved as LOST → Creates `shrinkage_log` entries → Session closes as `flagged`

**Important:** Items marked lost do NOT go to back_of_house. They go directly to shrinkage_log.

### Back-of-House Time-Based Color Coding
Items awaiting return to floor are color-coded by wait time:
- **< 30 min:** Grey (normal)
- **30-60 min:** Amber (warning)
- **> 60 min:** Red (critical)

Logic in `getWaitTimeCategory()` (src/lib/utils.ts). Filtering is client-side, not database-level.

## Database Schema Key Relationships

```
stores (1) → (N) team_members → (N) sessions → (N) session_items
                                       ↓ (N)
                                  back_of_house
                                  shrinkage_log
```

**Cascade deletes are enabled** - Deleting a store removes all dependent records.

**Session counters are denormalized:**
- `total_items_in`, `total_items_out`, `items_purchased`, `items_restocked`, `items_lost`
- These are updated on session completion, not maintained in real-time

**Auto-updated timestamps:** All tables have `updated_at` maintained by database triggers.

## Component Patterns

### Screen Components
All screens in `src/screens/` follow this pattern:
- Wrap in `NavBar` + optional `BottomNav` or `PageHeader`
- Use custom hooks for data, not direct Supabase calls
- Handle loading/error states locally
- Navigate with `useNavigate()` from react-router-dom

### UI Components (src/components/ui/)
Reusable components that accept size/variant props:
- `Button` - Primary, secondary, danger, success, outline variants
- `StatCard` - Dashboard metrics with icons and color coding
- `StatusPill` - Status badges for session/item states
- `PinPad` - Numeric keypad for PIN entry
- `ConfirmDialog` - Confirmation modals

**Design system:** All colors defined as Tailwind custom colors in `tailwind.config.js` prefixed with `primark-*`

### Scanning Components
- Always provide manual entry fallback alongside scanner
- Use `isValidBarcode()` for client-side validation (min 4 alphanumeric chars)
- Call `playBeep()` after successful scan for user feedback

## Role-Based Access Control

Routes are protected with role requirements:
- `/` (home) - All authenticated users
- `/entry`, `/exit` - All authenticated users
- `/back-of-house` - All authenticated users
- `/dashboard` - `manager` or `admin` only
- `/admin` - `admin` only

**Implementation:** ProtectedRoute component in App.tsx checks `hasRole()` from AuthContext.

## Testing with Seed Data

After running seed.sql, three stores with test accounts are available:

**Manchester Arndale** (store_id: a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d)
- Sarah K (team_member): PIN 1234
- Tom B (manager): PIN 5678
- Jenna L (team_member): PIN 9012

**London Oxford Street**
- Dan M (admin): PIN 5678
- Emma R (team_member): PIN 3456

**Test flow with manual entry:**
1. Login → Manchester → PIN 1234
2. ENTER → Tag: `TAG001` → Items: `ITEM001`, `ITEM002`, `ITEM003` → DONE
3. EXIT → Tag: `TAG001` → Scan items back → RESTOCK or PURCHASE each
4. Test discrepancy: Only scan 2/3 items back → Red screen appears

## Common Gotchas

**Camera permissions:** HTTPS required (except localhost). `html5-qrcode` will fail silently without proper permissions.

**Session storage vs localStorage:** Auth uses sessionStorage (clears on tab close). This is intentional for security.

**Supabase queries return null for single rows:** Use `.maybeSingle()` when expecting 0 or 1 results, `.single()` when expecting exactly 1 (throws if not found).

**Status transitions are not reversible:** Once a session is `complete` or `flagged`, it cannot return to `in_progress`.

**Debounced scans:** `useBarcodeScan` prevents scanning same barcode twice within 2 seconds. This is working as designed to prevent double-entry.

## Path Aliases

The project uses `@/*` aliases for imports:
- `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json)
- Always use aliases: `import { useAuth } from '@/hooks/useAuth'`

## Future Enhancement Notes

The MVP implementation has placeholders for:
- Manager Dashboard charts (Recharts integration ready)
- Admin CRUD for users/stores (UI placeholder exists)
- Team performance analytics (hook logic exists, UI needed)

When adding features, follow the existing pattern:
1. Add hook in `src/hooks/` for data operations
2. Create screen in `src/screens/` with loading/error states
3. Add route in `App.tsx` with appropriate role guards
4. Update database schema if needed (create migration SQL file)
