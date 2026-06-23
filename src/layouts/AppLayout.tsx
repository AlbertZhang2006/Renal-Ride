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
  const isDemo = location.pathname.startsWith('/demo');

  if (!role) return <Navigate to={isDemo ? '/demo' : '/login'} replace />;

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
      {isDemo && (
        <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-1.5 text-center shrink-0">
          <p className="text-[11px] text-amber-700">
            <span className="font-semibold">Prototype Demo</span> — Sample data only. Not for real patient information. HIPAA/security review required before production use.
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
