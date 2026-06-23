import { useState, useRef, useEffect, useCallback } from 'react';
import { rides, patients, vendors, clinic } from '../data/mock';
import { StatusPill } from '../components/StatusPill';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal, ModalRow } from '../components/Modal';
import { RideDetail } from '../components/RideDetail';
import { cn } from '../utils/cn';
import { getPatientName, formatTime, getRideStatusLabel } from '../utils/helpers';
import type { Ride, RiskLevel, Patient } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPatient(id: string): Patient | undefined {
  return patients.find((p) => p.id === id);
}

function getVendorName(id: string): string {
  return vendors.find((v) => v.id === id)?.name ?? 'Unknown';
}

function getVendorShort(id: string): string {
  const name = getVendorName(id);
  return name.split(' ').slice(0, 2).join(' ');
}

const assistanceLabels: Record<string, string> = {
  independent: 'Independent',
  'door-to-door': 'Door-to-door',
  'door-through-door': 'Door-thru-door',
};

const riskVariant: Record<RiskLevel, 'low' | 'medium' | 'high'> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
};

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

interface StatItem {
  label: string;
  value: number;
  accent: boolean;
  icon: React.ReactNode;
}

function useClinicStats(): { stats: StatItem[]; completedPct: number; completedCount: number; totalRides: number } {
  const uniquePatients = new Set(rides.map((r) => r.patientId)).size;
  const confirmed = rides.filter((r) => r.status !== 'scheduled' && r.status !== 'canceled').length;
  const atRisk = rides.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'medium').length;
  const late = rides.filter((r) => r.status === 'delayed').length;
  const arrived = rides.filter((r) =>
    ['arrived_at_clinic', 'in_treatment', 'ready_for_return'].includes(r.status),
  ).length;
  const returnPending = rides.filter((r) =>
    r.direction === 'from-clinic' && !['completed', 'canceled', 'missed', 'arrived_home', 'returning_home'].includes(r.status),
  ).length;
  const missed = rides.filter((r) => r.status === 'missed').length;
  const completed = rides.filter((r) => r.status === 'completed').length;

  const stats: StatItem[] = [
    { label: 'Patients Today', value: uniquePatients, accent: false, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /> },
    { label: 'Rides Confirmed', value: confirmed, accent: false, icon: <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /> },
    { label: 'At-Risk Rides', value: atRisk, accent: atRisk > 0, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /> },
    { label: 'Late Pickups', value: late, accent: late > 0, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> },
    { label: 'At Clinic', value: arrived, accent: false, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" /> },
    { label: 'Returns Pending', value: returnPending, accent: returnPending > 0, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /> },
    { label: 'Missed', value: missed, accent: missed > 0, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /> },
  ];

  return {
    stats,
    completedPct: Math.round((completed / Math.max(rides.length, 1)) * 100),
    completedCount: completed,
    totalRides: rides.length,
  };
}

// ---------------------------------------------------------------------------
// Filter definitions
// ---------------------------------------------------------------------------

type FilterKey = 'all' | 'at-risk' | 'late' | 'needs-return' | 'wheelchair' | 'completed';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'at-risk', label: 'At Risk' },
  { key: 'late', label: 'Late' },
  { key: 'needs-return', label: 'Needs Return' },
  { key: 'wheelchair', label: 'Wheelchair' },
  { key: 'completed', label: 'Completed' },
];

function applyFilter(key: FilterKey, list: Ride[]): Ride[] {
  switch (key) {
    case 'at-risk':
      return list.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'medium');
    case 'late':
      return list.filter((r) => r.status === 'delayed' || r.status === 'issue_reported');
    case 'needs-return':
      return list.filter((r) =>
        r.direction === 'from-clinic' &&
        !['completed', 'canceled', 'missed', 'arrived_home', 'returning_home'].includes(r.status),
      );
    case 'wheelchair':
      return list.filter((r) => r.rideType === 'wheelchair');
    case 'completed':
      return list.filter((r) => r.status === 'completed');
    default:
      return list;
  }
}

function filterCount(key: FilterKey): number {
  if (key === 'all') return rides.length;
  return applyFilter(key, rides).length;
}

