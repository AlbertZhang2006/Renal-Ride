import { Link, useNavigate } from 'react-router-dom';
import { useRole } from '../data/RoleContext';
import { roleLabels, roleColors, demoUsers } from '../data/roles';
import type { UserRole } from '../types';
import { cn } from '../utils/cn';

const roles: UserRole[] = ['patient', 'caregiver', 'clinic', 'vendor', 'admin'];

const roleIcons: Record<UserRole, React.ReactNode> = {
  patient: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  ),
  caregiver: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  ),
  clinic: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  ),
  vendor: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />
  ),
  admin: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
  ),
};

const roleDetailedDesc: Record<UserRole, string> = {
  patient: 'View your upcoming rides, track driver status in real time, and manage your dialysis transportation schedule.',
  caregiver: 'Monitor rides for the patients you care for. Receive pickup and drop-off notifications.',
  clinic: 'See all patient rides at a glance. Manage the risk queue, request return rides, and track vendor performance.',
  vendor: 'Accept ride requests, dispatch drivers, manage your fleet, and view performance metrics.',
  admin: 'Full system oversight. Manage users, clinics, vendors, and platform settings.',
};

export function Login() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  function handleSelect(role: UserRole) {
    setRole(role);
    navigate(`/demo/${role}`);
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Renal Ride</span>
          </Link>
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200/60">
            Demo Mode
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        {/* Heading */}
        <div className="text-center mb-10 max-w-lg">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
            Choose a role to explore
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Renal Ride coordinates dialysis transportation between patients, caregivers,
            clinics, and vendors. Select a role below to see the demo dashboard.
          </p>
        </div>

        {/* Role cards grid */}
        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((r) => {
            const c = roleColors[r];
            const user = demoUsers[r];
            return (
              <button
                key={r}
                onClick={() => handleSelect(r)}
                className={cn(
                  'group relative bg-white rounded-xl border border-gray-200 p-5 text-left transition-all cursor-pointer',
                  'hover:border-gray-300 hover:shadow-sm',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                  r === 'admin' && 'sm:col-span-2 sm:max-w-[calc(50%-6px)]  sm:mx-auto',
                )}
              >
                {/* Icon + label row */}
                <div className="flex items-start gap-3.5">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
                    <svg className={cn('w-5 h-5', c.text)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      {roleIcons[r]}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-900">{roleLabels[r]}</h2>
                      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {roleDetailedDesc[r]}
                    </p>
                  </div>
                  {/* Arrow */}
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>

                {/* Demo persona */}
                <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-semibold text-gray-500">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Demo as <span className="text-gray-600 font-medium">{user.name}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-[11px] text-gray-400 text-center max-w-sm leading-relaxed">
          No account or password needed. Each role shows a pre-configured dashboard with
          sample dialysis transportation data.
        </p>
        <p className="mt-3 text-center">
          <Link to="/login" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            Have an account? Sign in &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
