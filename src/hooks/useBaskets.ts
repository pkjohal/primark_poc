// Hook for managing baskets and purchased items

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Basket {
  id: string;
  store_id: string;
  basket_number: number;
  session_id: string;
  status: 'active' | 'abandoned' | 'transferred';
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  session?: {
    tag_barcode: string;
    entry_time: string;
    team_member?: {
      full_name: string;
    };
  };
  items?: Array<{
    id: string;
    item_barcode: string;
    status: string;
    created_at: string;
  }>;
}

export function useBaskets() {
  const { teamMember } = useAuth();
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all baskets for current store
  const fetchBaskets = async () => {
    if (!teamMember?.store_id) {
      setError('No store selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('baskets')
        .select(`
          *,
          session:sessions(
            tag_barcode,
            entry_time,
            team_member:team_members(full_name)
          )
        `)
        .eq('store_id', teamMember.store_id)
        .eq('status', 'active')
        .order('basket_number', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch items for each basket
      const basketsWithItems = await Promise.all(
        (data || []).map(async (basket) => {
          const { data: items } = await supabase
            .from('session_items')
            .select('id, item_barcode, status, created_at')
            .eq('basket_id', basket.id)
            .order('created_at', { ascending: true });

          return {
            ...basket,
            items: items || [],
          };
        })
      );

      setBaskets(basketsWithItems);
    } catch (err: any) {
      console.error('Error fetching baskets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new basket for a session
  const createBasket = async (sessionId: string): Promise<string | null> => {
    if (!teamMember?.store_id) {
      setError('No store selected');
      return null;
    }

    try {
      // Get next basket number for this store
      const { data: nextNumberData, error: rpcError } = await supabase
        .rpc('get_next_basket_number', { p_store_id: teamMember.store_id });

      if (rpcError) throw rpcError;

      const basketNumber = nextNumberData;

      // Create the basket
      const { data, error: insertError } = await supabase
        .from('baskets')
        .insert({
          store_id: teamMember.store_id,
          basket_number: basketNumber,
          session_id: sessionId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log(`Created basket ${basketNumber} for session ${sessionId}`);
      return data.id;
    } catch (err: any) {
      console.error('Error creating basket:', err);
      setError(err.message);
      return null;
    }
  };

  // Add item to basket
  const addItemToBasket = async (itemId: string, basketId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('session_items')
        .update({ basket_id: basketId })
        .eq('id', itemId);

      if (updateError) throw updateError;

      console.log(`Added item ${itemId} to basket ${basketId}`);
    } catch (err: any) {
      console.error('Error adding item to basket:', err);
      setError(err.message);
    }
  };

  // Get or create basket for a session
  const getOrCreateBasket = async (sessionId: string): Promise<string | null> => {
    if (!teamMember?.store_id) {
      setError('No store selected');
      return null;
    }

    try {
      // Check if basket already exists for this session
      const { data: existingBasket } = await supabase
        .from('baskets')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existingBasket) {
        return existingBasket.id;
      }

      // Create new basket
      return await createBasket(sessionId);
    } catch (err: any) {
      console.error('Error getting/creating basket:', err);
      setError(err.message);
      return null;
    }
  };

  // Update basket status (abandoned or transferred)
  const updateBasketStatus = async (basketId: string, status: 'abandoned' | 'transferred') => {
    try {
      const { error: updateError } = await supabase
        .from('baskets')
        .update({ status, resolved_at: new Date().toISOString() })
        .eq('id', basketId);

      if (updateError) throw updateError;

      await fetchBaskets(); // Refresh list — basket disappears because fetch filters active only
    } catch (err: any) {
      console.error('Error updating basket status:', err);
      setError(err.message);
    }
  };

  // Delete a basket and its item associations
  const deleteBasket = async (basketId: string) => {
    try {
      // First, remove basket_id from all items in this basket
      await supabase
        .from('session_items')
        .update({ basket_id: null })
        .eq('basket_id', basketId);

      // Then delete the basket
      const { error: deleteError } = await supabase
        .from('baskets')
        .delete()
        .eq('id', basketId);

      if (deleteError) throw deleteError;

      console.log(`Deleted basket ${basketId}`);
      await fetchBaskets(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting basket:', err);
      setError(err.message);
    }
  };

  return {
    baskets,
    loading,
    error,
    fetchBaskets,
    createBasket,
    addItemToBasket,
    getOrCreateBasket,
    updateBasketStatus,
    deleteBasket,
  };
}