// ---------------------------------------------------------------------------
// Row action dropdown
// ---------------------------------------------------------------------------

type ModalType = 'view' | 'escalate' | 'return' | 'call-vendor';

function ActionMenu({ ride, onAction }: { ride: Ride; onAction: (type: ModalType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  function act(type: ModalType) {
    setOpen(false);
    onAction(type);
  }

  const showReturn = ride.direction === 'to-clinic' &&
    ['in_treatment', 'ready_for_return', 'arrived_at_clinic'].includes(ride.status);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-40 py-1">
          <ActionItem label="View Ride" onClick={() => act('view')} />
          <ActionItem label="Escalate" onClick={() => act('escalate')} danger />
          {showReturn && <ActionItem label="Request Return" onClick={() => act('return')} />}
          <ActionItem label="Call Vendor" onClick={() => act('call-vendor')} />
        </div>
      )}
    </div>
  );
}

function ActionItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50',
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Modal content components
// ---------------------------------------------------------------------------

function ViewRideModal({ ride, onClose }: { ride: Ride; onClose: () => void }) {
  return (
    <Modal open title="Ride Details" onClose={onClose} wide>
      <RideDetail ride={ride} viewerRole="clinic" />
    </Modal>
  );
}

function EscalateModal({ ride, onClose }: { ride: Ride; onClose: () => void }) {
  const patient = getPatient(ride.patientId);

  return (
    <Modal open title="Escalate Ride" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-xs font-medium text-red-800 mb-1">Escalation for {patient ? getPatientName(patient) : 'Unknown'}</p>
          <p className="text-xs text-red-600">
            Current status: {getRideStatusLabel(ride.status)}
            {ride.riskLevel !== 'low' && ` · Risk: ${ride.riskLevel}`}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Reason</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option>Late pickup — at risk of missing treatment</option>
            <option>Driver no-show</option>
            <option>Vehicle type mismatch</option>
            <option>Patient safety concern</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            rows={3}
            placeholder="Additional details for the escalation..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={onClose}>Submit Escalation</Button>
        </div>
      </div>
    </Modal>
  );
}

function RequestReturnModal({ ride, onClose }: { ride: Ride; onClose: () => void }) {
  const patient = getPatient(ride.patientId);
  const vendor = vendors.find((v) => v.id === ride.vendorId);

  return (
    <Modal open title="Request Return Ride" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-brand-50 border border-brand-200/60 rounded-lg p-3">
          <p className="text-xs font-medium text-brand-800 mb-1">Return ride for {patient ? getPatientName(patient) : 'Unknown'}</p>
          <p className="text-xs text-brand-600">
            Current vendor: {vendor?.name ?? 'Unknown'} · Vehicle: {ride.vehicleType}
          </p>
        </div>

        <div className="space-y-0">
          <ModalRow label="Patient">{patient ? getPatientName(patient) : 'Unknown'}</ModalRow>
          <ModalRow label="Pickup From">{clinic.address}</ModalRow>
          <ModalRow label="Drop-off At">{patient?.address ?? ride.pickupAddress}</ModalRow>
          <ModalRow label="Vehicle Needed">{ride.vehicleType}</ModalRow>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Pickup readiness</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option>Patient is ready now</option>
            <option>Patient will be ready in 15 minutes</option>
            <option>Patient will be ready in 30 minutes</option>
            <option>Schedule for estimated return time</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onClose}>Request Return Ride</Button>
        </div>
      </div>
    </Modal>
  );
}

