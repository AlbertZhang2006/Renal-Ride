import { Link, useNavigate } from 'react-router-dom';
import { useRole } from '../data/RoleContext';
import { demoUsers } from '../data/roles';
import type { UserRole } from '../types';

const roles: { role: UserRole; label: string; desc: string; persona: string; icon: React.ReactNode }[] = [
  {
    role: 'clinic',
    label: 'Clinic Coordinator',
    desc: 'Command center for today\'s rides, risk queue, return ride dispatch, and vendor oversight.',
    persona: 'Dr. Sarah Patel',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />,
  },
  {
    role: 'patient',
    label: 'Patient',
    desc: 'View today\'s ride, track your driver, and request help — designed for accessibility.',
    persona: 'Maria Santos',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
  },
  {
    role: 'caregiver',
    label: 'Caregiver',
    desc: 'Monitor rides for the patients you care for. Receive pickup and drop-off notifications.',
    persona: 'Carlos Santos',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />,
  },
  {
    role: 'vendor',
    label: 'Transportation Vendor',
    desc: 'Accept ride requests, dispatch drivers, manage your fleet, and view performance metrics.',
    persona: 'CareRide Medical',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />,
  },
  {
    role: 'admin',
    label: 'Administrator',
    desc: 'Full system oversight. Manage users, clinics, vendors, and platform settings.',
    persona: 'Platform Admin',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />,
  },
];

export function Login() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  function handleSelect(role: UserRole) {
    setRole(role);
    navigate(`/demo/operations/${role}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center justify-between" style={{ maxWidth: 840, margin: '0 auto', padding: '0 24px', height: 58 }}>
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="flex items-center justify-center" style={{ height: 28, width: 28, borderRadius: 7, background: '#0e7490' }}>
              <svg style={{ width: 16, height: 16 }} className="text-white" fill="none" viewBox="0 0 32 32" stroke="currentColor">
                <path strokeLinecap="round" strokeWidth={3} d="M6.5 19.5C9 19.5 11 17.5 13.5 15.5S18 13.5 20 15s3.5 4 6 4" />
                <circle cx="6.5" cy="19.5" r="2.5" fill="currentColor" stroke="none" />
                <circle cx="26" cy="19" r="2.5" fill="#34d399" stroke="none" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#171717' }}>Renal Ride</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/demo" style={{ fontSize: 12, color: '#0e7490', fontWeight: 500, textDecoration: 'none' }}>
              ← Demo Home
            </Link>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#b45309', background: '#fffbeb', border: '1px solid #fceec5', padding: '3px 9px', borderRadius: 6 }}>
              Operations Demo
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '48px 24px 96px' }}>
        <div className="text-center" style={{ marginBottom: 36, maxWidth: 500 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            Operations Dashboard Demo
          </h1>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.55, margin: '10px 0 0' }}>
            Explore the full Renal Ride platform with sample data — multiple patients, rides, vendors, risk queue, reports, and more. Select a role below.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2" style={{ maxWidth: 720, gap: 12 }}>
          {roles.map((r) => {
            const user = demoUsers[r.role];
            return (
              <button
                key={r.role}
                onClick={() => handleSelect(r.role)}
                className="group text-left cursor-pointer"
                style={{
                  background: '#fff',
                  border: '1px solid #eaeaea',
                  borderRadius: 14,
                  padding: 18,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eaeaea'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex items-center justify-center shrink-0" style={{ height: 40, width: 40, borderRadius: 10, background: '#f0f7f9' }}>
                    <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="#0e7490">
                      {r.icon}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#171717' }}>{r.label}</h2>
                    <p style={{ fontSize: 13, color: '#737373', lineHeight: 1.5, margin: '4px 0 0' }}>{r.desc}</p>
                  </div>
                  <svg className="shrink-0" style={{ width: 16, height: 16, marginTop: 2 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#c4c4c4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>

                <div className="flex items-center gap-2" style={{ marginTop: 14, paddingTop: 13, borderTop: '1px solid #f4f4f4' }}>
                  <div className="flex items-center justify-center" style={{ height: 22, width: 22, borderRadius: 999, background: '#f3f3f3', fontSize: 9, fontWeight: 600, color: '#666' }}>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span style={{ fontSize: 12, color: '#a3a3a3' }}>
                    Demo as <span style={{ color: '#525252', fontWeight: 500 }}>{r.persona}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center" style={{ marginTop: 32, fontSize: 11, color: '#a3a3a3', maxWidth: 380, lineHeight: 1.5 }}>
          No account or password needed. Each role shows a pre-configured dashboard with
          sample dialysis transportation data.
        </p>
        <p className="text-center" style={{ marginTop: 12 }}>
          <Link to="/login" style={{ fontSize: 12, color: '#0e7490', fontWeight: 500, textDecoration: 'none' }}>
            Have an account? Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
