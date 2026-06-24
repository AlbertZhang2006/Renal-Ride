import { Link } from 'react-router-dom';

export function DemoSelector() {
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
          <span style={{ fontSize: 11, fontWeight: 500, color: '#b45309', background: '#fffbeb', border: '1px solid #fceec5', padding: '3px 9px', borderRadius: 6 }}>
            Demo Mode
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '48px 24px 96px' }}>
        <div className="text-center" style={{ marginBottom: 40, maxWidth: 520 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            Choose a Demo Experience
          </h1>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.55, margin: '10px 0 0' }}>
            Explore Renal Ride with two demo modes — a guided walkthrough of a single patient journey, or a full operations dashboard with sample data.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2" style={{ maxWidth: 760, gap: 20 }}>
          {/* Card 1: Guided Pickup Demo */}
          <div
            className="relative bg-white overflow-hidden"
            style={{ borderRadius: 18, border: '1px solid #eaeaea', boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}
          >
            {/* Recommended badge */}
            <div className="absolute top-4 right-4">
              <span style={{ fontSize: 10, fontWeight: 600, color: '#0e7490', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Recommended
              </span>
            </div>

            {/* Icon area */}
            <div style={{ padding: '28px 24px 0' }}>
              <div className="flex items-center justify-center" style={{ height: 52, width: 52, borderRadius: 14, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', marginBottom: 18 }}>
                <svg style={{ width: 26, height: 26 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#059669">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 600, margin: 0, color: '#171717' }}>Guided Pickup Demo</h2>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: '10px 0 0' }}>
                Follow one dialysis patient through a live transportation journey. See how Renal Ride coordinates the patient, driver, clinic, caregiver, and vendor in real time.
              </p>

              {/* Steps */}
              <div style={{ margin: '16px 0 0' }}>
                {[
                  'Patient readiness alert',
                  'Driver arrival',
                  'Pickup confirmation',
                  'Transport to clinic',
                  'Treatment started',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5" style={{ padding: '5px 0' }}>
                    <div className="flex items-center justify-center shrink-0" style={{ height: 20, width: 20, borderRadius: 999, background: '#ecfdf5' }}>
                      <svg style={{ width: 11, height: 11 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#059669">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, color: '#525252' }}>{step}</span>
                  </div>
                ))}
              </div>

              <Link to="/demo/guided">
                <button
                  className="w-full cursor-pointer"
                  style={{
                    marginTop: 20,
                    height: 44,
                    borderRadius: 10,
                    border: 'none',
                    background: '#0e7490',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                >
                  Start Guided Demo
                </button>
              </Link>
            </div>
          </div>

          {/* Card 2: Operations Dashboard Demo */}
          <div
            className="bg-white overflow-hidden"
            style={{ borderRadius: 18, border: '1px solid #eaeaea', boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}
          >
            {/* Icon area */}
            <div style={{ padding: '28px 24px 0' }}>
              <div className="flex items-center justify-center" style={{ height: 52, width: 52, borderRadius: 14, background: 'linear-gradient(135deg, #f0f7f9, #dbeafe)', marginBottom: 18 }}>
                <svg style={{ width: 26, height: 26 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0e7490">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                </svg>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 600, margin: 0, color: '#171717' }}>Operations Dashboard Demo</h2>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: '10px 0 16px' }}>
                Explore the full Renal Ride platform using sample data, including clinic dashboards, standing orders, return rides, risk queue, vendors, reports, and patient views.
              </p>

              {/* Feature highlights */}
              <div style={{ margin: '0 0 0' }}>
                {[
                  { label: 'Clinic Command Center', desc: 'Real-time ride board' },
                  { label: 'Multiple Patients', desc: '8 sample patients' },
                  { label: 'Vendor Management', desc: 'Fleet & driver views' },
                  { label: 'Risk Queue & Reports', desc: 'Clinical insights' },
                  { label: 'All 5 Role Views', desc: 'Patient, caregiver, clinic, vendor, admin' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5" style={{ padding: '5px 0' }}>
                    <div className="flex items-center justify-center shrink-0" style={{ height: 20, width: 20, borderRadius: 999, background: '#f0f7f9' }}>
                      <svg style={{ width: 11, height: 11 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#0e7490">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, color: '#525252' }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: '#a3a3a3' }}>{item.desc}</span>
                  </div>
                ))}
              </div>

              <Link to="/demo/operations">
                <button
                  className="w-full cursor-pointer"
                  style={{
                    marginTop: 20,
                    height: 44,
                    borderRadius: 10,
                    border: '1px solid #e2e2e2',
                    background: '#fff',
                    color: '#404040',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                >
                  Explore Operations Demo
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center" style={{ marginTop: 32, maxWidth: 480 }}>
          <p style={{ fontSize: 11, color: '#a3a3a3', lineHeight: 1.5 }}>
            This demo uses fictional sample data and is not connected to real patient records. No account or password needed.
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to="/login" style={{ fontSize: 12, color: '#0e7490', fontWeight: 500, textDecoration: 'none' }}>
              Have an account? Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
