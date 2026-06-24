import { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusPill } from '../components/StatusPill';
import { Badge } from '../components/Badge';
import type { RideStatus } from '../types';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('rr-visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' },
    );
    root.querySelectorAll('.rr-reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return ref;
}

function BrandIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg style={{ width: size, height: size }} className={className} fill="none" viewBox="0 0 32 32" stroke="currentColor">
      <path d="M12 9C12 7 10 6 8 6C5.5 6 4 9.5 4 16C4 22.5 5.5 26 8 26C10 26 12 25 12 23C12 21 10 19 10 16C10 13 12 11 12 9Z" fill="currentColor" stroke="none" />
      <path d="M20 9C20 7 22 6 24 6C26.5 6 28 9.5 28 16C28 22.5 26.5 26 24 26C22 26 20 25 20 23C20 21 22 19 22 16C22 13 20 11 20 9Z" fill="currentColor" stroke="none" />
      <line x1="12" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function HeroDashboardPreview() {
  const rows: { name: string; initials: string; time: string; status: RideStatus; risk: 'low' | 'medium' | 'high' }[] = [
    { name: 'M. Santos', initials: 'MS', time: '5:15 AM', status: 'in_treatment', risk: 'high' },
    { name: 'R. Johnson', initials: 'RJ', time: '5:20 AM', status: 'in_treatment', risk: 'low' },
    { name: 'D. Williams', initials: 'DW', time: '9:10 AM', status: 'driver_en_route', risk: 'medium' },
    { name: 'L. Martinez', initials: 'LM', time: '9:15 AM', status: 'delayed', risk: 'medium' },
    { name: 'W. Davis', initials: 'WD', time: '1:10 PM', status: 'scheduled', risk: 'high' },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e5e5', boxShadow: '0 20px 60px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.04)', overflow: 'hidden' }}>
      <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-2">
          <span className="relative flex" style={{ height: 8, width: 8 }}>
            <span className="absolute inset-0 rounded-full" style={{ background: '#34d399', opacity: 0.65, animation: 'rr-ping 1.8s cubic-bezier(0,0,.2,1) infinite' }} />
            <span className="relative inline-flex rounded-full" style={{ height: 8, width: 8, background: '#10b981' }} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>Today's Rides</span>
        </div>
        <span style={{ fontSize: 11, color: '#a3a3a3', fontFamily: "'Geist Mono', monospace" }}>8 rides · Live</span>
      </div>
      {rows.map((r) => (
        <div key={r.name + r.time} className="flex items-center gap-3" style={{ padding: '12px 18px', borderBottom: '1px solid #f6f6f6' }}>
          <div className="flex items-center justify-center shrink-0" style={{ height: 30, width: 30, borderRadius: 999, background: '#f5f5f5', fontSize: 10, fontWeight: 600, color: '#666' }}>
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

const roles = [
  {
    title: 'Patient',
    desc: 'Track your ride in real time, confirm pickup readiness, request help with one tap, and stay connected to your care team.',
    gradient: 'linear-gradient(135deg, #0e7490, #22d3ee)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
    cta: 'Explore patient view',
  },
  {
    title: 'Caregiver',
    desc: 'Monitor your loved one\'s ride status, receive real-time alerts for pickup and drop-off, and coordinate directly with the clinic.',
    gradient: 'linear-gradient(135deg, #7c3aed, #c084fc)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />,
    cta: 'Explore caregiver view',
  },
  {
    title: 'Clinic Staff',
    desc: 'Manage today\'s ride board, flag at-risk patients before they miss treatment, dispatch return rides, and oversee every pickup.',
    gradient: 'linear-gradient(135deg, #059669, #34d399)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />,
    cta: 'Explore clinic dashboard',
  },
  {
    title: 'Transportation Vendor',
    desc: 'Accept ride assignments, update trip status in real time, manage your fleet and drivers, and coordinate seamlessly with clinics.',
    gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />,
    cta: 'Explore vendor view',
  },
  {
    title: 'Administrator',
    desc: 'Full system oversight — manage users, clinics, vendors, and platform-wide settings with complete visibility across all operations.',
    gradient: 'linear-gradient(135deg, #475569, #94a3b8)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />,
    cta: 'Explore admin view',
  },
];

const features = [
  {
    title: 'Command Center',
    desc: 'See every patient\'s ride status in real time — who\'s en route, in treatment, delayed, or waiting for a return.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />,
  },
  {
    title: 'Risk Queue',
    desc: 'Surfaces at-risk rides with clinical reasoning — late drivers, missing vehicles, high-risk patients — before they become emergencies.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />,
  },
  {
    title: 'Return Ride Manager',
    desc: 'One-tap return dispatch when treatment ends. Supports scheduled pickups, will-call, and clinic-triggered returns.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />,
  },
];


export function Landing() {
  const pageRef = useScrollReveal();
  const [roleIdx, setRoleIdx] = useState(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const goToRole = useCallback((i: number) => {
    setRoleIdx((i + roles.length) % roles.length);
  }, []);

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', background: '#fff', overflowX: 'hidden' }}>
      {/* ─── Nav ─── */}
      <header className="sticky top-0 z-30" style={{ background: 'rgba(255,255,255,.82)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
        <div className="flex items-center justify-between" style={{ maxWidth: 1120, margin: '0 auto', padding: '0 28px', height: 60 }}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center text-white" style={{ height: 30, width: 30, borderRadius: 8, background: '#0e7490' }}>
              <BrandIcon size={16} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: '#171717' }}>Renal Ride</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <button className="cursor-pointer" style={{ height: 36, padding: '0 14px', border: 'none', background: 'none', color: '#525252', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>
                Sign in
              </button>
            </Link>
            <Link to="/demo">
              <button className="cursor-pointer" style={{ height: 36, padding: '0 18px', borderRadius: 8, border: 'none', background: '#0e7490', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0c6580'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0e7490'; }}
              >
                Try demo
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 28px 64px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: 64 }}>
          <div>
            <h1 style={{ fontSize: 48, lineHeight: 1.08, fontWeight: 700, letterSpacing: '-0.035em', margin: 0, color: '#0a0a0a', animation: 'rr-hero-up .9s cubic-bezier(.16,1,.3,1) .05s both' }}>
              Reliable dialysis rides,{' '}
              <span style={{ color: '#0e7490' }}>from pickup to return&nbsp;home.</span>
            </h1>
            <p style={{ margin: '22px 0 0', fontSize: 17, lineHeight: 1.65, color: '#555', maxWidth: 480, animation: 'rr-hero-up .9s cubic-bezier(.16,1,.3,1) .15s both' }}>
              Coordinate recurring pickups, manage return rides, flag at-risk patients before they miss treatment, and keep caregivers connected — all in one platform.
            </p>
            <div className="flex flex-wrap items-center" style={{ gap: 12, marginTop: 32, animation: 'rr-hero-up .9s cubic-bezier(.16,1,.3,1) .25s both' }}>
              <Link to="/demo">
                <button className="inline-flex items-center cursor-pointer" style={{ height: 48, padding: '0 26px', borderRadius: 12, border: 'none', background: '#0e7490', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', gap: 10, transition: 'background .15s, transform .15s, box-shadow .15s', boxShadow: '0 1px 3px rgba(14,116,144,.25)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0c6580'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(14,116,144,.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0e7490'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(14,116,144,.25)'; }}
                >
                  Try Interactive Demo
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </Link>
              <Link to="/login">
                <button className="inline-flex items-center cursor-pointer" style={{ height: 48, padding: '0 24px', borderRadius: 12, border: '1px solid #e0e0e0', background: '#fff', color: '#404040', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', transition: 'border-color .15s, background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0c0c0'; e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.background = '#fff'; }}
                >
                  Sign In
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center" style={{ gap: 20, marginTop: 28, fontSize: 13, color: '#888', animation: 'rr-hero-up .9s cubic-bezier(.16,1,.3,1) .35s both' }}>
              <Link to="/request-demo" style={{ color: '#0e7490', fontWeight: 500, textDecoration: 'none' }}>
                Request clinic access&nbsp;→
              </Link>
            </div>
          </div>

          <div className="hidden lg:block" style={{ animation: 'rr-hero-up .9s cubic-bezier(.16,1,.3,1) .3s both' }}>
            <HeroDashboardPreview />
          </div>
        </div>
        <div className="lg:hidden" style={{ marginTop: 40, animation: 'rr-hero-up .9s cubic-bezier(.16,1,.3,1) .4s both' }}>
          <HeroDashboardPreview />
        </div>
      </section>

      {/* ─── Full-width visual section ─── */}
      <section className="rr-reveal" style={{ position: 'relative', overflow: 'hidden', minHeight: 420 }}>
        <img
          src="https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1920&q=80"
          alt="Patient arriving for dialysis care"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(14,116,144,.93) 0%, rgba(21,94,117,.88) 50%, rgba(12,60,78,.92) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto', padding: '80px 28px' }}>
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#67e8f9', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px' }}>
              Why it matters
            </p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em', margin: 0 }}>
              Every missed ride is a missed treatment.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.8)', lineHeight: 1.65, margin: '20px auto 0', maxWidth: 640 }}>
              Renal Ride closes the coordination gap between clinics, transportation vendors, patients, and caregivers — reducing no-shows and improving dialysis adherence.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 0, marginTop: 48 }}>
            {[
              { n: '500K+', d: 'patients on dialysis in the U.S.' },
              { n: '3×', d: 'treatments needed per week' },
              { n: '30%', d: 'higher hospitalization from missed sessions' },
            ].map((item, i) => (
              <div key={item.n} style={{ textAlign: 'center', padding: '24px 20px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,.15)' : 'none' }}>
                <p style={{ fontSize: 40, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{item.n}</p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', margin: '6px 0 0' }}>{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Role showcase ─── */}
      <section style={{ padding: '80px 0 72px' }}>
        <div className="rr-reveal" style={{ maxWidth: 1120, margin: '0 auto', padding: '0 28px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0e7490', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 10px', textAlign: 'center' }}>
            Role-based experience
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: '#0a0a0a', textAlign: 'center' }}>
            Every role, one platform.
          </h2>
          <p style={{ fontSize: 16, color: '#666', margin: '0 auto 48px', maxWidth: 480, textAlign: 'center' }}>
            Patients, caregivers, clinics, vendors, and admins each get a purpose-built dashboard.
          </p>
        </div>

        <div className="rr-reveal" style={{ maxWidth: 900, margin: '0 auto', position: 'relative', padding: '0 60px' }}>
          {/* Left arrow */}
          <button
            onClick={() => goToRole(roleIdx - 1)}
            className="cursor-pointer"
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 48, height: 48, borderRadius: 999, border: '1px solid #e0e0e0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.1)', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0e7490'; e.currentTarget.style.borderColor = '#0e7490'; (e.currentTarget.querySelector('svg') as SVGElement).style.stroke = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e0e0'; (e.currentTarget.querySelector('svg') as SVGElement).style.stroke = '#555'; }}
          >
            <svg style={{ width: 20, height: 20, transition: 'stroke .2s' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="#555"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
          </button>

          {/* Right arrow */}
          <button
            onClick={() => goToRole(roleIdx + 1)}
            className="cursor-pointer"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 48, height: 48, borderRadius: 999, border: '1px solid #e0e0e0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.1)', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0e7490'; e.currentTarget.style.borderColor = '#0e7490'; (e.currentTarget.querySelector('svg') as SVGElement).style.stroke = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e0e0'; (e.currentTarget.querySelector('svg') as SVGElement).style.stroke = '#555'; }}
          >
            <svg style={{ width: 20, height: 20, transition: 'stroke .2s' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="#555"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </button>

          {/* 3-card visible carousel with swipe */}
          <div
            style={{ overflow: 'hidden' }}
            onTouchStart={e => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            onTouchEnd={e => {
              if (!touchRef.current) return;
              const dx = e.changedTouches[0].clientX - touchRef.current.x;
              const dy = e.changedTouches[0].clientY - touchRef.current.y;
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                goToRole(dx < 0 ? roleIdx + 1 : roleIdx - 1);
              }
              touchRef.current = null;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, minHeight: 420 }}>
              {roles.map((role, i) => {
                const diff = i - roleIdx;
                const isCenter = diff === 0;
                const isAdj = diff === 1 || diff === -1 || (roleIdx === 0 && i === roles.length - 1) || (roleIdx === roles.length - 1 && i === 0);
                const isLeft = diff === -1 || (roleIdx === 0 && i === roles.length - 1);
                if (!isCenter && !isAdj) return null;
                return (
                  <div
                    key={role.title}
                    onClick={() => { if (!isCenter) goToRole(i); }}
                    className={isAdj ? 'cursor-pointer' : ''}
                    style={{
                      width: isCenter ? '60%' : '20%',
                      minWidth: isCenter ? 340 : 120,
                      flexShrink: 0,
                      opacity: isCenter ? 1 : 0.45,
                      transform: isCenter ? 'scale(1)' : 'scale(0.88)',
                      filter: isCenter ? 'none' : 'blur(1px)',
                      transition: 'all .45s cubic-bezier(.16,1,.3,1)',
                      pointerEvents: 'auto',
                      order: isLeft ? 0 : isCenter ? 1 : 2,
                    }}
                  >
                    <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid #eaeaea', background: '#fff', boxShadow: isCenter ? '0 12px 40px rgba(0,0,0,.1)' : '0 2px 8px rgba(0,0,0,.04)' }}>
                      <div style={{ height: isCenter ? 170 : 100, background: role.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'height .45s cubic-bezier(.16,1,.3,1)' }}>
                        <div style={{ width: isCenter ? 72 : 44, height: isCenter ? 72 : 44, borderRadius: isCenter ? 18 : 12, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', transition: 'all .45s cubic-bezier(.16,1,.3,1)' }}>
                          <svg style={{ width: isCenter ? 36 : 22, height: isCenter ? 36 : 22, transition: 'all .45s cubic-bezier(.16,1,.3,1)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff">
                            {role.icon}
                          </svg>
                        </div>
                      </div>
                      <div style={{ padding: isCenter ? '24px 28px 28px' : '14px 16px 16px', transition: 'padding .45s cubic-bezier(.16,1,.3,1)' }}>
                        <h3 style={{ fontSize: isCenter ? 20 : 14, fontWeight: 700, margin: 0, color: '#171717', transition: 'font-size .45s cubic-bezier(.16,1,.3,1)' }}>{role.title}</h3>
                        {isCenter && (
                          <>
                            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.65, margin: '10px 0 0' }}>{role.desc}</p>
                            <Link to="/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 600, color: '#0e7490', textDecoration: 'none', marginTop: 18 }}>
                              {role.cta}
                              <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
            {roles.map((role, i) => (
              <button
                key={role.title}
                onClick={() => goToRole(i)}
                className="cursor-pointer"
                style={{
                  width: roleIdx === i ? 28 : 10,
                  height: 10,
                  borderRadius: 999,
                  border: 'none',
                  background: roleIdx === i ? '#0e7490' : '#d4d4d4',
                  transition: 'all .3s cubic-bezier(.16,1,.3,1)',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Swipe hint on mobile */}
          <p className="sm:hidden" style={{ textAlign: 'center', fontSize: 12, color: '#a3a3a3', marginTop: 12 }}>
            Swipe to explore roles
          </p>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', padding: '80px 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 28px' }}>
          <div className="rr-reveal text-center" style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0e7490', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 10px' }}>
              Platform capabilities
            </p>
            <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: '#0a0a0a' }}>
              Built for dialysis coordination
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 20 }}>
            {features.map((f, i) => (
              <div key={f.title} className={`rr-reveal rr-delay-${i + 1}`} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 16, padding: 28, transition: 'transform .25s ease, box-shadow .25s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ height: 48, width: 48, borderRadius: 12, background: 'linear-gradient(135deg, #f0f7f9, #e0f0f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="#0e7490">
                    {f.icon}
                  </svg>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#171717' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: '10px 0 0' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="rr-reveal" style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 28px' }}>
        <div className="text-center" style={{ borderRadius: 24, background: 'linear-gradient(135deg, #0e7490, #155e75)', padding: '64px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
              See Renal Ride in action
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', maxWidth: 460, margin: '14px auto 0', lineHeight: 1.55 }}>
              Explore the interactive demo with sample data, or request access for your clinic.
            </p>
            <div className="flex flex-wrap items-center justify-center" style={{ gap: 12, marginTop: 32 }}>
              <Link to="/demo">
                <button className="inline-flex items-center cursor-pointer" style={{ height: 48, padding: '0 28px', borderRadius: 12, border: 'none', background: '#fff', color: '#0e6a82', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', gap: 8, transition: 'transform .15s, box-shadow .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Try Interactive Demo
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </Link>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link to="/request-demo" style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,.9)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.65)'; }}
              >
                Request clinic access&nbsp;→
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: '1px solid #f0f0f0' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 28px', gap: 16 }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center text-white" style={{ height: 24, width: 24, borderRadius: 6, background: '#0e7490' }}>
              <BrandIcon size={14} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#525252' }}>Renal Ride</span>
          </div>
          <span style={{ fontSize: 12, color: '#a3a3a3' }}>Dialysis transportation coordination</span>
        </div>
      </footer>
    </div>
  );
}
