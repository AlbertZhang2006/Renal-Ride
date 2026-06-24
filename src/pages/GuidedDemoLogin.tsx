import { Link, useNavigate } from 'react-router-dom';
import { useRole } from '../data/RoleContext';
import type { UserRole } from '../types';

const roles: { role: UserRole; label: string; desc: string; persona: string; icon: React.ReactNode }[] = [
  {
    role: 'patient',
    label: 'Patient',
    desc: 'Experience readiness alerts, ride tracking, and the guided pickup journey as Mary Johnson.',
    persona: 'Mary Johnson',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
  },
  {
    role: 'caregiver',
    label: 'Caregiver',
    desc: 'Monitor Mary Johnson\'s ride status and receive real-time notifications as her caregiver.',
    persona: 'Robert Johnson',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />,
  },
  {
    role: 'clinic',
    label: 'Clinic Coordinator',
    desc: 'See Mary Johnson highlighted in the clinic command center with live status and risk alerts.',
    persona: 'Dr. Sarah Patel',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />,
  },
  {
    role: 'vendor',
    label: 'Transportation Vendor',
    desc: 'Dispatch and manage Mary Johnson\'s trip as the driver/vendor with real-time action buttons.',
    persona: 'CareRide Medical',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />,
  },
];

export function GuidedDemoLogin() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  function handleSelect(role: UserRole) {
    setRole(role);
    navigate(`/demo/guided/${role}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center justify-between" style={{ maxWidth: 840, margin: '0 auto', padding: '0 24px', height: 58 }}>
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="flex items-center justify-center" style={{ height: 28, width: 28, borderRadius: 7, background: '#0e7490' }}>
              <svg style={{ width: 16, height: 16 }} className="text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#171717' }}>Renal Ride</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/demo" style={{ fontSize: 12, color: '#0e7490', fontWeight: 500, textDecoration: 'none' }}>
              ← Demo Home
            </Link>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 9px', borderRadius: 6 }}>
              Guided Demo
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '48px 24px 96px' }}>
        <div className="text-center" style={{ marginBottom: 36, maxWidth: 500 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            Guided Pickup Demo
          </h1>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.55, margin: '10px 0 0' }}>
            Follow Mary Johnson through a live dialysis transportation journey. Choose a role to see the experience from that perspective.
          </p>
          <p style={{ fontSize: 12, color: '#a3a3a3', lineHeight: 1.5, margin: '8px 0 0' }}>
            State is shared — actions taken in one role are reflected in all others.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2" style={{ maxWidth: 720, gap: 12 }}>
          {roles.map((r) => (
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
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#a7f3d0'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eaeaea'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex items-center justify-center shrink-0" style={{ height: 40, width: 40, borderRadius: 10, background: '#ecfdf5' }}>
                  <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="#059669">
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
                <div className="flex items-center justify-center" style={{ height: 22, width: 22, borderRadius: 999, background: '#ecfdf5', fontSize: 9, fontWeight: 600, color: '#059669' }}>
                  {r.persona.split(' ').map(n => n[0]).join('')}
                </div>
                <span style={{ fontSize: 12, color: '#a3a3a3' }}>
                  Demo as <span style={{ color: '#525252', fontWeight: 500 }}>{r.persona}</span>
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center" style={{ marginTop: 32, fontSize: 11, color: '#a3a3a3', maxWidth: 380, lineHeight: 1.5 }}>
          This is a sample interactive demo using fictional patient data. State is shared across roles and persists when switching views.
        </p>
      </div>
    </div>
  );
}
