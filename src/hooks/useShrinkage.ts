// Hook for shrinkage log operations

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShrinkageLogEntry, ShrinkageLogEntryWithDetails } from '@/lib/types';
import { useAuth } from './useAuth';

export function useShrinkage() {
  const { store } = useAuth();
  const [entries, setEntries] = useState<ShrinkageLogEntryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async (filters?: {
    status?: ShrinkageLogEntry['status'];
    dateFrom?: Date;
    dateTo?: Date;
  }) => {
    if (!store) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('shrinkage_log')
        .select('*, team_member:team_members(*), session:sessions(*)')
        .eq('store_id', store.id)
        .order('lost_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('lost_at', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        query = query.lte('lost_at', filters.dateTo.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEntries(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching shrinkage entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const logLostItem = async (
    sessionId: string,
    itemBarcode: string,
    teamMemberId: string,
    notes?: string
  ) => {
    if (!store) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('shrinkage_log')
        .insert({
          store_id: store.id,
          session_id: sessionId,
          item_barcode: itemBarcode,
          team_member_id: teamMemberId,
          status: 'lost',
          notes,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return data as ShrinkageLogEntry;
    } catch (err: any) {
      setError(err.message);
      console.error('Error logging lost item:', err);
      throw err;
    }
  };

  const markAsRecovered = async (entryId: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from('shrinkage_log')
        .update({
          status: 'recovered',
          recovered_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchEntries();

      return data as ShrinkageLogEntry;
    } catch (err: any) {
      setError(err.message);
      console.error('Error marking item as recovered:', err);
      throw err;
    }
  };

  const getLostItemCount = async (dateFrom?: Date, dateTo?: Date) => {
    if (!store) return 0;

    try {
      let query = supabase
        .from('shrinkage_log')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'lost');

      if (dateFrom) {
        query = query.gte('lost_at', dateFrom.toISOString());
      }

      if (dateTo) {
        query = query.lte('lost_at', dateTo.toISOString());
      }

      const { count, error: countError } = await query;

      if (countError) throw countError;

      return count || 0;
    } catch (err: any) {
      console.error('Error getting lost item count:', err);
      return 0;
    }
  };

  const findLostItemByBarcode = async (barcode: string) => {
    if (!store) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('shrinkage_log')
        .select('*')
        .eq('store_id', store.id)
        .eq('item_barcode', barcode)
        .eq('status', 'lost')
        .maybeSingle();

      if (fetchError) throw fetchError;

      return data as ShrinkageLogEntry | null;
    } catch (err: any) {
      console.error('Error finding lost item by barcode:', err);
      return null;
    }
  };

  useEffect(() => {
    if (store) {
      fetchEntries();
    }
  }, [store]);

  return {
    entries,
    loading,
    error,
    fetchEntries,
    logLostItem,
    markAsRecovered,
    getLostItemCount,
    findLostItemByBarcode,
  };
}
