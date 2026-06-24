import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { rides, patients, vendors } from '../data/mock';
import { formatTime, getRideStatusLabel } from '../utils/helpers';
import { StatusPill } from '../components/StatusPill';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { RideDetail } from '../components/RideDetail';
import { cn } from '../utils/cn';
import { useNotifications } from '../data/NotificationContext';
import {
  useDemoScenario,
  DemoStatusBadge,
  DEMO_PATIENT,
  DEMO_CLINIC_INFO,
  DEMO_RIDE_INFO,
  isDemoErrorStatus,
  isDemoTerminalStatus,
  demoStatusLabels,
} from '../data/DemoScenarioContext';
import type { Ride, RideStatus, RiskLevel } from '../types';

// Demo vendor: CareRide Medical Transport
const vendor = vendors[0];
const vendorRides = rides.filter(r => r.vendorId === vendor.id);

// Mock drivers for this vendor
const driverPool = [
  { id: 'd-1', name: 'Tony Reeves', phone: '(916) 555-0501', vehicle: 'Wheelchair Van', status: 'on-trip' as const },
  { id: 'd-2', name: 'Kevin Park', phone: '(916) 555-0502', vehicle: 'Sedan', status: 'on-trip' as const },
  { id: 'd-3', name: 'Maria Lopez', phone: '(916) 555-0503', vehicle: 'Wheelchair Van', status: 'available' as const },
  { id: 'd-4', name: 'James Wilson', phone: '(916) 555-0504', vehicle: 'SUV', status: 'available' as const },
  { id: 'd-5', name: 'Linda Chen', phone: '(916) 555-0505', vehicle: 'Sedan', status: 'off-duty' as const },
];

type Tab = 'dispatch' | 'trips' | 'drivers' | 'issues' | 'completed';

function tabFromPath(path: string): Tab {
  if (path.endsWith('/trips')) return 'trips';
  if (path.endsWith('/drivers')) return 'drivers';
  if (path.endsWith('/issues')) return 'issues';
  if (path.endsWith('/completed')) return 'completed';
  return 'dispatch';
}

function patientLabel(patientId: string): string {
  const p = patients.find(pt => pt.id === patientId);
  if (!p) return 'Unknown';
  return `${p.firstName} ${p.lastName[0]}.`;
}

function getAssistanceLabel(patientId: string): string {
  const p = patients.find(pt => pt.id === patientId);
  if (!p) return '—';
  const labels: Record<string, string> = {
    independent: 'Independent',
    'door-to-door': 'Door-to-door',
    'door-through-door': 'Door-thru-door',
  };
  return labels[p.assistanceLevel] || p.assistanceLevel;
}

function getRideTypeLabel(r: Ride): string {
  const labels: Record<string, string> = {
    ambulatory: 'Ambulatory',
    wheelchair: 'Wheelchair',
    stretcher: 'Stretcher',
  };
  return labels[r.rideType] || r.rideType;
}

const riskVariant: Record<RiskLevel, 'low' | 'medium' | 'high'> = {
  low: 'low', medium: 'medium', high: 'high',
};

interface Toast { id: number; message: string; type: 'success' | 'info' | 'warning' }

const activeStatuses: RideStatus[] = [
  'scheduled', 'driver_assigned', 'driver_en_route', 'driver_arrived',
  'picked_up', 'arrived_at_clinic', 'in_treatment', 'ready_for_return',
  'return_assigned', 'returning_home',
];

const completedStatuses: RideStatus[] = ['arrived_home', 'completed'];
const issueStatuses: RideStatus[] = ['delayed', 'missed', 'canceled', 'issue_reported'];

// Statuses where driver is actively doing something
const driverActiveStatuses: RideStatus[] = [
  'driver_en_route', 'driver_arrived', 'picked_up', 'arrived_at_clinic',
  'returning_home',
];

