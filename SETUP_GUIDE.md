# Primark Changing Room Tracker - Setup Guide

## Implementation Complete ✅

All 12 phases of the implementation plan have been completed! The MVP is now ready for setup and testing.

## What Was Built

### ✅ Phase 1: Project Setup & Database
- Complete project configuration (package.json, vite, tailwind, typescript)
- Comprehensive database schema (stores, team_members, sessions, session_items, back_of_house, shrinkage_log)
- Database indexes for optimal performance
- Seed data with test accounts

### ✅ Phase 2: Core Infrastructure
- Supabase client integration
- TypeScript type definitions
- Utility functions (time formatting, barcode validation, audio beep)
- Authentication context with PIN-based login
- Protected routing with role-based access

### ✅ Phase 3: UI Components Library
- Reusable components (Button, StatCard, StatusPill, PinPad, etc.)
- Layout components (NavBar, BottomNav, PageHeader)
- BarcodeScanner with html5-qrcode integration
- Primark brand styling with design tokens

### ✅ Phase 4: Custom Hooks
- useSessions - Session CRUD operations
- useSessionItems - Item tracking
- useBackOfHouse - Back-of-house management
- useShrinkage - Loss tracking
- useStats - Dashboard analytics
- useBarcodeScan - Scan handling with beep

### ✅ Phase 5: Login & Home Screens
- Store selection and PIN authentication
- Home dashboard with ENTER/EXIT buttons
- Today's stats and active sessions
- Session staleness warnings

### ✅ Phase 6: Entry Flow
- Two-step entry: tag scan → items scan
- Persistent camera with manual entry fallback
- Duplicate tag prevention
- Item removal capability

### ✅ Phase 7: Exit Flow
- Tag-based session lookup
- Item-by-item resolution (PURCHASE/RESTOCK)
- Progress tracking
- Green success screen on completion

### ✅ Phase 8: Discrepancy Handling
- Full-screen red alert for missing items
- Scanner for recovery attempts
- "Mark as Lost" with confirmation
- Shrinkage log integration

### ✅ Phase 9: Back-of-House Screen
- Restocked items list with wait times
- Color-coded urgency (grey/amber/red)
- Filter by wait time (>30min, >1hr)
- "Returned to Floor" functionality

### ✅ Phase 10: Manager Dashboard
- Key metrics (sessions, conversion, shrinkage)
- Today's activity overview
- Analytics foundation (ready for charts)

### ✅ Phase 11: Admin Screen
- Placeholder for user/store management
- Framework for future admin features

### ✅ Phase 12: Polish
- Loading states throughout
- Error handling
- Empty states
- Touch-friendly design
- Responsive layouts

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. In the SQL Editor, run these scripts **in order**:
   - `supabase/schema.sql` (creates tables and triggers)
   - `supabase/indexes.sql` (adds performance indexes)
   - `supabase/seed.sql` (loads test data)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Test Accounts

### Manchester Arndale Store
- **Sarah K** (Team Member): PIN `1234`
- **Tom B** (Manager): PIN `5678`
- **Jenna L** (Team Member): PIN `9012`

### London Oxford Street Store
- **Dan M** (Admin): PIN `5678`
- **Emma R** (Team Member): PIN `3456`

### Birmingham High Street Store
- **Mike H** (Manager): PIN `7890`

## Testing the Flows

### Test 1: Complete Entry Flow
1. Login as Sarah K (Manchester, PIN 1234)
2. Tap **ENTER**
3. Manual entry: `TAG001`
4. Manual entry items: `ITEM001`, `ITEM002`, `ITEM003`
5. Tap **DONE**
6. Verify session appears on home screen

### Test 2: Clean Exit Flow
1. Tap **EXIT**
2. Manual entry: `TAG001`
3. Scan items back: `ITEM001`, `ITEM002`, `ITEM003`
4. Mark each as **PURCHASE** or **RESTOCK**
5. Tap **All Done**
6. See green success screen

### Test 3: Discrepancy Flow
1. Create new entry with `TAG002` and 3 items
2. On exit, only scan 2 items back
3. Tap **All Done**
4. RED discrepancy screen appears
5. Tap **MARK AS LOST**
6. Confirm
7. Session closes as 'flagged'

### Test 4: Back-of-House
1. Navigate to Back of House tab
2. See items marked as RESTOCK
3. Filter by wait time
4. Tap **Returned to Floor**

### Test 5: Manager Dashboard
1. Login as Tom B (Manager, PIN 5678)
2. Navigate to Dashboard tab
3. View metrics and stats

## Project Structure

```
primark_changing_room_poc/
├── supabase/              # Database files
│   ├── schema.sql         # Table definitions
│   ├── indexes.sql        # Performance indexes
│   └── seed.sql           # Test data
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Basic components
│   │   ├── layout/       # Navigation & layout
│   │   ├── scanner/      # Barcode scanner
│   │   └── session/      # Session-specific components
│   ├── screens/          # Main app screens
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & types
│   ├── context/          # React contexts
│   ├── App.tsx           # Main app with routing
│   └── main.tsx          # Entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend (PostgreSQL + Auth + Realtime)
- **html5-qrcode** - Barcode scanning
- **React Router** - Navigation
- **Lucide React** - Icons

## Database Schema

### Core Tables
- `stores` - Store locations
- `team_members` - Staff with PIN authentication
- `sessions` - Changing room sessions
- `session_items` - Individual items per session
- `back_of_house` - Restocked items awaiting return
- `shrinkage_log` - Lost item tracking

## Features

✅ PIN-based authentication with store selection
✅ Two-step entry flow (tag → items)
✅ Exit flow with PURCHASE/RESTOCK resolution
✅ Real-time discrepancy detection with red alert
✅ Back-of-house inventory management
✅ Time-based color coding for urgency
✅ Manager dashboard with key metrics
✅ Role-based access control (team_member, manager, admin)
✅ Persistent camera with manual entry fallback
✅ Audible beep on successful scan
✅ Touch-friendly UI (48px+ buttons)
✅ Responsive design
✅ Loading and error states
✅ Session staleness warnings (>4 hours)

## Browser Requirements

- Modern browser with camera support
- HTTPS required for camera access (except localhost)
- Recommended: Chrome/Edge on Android tablets

## Next Steps

### Immediate
1. Set up Supabase project
2. Run database scripts
3. Configure environment variables
4. Test all flows with seed data

### Future Enhancements
- Charts with Recharts (hourly activity, shrinkage trends)
- Team performance table with sorting
- Date range filtering on dashboard
- Full admin CRUD for users and stores
- Export capabilities (CSV/PDF reports)
- Audit logs
- Push notifications for stale sessions
- Offline mode with sync
- Print labels for tags

## Troubleshooting

### Camera not working
- Ensure HTTPS (or use localhost)
- Check browser permissions
- Try different browser (Chrome recommended)

### Database connection errors
- Verify `.env` credentials
- Check Supabase project status
- Ensure RLS policies allow access

### Build errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Verify Node.js version 18+

## Support

For issues or questions, refer to:
- README.md for general documentation
- Database schema comments in schema.sql
- Component JSDoc comments in source files

---

**Status**: MVP Complete ✅
**Version**: 1.0.0
**Last Updated**: 2026-02-16