function CallVendorModal({ ride, onClose }: { ride: Ride; onClose: () => void }) {
  const vendor = vendors.find((v) => v.id === ride.vendorId);

  return (
    <Modal open title="Contact Vendor" onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-0">
          <ModalRow label="Vendor">{vendor?.name ?? 'Unknown'}</ModalRow>
          <ModalRow label="Phone">{vendor?.phone ?? 'N/A'}</ModalRow>
          <ModalRow label="Service Area">{vendor?.serviceArea ?? 'N/A'}</ModalRow>
          <ModalRow label="On-Time Rate">
            <span className={(vendor?.onTimeRate ?? 0) >= 92 ? 'text-emerald-700' : (vendor?.onTimeRate ?? 0) >= 90 ? 'text-amber-700' : 'text-red-600'}>
              {vendor?.onTimeRate ?? 0}%
            </span>
          </ModalRow>
          <ModalRow label="Avg Delay">{vendor?.averageDelayMinutes ?? 0} min</ModalRow>
          <ModalRow label="Wheelchair">{vendor?.supportsWheelchair ? 'Yes' : 'No'}</ModalRow>
          <ModalRow label="Door-thru-door">{vendor?.supportsDoorThroughDoor ? 'Yes' : 'No'}</ModalRow>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-700 mb-0.5">Ride Reference</p>
          <p className="text-xs text-gray-500">
            {ride.id} · Driver: {ride.driverName || 'Unassigned'} · {ride.vehicleType}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={onClose}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            Call {vendor?.phone}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ClinicDashboard() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [modalState, setModalState] = useState<{ type: ModalType; ride: Ride } | null>(null);

  const filteredRides = applyFilter(filter, rides);

  const closeModal = useCallback(() => setModalState(null), []);

  const { stats } = useClinicStats();

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Command Center</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#666', maxWidth: 560, lineHeight: 1.5 }}>
            Every dialysis ride today — who's been picked up, who's in treatment, who's at risk of missing care, and who's waiting to go home.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: s.accent ? '#fffafa' : '#fff',
              border: s.accent ? '1px solid #f6dcdc' : '1px solid #eaeaea',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 12, color: '#737373', fontWeight: 500, margin: 0 }}>{s.label}</p>
              <svg style={{ width: 15, height: 15, color: s.accent ? '#dc2626' : '#c9c9c9' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                {s.icon}
              </svg>
            </div>
            <p style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', fontFamily: "'Geist Mono', monospace", color: s.accent ? '#b91c1c' : '#171717', margin: 0 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Transportation board */}
      <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 12, overflow: 'hidden' }}>
        {/* Filters header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Transportation Board</h2>
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {filters.map((f) => {
              const count = filterCount(f.key);
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="inline-flex items-center cursor-pointer"
                  style={{
                    height: 28,
                    padding: '0 10px',
                    borderRadius: 7,
                    border: 'none',
                    background: isActive ? '#171717' : '#f4f4f5',
                    color: isActive ? '#fff' : '#666',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    gap: 5,
                  }}
                >
                  {f.label}
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: isActive ? 'rgba(255,255,255,.2)' : '#e4e4e7',
                    color: isActive ? '#fff' : '#737373',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#a3a3a3', padding: '9px 12px 9px 18px', letterSpacing: '0.03em' }}>PATIENT</th>
                <th className="hidden lg:table-cell" style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#a3a3a3', padding: '9px 12px', letterSpacing: '0.03em' }}>CHAIR</th>
                <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#a3a3a3', padding: '9px 12px', letterSpacing: '0.03em' }}>PICKUP</th>
                <th className="hidden sm:table-cell" style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#a3a3a3', padding: '9px 12px', letterSpacing: '0.03em' }}>DIR</th>
                <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#a3a3a3', padding: '9px 12px', letterSpacing: '0.03em' }}>STATUS</th>
                <th className="hidden md:table-cell" style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#a3a3a3', padding: '9px 12px', letterSpacing: '0.03em' }}>RISK</th>
                <th className="hidden xl:table-cell" style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#a3a3a3', padding: '9px 12px', letterSpacing: '0.03em' }}>VENDOR</th>
                <th className="hidden xl:table-cell" style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#a3a3a3', padding: '9px 12px', letterSpacing: '0.03em' }}>ASSIST</th>
                <th style={{ textAlign: 'right', fontSize: 11, fontWeight: 500, color: '#a3a3a3', padding: '9px 18px 9px 12px', letterSpacing: '0.03em', width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRides.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />
                    </svg>
                    <p className="text-sm font-medium text-gray-400">No rides match "{filters.find((f) => f.key === filter)?.label}"</p>
                    <p className="text-xs text-gray-300 mt-1">Try a different filter or check back later</p>
                  </td>
                </tr>
              )}
              {filteredRides.map((ride) => {
                const patient = getPatient(ride.patientId);
                const isUrgent = ride.status === 'delayed' || ride.status === 'missed' || ride.status === 'issue_reported';
                return (
                  <tr
                    key={ride.id}
                    style={{
                      borderBottom: '1px solid #f4f4f4',
                      background: isUrgent ? '#fef9f9' : undefined,
                    }}
                  >
                    {/* Patient */}
                    <td style={{ padding: '11px 12px 11px 18px' }}>
                      <div className="flex items-center" style={{ gap: 10 }}>
                        <div className="flex items-center justify-center shrink-0" style={{ height: 28, width: 28, borderRadius: 999, background: '#f3f3f3', fontSize: 10, fontWeight: 600, color: '#666' }}>
                          {patient ? `${patient.firstName[0]}${patient.lastName[0]}` : '?'}
                        </div>
                        <div className="min-w-0">
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#262626', margin: 0 }} className="truncate">
                            {patient ? getPatientName(patient) : 'Unknown'}
                          </p>
                          <p className="sm:hidden" style={{ fontSize: 11, color: '#a3a3a3', margin: 0 }}>
                            {ride.direction === 'to-clinic' ? 'To clinic' : 'Return'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Chair time */}
                    <td className="hidden lg:table-cell" style={{ padding: '11px 12px', color: '#525252', fontFamily: "'Geist Mono', monospace", fontSize: 12, whiteSpace: 'nowrap' }}>
                      {formatTime(ride.chairTime)}
                    </td>

                    {/* Pickup time */}
                    <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#262626', fontFamily: "'Geist Mono', monospace", fontSize: 12 }}>{formatTime(ride.pickupTime)}</span>
                      {ride.actualPickupTime && (
                        <span className="text-[10px] text-gray-400 ml-1">
                          (actual {formatTime(ride.actualPickupTime)})
                        </span>
                      )}
                    </td>

                    {/* Direction */}
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs',
                        ride.direction === 'to-clinic' ? 'text-brand-700' : 'text-violet-700',
                      )}>
                        {ride.direction === 'to-clinic' ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                          </svg>
                        )}
                        {ride.direction === 'to-clinic' ? 'To clinic' : 'Return'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <StatusPill status={ride.status} className="text-[10px]" />
                    </td>

                    {/* Risk */}
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <Badge variant={riskVariant[ride.riskLevel]}>{ride.riskLevel}</Badge>
                    </td>

                    {/* Vendor */}
                    <td className="px-3 py-2.5 text-gray-600 hidden xl:table-cell truncate max-w-[120px]">
                      {getVendorShort(ride.vendorId)}
                    </td>

                    {/* Assistance */}
                    <td className="px-3 py-2.5 hidden xl:table-cell">
                      {patient && (
                        <span className={cn(
                          'text-xs',
                          patient.assistanceLevel === 'door-through-door' ? 'text-amber-700 font-medium' : 'text-gray-500',
                        )}>
                          {assistanceLabels[patient.assistanceLevel]}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="pl-3 pr-4 sm:pr-5 py-2.5 text-right">
                      <ActionMenu
                        ride={ride}
                        onAction={(type) => setModalState({ type, ride })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            {filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''}
            {filter !== 'all' ? ` matching "${filters.find((f) => f.key === filter)?.label}"` : ' total'}
          </p>
          <p className="text-[11px] text-gray-400">{clinic.name}</p>
        </div>
      </div>

      {/* Modals */}
      {modalState?.type === 'view' && (
        <ViewRideModal ride={modalState.ride} onClose={closeModal} />
      )}
      {modalState?.type === 'escalate' && (
        <EscalateModal ride={modalState.ride} onClose={closeModal} />
      )}
      {modalState?.type === 'return' && (
        <RequestReturnModal ride={modalState.ride} onClose={closeModal} />
      )}
      {modalState?.type === 'call-vendor' && (
        <CallVendorModal ride={modalState.ride} onClose={closeModal} />
      )}
    </div>
  );
}
