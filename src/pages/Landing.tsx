import { Link } from 'react-router-dom';
import { StatusPill } from '../components/StatusPill';
import { Badge } from '../components/Badge';
import type { RideStatus } from '../types';

function HeroDashboardPreview() {
  const rows: { name: string; initials: string; time: string; status: RideStatus; risk: 'low' | 'medium' | 'high' }[] = [
    { name: 'M. Santos', initials: 'MS', time: '5:15 AM', status: 'in_treatment', risk: 'high' },
    { name: 'R. Johnson', initials: 'RJ', time: '5:20 AM', status: 'in_treatment', risk: 'low' },
    { name: 'D. Williams', initials: 'DW', time: '9:10 AM', status: 'driver_en_route', risk: 'medium' },
    { name: 'L. Martinez', initials: 'LM', time: '9:15 AM', status: 'delayed', risk: 'medium' },
    { name: 'W. Davis', initials: 'WD', time: '1:10 PM', status: 'scheduled', risk: 'high' },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eaeaea', boxShadow: '0 16px 44px rgba(0,0,0,.08)', overflow: 'hidden' }}>
      <div className="flex items-center justify-between" style={{ padding: '13px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-2">
          <span className="relative flex" style={{ height: 8, width: 8 }}>
            <span className="absolute inset-0 rounded-full" style={{ background: '#34d399', opacity: 0.65, animation: 'rr-ping 1.8s cubic-bezier(0,0,.2,1) infinite' }} />
            <span className="relative inline-flex rounded-full" style={{ height: 8, width: 8, background: '#10b981' }} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Today's Rides</span>
        </div>
        <span style={{ fontSize: 11, color: '#a3a3a3', fontFamily: "'Geist Mono', monospace" }}>8 rides · Live</span>
      </div>
      {rows.map((r) => (
        <div key={r.name + r.time} className="flex items-center gap-3" style={{ padding: '11px 16px', borderBottom: '1px solid #f6f6f6' }}>
          <div className="flex items-center justify-center shrink-0" style={{ height: 28, width: 28, borderRadius: 999, background: '#f3f3f3', fontSize: 10, fontWeight: 600, color: '#666' }}>
            {r.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 13, fontWeight: 500, color: '#262626', margin: 0 }}>{r.name}</p>
            <p style={{ fontSize: 11, color: '#a3a3a3', margin: 0 }}>{r.time}</p>
          </div>
          <Badge variant={r.risk} className="hidden sm:inline-flex">{r.risk === 'medium' ? 'Med' : r.risk.charAt(0).toUpperCase() + r.risk.slice(1)}</Badge>
          <StatusPill status={r.status} />
        </div>
      ))}
    </div>
  );
}

const features = [
  {
    title: 'Command Center',
    desc: 'See every patient\'s ride status in real time — who\'s en route, in treatment, delayed, or waiting for a return.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    ),
  },
  {
    title: 'Risk Queue',
    desc: 'Surfaces at-risk rides with clinical reasoning — late drivers, missing vehicles, high-risk patients — before they become emergencies.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    ),
  },
  {
    title: 'Return Ride Manager',
    desc: 'One-tap return dispatch when treatment ends. Supports scheduled pickups, will-call, and clinic-triggered returns.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    ),
  },
];

export function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Nav */}
      <header className="sticky top-0 z-30" style={{ background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center justify-between" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px', height: 60 }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center" style={{ height: 30, width: 30, borderRadius: 8, background: '#0e7490' }}>
              <svg style={{ width: 16, height: 16 }} className="text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Renal Ride</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <button className="cursor-pointer" style={{ height: 36, padding: '0 14px', border: 'none', background: 'none', color: '#525252', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>
                Sign in
              </button>
            </Link>
            <Link to="/demo">
              <button className="cursor-pointer" style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: '#0e7490', color: '#fff', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>
                Try demo
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 28px 56px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: 56 }}>
          <div>
            <div className="inline-flex items-center gap-2" style={{ borderRadius: 999, background: '#f0f7f9', border: '1px solid #d8e8ec', padding: '5px 12px', fontSize: 12, fontWeight: 500, color: '#0e6a82', marginBottom: 22 }}>
              <span className="relative flex" style={{ height: 6, width: 6 }}>
                <span className="absolute inset-0 rounded-full" style={{ background: '#67c5d4', opacity: 0.6, animation: 'rr-ping 1.8s cubic-bezier(0,0,.2,1) infinite' }} />
                <span className="relative inline-flex rounded-full" style={{ height: 6, width: 6, background: '#0e7490' }} />
              </span>
              Dialysis Transportation Platform
            </div>
            <h1 style={{ fontSize: 42, lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.03em', margin: 0 }}>
              Reliable dialysis transportation from pickup to return&nbsp;home.
            </h1>
            <p style={{ margin: '20px 0 0', fontSize: 16, lineHeight: 1.6, color: '#666', maxWidth: 480 }}>
              Renal Ride helps dialysis clinics coordinate recurring rides, manage
              return transportation, alert staff when patients are at risk of missing
              treatment, and keep caregivers informed.
            </p>
            <div className="flex flex-wrap items-center" style={{ gap: 12, marginTop: 28 }}>
              <Link to="/demo">
                <button className="inline-flex items-center cursor-pointer" style={{ height: 44, padding: '0 22px', borderRadius: 10, border: 'none', background: '#0e7490', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', gap: 8 }}>
                  Try Interactive Demo
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </Link>
              <Link to="/login">
                <button className="inline-flex items-center cursor-pointer" style={{ height: 44, padding: '0 22px', borderRadius: 10, border: '1px solid #e2e2e2', background: '#fff', color: '#404040', fontSize: 15, fontWeight: 500, fontFamily: 'inherit' }}>
                  Sign In
                </button>
              </Link>
            </div>
            <div className="flex items-center" style={{ gap: 20, marginTop: 24, fontSize: 12, color: '#999' }}>
              <span className="flex items-center gap-1.5">
                <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="#10b981">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Demo uses sample data
              </span>
              <span className="flex items-center gap-1.5">
                <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="#10b981">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                5 role demos
              </span>
              <Link to="/request-demo" style={{ color: '#0e7490', fontWeight: 500, fontSize: 12, textDecoration: 'none' }}>
                Request Clinic Access →
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <HeroDashboardPreview />
          </div>
        </div>
        <div className="lg:hidden" style={{ marginTop: 40 }}>
          <HeroDashboardPreview />
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px 64px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 18 }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 14, padding: 22 }}>
              <div className="flex items-center justify-center" style={{ height: 40, width: 40, borderRadius: 10, background: '#f0f7f9', marginBottom: 15 }}>
                <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="#0e7490">
                  {f.icon}
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#737373', lineHeight: 1.55, margin: '8px 0 0' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px 72px' }}>
        <div className="text-center" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #0e7490, #155e75)', padding: '56px 32px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            See Renal Ride in action
          </h2>
          <p style={{ fontSize: 15, color: '#bfe3ea', maxWidth: 440, margin: '12px auto 0', lineHeight: 1.55 }}>
            Explore the interactive demo with sample data, or sign in to manage
            real dialysis transportation.
          </p>
          <div className="flex flex-wrap items-center justify-center" style={{ gap: 12, marginTop: 28 }}>
            <Link to="/demo">
              <button className="inline-flex items-center cursor-pointer" style={{ height: 44, padding: '0 24px', borderRadius: 10, border: 'none', background: '#fff', color: '#0e6a82', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', gap: 8 }}>
                Try Interactive Demo
                <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </Link>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link to="/request-demo" style={{ fontSize: 14, color: '#bfe3ea', textDecoration: 'none' }}>
              Request clinic access →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px', gap: 16 }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center" style={{ height: 24, width: 24, borderRadius: 6, background: '#0e7490' }}>
              <svg style={{ width: 14, height: 14 }} className="text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#525252' }}>Renal Ride</span>
          </div>
          <span style={{ fontSize: 12, color: '#a3a3a3' }}>Dialysis transportation coordination — Prototype</span>
        </div>
      </footer>
    </div>
  );
}
