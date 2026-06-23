import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { cn } from '../utils/cn';
import { patients, vendors, caregivers } from '../data/mock';
import { getPatientName, formatTime } from '../utils/helpers';
import { useNotifications } from '../data/NotificationContext';

// ── Types ──

type SessionStatus = 'in_treatment' | 'ready' | 'assigned';

interface ReturnSession {
  id: string;
  patientId: string;
  vendorId: string;
  driverName: string;
  vehicleType: string;
  chairTime: string;
  estimatedEndTime: string;
  status: SessionStatus;
  readyTime: string | null;
  caregiverNotified: boolean;
  needsAssistance: boolean;
  delayMinutes: number;
  notes: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

// ── Helpers ──

function todayAt(time: string): string {
  const d = new Date();
  const [h, m] = time.split(':');
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
}

function timeUntil(iso: string): { label: string; urgent: boolean; past: boolean } {
  const diff = new Date(iso).getTime() - Date.now();
  const min = Math.round(diff / 60000);
  if (min <= -5) return { label: `${Math.abs(min)} min ago`, urgent: true, past: true };
  if (min < 0) return { label: 'Just now', urgent: false, past: true };
  if (min === 0) return { label: 'Now', urgent: true, past: false };
  if (min <= 10) return { label: `in ${min} min`, urgent: true, past: false };
  if (min < 60) return { label: `in ${min} min`, urgent: false, past: false };
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return { label: `in ${h}h${rem > 0 ? ` ${rem}m` : ''}`, urgent: false, past: false };
}

function waitingSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.round(diff / 60000));
  if (min === 0) return 'Just marked ready';
  if (min < 60) return `Waiting ${min} min`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return `Waiting ${h}h ${rem}m`;
}

// ── Initial data ──

function buildInitialSessions(): ReturnSession[] {
  return [
    {
      id: 'rs-1',
      patientId: 'pt-2',
      vendorId: 'vendor-3',
      driverName: '',
      vehicleType: 'Sedan',
      chairTime: '06:00',
      estimatedEndTime: todayAt('10:15'),
      status: 'in_treatment',
      readyTime: null,
      caregiverNotified: false,
      needsAssistance: false,
      delayMinutes: 0,
      notes: 'Uses a cane.',
    },
    {
      id: 'rs-2',
      patientId: 'pt-6',
      vendorId: 'vendor-2',
      driverName: '',
      vehicleType: 'Sedan',
      chairTime: '06:00',
      estimatedEndTime: todayAt('10:30'),
      status: 'in_treatment',
      readyTime: null,
      caregiverNotified: false,
      needsAssistance: false,
      delayMinutes: 0,
      notes: 'Prefers female driver.',
    },
    {
      id: 'rs-3',
      patientId: 'pt-4',
      vendorId: 'vendor-1',
      driverName: '',
      vehicleType: 'Sedan',
      chairTime: '10:00',
      estimatedEndTime: todayAt('14:30'),
      status: 'in_treatment',
      readyTime: null,
      caregiverNotified: false,
      needsAssistance: false,
      delayMinutes: 0,
      notes: 'Prone to dizziness post-treatment.',
    },
    {
      id: 'rs-4',
      patientId: 'pt-7',
      vendorId: 'vendor-1',
      driverName: '',
      vehicleType: 'Bariatric Wheelchair Van',
      chairTime: '14:00',
      estimatedEndTime: todayAt('18:30'),
      status: 'in_treatment',
      readyTime: null,
      caregiverNotified: false,
      needsAssistance: false,
      delayMinutes: 0,
      notes: 'Bariatric wheelchair — needs wide-door vehicle.',
    },
    {
      id: 'rs-5',
      patientId: 'pt-1',
      vendorId: 'vendor-1',
      driverName: '',
      vehicleType: 'Wheelchair Van',
      chairTime: '06:00',
      estimatedEndTime: todayAt('10:30'),
      status: 'ready',
      readyTime: todayAt('10:25'),
      caregiverNotified: true,
      needsAssistance: false,
      delayMinutes: 0,
      notes: 'Spanish-speaking driver preferred.',
    },
    {
      id: 'rs-6',
      patientId: 'pt-8',
      vendorId: 'vendor-2',
      driverName: '',
      vehicleType: 'SUV',
      chairTime: '10:00',
      estimatedEndTime: todayAt('14:30'),
      status: 'ready',
      readyTime: todayAt('14:20'),
      caregiverNotified: false,
      needsAssistance: false,
      delayMinutes: 0,
      notes: 'New patient — may need extra time.',
    },
    {
      id: 'rs-7',
      patientId: 'pt-3',
      vendorId: 'vendor-1',
      driverName: 'Kevin Park',
      vehicleType: 'Wheelchair Van',
      chairTime: '10:00',
      estimatedEndTime: todayAt('14:15'),
      status: 'assigned',
      readyTime: todayAt('14:10'),
      caregiverNotified: true,
      needsAssistance: false,
      delayMinutes: 0,
      notes: 'Ramp-equipped vehicle.',
    },
    {
      id: 'rs-8',
      patientId: 'pt-5',
      vendorId: 'vendor-3',
      driverName: 'Sandra Lee',
      vehicleType: 'Sedan',
      chairTime: '14:00',
      estimatedEndTime: todayAt('18:00'),
      status: 'assigned',
      readyTime: todayAt('17:55'),
      caregiverNotified: false,
      needsAssistance: false,
      delayMinutes: 0,
      notes: '',
    },
  ];
}

