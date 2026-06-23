import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '../data/RoleContext';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { NotificationBell } from '../components/NotificationBell';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo');

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate(isDemo ? '/demo' : '/');
  }

  return (
    <header
      className="shrink-0 z-40 flex items-center justify-between px-5"
      style={{ height: 56, background: '#fff', borderBottom: '1px solid #eaeaea' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-[#525252] hover:bg-gray-100 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center" style={{ height: 28, width: 28, borderRadius: 7, background: '#0e7490' }}>
            <svg className="text-white" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <span className="hidden sm:block" style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Renal Ride</span>
        </div>

        <div className="hidden sm:block" style={{ width: 1, height: 20, background: '#eaeaea' }} />
        <span className="hidden sm:block" style={{ fontSize: 13, color: '#666' }}>
          Fresenius Kidney Care — Riverside
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isDemo && (
          <span
            className="hidden sm:inline-flex items-center"
            style={{ fontSize: 11, fontWeight: 500, color: '#b45309', background: '#fffbeb', border: '1px solid #fceec5', padding: '3px 9px', borderRadius: 6 }}
          >
            Demo Mode
          </span>
        )}

        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="relative flex" style={{ height: 8, width: 8 }}>
            <span className="absolute inset-0 rounded-full" style={{ background: '#34d399', opacity: 0.65, animation: 'rr-ping 1.8s cubic-bezier(0,0,.2,1) infinite' }} />
            <span className="relative inline-flex rounded-full" style={{ height: 8, width: 8, background: '#10b981' }} />
          </span>
          <span style={{ fontSize: 12, color: '#737373', fontFamily: "'Geist Mono', monospace" }}>
            Live · {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>

        <NotificationBell />

        {isDemo && <RoleSwitcher />}

        <div className="hidden sm:block" style={{ width: 1, height: 20, background: '#eaeaea' }} />

        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center text-white"
            style={{ height: 30, width: 30, borderRadius: 999, background: '#0e7490', fontSize: 11, fontWeight: 600 }}
          >
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="hidden md:block" style={{ fontSize: 13, color: '#404040', fontWeight: 500 }}>{user.name}</span>
        </div>

        <button
          onClick={handleLogout}
          className="hidden sm:flex items-center gap-1.5 transition-colors cursor-pointer"
          style={{ fontSize: 12, color: '#a3a3a3' }}
          title="Sign out"
        >
          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
