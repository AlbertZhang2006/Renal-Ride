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
import type { RiskLevel } from '../types';

// ── Types ──

type RiskType =
  | 'no_driver'
  | 'driver_delayed'
  | 'patient_not_ready'
  | 'wheelchair_unavailable'
  | 'vendor_canceled'
  | 'missed_previous'
  | 'wrong_assistance'
  | 'return_waiting'
  | 'weather_traffic';

type RiskStatus = 'open' | 'in_progress' | 'resolved';

interface RiskItem {
  id: string;
  type: RiskType;
  severity: RiskLevel;
  patientId: string;
  vendorId: string;
  rideId: string;
  chairTime: string;
  pickupTime: string;
  problem: string;
  whyItMatters: string;
  suggestedAction: string;
  status: RiskStatus;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  riskId: string;
  action: string;
  detail: string;
  timestamp: string;
  actor: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

// ── Labels ──

const riskTypeLabels: Record<RiskType, string> = {
  no_driver: 'No Driver Assigned',
  driver_delayed: 'Driver Delayed',
  patient_not_ready: 'Patient Not Confirmed',
  wheelchair_unavailable: 'Wheelchair Vehicle Unavailable',
  vendor_canceled: 'Vendor Canceled',
  missed_previous: 'Previous Ride Missed',
  wrong_assistance: 'Wrong Assistance Level',
  return_waiting: 'Return Ride Waiting Too Long',
  weather_traffic: 'Weather / Traffic Delay',
};

const riskTypeIcons: Record<RiskType, React.ReactNode> = {
  no_driver: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />,
  driver_delayed: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  patient_not_ready: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
  wheelchair_unavailable: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />,
  vendor_canceled: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />,
  missed_previous: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />,
  wrong_assistance: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />,
  return_waiting: <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />,
  weather_traffic: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />,
};

const statusLabels: Record<RiskStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const severityConfig: Record<RiskLevel, { border: string; bg: string; text: string; dot: string; badge: 'high' | 'medium' | 'low' }> = {
  high: { border: 'border-l-red-500', bg: 'bg-red-50/40', text: 'text-red-700', dot: 'bg-red-500', badge: 'high' },
  medium: { border: 'border-l-amber-500', bg: 'bg-amber-50/40', text: 'text-amber-700', dot: 'bg-amber-500', badge: 'medium' },
  low: { border: 'border-l-blue-500', bg: 'bg-blue-50/40', text: 'text-blue-700', dot: 'bg-blue-500', badge: 'low' },
};

// ── Helpers ──

function todayAt(time: string): string {
  const d = new Date();
  const [h, m] = time.split(':');
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.round(diff / 60000));
  if (min === 0) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m ago`;
}

// ── Initial risk items derived from mock data ──

function buildRiskItems(): RiskItem[] {
  return [
    {
      id: 'risk-1',
      type: 'driver_delayed',
      severity: 'high',
      patientId: 'pt-8',
      vendorId: 'vendor-2',
      rideId: 'ride-5',
      chairTime: '10:00',
      pickupTime: todayAt('09:15'),
      problem: 'Driver Ray Gutierrez is 18 minutes late due to traffic on Florin Rd. Patient Linda Martinez has not been picked up.',
      whyItMatters: 'Linda is a new dialysis patient still adjusting to her schedule. A missed or late treatment can cause medical complications and increase anxiety about future treatments.',
      suggestedAction: 'Contact Valley Health Shuttle for ETA. If driver cannot arrive within 10 minutes, dispatch backup from CareRide Medical Transport.',
      status: 'open',
      createdAt: todayAt('09:33'),
    },
    {
      id: 'risk-2',
      type: 'return_waiting',
      severity: 'high',
      patientId: 'pt-1',
      vendorId: 'vendor-1',
      rideId: 'ride-2',
      chairTime: '06:00',
      pickupTime: todayAt('10:30'),
      problem: 'Maria Santos has been marked ready for return but no driver has been dispatched. She is a wheelchair patient requiring a wheelchair-accessible van.',
      whyItMatters: 'Extended post-treatment waits increase fall risk for wheelchair-bound patients. Maria is high-risk and Spanish-speaking — communication barriers may prevent her from self-advocating.',
      suggestedAction: 'Call CareRide Medical Transport immediately to dispatch Tony Reeves for return ride. Notify caregiver Carlos Santos.',
      status: 'open',
      createdAt: todayAt('10:35'),
    },
    {
      id: 'risk-3',
      type: 'no_driver',
      severity: 'high',
      patientId: 'pt-4',
      vendorId: 'vendor-1',
      rideId: 'ride-8',
      chairTime: '10:00',
      pickupTime: todayAt('14:30'),
      problem: 'Dorothy Williams’ return ride has no driver assigned. Original driver called off earlier today and replacement has not been confirmed.',
      whyItMatters: 'Dorothy is prone to dizziness post-treatment and requires door-to-door assistance. Leaving her without confirmed return transportation is a safety risk.',
      suggestedAction: 'Assign Kevin Park or request backup driver from CareRide. Notify grandson Marcus Williams of potential delay.',
      status: 'open',
      createdAt: todayAt('09:10'),
    },
    {
      id: 'risk-4',
      type: 'wheelchair_unavailable',
      severity: 'high',
      patientId: 'pt-7',
      vendorId: 'vendor-1',
      rideId: 'ride-6',
      chairTime: '14:00',
      pickupTime: todayAt('13:10'),
      problem: 'William Davis requires a bariatric wheelchair van (wide-door access, 320+ lb capacity). CareRide’s only bariatric van is assigned to Tony Reeves who is currently on Maria Santos’ return ride.',
      whyItMatters: 'No substitute vehicle exists in the vendor fleet. If the bariatric van is not available by 1:10 PM, William will miss his dialysis treatment entirely.',
      suggestedAction: 'Confirm Tony Reeves will complete Maria’s return by 12:30 PM at the latest. Have Metro Access on standby if their fleet includes bariatric-capable vehicles.',
      status: 'open',
      createdAt: todayAt('08:00'),
    },
    {
      id: 'risk-5',
      type: 'wrong_assistance',
      severity: 'medium',
      patientId: 'pt-6',
      vendorId: 'vendor-2',
      rideId: 'ride-12',
      chairTime: '06:00',
      pickupTime: todayAt('05:15'),
      problem: 'Fatima Al-Rashid requested a female driver due to cultural preferences. A male driver (Mike Torres) was dispatched instead. Patient was uncomfortable but accepted the ride.',
      whyItMatters: 'Repeated preference violations may cause Fatima to refuse future rides, leading to missed treatments. Her husband Omar accompanies on Saturdays but is unavailable on weekdays.',
      suggestedAction: 'Document the incident and update the standing order to flag female-driver-only. Contact Valley Health Shuttle to ensure compliance on future dispatches.',
      status: 'open',
      createdAt: todayAt('05:30'),
    },
    {
      id: 'risk-6',
      type: 'vendor_canceled',
      severity: 'medium',
      patientId: 'pt-3',
      vendorId: 'vendor-1',
      rideId: 'ride-4',
      chairTime: '10:00',
      pickupTime: todayAt('09:10'),
      problem: 'CareRide’s original driver for Thanh Nguyen’s ride called off. Replacement driver Kevin Park was assigned but is running 10 minutes behind schedule.',
      whyItMatters: 'Thanh has limited English and relies on her daughter Linh for communication. A delayed or canceled ride without interpreter support creates confusion and distress.',
      suggestedAction: 'Monitor Kevin Park’s ETA. If he cannot arrive by 9:25 AM, contact Linh Nguyen to relay status in Vietnamese.',
      status: 'in_progress',
      createdAt: todayAt('09:05'),
    },
    {
      id: 'risk-7',
      type: 'patient_not_ready',
      severity: 'medium',
      patientId: 'pt-7',
      vendorId: 'vendor-1',
      rideId: 'ride-6',
      chairTime: '14:00',
      pickupTime: todayAt('13:10'),
      problem: 'William Davis has not confirmed readiness for his 2:00 PM appointment. No phone confirmation received and no caregiver on file to verify.',
      whyItMatters: 'William is a high-risk wheelchair patient with bariatric needs. If he is not ready, the specialized vehicle dispatch is wasted and rescheduling may cause a multi-day treatment gap.',
      suggestedAction: 'Call William directly at (916) 555-0207. If no answer by 12:30 PM, attempt neighbor or building manager contact.',
      status: 'open',
      createdAt: todayAt('11:00'),
    },
    {
      id: 'risk-8',
      type: 'weather_traffic',
      severity: 'low',
      patientId: 'pt-8',
      vendorId: 'vendor-2',
      rideId: 'ride-5',
      chairTime: '10:00',
      pickupTime: todayAt('09:15'),
      problem: 'Traffic congestion reported on Florin Rd and I-5 South due to a multi-vehicle accident. Afternoon pickups in the Florin/Meadowview area may be affected.',
      whyItMatters: 'Two patients (Linda Martinez, Dorothy Williams) have afternoon return rides through the affected corridor. Delays could extend post-treatment waits beyond 45 minutes.',
      suggestedAction: 'Alert afternoon vendors to consider alternate routes via Freeport Blvd. Monitor traffic updates and preemptively add 15-minute buffers to affected pickups.',
      status: 'open',
      createdAt: todayAt('09:45'),
    },
    {
      id: 'risk-9',
      type: 'missed_previous',
      severity: 'low',
      patientId: 'pt-5',
      vendorId: 'vendor-3',
      rideId: 'ride-11',
      chairTime: '06:00',
      pickupTime: todayAt('05:30'),
      problem: 'James Chen’s driver Sandra Lee was reported texting while driving during this morning’s ride. While the ride was completed, this is a critical safety incident.',
      whyItMatters: 'Safety incidents erode patient trust. If James feels unsafe, he may begin declining rides — a known precursor to treatment non-adherence in dialysis patients.',
      suggestedAction: 'Document the safety report for Metro Access Transport. Request a different driver for James’s future rides. Follow up with James to confirm he feels safe continuing.',
      status: 'open',
      createdAt: todayAt('06:10'),
    },
  ];
}

// ── Filters ──

type Filter = 'all' | 'high' | 'medium' | 'low' | 'open' | 'resolved';

// ══════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════

export function ClinicRiskQueue() {
  const { addNotification: addGlobalNotif, addAuditLogEntry: addGlobalAudit } = useNotifications();
  const [risks, setRisks] = useState<RiskItem[]>(buildRiskItems);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals
  const [actionModal, setActionModal] = useState<{ risk: RiskItem; action: string } | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [detailRisk, setDetailRisk] = useState<RiskItem | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Toast auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToasts((prev) => [...prev, { id: `t-${Date.now()}-${Math.random()}`, message, type }]);
  }, []);

  const addAudit = useCallback((riskId: string, action: string, detail: string) => {
    setAuditLog((prev) => [
      {
        id: `audit-${Date.now()}-${Math.random()}`,
        riskId,
        action,
        detail,
        timestamp: new Date().toISOString(),
        actor: 'Dr. Sarah Patel',
      },
      ...prev,
    ]);
  }, []);

  // ── Derived ──

  const filtered = risks.filter((r) => {
    switch (filter) {
      case 'high': return r.severity === 'high';
      case 'medium': return r.severity === 'medium';
      case 'low': return r.severity === 'low';
      case 'open': return r.status !== 'resolved';
      case 'resolved': return r.status === 'resolved';
      default: return true;
    }
  });

  const sortedRisks = [...filtered].sort((a, b) => {
    const sev = { high: 0, medium: 1, low: 2 };
    const stat = { open: 0, in_progress: 1, resolved: 2 };
    if (stat[a.status] !== stat[b.status]) return stat[a.status] - stat[b.status];
    return sev[a.severity] - sev[b.severity];
  });

  const counts = {
    all: risks.length,
    high: risks.filter((r) => r.severity === 'high').length,
    medium: risks.filter((r) => r.severity === 'medium').length,
    low: risks.filter((r) => r.severity === 'low').length,
    open: risks.filter((r) => r.status !== 'resolved').length,
    resolved: risks.filter((r) => r.status === 'resolved').length,
  };

  // ── Actions ──

  function executeAction(riskId: string, action: string, note: string) {
    const risk = risks.find((r) => r.id === riskId);
    if (!risk) return;
    const patient = patients.find((p) => p.id === risk.patientId);
    const name = patient ? getPatientName(patient) : 'Unknown';

    let newStatus: RiskStatus = risk.status;
    let toastMsg = '';
    let auditAction = action;

    switch (action) {
      case 'assign_backup':
        newStatus = 'in_progress';
        toastMsg = `Backup vendor contacted for ${name}.`;
        auditAction = 'Assign Backup Vendor';
        break;
      case 'call_patient':
        newStatus = risk.status === 'open' ? 'in_progress' : risk.status;
        toastMsg = `Call initiated to ${name}.`;
        auditAction = 'Call Patient';
        break;
      case 'notify_caregiver':
        newStatus = risk.status === 'open' ? 'in_progress' : risk.status;
        toastMsg = `Caregiver notified for ${name}.`;
        auditAction = 'Notify Caregiver';
        break;
      case 'message_vendor': {
        const vendor = vendors.find((v) => v.id === risk.vendorId);
        newStatus = risk.status === 'open' ? 'in_progress' : risk.status;
        toastMsg = `Message sent to ${vendor?.name ?? 'vendor'}.`;
        auditAction = 'Message Vendor';
        break;
      }
      case 'resolve':
        newStatus = 'resolved';
        toastMsg = `Risk resolved for ${name}.`;
        auditAction = 'Mark Resolved';
        break;
      case 'document':
        newStatus = risk.status === 'open' ? 'in_progress' : risk.status;
        toastMsg = `Issue documented for ${name}.`;
        auditAction = 'Document Issue';
        break;
    }

    setRisks((prev) => prev.map((r) => (r.id === riskId ? { ...r, status: newStatus } : r)));
    addAudit(riskId, auditAction, note || `${auditAction} for ${name}`);
    addToast(toastMsg, action === 'resolve' ? 'success' : 'info');

    if (action === 'resolve') {
      addGlobalAudit({ actorRole: 'clinic', actorName: 'Dr. Sarah Patel', action: 'risk_resolved', target: name, details: `Risk resolved: ${auditAction}${note ? ` — ${note}` : ''}` });
      addGlobalNotif({ recipientRole: 'admin', patientId: risk.patientId, title: 'Risk Resolved', message: `${name} risk item resolved by clinic staff.`, severity: 'success' });
    }
    if (action === 'assign_backup') {
      addGlobalAudit({ actorRole: 'clinic', actorName: 'Dr. Sarah Patel', action: 'backup_vendor_assigned', target: name, details: `Backup vendor contacted for ${name}` });
      addGlobalNotif({ recipientRole: 'vendor', patientId: risk.patientId, title: 'Backup Vendor Request', message: `Backup vendor needed for ${name}. Please contact clinic.`, severity: 'warning' });
    }

    setActionModal(null);
    setActionNote('');
  }

  function quickAction(riskId: string, action: string) {
    const risk = risks.find((r) => r.id === riskId);
    if (!risk) return;

    if (action === 'resolve') {
      setActionModal({ risk, action });
      setActionNote('');
      return;
    }

    setActionModal({ risk, action });
    setActionNote('');
  }

  // ══════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Risk Queue"
        subtitle="Missed-treatment prevention system"
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-medium text-gray-500">{counts.open} open</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAuditLog(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Audit Log ({auditLog.length})
            </Button>
          </div>
        }
      />

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto px-4 py-3 rounded-lg shadow-lg border text-sm font-medium max-w-sm',
              t.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
              t.type === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
              t.type === 'warning' && 'bg-amber-50 border-amber-200 text-amber-800',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Mission banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100 mb-6">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-red-900">Every missed dialysis treatment is a preventable emergency</p>
          <p className="text-xs text-red-700 mt-0.5">
            This queue monitors all rides at risk of causing a missed treatment. Each item includes the problem, why it matters for the patient, and a specific action to resolve it. Resolve risks before they become missed sessions.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Main column ── */}
        <div className="flex-1 min-w-0">
          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
            {[
              { label: 'High Risk', value: counts.high, color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
              { label: 'Medium', value: counts.medium, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
              { label: 'Low', value: counts.low, color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
              { label: 'Open', value: counts.open, color: 'text-gray-900', bg: 'bg-gray-50', dot: 'bg-gray-400' },
              { label: 'Resolved', value: counts.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
            ].map((s) => (
              <div key={s.label} className={cn('rounded-lg p-3 border border-gray-100', s.bg)}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                  <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
                </div>
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {(['all', 'high', 'medium', 'low', 'open', 'resolved'] as Filter[]).map((f) => {
              const labels: Record<Filter, string> = {
                all: 'All',
                high: 'High Risk',
                medium: 'Medium',
                low: 'Low',
                open: 'Open',
                resolved: 'Resolved',
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {labels[f]}
                  <span className={cn('ml-1.5', filter === f ? 'text-gray-300' : 'text-gray-400')}>
                    {counts[f]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Risk cards */}
          <div className="space-y-3">
            {sortedRisks.map((risk) => {
              const patient = patients.find((p) => p.id === risk.patientId);
              const vendor = vendors.find((v) => v.id === risk.vendorId);
              const cg = patient ? caregivers.find((c) => c.patientId === patient.id) : null;
              const sev = severityConfig[risk.severity];
              const isResolved = risk.status === 'resolved';

              return (
                <div
                  key={risk.id}
                  className={cn(
                    'rounded-xl border border-gray-200 overflow-hidden transition-all',
                    `border-l-4 ${sev.border}`,
                    isResolved && 'opacity-60',
                  )}
                >
                  <div className={cn('p-4', isResolved ? 'bg-gray-50' : sev.bg)}>
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', isResolved ? 'bg-gray-200' : `${sev.bg}`)}>
                          <svg className={cn('w-4 h-4', isResolved ? 'text-gray-400' : sev.text)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            {riskTypeIcons[risk.type]}
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={isResolved ? 'neutral' : sev.badge}>
                              {risk.severity.toUpperCase()}
                            </Badge>
                            <span className="text-xs font-semibold text-gray-900">
                              {riskTypeLabels[risk.type]}
                            </span>
                            <Badge variant={risk.status === 'resolved' ? 'success' : risk.status === 'in_progress' ? 'warning' : 'neutral'}>
                              {statusLabels[risk.status]}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Detected {timeAgo(risk.createdAt)}
                            {auditLog.filter((a) => a.riskId === risk.id).length > 0 &&
                              ` · ${auditLog.filter((a) => a.riskId === risk.id).length} action${auditLog.filter((a) => a.riskId === risk.id).length > 1 ? 's' : ''} taken`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDetailRisk(risk)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors cursor-pointer shrink-0"
                        title="View details"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </button>
                    </div>

                    {/* Patient + ride info */}
                    <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-white/60 border border-white/80">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                        {patient ? patient.firstName[0] + patient.lastName[0] : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {patient ? getPatientName(patient) : 'Unknown'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                          <span>Chair {formatTime(risk.chairTime)}</span>
                          <span className="w-px h-3 bg-gray-300" />
                          <span>Pickup {formatTime(risk.pickupTime)}</span>
                          {patient && (
                            <>
                              <span className="w-px h-3 bg-gray-300" />
                              <span className={patient.mobilityLevel === 'wheelchair' ? 'text-amber-600 font-medium' : ''}>
                                {patient.mobilityLevel === 'wheelchair' ? 'Wheelchair' : patient.mobilityLevel === 'stretcher' ? 'Stretcher' : 'Ambulatory'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-0.5 text-[11px] text-gray-500 shrink-0">
                        <span>{vendor?.name ?? '—'}</span>
                        {cg && <span>{cg.name} ({cg.relationship})</span>}
                      </div>
                    </div>

                    {/* Problem description */}
                    <p className="text-sm text-gray-700 mb-3">{risk.problem}</p>

                    {/* Why it matters */}
                    <div className="flex gap-2 p-2.5 rounded-lg bg-white/70 border border-red-100/60 mb-3">
                      <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                      <div>
                        <p className="text-[11px] font-semibold text-red-800 uppercase tracking-wider mb-0.5">Why This Matters</p>
                        <p className="text-xs text-red-700">{risk.whyItMatters}</p>
                      </div>
                    </div>

                    {/* Suggested action */}
                    <div className="flex gap-2 p-2.5 rounded-lg bg-white/70 border border-brand-100/60 mb-3">
                      <svg className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                      </svg>
                      <div>
                        <p className="text-[11px] font-semibold text-brand-800 uppercase tracking-wider mb-0.5">Suggested Action</p>
                        <p className="text-xs text-brand-700">{risk.suggestedAction}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!isResolved && (
                      <div className="flex flex-wrap gap-1.5">
                        <ActionBtn label="Backup Vendor" onClick={() => quickAction(risk.id, 'assign_backup')} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />} />
                        <ActionBtn label="Call Patient" onClick={() => quickAction(risk.id, 'call_patient')} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />} />
                        <ActionBtn label="Notify Caregiver" onClick={() => quickAction(risk.id, 'notify_caregiver')} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />} />
                        <ActionBtn label="Message Vendor" onClick={() => quickAction(risk.id, 'message_vendor')} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />} />
                        <ActionBtn label="Document" onClick={() => quickAction(risk.id, 'document')} variant="neutral" icon={<path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />} />
                        <ActionBtn label="Resolve" onClick={() => quickAction(risk.id, 'resolve')} variant="success" icon={<path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedRisks.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center">
                {filter === 'resolved' ? (
                  <>
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-400">No resolved risks yet</p>
                    <p className="text-xs text-gray-300 mt-1">Resolved risks will be tracked here for the audit trail</p>
                  </>
                ) : filter === 'all' && risks.length === 0 ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-emerald-700">All clear — no active risks</p>
                    <p className="text-xs text-gray-400 mt-1">All rides are proceeding as planned. Great work!</p>
                  </>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-400">No risks match this filter</p>
                    <p className="text-xs text-gray-300 mt-1">Try selecting a different severity or status filter</p>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Showing {sortedRisks.length} of {risks.length} risk{risks.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Right sidebar: Escalation Rules ── */}
        <div className="lg:w-80 shrink-0">
          <div className="sticky top-4 space-y-4">
            {/* Escalation Rules */}
            <Card className="!p-0">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-900">Escalation Rules</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <EscalationRule
                  severity="high"
                  title="High-risk patient flagged"
                  rule="Alert clinic staff immediately"
                  detail="Page on-duty coordinator within 2 minutes"
                />
                <EscalationRule
                  severity="high"
                  title="No driver 45 min before pickup"
                  rule="Contact backup vendor"
                  detail="Auto-dispatch to next available vendor in rotation"
                />
                <EscalationRule
                  severity="medium"
                  title="Patient not ready 20 min before"
                  rule="Notify caregiver"
                  detail="Send SMS/call to primary caregiver on file"
                />
                <EscalationRule
                  severity="medium"
                  title="Return wait over 45 minutes"
                  rule="Escalate to vendor"
                  detail="Flag vendor account and request supervisor callback"
                />
                <EscalationRule
                  severity="low"
                  title="Driver delayed 10+ minutes"
                  rule="Notify patient and clinic"
                  detail="Send automated ETA update to patient and clinic desk"
                />
                <EscalationRule
                  severity="low"
                  title="Repeated preference violations"
                  rule="Flag for standing order review"
                  detail="Queue for weekly vendor compliance meeting"
                />
              </div>
            </Card>

            {/* Today's Summary */}
            <Card className="!p-0">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Prevention Score</h3>
              </div>
              <div className="p-4">
                <div className="flex items-end gap-3 mb-3">
                  <span className="text-3xl font-bold text-brand-600">
                    {Math.round((counts.resolved / Math.max(counts.all, 1)) * 100)}%
                  </span>
                  <span className="text-xs text-gray-500 mb-1">risks resolved today</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${(counts.resolved / Math.max(counts.all, 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                  <span>{counts.resolved} resolved</span>
                  <span>{counts.open} remaining</span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Missed treatments today</span>
                    <span className="font-semibold text-emerald-600">0</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Avg. response time</span>
                    <span className="font-medium text-gray-700">8 min</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Actions taken today</span>
                    <span className="font-medium text-gray-700">{auditLog.length}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent actions */}
            {auditLog.length > 0 && (
              <Card className="!p-0">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Recent Actions</h3>
                </div>
                <div className="p-4 space-y-2.5 max-h-64 overflow-y-auto">
                  {auditLog.slice(0, 5).map((entry) => {
                    const risk = risks.find((r) => r.id === entry.riskId);
                    const patient = risk ? patients.find((p) => p.id === risk.patientId) : null;
                    return (
                      <div key={entry.id} className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-700">
                            <span className="font-medium">{entry.action}</span>
                            {patient && ` — ${getPatientName(patient)}`}
                          </p>
                          <p className="text-[11px] text-gray-400">{timeAgo(entry.timestamp)} by {entry.actor}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ════ Action Confirmation Modal ════ */}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title={actionModal ? getActionTitle(actionModal.action) : ''}>
        {actionModal && (() => {
          const risk = actionModal.risk;
          const patient = patients.find((p) => p.id === risk.patientId);
          const vendor = vendors.find((v) => v.id === risk.vendorId);
          const cg = patient ? caregivers.find((c) => c.patientId === patient.id) : null;

          return (
            <div className="space-y-4">
              {/* Context */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {patient ? patient.firstName[0] + patient.lastName[0] : '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{patient ? getPatientName(patient) : 'Unknown'}</p>
                  <p className="text-[11px] text-gray-500">{riskTypeLabels[risk.type]} · {risk.severity.toUpperCase()}</p>
                </div>
              </div>

              {/* Action-specific content */}
              {actionModal.action === 'assign_backup' && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Select backup vendor</p>
                  <div className="space-y-1.5">
                    {vendors.filter((v) => v.id !== risk.vendorId).map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{v.name}</p>
                          <p className="text-[11px] text-gray-500">
                            {v.onTimeRate}% on-time · {v.phone}
                            {patient?.mobilityLevel === 'wheelchair' && !v.supportsWheelchair && (
                              <span className="text-red-500 ml-1">· No wheelchair support</span>
                            )}
                          </p>
                        </div>
                        <Badge variant={v.onTimeRate >= 90 ? 'success' : 'warning'}>
                          {v.onTimeRate}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {actionModal.action === 'call_patient' && patient && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium">{patient.phone}</p>
                  <p className="text-xs text-blue-600 mt-1">Language: {patient.preferredLanguage}</p>
                </div>
              )}

              {actionModal.action === 'notify_caregiver' && (
                cg ? (
                  <div className="p-3 rounded-lg bg-violet-50 border border-violet-100">
                    <p className="text-sm font-medium text-violet-900">{cg.name}</p>
                    <p className="text-xs text-violet-700">{cg.relationship} · {cg.phone} · {cg.email}</p>
                    <p className="text-xs text-violet-600 mt-1">Preferred: {cg.notificationPreference}</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-center">
                    <p className="text-sm text-gray-500">No caregiver on file for this patient</p>
                  </div>
                )
              )}

              {actionModal.action === 'message_vendor' && vendor && (
                <div className="p-3 rounded-lg bg-brand-50 border border-brand-100">
                  <p className="text-sm font-medium text-brand-900">{vendor.name}</p>
                  <p className="text-xs text-brand-700">{vendor.phone} · {vendor.serviceArea}</p>
                </div>
              )}

              {actionModal.action === 'resolve' && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-xs text-emerald-700">This risk will be marked as resolved. A resolution note will be added to the audit log.</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {actionModal.action === 'resolve' ? 'Resolution note' : 'Notes'} (required)
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder={
                    actionModal.action === 'resolve'
                      ? 'Describe how this risk was resolved...'
                      : 'Add context for the audit trail...'
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" size="sm" onClick={() => setActionModal(null)}>Cancel</Button>
                <Button
                  size="sm"
                  variant={actionModal.action === 'resolve' ? 'primary' : 'primary'}
                  onClick={() => executeAction(risk.id, actionModal.action, actionNote)}
                  disabled={!actionNote.trim()}
                >
                  {getActionTitle(actionModal.action)}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ════ Risk Detail Modal ════ */}
      <Modal open={!!detailRisk} onClose={() => setDetailRisk(null)} title="Risk Detail" wide>
        {detailRisk && (() => {
          const patient = patients.find((p) => p.id === detailRisk.patientId);
          const vendor = vendors.find((v) => v.id === detailRisk.vendorId);
          const cg = patient ? caregivers.find((c) => c.patientId === patient.id) : null;
          const sev = severityConfig[detailRisk.severity];
          const riskAudit = auditLog.filter((a) => a.riskId === detailRisk.id);

          return (
            <div className="space-y-5">
              {/* Severity + type */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={sev.badge}>{detailRisk.severity.toUpperCase()}</Badge>
                <span className="text-sm font-semibold text-gray-900">{riskTypeLabels[detailRisk.type]}</span>
                <Badge variant={detailRisk.status === 'resolved' ? 'success' : detailRisk.status === 'in_progress' ? 'warning' : 'neutral'}>
                  {statusLabels[detailRisk.status]}
                </Badge>
              </div>

              {/* Patient info */}
              <div>
                <p className="text-xs font-semibold text-gray-900 mb-2">Patient</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                    {patient ? patient.firstName[0] + patient.lastName[0] : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{patient ? getPatientName(patient) : 'Unknown'}</p>
                    <p className="text-[11px] text-gray-500">
                      {patient?.phone} · {patient?.preferredLanguage} · {patient?.mobilityLevel} · {patient?.assistanceLevel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ride info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-gray-400">Chair Time</p>
                  <p className="text-sm font-medium text-gray-900">{formatTime(detailRisk.chairTime)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Pickup Time</p>
                  <p className="text-sm font-medium text-gray-900">{formatTime(detailRisk.pickupTime)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Vendor</p>
                  <p className="text-sm text-gray-700">{vendor?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Caregiver</p>
                  <p className="text-sm text-gray-700">{cg ? `${cg.name} (${cg.relationship})` : 'None on file'}</p>
                </div>
              </div>

              {/* Problem */}
              <div>
                <p className="text-xs font-semibold text-gray-900 mb-1">Problem</p>
                <p className="text-sm text-gray-700">{detailRisk.problem}</p>
              </div>

              {/* Why it matters */}
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-[11px] font-semibold text-red-800 uppercase tracking-wider mb-1">Why This Matters</p>
                <p className="text-xs text-red-700">{detailRisk.whyItMatters}</p>
              </div>

              {/* Suggested action */}
              <div className="p-3 rounded-lg bg-brand-50 border border-brand-100">
                <p className="text-[11px] font-semibold text-brand-800 uppercase tracking-wider mb-1">Suggested Action</p>
                <p className="text-xs text-brand-700">{detailRisk.suggestedAction}</p>
              </div>

              {/* Audit trail */}
              {riskAudit.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-900 mb-2">Audit Trail</p>
                  <div className="space-y-2">
                    {riskAudit.map((entry) => (
                      <div key={entry.id} className="flex gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-700"><span className="font-medium">{entry.action}</span></p>
                          <p className="text-[11px] text-gray-500">{entry.detail}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(entry.timestamp)} by {entry.actor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-gray-400">Detected {timeAgo(detailRisk.createdAt)}</p>
            </div>
          );
        })()}
      </Modal>

      {/* ════ Audit Log Modal ════ */}
      <Modal open={showAuditLog} onClose={() => setShowAuditLog(false)} title="Audit Log" wide>
        <div className="space-y-3">
          {auditLog.length > 0 ? (
            auditLog.map((entry) => {
              const risk = risks.find((r) => r.id === entry.riskId);
              const patient = risk ? patients.find((p) => p.id === risk.patientId) : null;
              return (
                <div key={entry.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    SP
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                      {risk && <Badge variant={severityConfig[risk.severity].badge}>{risk.severity.toUpperCase()}</Badge>}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{entry.detail}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {patient ? getPatientName(patient) : 'Unknown'} · {timeAgo(entry.timestamp)} · {entry.actor}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-sm text-gray-400">No actions taken yet</p>
              <p className="text-xs text-gray-400 mt-1">Actions will appear here as you respond to risks</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ── Sub-components ──

function ActionBtn({
  label,
  onClick,
  icon,
  variant = 'default',
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  variant?: 'default' | 'neutral' | 'success';
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
        variant === 'success' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
        variant === 'neutral' && 'bg-gray-200 text-gray-600 hover:bg-gray-300',
        variant === 'default' && 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm',
      )}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        {icon}
      </svg>
      {label}
    </button>
  );
}

function EscalationRule({
  severity,
  title,
  rule,
  detail,
}: {
  severity: RiskLevel;
  title: string;
  rule: string;
  detail: string;
}) {
  const colors: Record<RiskLevel, { dot: string; bg: string }> = {
    high: { dot: 'bg-red-500', bg: 'bg-red-50' },
    medium: { dot: 'bg-amber-500', bg: 'bg-amber-50' },
    low: { dot: 'bg-blue-500', bg: 'bg-blue-50' },
  };
  const c = colors[severity];
  return (
    <div className={cn('p-2.5 rounded-lg border border-gray-100', c.bg)}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
        <p className="text-[11px] font-medium text-gray-600">{title}</p>
      </div>
      <p className="text-xs font-semibold text-gray-900 mb-0.5">{rule}</p>
      <p className="text-[11px] text-gray-500">{detail}</p>
    </div>
  );
}

function getActionTitle(action: string): string {
  const map: Record<string, string> = {
    assign_backup: 'Assign Backup Vendor',
    call_patient: 'Call Patient',
    notify_caregiver: 'Notify Caregiver',
    message_vendor: 'Message Vendor',
    resolve: 'Mark Resolved',
    document: 'Document Issue',
  };
  return map[action] ?? action;
}
