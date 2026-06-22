import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { StatusPill } from '../components/StatusPill';
import { Badge } from '../components/Badge';
import type { RideStatus } from '../types';

// ---------------------------------------------------------------------------
// Tiny inline preview components — these render fake "dashboard cards" that
// give the landing page a product-preview feel without importing real pages.
// ---------------------------------------------------------------------------

function PreviewCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">{children}</p>;
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`max-w-5xl mx-auto px-6 py-16 sm:py-24 ${className}`}>
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-widest mb-3">{children}</p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{children}</h2>
  );
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">{children}</p>
  );
}

function Divider() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <div className="border-t border-gray-100" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero dashboard preview — a simplified "command center" card
// ---------------------------------------------------------------------------

function HeroDashboardPreview() {
  const rows: { name: string; time: string; status: RideStatus; risk: 'low' | 'medium' | 'high' }[] = [
    { name: 'M. Santos', time: '5:15 AM', status: 'in_treatment', risk: 'high' },
    { name: 'R. Johnson', time: '5:20 AM', status: 'in_treatment', risk: 'low' },
    { name: 'D. Williams', time: '9:10 AM', status: 'driver_en_route', risk: 'medium' },
    { name: 'L. Martinez', time: '9:15 AM', status: 'delayed', risk: 'medium' },
    { name: 'W. Davis', time: '1:10 PM', status: 'scheduled', risk: 'high' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Title bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-gray-700">Today's Rides</span>
        </div>
        <span className="text-[11px] text-gray-400">12 rides &middot; Live</span>
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {rows.map((r) => (
          <div key={r.name} className="px-4 sm:px-5 py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-500 shrink-0">
              {r.name.split('.')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{r.name}</p>
              <p className="text-[11px] text-gray-400">{r.time}</p>
            </div>
            <Badge variant={r.risk} className="hidden sm:inline-flex">{r.risk}</Badge>
            <StatusPill status={r.status} className="text-[10px] px-2 py-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Landing Page
// ===========================================================================

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* ----------------------------------------------------------------- */}
      {/* Nav                                                                */}
      {/* ----------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Renal Ride</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/app/clinic">
              <Button size="sm">View Demo Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                               */}
      {/* ----------------------------------------------------------------- */}
      <Section className="!pt-14 sm:!pt-20 !pb-12 sm:!pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200/60 px-3 py-1 text-xs font-medium text-brand-700 mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500" />
              </span>
              Dialysis Transportation Platform
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-[1.15]">
              Reliable dialysis transportation from pickup to return&nbsp;home.
            </h1>
            <p className="text-base text-gray-500 mt-5 leading-relaxed">
              Renal Ride helps dialysis clinics coordinate recurring rides, manage
              return transportation, alert staff when patients are at risk of missing
              treatment, and keep caregivers informed.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link to="/app/clinic">
                <Button size="lg">View Demo Dashboard</Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg">Learn More</Button>
              </a>
            </div>
            <div className="flex items-center gap-4 mt-6 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                No sign-up required
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                5 role demos
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Realistic data
              </span>
            </div>
          </div>

          {/* Preview */}
          <div className="hidden lg:block">
            <HeroDashboardPreview />
          </div>
        </div>

        {/* Mobile preview — shown below copy on small screens */}
        <div className="lg:hidden mt-10">
          <HeroDashboardPreview />
        </div>
      </Section>

      <Divider />

      {/* ----------------------------------------------------------------- */}
      {/* 1 · Built for Dialysis Schedules                                   */}
      {/* ----------------------------------------------------------------- */}
      <Section id="features">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div>
            <SectionLabel>Recurring Schedules</SectionLabel>
            <SectionTitle>Built for Dialysis Schedules</SectionTitle>
            <SectionDesc>
              Dialysis patients typically receive treatment three times per week on
              a fixed schedule &mdash; Monday/Wednesday/Friday or
              Tuesday/Thursday/Saturday. Renal Ride is designed around these
              recurring patterns, automatically generating ride requests from
              standing orders so clinic staff don't re-enter the same information
              every week.
            </SectionDesc>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* MWF card */}
            <PreviewCard>
              <PreviewLabel>Schedule A</PreviewLabel>
              <div className="flex gap-1.5 mb-3">
                {['M', 'W', 'F'].map((d) => (
                  <span key={d} className="h-7 w-7 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold flex items-center justify-center">
                    {d}
                  </span>
                ))}
                {['T', 'T', 'S'].map((d, i) => (
                  <span key={`off-${i}`} className="h-7 w-7 rounded-md bg-gray-50 text-gray-300 text-xs font-medium flex items-center justify-center">
                    {d}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500">6:00 AM chair time</p>
              <p className="text-[11px] text-gray-400 mt-0.5">4 patients</p>
            </PreviewCard>

            {/* TTS card */}
            <PreviewCard>
              <PreviewLabel>Schedule B</PreviewLabel>
              <div className="flex gap-1.5 mb-3">
                {['M', 'W', 'F'].map((d, i) => (
                  <span key={`off-${i}`} className="h-7 w-7 rounded-md bg-gray-50 text-gray-300 text-xs font-medium flex items-center justify-center">
                    {d}
                  </span>
                ))}
                {['T', 'T', 'S'].map((d) => (
                  <span key={d} className="h-7 w-7 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold flex items-center justify-center">
                    {d}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500">10:00 AM chair time</p>
              <p className="text-[11px] text-gray-400 mt-0.5">3 patients</p>
            </PreviewCard>

            {/* Standing order */}
            <PreviewCard className="col-span-2">
              <PreviewLabel>Standing Order</PreviewLabel>
              <div className="space-y-2">
                {[
                  { name: 'M. Santos', days: 'MWF', type: 'Wheelchair', time: '5:15 AM' },
                  { name: 'T. Nguyen', days: 'TTS', type: 'Wheelchair', time: '9:10 AM' },
                  { name: 'R. Johnson', days: 'MWF', type: 'Ambulatory', time: '5:20 AM' },
                ].map((o) => (
                  <div key={o.name} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{o.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">{o.days}</Badge>
                      <span className="text-gray-400">{o.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </PreviewCard>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ----------------------------------------------------------------- */}
      {/* 2 · Clinic Command Center                                          */}
      {/* ----------------------------------------------------------------- */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Preview first on desktop for alternating layout */}
          <div className="order-2 lg:order-1">
            <PreviewCard>
              <PreviewLabel>Patient Status Board</PreviewLabel>
              <div className="space-y-2.5">
                {([
                  { name: 'Maria Santos', status: 'in_treatment' as const, chair: '6:00 AM', note: 'Return at 10:30 AM' },
                  { name: 'Robert Johnson', status: 'in_treatment' as const, chair: '6:00 AM', note: 'Will-call return' },
                  { name: 'Dorothy Williams', status: 'driver_en_route' as const, chair: '10:00 AM', note: 'Driver 5 min away' },
                  { name: 'Linda Martinez', status: 'delayed' as const, chair: '10:00 AM', note: 'Pickup delayed — traffic' },
                  { name: 'William Davis', status: 'scheduled' as const, chair: '2:00 PM', note: 'Bariatric van confirmed' },
                  { name: 'Fatima Al-Rashid', status: 'issue_reported' as const, chair: '6:00 AM', note: 'Driver preference issue' },
                ]).map((p) => (
                  <div key={p.name} className="flex items-center gap-3 py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800">{p.name}</p>
                      <p className="text-[11px] text-gray-400">Chair {p.chair} &middot; {p.note}</p>
                    </div>
                    <StatusPill status={p.status} className="text-[10px] px-2 py-0.5" />
                  </div>
                ))}
              </div>
            </PreviewCard>
          </div>

          <div className="order-1 lg:order-2">
            <SectionLabel>Real-Time Visibility</SectionLabel>
            <SectionTitle>Clinic Command Center</SectionTitle>
            <SectionDesc>
              Clinic staff see every patient's transportation status in one view &mdash;
              who's been picked up, who's in treatment, who's waiting for a return
              ride, and who's running late. No more calling transportation vendors to
              ask "where's the driver?" Status updates flow automatically so the
              front desk always knows what's happening.
            </SectionDesc>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ----------------------------------------------------------------- */}
      {/* 3 · Risk Queue                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div>
            <SectionLabel>Proactive Alerts</SectionLabel>
            <SectionTitle>Risk Queue</SectionTitle>
            <SectionDesc>
              Missed dialysis treatments can be life-threatening. Renal Ride
              identifies rides at risk &mdash; late drivers, unconfirmed pickups,
              patients with a history of missed sessions &mdash; and surfaces them
              in a priority queue before they become emergencies. Staff can
              intervene early: reassign a driver, call the patient, or alert a
              caregiver.
            </SectionDesc>
          </div>

          <div className="space-y-3">
            {/* At-risk rides */}
            {[
              {
                name: 'Linda Martinez',
                issue: 'Driver 18 min late — patient at risk of missing 10:00 AM chair time',
                risk: 'high' as const,
                action: 'Reassign driver',
              },
              {
                name: 'Dorothy Williams',
                issue: 'Original driver called off. Replacement running 10 min behind.',
                risk: 'medium' as const,
                action: 'Monitor',
              },
              {
                name: 'William Davis',
                issue: 'Bariatric van has no backup vehicle if delayed',
                risk: 'high' as const,
                action: 'Confirm availability',
              },
            ].map((item) => (
              <PreviewCard key={item.name} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <Badge variant={item.risk}>{item.risk}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.issue}</p>
                  </div>
                  <button className="shrink-0 text-[11px] font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap cursor-pointer">
                    {item.action}
                  </button>
                </div>
              </PreviewCard>
            ))}
          </div>
        </div>
      </Section>

      <Divider />

      {/* ----------------------------------------------------------------- */}
      {/* 4 · Return Ride Manager                                            */}
      {/* ----------------------------------------------------------------- */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Preview */}
          <div className="order-2 lg:order-1 space-y-3">
            <PreviewCard>
              <PreviewLabel>Return Rides — Will-Call</PreviewLabel>
              <div className="space-y-3">
                {[
                  { name: 'Robert Johnson', status: 'In treatment — nurse will notify', ready: false },
                  { name: 'James Chen', status: 'Treatment complete — requesting pickup', ready: true },
                ].map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.status}</p>
                    </div>
                    {p.ready ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 text-gray-500 px-2 py-0.5 text-[10px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                        In treatment
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </PreviewCard>

            <PreviewCard>
              <PreviewLabel>Return Rides — Scheduled</PreviewLabel>
              <div className="space-y-3">
                {[
                  { name: 'Maria Santos', time: '10:30 AM', vehicle: 'Wheelchair Van' },
                  { name: 'Dorothy Williams', time: '2:30 PM', vehicle: 'Sedan' },
                ].map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.vehicle}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-600">{p.time}</span>
                  </div>
                ))}
              </div>
            </PreviewCard>
          </div>

          <div className="order-1 lg:order-2">
            <SectionLabel>Flexible Returns</SectionLabel>
            <SectionTitle>Return Ride Manager</SectionTitle>
            <SectionDesc>
              Treatment end times are unpredictable. Some clinics schedule a fixed
              return pickup, but many use will-call &mdash; requesting a driver only
              when the patient is actually ready. Renal Ride supports both modes.
              Nurses can mark a patient as "ready for pickup" with one click, and
              the system dispatches a return ride automatically.
            </SectionDesc>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ----------------------------------------------------------------- */}
      {/* 5 · Caregiver Updates                                              */}
      {/* ----------------------------------------------------------------- */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div>
            <SectionLabel>Family Communication</SectionLabel>
            <SectionTitle>Caregiver Updates</SectionTitle>
            <SectionDesc>
              Family members and caregivers worry. Renal Ride sends automated
              status updates &mdash; via SMS, email, or both &mdash; at every key
              moment: driver dispatched, patient picked up, arrived at clinic,
              treatment complete, and returned home. Caregivers stay informed
              without having to call the clinic or the driver.
            </SectionDesc>
          </div>

          <PreviewCard>
            <PreviewLabel>Caregiver Notifications &mdash; Carlos Santos (Son)</PreviewLabel>
            <div className="space-y-0">
              {[
                { time: '5:15 AM', event: 'Driver dispatched', detail: 'Tony R. — Wheelchair Van — ETA 5:15 AM', icon: 'dispatched' },
                { time: '5:18 AM', event: 'Patient picked up', detail: 'Maria picked up from 1815 Alhambra Blvd', icon: 'pickup' },
                { time: '5:52 AM', event: 'Arrived at clinic', detail: 'Fresenius Kidney Care — Riverside', icon: 'arrived' },
                { time: '10:25 AM', event: 'Treatment complete', detail: 'Ready for return ride', icon: 'treatment' },
                { time: '10:32 AM', event: 'Return driver en route', detail: 'Tony R. — ETA 10:35 AM', icon: 'dispatched' },
                { time: '11:10 AM', event: 'Returned home', detail: 'Maria dropped off at 1815 Alhambra Blvd', icon: 'home' },
              ].map((step, i, arr) => (
                <div key={step.time} className="flex gap-3">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${i < 4 ? 'bg-brand-500' : i === 4 ? 'bg-amber-400' : 'bg-gray-300'}`} />
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-100 my-0.5" />}
                  </div>
                  <div className="pb-4 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-xs font-medium text-gray-800">{step.event}</p>
                      <span className="text-[11px] text-gray-400">{step.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </PreviewCard>
        </div>
      </Section>

      <Divider />

      {/* ----------------------------------------------------------------- */}
      {/* 6 · Vendor Reliability                                             */}
      {/* ----------------------------------------------------------------- */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Preview */}
          <div className="order-2 lg:order-1">
            <PreviewCard>
              <PreviewLabel>Vendor Performance</PreviewLabel>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left font-medium text-gray-500 pb-2.5 pr-4 pl-1">Vendor</th>
                      <th className="text-right font-medium text-gray-500 pb-2.5 px-2">On-Time</th>
                      <th className="text-right font-medium text-gray-500 pb-2.5 px-2">Cancel&nbsp;%</th>
                      <th className="text-right font-medium text-gray-500 pb-2.5 px-2">Avg&nbsp;Delay</th>
                      <th className="text-right font-medium text-gray-500 pb-2.5 pl-2 pr-1">Capabilities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'CareRide Medical', ontime: 94, cancel: 2, delay: '4 min', wc: true, dtd: true },
                      { name: 'Metro Access', ontime: 91, cancel: 3, delay: '6 min', wc: false, dtd: false },
                      { name: 'Valley Health', ontime: 88, cancel: 5, delay: '8 min', wc: true, dtd: false },
                    ].map((v) => (
                      <tr key={v.name} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 pr-4 pl-1 font-medium text-gray-800 whitespace-nowrap">{v.name}</td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={v.ontime >= 92 ? 'text-emerald-700' : v.ontime >= 90 ? 'text-amber-700' : 'text-red-600'}>
                            {v.ontime}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-gray-600">{v.cancel}%</td>
                        <td className="py-2.5 px-2 text-right text-gray-600">{v.delay}</td>
                        <td className="py-2.5 pl-2 pr-1 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {v.wc && <Badge variant="low">WC</Badge>}
                            {v.dtd && <Badge variant="success">DTD</Badge>}
                            {!v.wc && !v.dtd && <Badge variant="neutral">Amb</Badge>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PreviewCard>
          </div>

          <div className="order-1 lg:order-2">
            <SectionLabel>Accountability</SectionLabel>
            <SectionTitle>Vendor Reliability</SectionTitle>
            <SectionDesc>
              Not all transportation vendors perform equally. Renal Ride tracks
              on-time rates, cancellation rates, average delay, and reported issues
              by vendor &mdash; so clinics can make data-driven decisions about
              which providers to keep, which need improvement plans, and where to
              route high-risk patients who can't afford a late pickup.
            </SectionDesc>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ----------------------------------------------------------------- */}
      {/* CTA                                                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-12 sm:py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            See Renal Ride in action
          </h2>
          <p className="text-sm text-brand-200 mt-2 max-w-lg mx-auto leading-relaxed">
            Explore the interactive demo dashboard with realistic patient data,
            ride schedules, and risk tracking &mdash; no sign-up required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link to="/app/clinic">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-brand-700 text-sm font-semibold hover:bg-brand-50 transition-colors cursor-pointer">
                View Demo Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </Link>
            <Link to="/login">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500/30 text-white text-sm font-medium hover:bg-brand-500/40 transition-colors cursor-pointer border border-brand-400/30">
                Choose a Role
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Footer                                                             */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-brand-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-700">Renal Ride</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Dialysis Transportation Coordination</span>
              <span className="hidden sm:inline">&middot;</span>
              <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 border border-amber-200/60">
                Demo
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
