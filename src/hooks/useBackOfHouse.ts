// Hook for back-of-house operations

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BackOfHouseItem, BackOfHouseItemWithDetails } from '@/lib/types';
import { useAuth } from './useAuth';

export function useBackOfHouse() {
  const { store } = useAuth();
  const [items, setItems] = useState<BackOfHouseItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async (filters?: {
    status?: BackOfHouseItem['status'];
    minWaitMinutes?: number;
  }) => {
    if (!store) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('back_of_house')
        .select('*, team_member:team_members(*)')
        .eq('store_id', store.id)
        .order('received_at', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'awaiting_return');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredData = data || [];

      // Apply client-side time filtering if needed
      if (filters?.minWaitMinutes) {
        const cutoffTime = new Date(Date.now() - filters.minWaitMinutes * 60 * 1000);
        filteredData = filteredData.filter(
          (item) => new Date(item.received_at) <= cutoffTime
        );
      }

      setItems(filteredData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching back-of-house items:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (
    sessionId: string,
    itemBarcode: string,
    teamMemberId: string
  ) => {
    if (!store) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('back_of_house')
        .insert({
          store_id: store.id,
          session_id: sessionId,
          item_barcode: itemBarcode,
          team_member_id: teamMemberId,
          status: 'awaiting_return',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return data as BackOfHouseItem;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding back-of-house item:', err);
      throw err;
    }
  };

  const markAsReturned = async (itemId: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from('back_of_house')
        .update({
          status: 'returned',
          returned_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Refresh the list
      await fetchItems();

      return data as BackOfHouseItem;
    } catch (err: any) {
      setError(err.message);
      console.error('Error marking item as returned:', err);
      throw err;
    }
  };

  const getItemCount = async () => {
    if (!store) return 0;

    try {
      const { count, error: countError } = await supabase
        .from('back_of_house')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'awaiting_return');

      if (countError) throw countError;

      return count || 0;
    } catch (err: any) {
      console.error('Error getting back-of-house count:', err);
      return 0;
    }
  };

  useEffect(() => {
    if (store) {
      fetchItems();
    }
  }, [store]);

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    markAsReturned,
    getItemCount,
  };
}
