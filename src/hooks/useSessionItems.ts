// Hook for session items operations

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SessionItem } from '@/lib/types';

export function useSessionItems() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSessionItems = async (sessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('session_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('scanned_in_at', { ascending: true });

      if (fetchError) throw fetchError;

      return data as SessionItem[];
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching session items:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addSessionItem = async (sessionId: string, itemBarcode: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('session_items')
        .insert({
          session_id: sessionId,
          item_barcode: itemBarcode,
          status: 'in_room',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return data as SessionItem;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding session item:', err);
      throw err;
    }
  };

  const removeSessionItem = async (itemId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('session_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;
    } catch (err: any) {
      setError(err.message);
      console.error('Error removing session item:', err);
      throw err;
    }
  };

  const updateItemStatus = async (
    itemId: string,
    status: SessionItem['status']
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('session_items')
        .update({
          status,
          resolved_at: status !== 'in_room' ? new Date().toISOString() : null,
        })
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) throw updateError;

      return data as SessionItem;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating item status:', err);
      throw err;
    }
  };

  const markItemAsPurchased = async (itemId: string) => {
    return updateItemStatus(itemId, 'purchased');
  };

  const markItemAsRestocked = async (itemId: string) => {
    return updateItemStatus(itemId, 'restocked');
  };

  const markItemAsLost = async (itemId: string) => {
    return updateItemStatus(itemId, 'lost');
  };

  const getUnresolvedItems = async (sessionId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('session_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'in_room');

      if (fetchError) throw fetchError;

      return data as SessionItem[];
    } catch (err: any) {
      console.error('Error fetching unresolved items:', err);
      return [];
    }
  };

  const findItemByBarcode = async (sessionId: string, barcode: string) => {
    try {
      // Get first unresolved item with this barcode (handles duplicates)
      const { data, error: fetchError } = await supabase
        .from('session_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('item_barcode', barcode)
        .eq('status', 'in_room')
        .order('scanned_in_at', { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;

      return data && data.length > 0 ? (data[0] as SessionItem) : null;
    } catch (err: any) {
      console.error('Error finding item by barcode:', err);
      return null;
    }
  };

  return {
    loading,
    error,
    getSessionItems,
    addSessionItem,
    removeSessionItem,
    updateItemStatus,
    markItemAsPurchased,
    markItemAsRestocked,
    markItemAsLost,
    getUnresolvedItems,
    findItemByBarcode,
  };
}
