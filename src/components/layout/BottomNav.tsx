// Bottom navigation for mobile

import { Home, ArrowRightLeft, BarChart3, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', roles: ['team_member', 'manager', 'admin'] },
    { icon: ArrowRightLeft, label: 'Back of House', path: '/back-of-house', roles: ['team_member', 'manager', 'admin'] },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard', roles: ['manager', 'admin'] },
    { icon: Settings, label: 'Admin', path: '/admin', roles: ['admin'] },
  ];

  const visibleItems = navItems.filter(item => hasRole(item.roles as any));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-primark-grey/20 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-around">
        {visibleItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 transition-colors',
                isActive ? 'text-primark-blue' : 'text-primark-grey hover:text-primark-navy'
              )}
            >
              <Icon size={24} />
              <span className="text-xs font-medium mt-1">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
