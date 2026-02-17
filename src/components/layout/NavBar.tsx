// Top navigation bar

import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function NavBar() {
  const { store, teamMember, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primark-navy text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-primark tracking-wide text-primark-blue">
            PRIMARK
          </h1>
          <p className="text-sm text-white/90">{store?.store_name}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primark-blue flex items-center justify-center">
              <User size={18} />
            </div>
            <div className="text-sm">
              <p className="font-medium">{teamMember?.full_name}</p>
              <p className="text-xs text-white/70 capitalize">{teamMember?.role.replace('_', ' ')}</p>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Log Out?"
        message="Are you sure you want to log out?"
        confirmText="Yes, Log Out"
        cancelText="Cancel"
        variant="warning"
      />
    </nav>
  );
}
