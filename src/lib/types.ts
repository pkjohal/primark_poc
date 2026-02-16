// TypeScript interfaces for the application

export interface Store {
  id: string;
  store_code: string;
  store_name: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  store_id: string;
  member_code: string;
  full_name: string;
  pin_code: string;
  role: 'team_member' | 'manager' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  store_id: string;
  team_member_id: string;
  tag_barcode: string;
  status: 'in_progress' | 'exiting' | 'complete' | 'flagged';
  total_items_in: number;
  total_items_out: number;
  items_purchased: number;
  items_restocked: number;
  items_lost: number;
  entry_time: string;
  exit_start_time: string | null;
  exit_complete_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionItem {
  id: string;
  session_id: string;
  item_barcode: string;
  status: 'in_room' | 'purchased' | 'restocked' | 'lost';
  scanned_in_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackOfHouseItem {
  id: string;
  store_id: string;
  session_id: string;
  item_barcode: string;
  team_member_id: string;
  status: 'awaiting_return' | 'returned';
  received_at: string;
  returned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShrinkageLogEntry {
  id: string;
  store_id: string;
  session_id: string;
  item_barcode: string;
  team_member_id: string;
  status: 'lost' | 'recovered';
  lost_at: string;
  recovered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with joined data
export interface SessionWithDetails extends Session {
  team_member?: TeamMember;
  store?: Store;
  items?: SessionItem[];
}

export interface BackOfHouseItemWithDetails extends BackOfHouseItem {
  team_member?: TeamMember;
}

export interface ShrinkageLogEntryWithDetails extends ShrinkageLogEntry {
  team_member?: TeamMember;
  session?: Session;
}

// Stats types
export interface DashboardStats {
  sessionsToday: number;
  openSessions: number;
  itemsLost: number;
  backOfHouseCount: number;
  totalSessions: number;
  avgItemsPerSession: number;
  conversionRate: number;
}

export interface TeamPerformance {
  member_id: string;
  member_name: string;
  sessions_handled: number;
  items_processed: number;
  shrinkage_events: number;
  avg_session_time: number;
}

// Barcode scan result
export interface BarcodeScanResult {
  barcode: string;
  timestamp: Date;
}
