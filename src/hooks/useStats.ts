// Hook for dashboard statistics

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardStats, TeamPerformance } from '@/lib/types';
import { useAuth } from './useAuth';

export function useStats() {
  const { store } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDashboardStats = async (dateFrom?: Date, dateTo?: Date): Promise<DashboardStats> => {
    if (!store) {
      return {
        sessionsToday: 0,
        openSessions: 0,
        itemsLost: 0,
        backOfHouseCount: 0,
        totalSessions: 0,
        avgItemsPerSession: 0,
        conversionRate: 0,
      };
    }

    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Sessions today
      const { count: sessionsToday } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .gte('entry_time', today.toISOString());

      // Open sessions
      const { count: openSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .in('status', ['in_progress', 'exiting']);

      // Items lost (for date range if provided)
      let lostQuery = supabase
        .from('shrinkage_log')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'lost');

      if (dateFrom) {
        lostQuery = lostQuery.gte('lost_at', dateFrom.toISOString());
      } else {
        lostQuery = lostQuery.gte('lost_at', today.toISOString());
      }

      if (dateTo) {
        lostQuery = lostQuery.lte('lost_at', dateTo.toISOString());
      }

      const { count: itemsLost } = await lostQuery;

      // Back-of-house count
      const { count: backOfHouseCount } = await supabase
        .from('back_of_house')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'awaiting_return');

      // Total sessions (for date range)
      let sessionsQuery = supabase
        .from('sessions')
        .select('total_items_in, items_purchased')
        .eq('store_id', store.id);

      if (dateFrom) {
        sessionsQuery = sessionsQuery.gte('entry_time', dateFrom.toISOString());
      }

      if (dateTo) {
        sessionsQuery = sessionsQuery.lte('entry_time', dateTo.toISOString());
      }

      const { data: sessionsData } = await sessionsQuery;

      const totalSessions = sessionsData?.length || 0;
      const totalItems = sessionsData?.reduce((sum, s) => sum + (s.total_items_in || 0), 0) || 0;
      const totalPurchased = sessionsData?.reduce((sum, s) => sum + (s.items_purchased || 0), 0) || 0;

      const avgItemsPerSession = totalSessions > 0 ? totalItems / totalSessions : 0;
      const conversionRate = totalItems > 0 ? (totalPurchased / totalItems) * 100 : 0;

      return {
        sessionsToday: sessionsToday || 0,
        openSessions: openSessions || 0,
        itemsLost: itemsLost || 0,
        backOfHouseCount: backOfHouseCount || 0,
        totalSessions,
        avgItemsPerSession: Math.round(avgItemsPerSession * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching dashboard stats:', err);
      return {
        sessionsToday: 0,
        openSessions: 0,
        itemsLost: 0,
        backOfHouseCount: 0,
        totalSessions: 0,
        avgItemsPerSession: 0,
        conversionRate: 0,
      };
    } finally {
      setLoading(false);
    }
  };

  const getTeamPerformance = async (dateFrom?: Date, dateTo?: Date): Promise<TeamPerformance[]> => {
    if (!store) return [];

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('sessions')
        .select(`
          team_member_id,
          team_member:team_members(full_name),
          total_items_in,
          items_lost,
          entry_time,
          exit_complete_time
        `)
        .eq('store_id', store.id)
        .in('status', ['complete', 'flagged']);

      if (dateFrom) {
        query = query.gte('entry_time', dateFrom.toISOString());
      }

      if (dateTo) {
        query = query.lte('entry_time', dateTo.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Group by team member
      const grouped = (data || []).reduce((acc: any, session: any) => {
        const memberId = session.team_member_id;
        if (!acc[memberId]) {
          acc[memberId] = {
            member_id: memberId,
            member_name: session.team_member?.full_name || 'Unknown',
            sessions_handled: 0,
            items_processed: 0,
            shrinkage_events: 0,
            total_session_time: 0,
          };
        }

        acc[memberId].sessions_handled += 1;
        acc[memberId].items_processed += session.total_items_in || 0;
        acc[memberId].shrinkage_events += session.items_lost || 0;

        // Calculate session time if both timestamps exist
        if (session.entry_time && session.exit_complete_time) {
          const duration = new Date(session.exit_complete_time).getTime() - new Date(session.entry_time).getTime();
          acc[memberId].total_session_time += duration;
        }

        return acc;
      }, {});

      // Convert to array and calculate averages
      return Object.values(grouped).map((member: any) => ({
        ...member,
        avg_session_time: member.sessions_handled > 0
          ? Math.round(member.total_session_time / member.sessions_handled / 60000) // Convert to minutes
          : 0,
      }));
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching team performance:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getBasketStats = async () => {
    const empty = { transferred: 0, abandoned: 0, transferredToday: 0, abandonedToday: 0 };
    if (!store) return empty;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error: fetchError } = await supabase
        .from('baskets')
        .select('status, resolved_at')
        .eq('store_id', store.id)
        .in('status', ['abandoned', 'transferred']);

      if (fetchError) throw fetchError;

      const rows = data || [];
      return {
        transferred: rows.filter(b => b.status === 'transferred').length,
        abandoned: rows.filter(b => b.status === 'abandoned').length,
        transferredToday: rows.filter(b => b.status === 'transferred' && b.resolved_at && new Date(b.resolved_at) >= today).length,
        abandonedToday: rows.filter(b => b.status === 'abandoned' && b.resolved_at && new Date(b.resolved_at) >= today).length,
      };
    } catch (err: any) {
      console.error('Error fetching basket stats:', err);
      return empty;
    }
  };

  const getHourlyActivity = async (date: Date) => {
    if (!store) return [];

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('entry_time')
        .eq('store_id', store.id)
        .gte('entry_time', startOfDay.toISOString())
        .lte('entry_time', endOfDay.toISOString());

      if (fetchError) throw fetchError;

      // Group by hour
      const hourly = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}:00`,
        count: 0,
      }));

      (data || []).forEach((session: any) => {
        const hour = new Date(session.entry_time).getHours();
        hourly[hour].count += 1;
      });

      return hourly;
    } catch (err: any) {
      console.error('Error fetching hourly activity:', err);
      return [];
    }
  };

  return {
    loading,
    error,
    getDashboardStats,
    getBasketStats,
    getTeamPerformance,
    getHourlyActivity,
  };
}