// ══════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════

export function ClinicReturnRides() {
  const { addNotification: addGlobalNotif, addAuditLogEntry: addGlobalAudit } = useNotifications();
  const [sessions, setSessions] = useState<ReturnSession[]>(buildInitialSessions);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [now, setNow] = useState(() => Date.now());

  // Modals
  const [delayModal, setDelayModal] = useState<ReturnSession | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [delayReason, setDelayReason] = useState('');

  const [assistModal, setAssistModal] = useState<ReturnSession | null>(null);
  const [assistNote, setAssistNote] = useState('');

  const [caregiverModal, setCaregiverModal] = useState<ReturnSession | null>(null);
  const [caregiverMessage, setCaregiverMessage] = useState('');

  const [vendorModal, setVendorModal] = useState<ReturnSession | null>(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Sections
  const inTreatment = sessions.filter((s) => s.status === 'in_treatment');
  const ready = sessions.filter((s) => s.status === 'ready');
  const assigned = sessions.filter((s) => s.status === 'assigned');

  // Toast auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToasts((prev) => [...prev, { id: `t-${Date.now()}-${Math.random()}`, message, type }]);
  }, []);

  // ── Actions ──

  function markReady(sessionId: string, minutesFromNow: number) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const patient = patients.find((p) => p.id === session.patientId);
    const name = patient ? getPatientName(patient) : 'Patient';

    const readyTime =
      minutesFromNow === 0
        ? new Date().toISOString()
        : new Date(Date.now() + minutesFromNow * 60000).toISOString();

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'ready' as const, readyTime } : s)),
    );

    if (minutesFromNow === 0) {
      addToast(`${name} marked as ready now. Return ride requested.`);
    } else {
      addToast(`${name} will be ready in ${minutesFromNow} min. Vendor notified.`, 'info');
    }

    addGlobalAudit({ actorRole: 'clinic', actorName: 'Dr. Sarah Patel', action: 'return_ride_requested', target: name, details: minutesFromNow === 0 ? 'Patient ready now — return ride requested' : `Patient ready in ${minutesFromNow} min — vendor notified` });
    addGlobalNotif({ recipientRole: 'vendor', patientId: session.patientId, title: 'Return Ride Requested', message: `${name} ${minutesFromNow === 0 ? 'is ready now' : `will be ready in ${minutesFromNow} min`}. Please dispatch return ride.`, severity: 'info' });
    addGlobalNotif({ recipientRole: 'caregiver', patientId: session.patientId, title: 'Return Ride Requested', message: `${name}'s return ride has been requested.`, severity: 'info' });
  }

  function submitDelay() {
    if (!delayModal) return;
    const patient = patients.find((p) => p.id === delayModal.patientId);
    const name = patient ? getPatientName(patient) : 'Patient';

    setSessions((prev) =>
      prev.map((s) =>
        s.id === delayModal.id
          ? {
              ...s,
              delayMinutes: s.delayMinutes + delayMinutes,
              estimatedEndTime: new Date(
                new Date(s.estimatedEndTime).getTime() + delayMinutes * 60000,
              ).toISOString(),
            }
          : s,
      ),
    );
    addToast(
      `${name} return delayed ${delayMinutes} min.${delayReason ? ` Reason: ${delayReason}` : ''}`,
      'warning',
    );
    setDelayModal(null);
    setDelayMinutes(30);
    setDelayReason('');
  }

  function submitAssistance() {
    if (!assistModal) return;
    const patient = patients.find((p) => p.id === assistModal.patientId);
    const name = patient ? getPatientName(patient) : 'Patient';

    setSessions((prev) =>
      prev.map((s) =>
        s.id === assistModal.id
          ? { ...s, needsAssistance: true, notes: assistNote || s.notes }
          : s,
      ),
    );
    addToast(`${name} flagged for extra assistance. Vendor notified.`, 'warning');
    setAssistModal(null);
    setAssistNote('');
  }

  function submitCaregiverNotification() {
    if (!caregiverModal) return;
    const patient = patients.find((p) => p.id === caregiverModal.patientId);
    const name = patient ? getPatientName(patient) : 'Patient';

    setSessions((prev) =>
      prev.map((s) => (s.id === caregiverModal.id ? { ...s, caregiverNotified: true } : s)),
    );
    addToast(`Caregiver notified for ${name}.`);
    setCaregiverModal(null);
    setCaregiverMessage('');
  }

  // ── Render helpers ──

  function PatientAvatar({ patientId }: { patientId: string }) {
    const p = patients.find((pt) => pt.id === patientId);
    if (!p) return null;
    return (
      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
        {p.firstName[0]}
        {p.lastName[0]}
      </div>
    );
  }

  function MobilityBadges({ patientId }: { patientId: string }) {
    const p = patients.find((pt) => pt.id === patientId);
    if (!p) return null;
    return (
      <div className="flex gap-1.5 flex-wrap">
        <span
          className={cn(
            'text-[11px] font-medium px-1.5 py-0.5 rounded',
            p.mobilityLevel === 'wheelchair'
              ? 'bg-amber-50 text-amber-700'
              : p.mobilityLevel === 'stretcher'
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-100 text-gray-600',
          )}
        >
          {p.mobilityLevel === 'wheelchair'
            ? 'Wheelchair'
            : p.mobilityLevel === 'stretcher'
              ? 'Stretcher'
              : 'Ambulatory'}
        </span>
        {p.assistanceLevel !== 'independent' && (
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
            {p.assistanceLevel === 'door-through-door' ? 'Door-thru-door' : 'Door-to-door'}
          </span>
        )}
      </div>
    );
  }

  function CaregiverStatus({ session }: { session: ReturnSession }) {
    const patient = patients.find((p) => p.id === session.patientId);
    const cg = patient ? caregivers.find((c) => c.patientId === patient.id) : null;
    if (!cg)
      return <span className="text-[11px] text-gray-400">No caregiver on file</span>;
    return (
      <span
        className={cn(
          'text-[11px] font-medium',
          session.caregiverNotified ? 'text-emerald-600' : 'text-gray-400',
        )}
      >
        {session.caregiverNotified ? (
          <>
            <span className="inline-block w-3.5 h-3.5 align-text-bottom mr-0.5">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 inline">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
            {cg.name} notified
          </>
        ) : (
          <>
            {cg.name} — not notified
          </>
        )}
      </span>
    );
  }

  // ══════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Return Rides"
        subtitle="Manage return transportation for patients finishing dialysis"
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
          </div>
        }
      />

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in slide-in-from-right max-w-sm',
              t.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
              t.type === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
              t.type === 'warning' && 'bg-amber-50 border-amber-200 text-amber-800',
            )}
          >
            <div className="flex items-start gap-2">
              {t.type === 'success' && (
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
              {t.type === 'info' && (
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
              )}
              {t.type === 'warning' && (
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              )}
              {t.message}
            </div>
          </div>
        ))}
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-100 mb-6">
        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-900">
            Dialysis end times can vary
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Renal Ride helps clinics request return rides when patients are actually ready, reducing
            long post-treatment waits. Use the buttons below to notify vendors at the right time.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'In Treatment', value: inTreatment.length, color: 'text-brand-600', bg: 'bg-brand-50', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> },
          { label: 'Ready for Return', value: ready.length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> },
          { label: 'Driver Assigned', value: assigned.length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /> },
          { label: 'Total Patients', value: sessions.length, color: 'text-gray-900', bg: 'bg-gray-50', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /> },
        ].map((s) => (
          <Card key={s.label} className="!p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500">{s.label}</p>
              <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', s.bg)}>
                <svg className={cn('w-3.5 h-3.5', s.color)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {s.icon}
                </svg>
              </div>
            </div>
            <p className={cn('text-2xl font-semibold', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ═══ Section: In Treatment ═══ */}
      <SectionHeader
        title="In Treatment"
        count={inTreatment.length}
        color="brand"
        icon={
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        }
      />
      {inTreatment.length > 0 ? (
        <div className="grid gap-3 mb-8">
          {inTreatment.map((s) => {
            const patient = patients.find((p) => p.id === s.patientId);
            const vendor = vendors.find((v) => v.id === s.vendorId);
            const eta = timeUntil(s.estimatedEndTime);
            const chairStart = new Date();
            const [ch, cm] = s.chairTime.split(':');
            chairStart.setHours(Number(ch), Number(cm), 0, 0);
            const endTime = new Date(s.estimatedEndTime).getTime();
            const totalDuration = endTime - chairStart.getTime();
            const elapsed = now - chairStart.getTime();
            const progressPct = Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));

            return (
              <Card key={s.id} className="!p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Left: patient info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <PatientAvatar patientId={s.patientId} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">
                            {patient ? getPatientName(patient) : 'Unknown'}
                          </p>
                          {s.needsAssistance && <Badge variant="warning">Needs Assistance</Badge>}
                          {s.delayMinutes > 0 && (
                            <Badge variant="danger">Delayed +{s.delayMinutes}m</Badge>
                          )}
                        </div>

                        {/* Treatment progress bar */}
                        <div className="mt-2 mb-3">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-gray-400">Treatment progress</span>
                            <span className={cn('font-medium', progressPct >= 90 ? 'text-amber-600' : 'text-brand-600')}>{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                progressPct >= 90 ? 'bg-amber-500' : 'bg-brand-500',
                              )}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                          <div>
                            <span className="text-[11px] text-gray-400">Chair Time</span>
                            <p className="text-xs text-gray-700 font-medium">{formatTime(s.chairTime)}</p>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-400">Est. Treatment End</span>
                            <p className={cn('text-xs font-medium', eta.urgent ? 'text-amber-700' : 'text-gray-700')}>
                              {formatTime(s.estimatedEndTime)}{' '}
                              <span className={cn('font-normal', eta.urgent ? 'text-amber-600' : 'text-gray-400')}>
                                ({eta.label})
                              </span>
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-400">Mobility</span>
                            <div className="mt-0.5">
                              <MobilityBadges patientId={s.patientId} />
                            </div>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-400">Vendor</span>
                            <p className="text-xs text-gray-700">{vendor?.name ?? '—'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[11px] text-gray-400">Caregiver</span>
                            <div className="mt-0.5">
                              <CaregiverStatus session={s} />
                            </div>
                          </div>
                        </div>
                        {s.notes && (
                          <p className="text-[11px] text-gray-400 mt-2 italic">{s.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="sm:w-64 border-t sm:border-t-0 sm:border-l border-gray-100 p-4 flex flex-col gap-2 bg-gray-50/50 sm:rounded-r-xl">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Return Actions
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => markReady(s.id, 0)}
                        className="flex-1 h-8 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors cursor-pointer"
                      >
                        Ready Now
                      </button>
                      <button
                        onClick={() => markReady(s.id, 15)}
                        className="flex-1 h-8 rounded-lg bg-brand-100 text-brand-700 text-xs font-medium hover:bg-brand-200 transition-colors cursor-pointer"
                      >
                        +15 Min
                      </button>
                      <button
                        onClick={() => markReady(s.id, 30)}
                        className="flex-1 h-8 rounded-lg bg-brand-100 text-brand-700 text-xs font-medium hover:bg-brand-200 transition-colors cursor-pointer"
                      >
                        +30 Min
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <ActionButton
                        label="Delay"
                        onClick={() => { setDelayModal(s); setDelayMinutes(30); setDelayReason(''); }}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />}
                      />
                      <ActionButton
                        label="Assist"
                        onClick={() => { setAssistModal(s); setAssistNote(''); }}
                        variant={s.needsAssistance ? 'active' : 'default'}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />}
                      />
                      <ActionButton
                        label="Notify"
                        onClick={() => {
                          const patient = patients.find((p) => p.id === s.patientId);
                          const cg = patient ? caregivers.find((c) => c.patientId === patient.id) : null;
                          setCaregiverModal(s);
                          setCaregiverMessage(
                            cg
                              ? `Hi ${cg.name.split(' ')[0]}, ${patient ? patient.firstName : 'your patient'} is finishing treatment and will be ready for pickup soon.`
                              : '',
                          );
                        }}
                        variant={s.caregiverNotified ? 'active' : 'default'}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />}
                      />
                      <ActionButton
                        label="Call"
                        onClick={() => setVendorModal(s)}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptySection
          message="No patients currently in treatment"
          description="Patients will appear here when they arrive for dialysis"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />}
          className="mb-8"
        />
      )}

      {/* ═══ Section: Ready for Return ═══ */}
      <SectionHeader
        title="Ready for Return"
        count={ready.length}
        color="amber"
        icon={
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        }
      />
      {ready.length > 0 ? (
        <div className="grid gap-3 mb-8">
          {ready.map((s) => {
            const patient = patients.find((p) => p.id === s.patientId);
            const vendor = vendors.find((v) => v.id === s.vendorId);
            const waitLabel = s.readyTime ? waitingSince(s.readyTime) : '';
            const readyEta = s.readyTime ? timeUntil(s.readyTime) : null;
            const isFutureReady = readyEta && !readyEta.past;
            return (
              <Card key={s.id} className="!p-0 border-amber-200">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <PatientAvatar patientId={s.patientId} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">
                            {patient ? getPatientName(patient) : 'Unknown'}
                          </p>
                          {isFutureReady ? (
                            <Badge variant="low">Ready {readyEta.label}</Badge>
                          ) : (
                            <Badge variant="warning">Ready Now</Badge>
                          )}
                          {s.needsAssistance && <Badge variant="danger">Needs Assistance</Badge>}
                        </div>

                        {/* Waiting indicator */}
                        {!isFutureReady && s.readyTime && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </span>
                            <span className="text-xs font-medium text-amber-700">{waitLabel}</span>
                          </div>
                        )}

                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
                          <div>
                            <span className="text-[11px] text-gray-400">Chair Time</span>
                            <p className="text-xs text-gray-700 font-medium">{formatTime(s.chairTime)}</p>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-400">Vehicle</span>
                            <p className="text-xs text-gray-700">{s.vehicleType}</p>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-400">Mobility</span>
                            <div className="mt-0.5">
                              <MobilityBadges patientId={s.patientId} />
                            </div>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-400">Vendor</span>
                            <p className="text-xs text-gray-700">{vendor?.name ?? '—'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[11px] text-gray-400">Caregiver</span>
                            <div className="mt-0.5">
                              <CaregiverStatus session={s} />
                            </div>
                          </div>
                        </div>
                        {s.notes && (
                          <p className="text-[11px] text-gray-400 mt-2 italic">{s.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="sm:w-56 border-t sm:border-t-0 sm:border-l border-amber-100 p-4 flex flex-col gap-2 bg-amber-50/30 sm:rounded-r-xl">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Actions
                    </p>
                    <div className="flex gap-1.5">
                      <ActionButton
                        label="Notify"
                        onClick={() => {
                          const pt = patients.find((p) => p.id === s.patientId);
                          const cg = pt ? caregivers.find((c) => c.patientId === pt.id) : null;
                          setCaregiverModal(s);
                          setCaregiverMessage(
                            cg
                              ? `Hi ${cg.name.split(' ')[0]}, ${pt ? pt.firstName : 'your patient'} is ready for pickup.`
                              : '',
                          );
                        }}
                        variant={s.caregiverNotified ? 'active' : 'default'}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />}
                      />
                      <ActionButton
                        label="Call"
                        onClick={() => setVendorModal(s)}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />}
                      />
                      <ActionButton
                        label="Assist"
                        onClick={() => { setAssistModal(s); setAssistNote(''); }}
                        variant={s.needsAssistance ? 'active' : 'default'}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />}
                      />
                    </div>
                    <button
                      onClick={() => { setDelayModal(s); setDelayMinutes(30); setDelayReason(''); }}
                      className="h-8 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Delay Return
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptySection
          message="No patients currently waiting for return"
          description="When a patient finishes treatment and is marked ready, they'll appear here"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />}
          className="mb-8"
        />
      )}

      {/* ═══ Section: Return Ride Assigned ═══ */}
      <SectionHeader
        title="Return Ride Assigned"
        count={assigned.length}
        color="emerald"
        icon={
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        }
      />
      {assigned.length > 0 ? (
        <div className="grid gap-3 mb-8">
          {assigned.map((s) => {
            const patient = patients.find((p) => p.id === s.patientId);
            const vendor = vendors.find((v) => v.id === s.vendorId);
            return (
              <Card key={s.id} className="!p-0 border-emerald-200">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <PatientAvatar patientId={s.patientId} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">
                            {patient ? getPatientName(patient) : 'Unknown'}
                          </p>
                          <Badge variant="success">Driver Assigned</Badge>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
                          <div>
                            <span className="text-[11px] text-gray-400">Driver</span>
                            <p className="text-xs text-gray-900 font-medium">{s.driverName || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-400">Vehicle</span>
                            <p className="text-xs text-gray-700">{s.vehicleType}</p>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-400">Mobility</span>
                            <div className="mt-0.5">
                              <MobilityBadges patientId={s.patientId} />
                            </div>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-400">Vendor</span>
                            <p className="text-xs text-gray-700">{vendor?.name ?? '—'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[11px] text-gray-400">Caregiver</span>
                            <div className="mt-0.5">
                              <CaregiverStatus session={s} />
                            </div>
                          </div>
                        </div>
                        {s.notes && (
                          <p className="text-[11px] text-gray-400 mt-2 italic">{s.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: status panel */}
                  <div className="sm:w-56 border-t sm:border-t-0 sm:border-l border-emerald-100 p-4 flex flex-col gap-2 bg-emerald-50/30 sm:rounded-r-xl">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Actions
                    </p>
                    <div className="flex gap-1.5">
                      <ActionButton
                        label="Notify"
                        onClick={() => {
                          const pt = patients.find((p) => p.id === s.patientId);
                          const cg = pt ? caregivers.find((c) => c.patientId === pt.id) : null;
                          setCaregiverModal(s);
                          setCaregiverMessage(
                            cg
                              ? `Hi ${cg.name.split(' ')[0]}, ${pt ? pt.firstName : 'your patient'}'s return ride is on the way.`
                              : '',
                          );
                        }}
                        variant={s.caregiverNotified ? 'active' : 'default'}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />}
                      />
                      <ActionButton
                        label="Call"
                        onClick={() => setVendorModal(s)}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptySection
          message="No return rides currently assigned"
          description="Assigned rides will appear here once a vendor dispatches a driver"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />}
          className="mb-8"
        />
      )}

      {/* ════ Delay Return Modal ════ */}
      <Modal open={!!delayModal} onClose={() => setDelayModal(null)} title="Delay Return">
        {delayModal && (() => {
          const patient = patients.find((p) => p.id === delayModal.patientId);
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Delay return for <span className="font-medium">{patient ? getPatientName(patient) : 'Unknown'}</span>
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Delay Duration</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setDelayMinutes(m)}
                      className={cn(
                        'flex-1 h-9 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                        delayMinutes === m ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Extended treatment, post-treatment observation..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" size="sm" onClick={() => setDelayModal(null)}>Cancel</Button>
                <Button size="sm" onClick={submitDelay}>Delay {delayMinutes} min</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ════ Needs Assistance Modal ════ */}
      <Modal open={!!assistModal} onClose={() => setAssistModal(null)} title="Flag for Assistance">
        {assistModal && (() => {
          const patient = patients.find((p) => p.id === assistModal.patientId);
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Flag <span className="font-medium">{patient ? getPatientName(patient) : 'Unknown'}</span> as
                needing extra assistance. The vendor will be notified to send a driver prepared for additional support.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assistance Notes</label>
                <textarea
                  value={assistNote}
                  onChange={(e) => setAssistNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Patient is dizzy post-treatment, needs help with wheelchair transfer, etc."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" size="sm" onClick={() => setAssistModal(null)}>Cancel</Button>
                <Button size="sm" onClick={submitAssistance}>Flag & Notify Vendor</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ════ Notify Caregiver Modal ════ */}
      <Modal open={!!caregiverModal} onClose={() => setCaregiverModal(null)} title="Notify Caregiver">
        {caregiverModal && (() => {
          const patient = patients.find((p) => p.id === caregiverModal.patientId);
          const cg = patient ? caregivers.find((c) => c.patientId === patient.id) : null;
          return (
            <div className="space-y-4">
              {cg ? (
                <>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold">
                        {cg.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cg.name}</p>
                        <p className="text-xs text-gray-500">{cg.relationship} &middot; {cg.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
                    <div className="flex gap-2">
                      {['SMS', 'Email', 'Both'].map((ch) => (
                        <span
                          key={ch}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium',
                            (cg.notificationPreference === ch.toLowerCase() ||
                              (cg.notificationPreference === 'both' && ch === 'Both'))
                              ? 'bg-brand-100 text-brand-700'
                              : 'bg-gray-100 text-gray-500',
                          )}
                        >
                          {ch}
                          {(cg.notificationPreference === ch.toLowerCase() ||
                            (cg.notificationPreference === 'both' && ch === 'Both')) && ' (preferred)'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={caregiverMessage}
                      onChange={(e) => setCaregiverMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    No caregiver on file for{' '}
                    <span className="font-medium">{patient ? getPatientName(patient) : 'this patient'}</span>
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" size="sm" onClick={() => setCaregiverModal(null)}>Cancel</Button>
                <Button size="sm" onClick={submitCaregiverNotification} disabled={!cg}>
                  Send Notification
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ════ Call Vendor Modal ════ */}
      <Modal open={!!vendorModal} onClose={() => setVendorModal(null)} title="Call Vendor">
        {vendorModal && (() => {
          const vendor = vendors.find((v) => v.id === vendorModal.vendorId);
          const patient = patients.find((p) => p.id === vendorModal.patientId);
          return (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{vendor?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{vendor?.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Call regarding</p>
                <p className="text-sm text-gray-600">
                  Return ride for <span className="font-medium">{patient ? getPatientName(patient) : 'Unknown'}</span>
                </p>
              </div>

              {vendorModal.driverName && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">Assigned driver</p>
                  <p className="text-sm text-gray-600">{vendorModal.driverName} &middot; {vendorModal.vehicleType}</p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-700">
                  In production, this would initiate a call via the clinic phone system.
                  For this demo, the vendor's number is shown above.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button variant="outline" size="sm" onClick={() => setVendorModal(null)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

// ── Shared sub-components ──

function SectionHeader({
  title,
  count,
  color,
  icon,
}: {
  title: string;
  count: number;
  color: 'brand' | 'amber' | 'emerald';
  icon: React.ReactNode;
}) {
  const colors = {
    brand: { dot: 'bg-brand-500', text: 'text-brand-700', bg: 'bg-brand-50' },
    amber: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    emerald: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  };
  const c = colors[color];
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', c.bg)}>
        <svg className={cn('w-4 h-4', c.text)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          {icon}
        </svg>
      </div>
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold', c.bg, c.text)}>
        {count}
      </span>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  icon,
  variant = 'default',
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  variant?: 'default' | 'active';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
        variant === 'active'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      )}
      title={label}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        {icon}
      </svg>
      {label}
    </button>
  );
}

function EmptySection({ message, description, icon, className }: { message: string; description?: string; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-dashed border-gray-200 py-10 text-center mb-8', className)}>
      {icon && (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {icon}
          </svg>
        </div>
      )}
      <p className="text-sm font-medium text-gray-400">{message}</p>
      {description && <p className="text-xs text-gray-300 mt-1">{description}</p>}
    </div>
  );
}