const issueTypes = [
  { id: 'not-ready', label: 'Patient Not Ready', icon: 'clock', color: 'bg-amber-100 text-amber-700' },
  { id: 'no-show', label: 'Patient No-Show', icon: 'x', color: 'bg-red-100 text-red-700' },
  { id: 'address', label: 'Address Issue', icon: 'map', color: 'bg-blue-100 text-blue-700' },
  { id: 'vehicle', label: 'Vehicle Problem', icon: 'truck', color: 'bg-gray-100 text-gray-700' },
  { id: 'traffic', label: 'Traffic Delay', icon: 'alert', color: 'bg-orange-100 text-orange-700' },
  { id: 'wheelchair', label: 'Wheelchair Mismatch', icon: 'people', color: 'bg-purple-100 text-purple-700' },
  { id: 'access', label: 'Building Access Issue', icon: 'lock', color: 'bg-teal-100 text-teal-700' },
];

function getNextAction(status: RideStatus, direction: Ride['direction']): { label: string; next: RideStatus } | null {
  if (status === 'scheduled') return { label: 'Accept Trip', next: 'driver_assigned' };
  if (status === 'driver_assigned') return { label: 'Start Trip', next: 'driver_en_route' };
  if (status === 'driver_en_route') return { label: 'Mark Arrived', next: 'driver_arrived' };
  if (status === 'driver_arrived') return { label: 'Mark Picked Up', next: 'picked_up' };
  if (status === 'picked_up' && direction === 'to-clinic') return { label: 'Mark Dropped Off', next: 'arrived_at_clinic' };
  if (status === 'ready_for_return') return { label: 'Accept Return', next: 'return_assigned' };
  if (status === 'return_assigned') return { label: 'Start Return', next: 'returning_home' };
  if (status === 'returning_home') return { label: 'Mark Dropped Off', next: 'arrived_home' };
  return null;
}

