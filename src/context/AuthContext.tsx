// Authentication context provider

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Store, TeamMember } from '@/lib/types';

interface AuthContextType {
  store: Store | null;
  teamMember: TeamMember | null;
  isAuthenticated: boolean;
  login: (store: Store, member: TeamMember) => void;
  logout: () => void;
  hasRole: (roles: Array<'team_member' | 'manager' | 'admin'>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'primark_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);

  // Load from session storage on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const { store: savedStore, teamMember: savedMember } = JSON.parse(savedAuth);
        setStore(savedStore);
        setTeamMember(savedMember);
      } catch (error) {
        console.error('Failed to parse saved auth:', error);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const login = (newStore: Store, newMember: TeamMember) => {
    setStore(newStore);
    setTeamMember(newMember);
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ store: newStore, teamMember: newMember })
    );
  };

  const logout = () => {
    setStore(null);
    setTeamMember(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const hasRole = (roles: Array<'team_member' | 'manager' | 'admin'>): boolean => {
    if (!teamMember) return false;
    return roles.includes(teamMember.role);
  };

  const value: AuthContextType = {
    store,
    teamMember,
    isAuthenticated: !!store && !!teamMember,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
