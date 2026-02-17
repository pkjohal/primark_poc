// Hook for session CRUD operations

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, SessionWithDetails } from '@/lib/types';
import { useAuth } from './useAuth';

export function useSessions() {
  const { store } = useAuth();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async (filters?: {
    status?: Session['status'] | Session['status'][];
    dateFrom?: Date;
    dateTo?: Date;
  }) => {
    if (!store) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          team_member:team_members(*),
          items:session_items(count)
        `)
        .eq('store_id', store.id)
        .order('entry_time', { ascending: false });

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.dateFrom) {
        query = query.gte('entry_time', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        query = query.lte('entry_time', filters.dateTo.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSessions(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (tagBarcode: string, teamMemberId: string) => {
    if (!store) return null;

    try {
      // Check for duplicate open tag
      const { data: existing } = await supabase
        .from('sessions')
        .select('id')
        .eq('tag_barcode', tagBarcode)
        .in('status', ['in_progress', 'exiting'])
        .single();

      if (existing) {
        throw new Error('This tag already has an open session');
      }

      const { data, error: createError } = await supabase
        .from('sessions')
        .insert({
          store_id: store.id,
          team_member_id: teamMemberId,
          tag_barcode: tagBarcode,
          status: 'in_progress',
        })
        .select()
        .single();

      if (createError) throw createError;

      return data as Session;
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating session:', err);
      throw err;
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<Session>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) throw updateError;

      return data as Session;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating session:', err);
      throw err;
    }
  };

  const getSessionByTag = async (tagBarcode: string) => {
    if (!store) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*, team_member:team_members(*)')
        .eq('store_id', store.id)
        .eq('tag_barcode', tagBarcode)
        .in('status', ['in_progress', 'exiting'])
        .single();

      if (fetchError) throw fetchError;

      return data as SessionWithDetails;
    } catch (err: any) {
      console.error('Error getting session by tag:', err);
      return null;
    }
  };

  const getSessionById = async (sessionId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*, team_member:team_members(*)')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      return data as SessionWithDetails;
    } catch (err: any) {
      console.error('Error getting session by id:', err);
      return null;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (deleteError) throw deleteError;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting session:', err);
      throw err;
    }
  };

  const completeSession = async (sessionId: string, status: 'complete' | 'flagged') => {
    return updateSession(sessionId, {
      status,
      exit_complete_time: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (store) {
      fetchSessions();
    }
  }, [store]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    getSessionByTag,
    getSessionById,
    completeSession,
  };
}
