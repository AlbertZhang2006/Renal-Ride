import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useRole } from '../data/RoleContext';
import { useNotifications } from '../data/NotificationContext';
import { cn } from '../utils/cn';

export function AppLayout() {
  const { role } = useRole();
  const { toasts } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isGuidedDemo = location.pathname.startsWith('/demo/guided');
  const isOpsDemo = location.pathname.startsWith('/demo/operations');
  const isDemo = isGuidedDemo || isOpsDemo;

  if (!role) return <Navigate to={isGuidedDemo ? '/demo/guided' : isOpsDemo ? '/demo/operations' : isDemo ? '/demo' : '/login'} replace />;

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
      {isDemo && (
        <div className={cn(
          'border-b px-4 py-1.5 text-center shrink-0',
          isGuidedDemo ? 'bg-emerald-50 border-emerald-200/60' : 'bg-amber-50 border-amber-200/60',
        )}>
          <p className={cn('text-[11px]', isGuidedDemo ? 'text-emerald-700' : 'text-amber-700')}>
            <span className="font-semibold">{isGuidedDemo ? 'Guided Demo' : 'Operations Demo'}</span>
            {' — '}
            {isGuidedDemo
              ? 'Follow Mary Johnson through a live dialysis pickup journey. Actions sync across all roles.'
              : 'Sample data only. Not for real patient information. HIPAA/security review required before production use.'}
            {' '}
            <a
              href="/demo"
              className={cn('underline underline-offset-2', isGuidedDemo ? 'text-emerald-800' : 'text-amber-800')}
            >
              Switch demo mode
            </a>
          </p>
        </div>
      )}
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto" style={{ background: '#fafafa' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '30px 36px 64px' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global toast renderer */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto px-4 py-3 rounded-lg shadow-lg border text-sm font-medium max-w-sm animate-[slideIn_0.3s_ease-out]',
              t.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
              t.type === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
              t.type === 'warning' && 'bg-amber-50 border-amber-200 text-amber-800',
            )}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' && (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
              {t.type === 'info' && (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
              )}
              {t.type === 'warning' && (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              )}
              {t.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
