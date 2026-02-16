# Primark Changing Room Tracker MVP

A barcode-scanning web application for Primark store team members to track items going in and out of changing rooms, detect missing items in real-time, and manage back-of-house inventory.

## Features

- **Entry Flow**: Two-step process to scan changing room tag and track items entering
- **Exit Flow**: Match items leaving against entry list, detect discrepancies
- **Discrepancy Management**: Full-screen alerts for missing items with loss tracking
- **Back-of-House**: Track and manage items awaiting return to floor
- **Manager Dashboard**: Analytics, charts, and team performance metrics
- **Admin Panel**: User and store management

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Barcode Scanning**: html5-qrcode
- **Charts**: Recharts
- **Routing**: React Router v6
- **Build Tool**: Vite

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd primark_changing_room_poc
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the following scripts in order:
   - `supabase/schema.sql` - Creates all tables and triggers
   - `supabase/indexes.sql` - Adds performance indexes
   - `supabase/seed.sql` - Loads test data (optional but recommended)

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy the Project URL and anon/public key

3. Update `.env` with your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Test Accounts

After running `seed.sql`, you can log in with these test accounts:

### Manchester Arndale Store
- **Team Member**: Sarah K, PIN: `1234`
- **Manager**: Tom B, PIN: `5678`
- **Team Member**: Jenna L, PIN: `9012`

### London Oxford Street Store
- **Admin**: Dan M, PIN: `5678`
- **Team Member**: Emma R, PIN: `3456`

### Birmingham High Street Store
- **Manager**: Mike H, PIN: `7890`

## Database Schema

### Core Tables

- **stores** - Store locations
- **team_members** - Staff with roles (team_member, manager, admin)
- **sessions** - Changing room sessions with tag barcodes
- **session_items** - Individual items in each session
- **back_of_house** - Items awaiting return to floor
- **shrinkage_log** - Lost item tracking

### Key Relationships

```
stores → team_members → sessions → session_items
       ↓                ↓
   back_of_house   shrinkage_log
```

## User Roles

- **Team Member**: Entry/exit scanning, basic views
- **Manager**: All team member features + dashboard analytics
- **Admin**: All features + user/store management

## Usage Flow

### Entry Process
1. Login with store selection and PIN
2. Tap ENTER button
3. Scan changing room tag barcode
4. Scan each item going into room
5. Tap DONE when complete

### Exit Process - Normal
1. Tap EXIT button
2. Scan changing room tag
3. Scan each item coming out
4. Mark as PURCHASE or RESTOCK
5. Green success screen when all resolved

### Exit Process - Discrepancy
1. Complete normal exit steps
2. If items unaccounted for, red alert screen appears
3. Option to scan more items or MARK AS LOST
4. Lost items logged in shrinkage_log
5. Session closes as 'flagged'

## Development

### Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Basic UI elements
│   ├── layout/      # Navigation and layout
│   ├── scanner/     # Barcode scanning
│   └── ...
├── screens/         # Main app screens
├── hooks/           # Custom React hooks
├── lib/             # Utilities and types
├── context/         # React contexts
└── main.tsx         # Entry point
```

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Browser Requirements

- Modern browsers with camera support
- Recommended: Chrome/Edge on Android tablets
- HTTPS required for camera access (except localhost)

## Troubleshooting

### Camera not working
- Ensure HTTPS connection (or localhost)
- Check browser permissions for camera access
- Try a different browser

### Database connection issues
- Verify `.env` file has correct Supabase credentials
- Check Supabase project is active and not paused
- Ensure RLS policies allow anonymous access (if using)

### Build errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version is 18+

## Support

For issues and questions, please contact the development team.

## License

Proprietary - Internal Primark use only
