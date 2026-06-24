import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '../data/RoleContext';
import { roleLabels, roleDescriptions, roleColors } from '../data/roles';
import type { UserRole } from '../types';
import { cn } from '../utils/cn';

const roles: UserRole[] = ['patient', 'caregiver', 'clinic', 'vendor', 'admin'];

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isGuidedDemo = location.pathname.startsWith('/demo/guided');
  const isOpsDemo = location.pathname.startsWith('/demo/operations');
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!role) return null;

  function handleSelect(r: UserRole) {
    setRole(r);
    const prefix = isGuidedDemo ? '/demo/guided' : isOpsDemo ? '/demo/operations' : '/app';
    navigate(`${prefix}/${r}`);
    setOpen(false);
  }

  const c = roleColors[role];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
          c.bg, c.text,
          'hover:opacity-80',
        )}
      >
        <span className={cn('h-2 w-2 rounded-full', c.dot)} />
        {roleLabels[role]}
        <svg className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Switch Role</p>
          </div>
          {roles.filter(r => !(isGuidedDemo && r === 'admin')).map((r) => {
            const rc = roleColors[r];
            return (
              <button
                key={r}
                onClick={() => handleSelect(r)}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer',
                  r === role ? 'bg-gray-50' : 'hover:bg-gray-50',
                )}
              >
                <span className={cn('mt-1 h-2 w-2 rounded-full shrink-0', rc.dot)} />
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium', r === role ? 'text-gray-900' : 'text-gray-700')}>
                    {roleLabels[r]}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{roleDescriptions[r]}</p>
                </div>
                {r === role && (
                  <svg className="w-4 h-4 text-brand-600 shrink-0 ml-auto mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