export function VendorView() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = tabFromPath(location.pathname);
  const isDemo = location.pathname.startsWith('/demo');
  const isGuidedDemo = location.pathname.startsWith('/demo/guided');

  const { addNotification, addAuditLogEntry, addToast: addGlobalToast } = useNotifications();

  const demo = useDemoScenario();

  const [rideStates, setRideStates] = useState<Record<string, RideStatus>>(() => {
    const initial: Record<string, RideStatus> = {};
    vendorRides.forEach(r => { initial[r.id] = r.status; });
    return initial;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showAssignDriver, setShowAssignDriver] = useState<Ride | null>(null);
  const [showIssueReport, setShowIssueReport] = useState<{ ride: Ride; issueType: string } | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueRide, setIssueRide] = useState<Ride | null>(null);
  const [driverView, setDriverView] = useState(false);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts(prev => prev.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  function getStatus(rideId: string): RideStatus {
    return rideStates[rideId] ?? 'scheduled';
  }

  function advanceStatus(ride: Ride) {
    const current = getStatus(ride.id);
    const action = getNextAction(current, ride.direction);
    if (!action) return;
    setRideStates(prev => ({ ...prev, [ride.id]: action.next }));
    addToast(`${patientLabel(ride.patientId)}: ${getRideStatusLabel(action.next)}`);

    const pLabel = patientLabel(ride.patientId);
    addAuditLogEntry({ actorRole: 'vendor', actorName: ride.driverName || vendor.name, action: 'status_changed', target: `${pLabel} (${ride.id})`, details: `${action.label} — status changed to ${action.next}` });

    if (action.next === 'picked_up') {
      addGlobalToast(`${pLabel} picked up`);
      addNotification({ recipientRole: 'clinic', patientId: ride.patientId, title: 'Patient Picked Up', message: `${pLabel} was picked up by ${ride.driverName || 'driver'}.`, severity: 'success' });
      addNotification({ recipientRole: 'caregiver', patientId: ride.patientId, title: 'Patient Picked Up', message: `${pLabel} has been picked up and is on the way.`, severity: 'success' });
    }
    if (action.next === 'arrived_at_clinic') {
      addNotification({ recipientRole: 'clinic', patientId: ride.patientId, title: 'Patient Arrived', message: `${pLabel} has arrived at the clinic.`, severity: 'info' });
    }
    if (action.next === 'arrived_home') {
      addNotification({ recipientRole: 'caregiver', patientId: ride.patientId, title: 'Patient Home', message: `${pLabel} has arrived home safely.`, severity: 'success' });
    }
  }

  const dispatchRides = vendorRides.filter(r => activeStatuses.includes(getStatus(r.id)) && !issueStatuses.includes(getStatus(r.id)));
  const completedRides = vendorRides.filter(r => completedStatuses.includes(getStatus(r.id)));
  const issueRides = vendorRides.filter(r => issueStatuses.includes(r.status));

  // Assigned trips = rides currently with an active driver action
  const assignedTrips = vendorRides.filter(r => {
    const s = getStatus(r.id);
    return driverActiveStatuses.includes(s) || s === 'return_assigned';
  });

  const base = isGuidedDemo ? '/demo/guided/vendor' : isDemo ? '/demo/operations/vendor' : '/app/vendor';
  const tabItems: { key: Tab; label: string; path: string }[] = [
    { key: 'dispatch', label: 'Dispatch', path: base },
    { key: 'trips', label: 'Trips', path: `${base}/trips` },
    { key: 'drivers', label: 'Drivers', path: `${base}/drivers` },
    { key: 'issues', label: 'Issues', path: `${base}/issues` },
    { key: 'completed', label: 'Done', path: `${base}/completed` },
  ];

  return (
    <div className="pb-6">
      {/* Toasts */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-xs animate-[slideIn_0.3s_ease-out]',
              t.type === 'success' && 'bg-emerald-600 text-white',
              t.type === 'info' && 'bg-blue-600 text-white',
              t.type === 'warning' && 'bg-amber-500 text-white',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-xl bg-white border border-gray-200 shadow-sm mb-6 overflow-hidden">
        {tabItems.map(t => (
          <button
            key={t.key}
            onClick={() => navigate(t.path)}
            className={cn(
              'flex-1 py-2.5 px-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer text-center',
              tab === t.key
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            {t.label}
            {t.key === 'issues' && issueRides.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {issueRides.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===== DISPATCH TAB ===== */}
      {tab === 'dispatch' && (
        <div className="space-y-5">

          {/* Guided Demo Scenario — Active Trip Card */}
          {isGuidedDemo && demo && (
            <>
              {/* Demo Banner */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                This is a sample interactive demo using fictional patient data.
              </div>

              {/* Active Trip Card */}
              <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-200">
                  <h2 className="text-base font-semibold text-gray-900">
                    Active Trip &mdash; {DEMO_PATIENT.firstName} {DEMO_PATIENT.lastName}
                  </h2>
                  <DemoStatusBadge status={demo.status} />
                </div>

                <div className="p-4 space-y-4">
                  {/* Patient response tag */}
                  {demo.status === 'patient_ready' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Patient confirmed ready
                    </div>
                  )}
                  {demo.status === 'patient_needs_help' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Patient needs assistance
                    </div>
                  )}
                  {demo.status === 'patient_not_ready' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Patient not ready
                    </div>
                  )}
                  {demo.status === 'cancel_requested' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Patient requested cancellation
                    </div>
                  )}
                  {demo.status === 'readiness_prompt_sent' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Readiness check sent — awaiting patient response
                    </div>
                  )}
                  {demo.status === 'driver_en_route_to_patient' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Driver en route to patient
                    </div>
                  )}
                  {demo.status === 'driver_arrived' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Driver arrived — waiting for patient
                    </div>
                  )}
                  {(demo.status === 'picked_up' || demo.status === 'en_route_to_clinic') && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Patient onboard — en route to clinic
                    </div>
                  )}
                  {demo.status === 'arrived_at_clinic' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Arrived at clinic
                    </div>
                  )}
                  {demo.status === 'in_treatment' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Patient in treatment
                    </div>
                  )}
                  {demo.status === 'pickup_failed' && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Pickup failed
                    </div>
                  )}

                  {/* Trip details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-20 shrink-0">Pickup</span>
                      <span className="text-gray-900">{DEMO_PATIENT.address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-20 shrink-0">Clinic</span>
                      <span className="text-gray-900">{DEMO_CLINIC_INFO.name}, {DEMO_CLINIC_INFO.address.split(',')[0]}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-20 shrink-0">Pickup time</span>
                      <span className="text-gray-900 font-medium">{formatTime(DEMO_RIDE_INFO.pickupTime)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-20 shrink-0">Chair time</span>
                      <span className="text-gray-900 font-medium">{formatTime(DEMO_RIDE_INFO.chairTime)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-20 shrink-0">Ride type</span>
                      <span className="text-gray-900">{DEMO_RIDE_INFO.rideType}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-20 shrink-0">Assistance</span>
                      <span className="text-gray-900">{DEMO_RIDE_INFO.assistance}</span>
                    </div>
                  </div>

                  {/* Driver info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <span>{DEMO_RIDE_INFO.driverName} &middot; {DEMO_RIDE_INFO.vendorName}</span>
                  </div>

                  {/* Driver action buttons */}
                  {(demo.status === 'driver_en_route_to_patient' || demo.status === 'readiness_prompt_sent' || demo.status === 'patient_ready' || demo.status === 'patient_needs_help' || demo.status === 'patient_not_ready') && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {demo.status === 'driver_en_route_to_patient' && (
                        <button
                          onClick={() => demo.sendReadinessPrompt()}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transition-colors cursor-pointer"
                        >
                          Send Readiness Check
                        </button>
                      )}
                      <button
                        onClick={() => demo.driverArrived()}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transition-colors cursor-pointer"
                      >
                        Arrived
                      </button>
                      <button
                        onClick={() => demo.pickupFailed()}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Unable to Pick Up
                      </button>
                    </div>
                  )}

                  {demo.status === 'driver_arrived' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => demo.patientPickedUp()}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transition-colors cursor-pointer"
                      >
                        Patient Onboard
                      </button>
                      <button
                        onClick={() => demo.pickupFailed()}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Unable to Pick Up
                      </button>
                    </div>
                  )}

                  {demo.status === 'en_route_to_clinic' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => demo.arrivedAtClinic()}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transition-colors cursor-pointer"
                      >
                        Arrived at Clinic
                      </button>
                    </div>
                  )}

                  {(isDemoTerminalStatus(demo.status) || demo.status === 'arrived_at_clinic') && (
                    <div className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium',
                      isDemoErrorStatus(demo.status) ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700',
                    )}>
                      {demoStatusLabels[demo.status]}
                      {demo.status === 'arrived_at_clinic' && ' — trip complete'}
                    </div>
                  )}

                  {/* Reset Demo */}
                  <div className="pt-1">
                    <button
                      onClick={() => demo.resetDemoScenario()}
                      className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors cursor-pointer"
                    >
                      Reset Demo
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Dispatch Board</h1>
              <p className="text-sm text-gray-500 mt-0.5">{vendor.name} &mdash; {dispatchRides.length} active trips today</p>
            </div>
            <button
              onClick={() => setDriverView(!driverView)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
                driverView
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50',
              )}
            >
              {driverView ? 'Table View' : 'Driver View'}
            </button>
          </div>

          {/* Summary counters */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Active', count: dispatchRides.length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'In Transit', count: vendorRides.filter(r => ['driver_en_route', 'returning_home'].includes(getStatus(r.id))).length, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Completed', count: completedRides.length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Issues', count: issueRides.length, color: 'bg-red-50 text-red-700 border-red-200' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-xl border p-3 text-center', s.color)}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {!driverView ? (
            /* Dispatch Table */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Pickup</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dropoff</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Assist</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchRides.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">No active trips</td>
                      </tr>
                    ) : (
                      dispatchRides
                        .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime())
                        .map(ride => {
                          const status = getStatus(ride.id);
                          const action = getNextAction(status, ride.direction);
                          return (
                            <tr
                              key={ride.id}
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => setSelectedRide(ride)}
                            >
                              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatTime(ride.pickupTime)}</td>
                              <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                                <div>
                                  <span className="font-medium">{patientLabel(ride.patientId)}</span>
                                  <span className="text-gray-400 text-xs ml-1.5">
                                    {ride.direction === 'to-clinic' ? '→ Clinic' : '→ Home'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs max-w-[180px] truncate hidden lg:table-cell">{ride.pickupAddress}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs max-w-[180px] truncate hidden lg:table-cell">{ride.dropoffAddress}</td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <Badge variant="neutral">{getRideTypeLabel(ride)}</Badge>
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">{getAssistanceLabel(ride.patientId)}</td>
                              <td className="px-4 py-3"><StatusPill status={status} /></td>
                              <td className="px-4 py-3">
                                <Badge variant={riskVariant[ride.riskLevel]}>
                                  {ride.riskLevel.charAt(0).toUpperCase() + ride.riskLevel.slice(1)}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                  {action && (
                                    <button
                                      onClick={() => advanceStatus(ride)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      {action.label}
                                    </button>
                                  )}
                                  {status === 'scheduled' && (
                                    <button
                                      onClick={() => setShowAssignDriver(ride)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      Assign
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Driver Card View */
            <div className="space-y-3">
              {dispatchRides.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-sm text-gray-400">No active trips</p>
                </div>
              ) : (
                dispatchRides
                  .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime())
                  .map(ride => {
                    const status = getStatus(ride.id);
                    const action = getNextAction(status, ride.direction);
                    return (
                      <div
                        key={ride.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">{formatTime(ride.pickupTime)}</span>
                            <span className="text-xs text-gray-400">
                              {ride.direction === 'to-clinic' ? '→ Clinic' : '→ Home'}
                            </span>
                          </div>
                          <StatusPill status={status} />
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-gray-900">{patientLabel(ride.patientId)}</span>
                            <Badge variant={riskVariant[ride.riskLevel]}>
                              {ride.riskLevel.charAt(0).toUpperCase() + ride.riskLevel.slice(1)} Risk
                            </Badge>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                              </svg>
                              <p className="text-xs text-gray-600">{ride.pickupAddress}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                              </svg>
                              <p className="text-xs text-gray-600">{ride.dropoffAddress}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{getRideTypeLabel(ride)}</span>
                            <span>&middot;</span>
                            <span>{getAssistanceLabel(ride.patientId)}</span>
                            <span>&middot;</span>
                            <span>{ride.vehicleType}</span>
                          </div>

                          {ride.driverName && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                              </svg>
                              <span>{ride.driverName}</span>
                            </div>
                          )}

                          {/* Driver action buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {action && (
                              <button
                                onClick={() => advanceStatus(ride)}
                                className="px-3 py-3 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transition-colors cursor-pointer col-span-2"
                              >
                                {action.label}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setIssueRide(ride);
                                setShowIssueForm(true);
                              }}
                              className="px-3 py-2.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              Report Issue
                            </button>
                            <button
                              onClick={() => setSelectedRide(ride)}
                              className="px-3 py-2.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              Trip Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== ASSIGNED TRIPS TAB ===== */}
      {tab === 'trips' && (
        <div className="space-y-5">

          {/* Guided Demo Scenario — Trip Status Card */}
          {isGuidedDemo && demo && (
            <>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                This is a sample interactive demo using fictional patient data.
              </div>

              <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{DEMO_PATIENT.firstName} {DEMO_PATIENT.lastName}</p>
                      <p className="text-xs text-gray-500">{DEMO_RIDE_INFO.driverName} &middot; {DEMO_RIDE_INFO.rideType}</p>
                    </div>
                  </div>
                  <DemoStatusBadge status={demo.status} />
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-14 shrink-0">Pickup</span>
                    <span className="font-medium">{formatTime(DEMO_RIDE_INFO.pickupTime)}</span>
                    <span className="text-gray-300">&middot;</span>
                    <span className="truncate">{DEMO_PATIENT.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-14 shrink-0">Clinic</span>
                    <span className="truncate">{DEMO_CLINIC_INFO.name}, {DEMO_CLINIC_INFO.address.split(',')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-14 shrink-0">Chair</span>
                    <span className="font-medium">{formatTime(DEMO_RIDE_INFO.chairTime)}</span>
                    <span className="text-gray-300">&middot;</span>
                    <span>{DEMO_RIDE_INFO.assistance}</span>
                  </div>
                </div>

                {/* Action buttons (same logic as dispatch card) */}
                {(demo.status === 'driver_en_route_to_patient' || demo.status === 'readiness_prompt_sent' || demo.status === 'patient_ready' || demo.status === 'patient_needs_help' || demo.status === 'patient_not_ready') && (
                  <div className="flex items-center gap-2">
                    {demo.status === 'driver_en_route_to_patient' && (
                      <button
                        onClick={() => demo.sendReadinessPrompt()}
                        className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                      >
                        Send Readiness Check
                      </button>
                    )}
                    <button
                      onClick={() => demo.driverArrived()}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                    >
                      Arrived
                    </button>
                    <button
                      onClick={() => demo.pickupFailed()}
                      className="px-3 py-2 rounded-xl text-xs font-medium bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Unable to Pick Up
                    </button>
                  </div>
                )}

                {demo.status === 'driver_arrived' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => demo.patientPickedUp()}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                    >
                      Patient Onboard
                    </button>
                    <button
                      onClick={() => demo.pickupFailed()}
                      className="px-3 py-2 rounded-xl text-xs font-medium bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Unable to Pick Up
                    </button>
                  </div>
                )}

                {demo.status === 'en_route_to_clinic' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => demo.arrivedAtClinic()}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                    >
                      Arrived at Clinic
                    </button>
                  </div>
                )}

                {/* Terminal status message */}
                {(isDemoTerminalStatus(demo.status) || demo.status === 'arrived_at_clinic') && (
                  <div className={cn(
                    'rounded-lg px-3 py-2 text-xs font-medium',
                    isDemoErrorStatus(demo.status) ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700',
                  )}>
                    {demoStatusLabels[demo.status]}
                  </div>
                )}

                {/* Reset Demo */}
                <div>
                  <button
                    onClick={() => demo.resetDemoScenario()}
                    className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors cursor-pointer"
                  >
                    Reset Demo
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <h1 className="text-lg font-semibold text-gray-900">Assigned Trips</h1>
            <p className="text-sm text-gray-500 mt-0.5">{assignedTrips.length} trips with drivers en route or on-site</p>
          </div>

          {assignedTrips.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No active driver assignments right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedTrips
                .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime())
                .map(ride => {
                  const status = getStatus(ride.id);
                  const action = getNextAction(status, ride.direction);
                  return (
                    <div key={ride.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-base font-semibold text-gray-900">{patientLabel(ride.patientId)}</p>
                            <p className="text-xs text-gray-500">{ride.driverName} &middot; {ride.vehicleType}</p>
                          </div>
                        </div>
                        <StatusPill status={status} />
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 w-14 shrink-0">Pickup</span>
                          <span className="font-medium">{formatTime(ride.pickupTime)}</span>
                          <span className="text-gray-300">&middot;</span>
                          <span className="truncate">{ride.pickupAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 w-14 shrink-0">Dropoff</span>
                          <span className="truncate">{ride.dropoffAddress}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {action && (
                          <button
                            onClick={() => advanceStatus(ride)}
                            className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                          >
                            {action.label}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedRide(ride)}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ===== DRIVERS TAB ===== */}
      {tab === 'drivers' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Drivers</h1>
            <p className="text-sm text-gray-500 mt-0.5">{vendor.name} fleet status</p>
          </div>

          {/* Driver status summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Available', count: driverPool.filter(d => d.status === 'available').length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'On Trip', count: driverPool.filter(d => d.status === 'on-trip').length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Off Duty', count: driverPool.filter(d => d.status === 'off-duty').length, color: 'bg-gray-50 text-gray-600 border-gray-200' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-xl border p-3 text-center', s.color)}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Driver list */}
          <div className="space-y-3">
            {driverPool.map(driver => (
              <div key={driver.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-sm font-bold',
                  driver.status === 'available' && 'bg-emerald-100 text-emerald-700',
                  driver.status === 'on-trip' && 'bg-amber-100 text-amber-700',
                  driver.status === 'off-duty' && 'bg-gray-100 text-gray-500',
                )}>
                  {driver.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{driver.name}</p>
                  <p className="text-xs text-gray-500">{driver.vehicle} &middot; {driver.phone}</p>
                </div>
                <Badge variant={
                  driver.status === 'available' ? 'success' :
                  driver.status === 'on-trip' ? 'warning' : 'neutral'
                }>
                  {driver.status === 'available' ? 'Available' :
                   driver.status === 'on-trip' ? 'On Trip' : 'Off Duty'}
                </Badge>
              </div>
            ))}
          </div>

          {/* Fleet info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Fleet Performance</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{vendor.onTimeRate}%</p>
                <p className="text-xs text-gray-500 mt-0.5">On-Time Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{vendor.averageDelayMinutes}m</p>
                <p className="text-xs text-gray-500 mt-0.5">Avg Delay</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{vendor.cancellationRate}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Cancel Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ISSUES TAB ===== */}
      {tab === 'issues' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Report an Issue</h1>
            <p className="text-sm text-gray-500 mt-0.5">Select a trip, then report the issue type</p>
          </div>

          {/* Issue types */}
          <div className="space-y-2">
            {issueTypes.map(issue => (
              <button
                key={issue.id}
                onClick={() => {
                  // Find first active ride to attach issue to
                  const target = dispatchRides[0] || vendorRides[0];
                  if (target) {
                    setShowIssueReport({ ride: target, issueType: issue.id });
                  }
                }}
                className="flex items-center gap-4 w-full rounded-xl p-4 bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors text-left cursor-pointer"
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', issue.color)}>
                  {issue.icon === 'clock' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                  {issue.icon === 'x' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                  {issue.icon === 'map' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  )}
                  {issue.icon === 'truck' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />
                    </svg>
                  )}
                  {issue.icon === 'alert' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  )}
                  {issue.icon === 'people' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  )}
                  {issue.icon === 'lock' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{issue.label}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>

          {/* Active issues */}
          {issueRides.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Issues ({issueRides.length})</h3>
              <div className="space-y-2">
                {issueRides.map(ride => (
                  <div key={ride.id} className="bg-red-50 rounded-xl border border-red-200 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-red-800">{patientLabel(ride.patientId)}</span>
                      <Badge variant="danger">{ride.issueType?.replace(/_/g, ' ') || 'Issue'}</Badge>
                    </div>
                    <p className="text-xs text-red-700">{ride.notes}</p>
                    <p className="text-xs text-red-400 mt-1">{formatTime(ride.pickupTime)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== COMPLETED TAB ===== */}
      {tab === 'completed' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Completed Trips</h1>
            <p className="text-sm text-gray-500 mt-0.5">{completedRides.length} trips completed today</p>
          </div>

          {completedRides.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No completed trips yet today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedRides.map(ride => (
                <div key={ride.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{patientLabel(ride.patientId)}</p>
                        <p className="text-xs text-gray-500">{ride.driverName} &middot; {ride.vehicleType}</p>
                      </div>
                    </div>
                    <StatusPill status={getStatus(ride.id)} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 pl-11">
                    <span>Pickup: {formatTime(ride.pickupTime)}</span>
                    {ride.actualPickupTime && <span>Actual: {formatTime(ride.actualPickupTime)}</span>}
                    <span className="text-gray-300">&middot;</span>
                    <span>{ride.direction === 'to-clinic' ? 'To clinic' : 'To home'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Trip Detail Modal */}
      <Modal open={selectedRide !== null} onClose={() => setSelectedRide(null)} title="Trip Details" wide>
        {selectedRide && (() => {
          const status = getStatus(selectedRide.id);
          const action = getNextAction(status, selectedRide.direction);
          return (
            <div className="space-y-4">
              <RideDetail ride={selectedRide} viewerRole="vendor" statusOverride={status} />
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {action && (
                  <button
                    onClick={() => {
                      advanceStatus(selectedRide);
                      setSelectedRide(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                  >
                    {action.label}
                  </button>
                )}
                <button
                  onClick={() => {
                    setIssueRide(selectedRide);
                    setShowIssueForm(true);
                    setSelectedRide(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Report Issue
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Assign Driver Modal */}
      <Modal open={showAssignDriver !== null} onClose={() => setShowAssignDriver(null)} title="Assign Driver">
        {showAssignDriver && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Select a driver for {patientLabel(showAssignDriver.patientId)}'s trip at {formatTime(showAssignDriver.pickupTime)}.
            </p>
            <div className="space-y-2">
              {driverPool
                .filter(d => d.status === 'available')
                .map(driver => (
                  <button
                    key={driver.id}
                    onClick={() => {
                      setRideStates(prev => ({ ...prev, [showAssignDriver.id]: 'driver_assigned' }));
                      addToast(`${driver.name} assigned to ${patientLabel(showAssignDriver.patientId)}`);
                      addAuditLogEntry({ actorRole: 'vendor', actorName: vendor.name, action: 'driver_assigned', target: `${patientLabel(showAssignDriver.patientId)} (${showAssignDriver.id})`, details: `${driver.name} assigned with ${driver.vehicle}` });
                      setShowAssignDriver(null);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                      <p className="text-xs text-gray-500">{driver.vehicle}</p>
                    </div>
                    <Badge variant="success">Available</Badge>
                  </button>
                ))}
              {driverPool.filter(d => d.status === 'available').length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No available drivers</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Issue Report Modal (from dispatch/trips) */}
      <Modal open={showIssueForm && issueRide !== null} onClose={() => { setShowIssueForm(false); setIssueRide(null); }} title="Report Issue">
        {issueRide && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Report an issue for {patientLabel(issueRide.patientId)}'s trip.
            </p>
            <div className="space-y-2">
              {issueTypes.map(issue => (
                <button
                  key={issue.id}
                  onClick={() => {
                    addToast(`Issue reported: ${issue.label} for ${patientLabel(issueRide.patientId)}`, 'warning');
                    addNotification({ recipientRole: 'clinic', patientId: issueRide.patientId, title: 'Vendor Issue Report', message: `${vendor.name} reported: ${issue.label} for ${patientLabel(issueRide.patientId)}.`, severity: 'warning' });
                    addAuditLogEntry({ actorRole: 'vendor', actorName: vendor.name, action: 'issue_reported', target: `${patientLabel(issueRide.patientId)} (${issueRide.id})`, details: `Vendor reported issue: ${issue.label}` });
                    setShowIssueForm(false);
                    setIssueRide(null);
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors cursor-pointer text-left"
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', issue.color)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{issue.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Issue Report Modal (from issues tab) */}
      <Modal open={showIssueReport !== null} onClose={() => setShowIssueReport(null)} title="Confirm Issue Report">
        {showIssueReport && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Report <span className="font-semibold">{issueTypes.find(i => i.id === showIssueReport.issueType)?.label}</span> for{' '}
              <span className="font-semibold">{patientLabel(showIssueReport.ride.patientId)}</span>'s trip?
            </p>
            <p className="text-xs text-gray-500">The clinic will be notified of this issue.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowIssueReport(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const label = issueTypes.find(i => i.id === showIssueReport.issueType)?.label;
                  addToast(`Issue reported: ${label}. Clinic has been notified.`, 'warning');
                  addNotification({ recipientRole: 'clinic', patientId: showIssueReport.ride.patientId, title: 'Vendor Issue Report', message: `${vendor.name} reported: ${label} for ${patientLabel(showIssueReport.ride.patientId)}.`, severity: 'warning' });
                  addAuditLogEntry({ actorRole: 'vendor', actorName: vendor.name, action: 'issue_reported', target: `${patientLabel(showIssueReport.ride.patientId)}`, details: `Vendor reported issue: ${label}` });
                  setShowIssueReport(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer"
              >
                Report Issue
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
