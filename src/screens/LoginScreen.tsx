// Login screen with progressive store/team member selection and PIN entry

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Store, TeamMember } from '@/lib/types';
import { AlertCircle, Delete, Check } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

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

  const fetchTeamMembers = async (storeId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('full_name');

      if (fetchError) throw fetchError;

      setTeamMembers(data || []);
    } catch (err: any) {
      console.error('Error fetching team members:', err);
      setTeamMembers([]);
    }
  };

  const handleStoreSelect = async (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      setSelectedStore(store);
      await fetchTeamMembers(storeId);
      setSelectedMember(null);
      setPin('');
      setPinError(null);
    }
  };

  const handleMemberSelect = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setPin('');
      setPinError(null);
    }
  };

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setPinError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClear = () => {
    setPin('');
    setPinError(null);
  };

  const handleSubmit = async () => {
    if (!selectedStore || !selectedMember || pin.length !== 4) {
      setPinError('Please complete all fields');
      return;
    }

    // Verify PIN
    if (selectedMember.pin_code !== pin) {
      setPinError('Incorrect PIN');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Login successful
    login(selectedStore, selectedMember);
    navigate('/', { replace: true });
  };

  const handleBack = () => {
    if (selectedMember) {
      setSelectedMember(null);
      setPin('');
      setPinError(null);
    } else if (selectedStore) {
      setSelectedStore(null);
      setTeamMembers([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primark-navy to-primark-blue">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primark-navy to-primark-blue p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle size={24} />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-primark-grey mb-4">{error}</p>
          <button onClick={fetchStores} className="w-full btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primark-navy to-primark-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1
            className="font-bold text-primark-blue mb-2"
            style={{
              fontSize: '28px',
              letterSpacing: '0.2em',
              fontWeight: 700,
            }}
          >
            PRIMARK
          </h1>
          <p className="text-white/80 text-sm">Changing Room Tracker</p>
        </div>

        {/* Login Card */}
        <div className="bg-primark-light-grey rounded-lg shadow-xl p-8">
          {/* Store Selection */}
          {!selectedStore && (
            <div>
              <h2 className="text-xl font-bold text-primark-navy mb-4 text-center">
                Select Your Store
              </h2>
              <select
                onChange={(e) => e.target.value && handleStoreSelect(e.target.value)}
                className="w-full px-4 py-3 border-2 border-primark-grey/30 rounded-lg focus:outline-none focus:border-primark-blue focus:ring-2 focus:ring-primark-blue/20 text-primark-navy"
              >
                <option value="">Select a store...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.store_name} - {store.location}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Team Member Selection */}
          {selectedStore && !selectedMember && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-primark-navy mb-1">
                  Select Team Member
                </h2>
                <p className="text-sm text-primark-grey">{selectedStore.store_name}</p>
              </div>
              <select
                onChange={(e) => e.target.value && handleMemberSelect(e.target.value)}
                className="w-full px-4 py-3 border-2 border-primark-grey/30 rounded-lg focus:outline-none focus:border-primark-blue focus:ring-2 focus:ring-primark-blue/20 text-primark-navy mb-4"
              >
                <option value="">Select your name...</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBack}
                className="w-full py-3 text-primark-blue hover:bg-primark-light-blue rounded-lg transition-colors"
              >
                ← Back to Store Selection
              </button>
            </div>
          )}

          {/* PIN Entry */}
          {selectedStore && selectedMember && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-primark-navy mb-1">Enter Your PIN</h2>
                <p className="text-sm text-primark-grey">{selectedMember.full_name}</p>
              </div>

              {/* PIN Display */}
              <div
                className={`flex items-center justify-center gap-3 p-4 bg-primark-light-grey rounded-lg mb-4 ${
                  shake ? 'animate-shake' : ''
                }`}
              >
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border-2 border-primark-navy"
                    style={{
                      backgroundColor: pin.length > index ? '#1A1F36' : 'transparent',
                    }}
                  />
                ))}
              </div>

              {/* PIN Pad */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinPress(digit)}
                    className="h-16 text-2xl font-bold bg-primark-light-blue text-primark-navy rounded-lg hover:bg-primark-blue hover:text-white active:scale-95 transition-all"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  disabled={pin.length === 0}
                  className="h-16 bg-primark-light-grey text-primark-grey rounded-lg hover:bg-primark-grey/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Delete size={24} />
                </button>
                <button
                  onClick={() => handlePinPress('0')}
                  className="h-16 text-2xl font-bold bg-primark-light-blue text-primark-navy rounded-lg hover:bg-primark-blue hover:text-white active:scale-95 transition-all"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  disabled={pin.length === 0}
                  className="h-16 bg-primark-light-grey text-primark-grey rounded-lg hover:bg-primark-grey/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⌫
                </button>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={pin.length !== 4}
                className="w-full inline-flex items-center justify-center gap-2 mb-4"
                size="lg"
              >
                <Check size={20} />
                Login
              </Button>

              {/* Error Message */}
              {pinError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{pinError}</p>
                </div>
              )}

              <button
                onClick={handleBack}
                className="w-full py-3 text-primark-blue hover:bg-primark-light-blue rounded-lg transition-colors"
              >
                ← Back to Team Selection
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          Internal use only • Staff members only
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
