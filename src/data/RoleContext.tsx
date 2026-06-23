/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserRole, User } from '../types';
import { demoUsers } from './roles';

const STORAGE_KEY = 'renal-ride-role';

function readStoredRole(): UserRole | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && ['patient', 'caregiver', 'clinic', 'vendor', 'admin'].includes(v)) {
      return v as UserRole;
    }
  } catch { /* SSR or private browsing — ignore */ }
  return null;
}

interface RoleContextValue {
  role: UserRole | null;
  user: User | null;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(readStoredRole);

  function setRole(r: UserRole) {
    localStorage.setItem(STORAGE_KEY, r);
    setRoleState(r);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setRoleState(null);
  }

  return (
    <RoleContext.Provider value={{ role, user: role ? demoUsers[role] : null, setRole, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function AuthRoleProvider({
  role,
  user,
  onLogout,
  children,
}: {
  role: UserRole;
  user: User;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <RoleContext.Provider value={{ role, user, setRole: () => {}, logout: onLogout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
