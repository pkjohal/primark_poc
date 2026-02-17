// Login screen with store selection and PIN entry

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Store, TeamMember } from '@/lib/types';
import PinPad from '@/components/ui/PinPad';
import { AlertCircle } from 'lucide-react';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('store_name');

      if (fetchError) throw fetchError;

      setStores(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (!selectedStore) return;

    setPinError(null);

    try {
      // Find team member by PIN and store
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('pin_code', pin)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setPinError('Invalid PIN. Please try again.');
        return;
      }

      const teamMember = data as TeamMember;

      // Login successful
      login(selectedStore, teamMember);
      navigate('/', { replace: true });
    } catch (err: any) {
      setPinError(err.message);
      console.error('Error verifying PIN:', err);
    }
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setPinError(null);
  };

  const handleBackToStores = () => {
    setSelectedStore(null);
    setPinError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primark-light-grey">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primark-grey">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primark-light-grey p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle size={24} />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-primark-grey mb-4">{error}</p>
          <button
            onClick={fetchStores}
            className="w-full btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primark-navy to-primark-blue flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-7xl font-primark text-primark-blue mb-4 tracking-wide">PRIMARK</h1>
          <p className="text-white text-lg font-light">Changing Room Tracker</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          {!selectedStore ? (
            // Store Selection
            <>
              <h2 className="text-xl font-bold text-primark-navy mb-4 text-center">
                Select Your Store
              </h2>
              <div className="space-y-3">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreSelect(store)}
                    className="w-full p-4 border-2 border-primark-grey/30 rounded-lg hover:border-primark-blue hover:bg-primark-light-blue transition-all text-left"
                  >
                    <p className="font-semibold text-primark-navy">{store.store_name}</p>
                    <p className="text-sm text-primark-grey">{store.location}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            // PIN Entry
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-primark-navy mb-1">
                  Enter Your PIN
                </h2>
                <p className="text-sm text-primark-grey">{selectedStore.store_name}</p>
              </div>

              <PinPad onComplete={handlePinComplete} />

              {pinError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{pinError}</p>
                </div>
              )}

              <button
                onClick={handleBackToStores}
                className="w-full mt-6 py-3 text-primark-blue hover:bg-primark-light-blue rounded-lg transition-colors"
              >
                ← Back to Store Selection
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          Internal use only • Staff members only
        </p>
      </div>
    </div>
  );
}
