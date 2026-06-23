import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { patients, caregivers, clinic, rides, standingOrders, vendors } from '../data/mock';
import { formatTime } from '../utils/helpers';
import { StatusPill } from '../components/StatusPill';
import { Modal } from '../components/Modal';
import { RideDetail } from '../components/RideDetail';
import { cn } from '../utils/cn';
import { useNotifications } from '../data/NotificationContext';
import { useRole } from '../data/RoleContext';
import type { RideStatus } from '../types';
import {
  useDemoScenario,
  DemoStatusBadge,
  demoTimelineSteps,
  getDemoStepIndex,
  isDemoErrorStatus,
  DEMO_PATIENT,
  DEMO_CLINIC_INFO,
  DEMO_RIDE_INFO,
} from '../data/DemoScenarioContext';

const caregiver = caregivers[0]; // Carlos Santos
const patient = patients.find(p => p.id === caregiver.patientId)!;
const patientRides = rides.filter(r => r.patientId === patient.id);
const toClinicRide = patientRides.find(r => r.direction === 'to-clinic' && r.status !== 'completed' && r.status !== 'canceled')!;
const returnRide = patientRides.find(r => r.direction === 'from-clinic')!;
const order = standingOrders.find(so => so.patientId === patient.id)!;
const rideVendor = vendors.find(v => v.id === toClinicRide.vendorId)!;

type Tab = 'status' | 'alerts' | 'schedule' | 'help';

function tabFromPath(path: string): Tab {
  if (path.endsWith('/alerts')) return 'alerts';
  if (path.endsWith('/schedule')) return 'schedule';
  if (path.endsWith('/help')) return 'help';
  return 'status';
}

const timelineSteps = [
  { key: 'scheduled', label: 'Ride Scheduled' },
  { key: 'picked_up', label: 'Patient Picked Up' },
  { key: 'arrived_at_clinic', label: 'Arrived at Dialysis' },
  { key: 'in_treatment', label: 'Treatment in Progress' },
  { key: 'ready_for_return', label: 'Ready for Return' },
  { key: 'returning_home', label: 'On the Way Home' },
  { key: 'arrived_home', label: 'Arrived Home' },
];

function getStepIndex(status: RideStatus): number {
  const map: Record<string, number> = {
    scheduled: 0, driver_assigned: 0, driver_en_route: 0, driver_arrived: 0,
    picked_up: 1, arrived_at_clinic: 2, in_treatment: 3,
    ready_for_return: 4, return_assigned: 4, returning_home: 5,
    arrived_home: 6, completed: 6,
  };
  return map[status] ?? 0;
}

interface Toast { id: number; message: string; type: 'success' | 'info' | 'warning' }

interface Alert {
  id: string;
  type: 'ride_scheduled' | 'driver_assigned' | 'picked_up' | 'arrived_clinic' | 'return_requested' | 'on_way_home' | 'arrived_home' | 'delayed' | 'action_needed';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const dayFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildAlerts(): Alert[] {
  const alerts: Alert[] = [];
  const today = new Date();
  const atTime = (h: number, m: number) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  alerts.push({
    id: 'a1', type: 'ride_scheduled', title: 'Ride Scheduled',
    description: `${patient.firstName}'s ride to dialysis has been confirmed for today.`,
    time: atTime(4, 30), read: true,
  });
  alerts.push({
    id: 'a2', type: 'driver_assigned', title: 'Driver Assigned',
    description: `${toClinicRide.driverName} with ${toClinicRide.vehicleType} will pick up ${patient.firstName}.`,
    time: atTime(4, 45), read: true,
  });
  if (toClinicRide.actualPickupTime) {
    alerts.push({
      id: 'a3', type: 'picked_up', title: 'Patient Picked Up',
      description: `${patient.firstName} was picked up at ${formatTime(toClinicRide.actualPickupTime)}.`,
      time: toClinicRide.actualPickupTime, read: true,
    });
  }
  if (toClinicRide.actualDropoffTime) {
    alerts.push({
      id: 'a4', type: 'arrived_clinic', title: 'Arrived at Clinic',
      description: `${patient.firstName} arrived at ${clinic.name}.`,
      time: toClinicRide.actualDropoffTime, read: true,
    });
  }
  if (toClinicRide.status === 'in_treatment' || getStepIndex(toClinicRide.status) > 3) {
    alerts.push({
      id: 'a5', type: 'action_needed', title: 'Treatment in Progress',
      description: `${patient.firstName} is receiving treatment. Chair time started at ${formatTime(toClinicRide.chairTime)}.`,
      time: atTime(6, 0), read: false,
    });
  }
  if (returnRide.status === 'ready_for_return' || returnRide.status === 'return_assigned') {
    alerts.push({
      id: 'a6', type: 'return_requested', title: 'Return Ride Ready',
      description: `${patient.firstName}'s return ride is being coordinated. Estimated pickup: ${formatTime(returnRide.pickupTime)}.`,
      time: atTime(10, 15), read: false,
    });
  }
  return alerts.reverse();
}

const alertStyles: Record<Alert['type'], { bg: string; icon: string; iconBg: string }> = {
  ride_scheduled: { bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-600', iconBg: 'bg-blue-100' },
  driver_assigned: { bg: 'bg-brand-50 border-brand-200', icon: 'text-brand-600', iconBg: 'bg-brand-100' },
  picked_up: { bg: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  arrived_clinic: { bg: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  return_requested: { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-600', iconBg: 'bg-amber-100' },
  on_way_home: { bg: 'bg-brand-50 border-brand-200', icon: 'text-brand-600', iconBg: 'bg-brand-100' },
  arrived_home: { bg: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  delayed: { bg: 'bg-red-50 border-red-200', icon: 'text-red-600', iconBg: 'bg-red-100' },
  action_needed: { bg: 'bg-violet-50 border-violet-200', icon: 'text-violet-600', iconBg: 'bg-violet-100' },
};

export function CaregiverView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useRole();
  const tab = tabFromPath(location.pathname);
  const isDemo = location.pathname.startsWith('/demo');

  const { addNotification, addAuditLogEntry, addToast: addGlobalToast } = useNotifications();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [readyNotified, setReadyNotified] = useState(false);
  const [notGoingNotified, setNotGoingNotified] = useState(false);
  const [showCallClinic, setShowCallClinic] = useState(false);
  const [showCallSupport, setShowCallSupport] = useState(false);
  const [showPickupNote, setShowPickupNote] = useState(false);
  const [showRideDetail, setShowRideDetail] = useState(false);
  const [pickupNote, setPickupNote] = useState('');
  const [showNotGoingConfirm, setShowNotGoingConfirm] = useState(false);
  const [alerts] = useState<Alert[]>(buildAlerts);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts(prev => prev.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const currentStep = getStepIndex(toClinicRide.status);
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = `${dayFull[now.getDay()]}, ${monthFull[now.getMonth()]} ${now.getDate()}`;

  const base = isDemo ? '/demo/caregiver' : '/app/caregiver';
  const tabItems: { key: Tab; label: string; path: string }[] = [
    { key: 'status', label: 'Status', path: base },
    { key: 'alerts', label: 'Alerts', path: `${base}/alerts` },
    { key: 'schedule', label: 'Schedule', path: `${base}/schedule` },
    { key: 'help', label: 'Help', path: `${base}/help` },
  ];

  const unreadCount = alerts.filter(a => !a.read).length;

  function getUpcomingSessions(): { date: Date; dayLabel: string }[] {
    const sessions: { date: Date; dayLabel: string }[] = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    for (let i = 0; i < 14 && sessions.length < 6; i++) {
      const dayName = dayAbbr[d.getDay()];
      if (order.daysOfWeek.includes(dayName)) {
        sessions.push({
          date: new Date(d),
          dayLabel: `${dayFull[d.getDay()]}, ${monthFull[d.getMonth()]} ${d.getDate()}`,
        });
      }
      d.setDate(d.getDate() + 1);
    }
    return sessions;
  }

  function formatAlertTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <div className="max-w-lg mx-auto pb-4">
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
      <div className="flex rounded-2xl bg-white border border-gray-200 shadow-sm mb-6 overflow-hidden">
        {tabItems.map(t => (
          <button
            key={t.key}
            onClick={() => navigate(t.path)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-colors cursor-pointer relative',
              tab === t.key
                ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            {t.key === 'status' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            )}
            {t.key === 'alerts' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            )}
            {t.key === 'schedule' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            )}
            {t.key === 'help' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
              </svg>
            )}
            {t.key === 'alerts' && unreadCount > 0 && (
              <span className="absolute top-1.5 right-1/4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            <span className="text-[13px]">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ===== STATUS TAB ===== */}
      {tab === 'status' && (
        <div className="space-y-5">
          {/* Demo Scenario Section */}
          {isDemo && <DemoScenarioSection />}

          {/* Greeting */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting}, {isDemo ? caregiver.name.split(' ')[0] : (user?.name?.split(' ')[0] ?? caregiver.name.split(' ')[0])}</h1>
            <p className="text-base text-gray-500 mt-1">{dateStr}</p>
          </div>

          {/* Patient Status Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-violet-600 px-5 py-3 flex items-center justify-between">
              <span className="text-white font-semibold text-base">{patient.firstName}'s Status</span>
              <StatusPill status={toClinicRide.status} />
            </div>
            <div className="p-5 space-y-4">
              {/* Patient info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-lg font-bold shrink-0">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{patient.firstName} {patient.lastName}</p>
                  <p className="text-sm text-gray-500">{clinic.name}</p>
                </div>
              </div>

              {/* Key info rows */}
              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-500">Today's pickup</span>
                  <span className="text-base font-semibold text-gray-900">{formatTime(toClinicRide.pickupTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-500">Chair time</span>
                  <span className="text-base font-semibold text-gray-900">{formatTime(toClinicRide.chairTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-500">Current status</span>
                  <StatusPill status={toClinicRide.status} />
                </div>
                {toClinicRide.actualPickupTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-500">Picked up at</span>
                    <span className="text-base font-medium text-emerald-600">{formatTime(toClinicRide.actualPickupTime)}</span>
                  </div>
                )}
                {toClinicRide.actualDropoffTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-500">Arrived at clinic</span>
                    <span className="text-base font-medium text-emerald-600">{formatTime(toClinicRide.actualDropoffTime)}</span>
                  </div>
                )}
              </div>

              {/* Return ride status */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-amber-800">Return Ride</span>
                  <StatusPill status={returnRide.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-amber-700">Estimated pickup</span>
                  <span className="text-sm font-medium text-amber-900">{formatTime(returnRide.pickupTime)}</span>
                </div>
                {returnRide.driverName && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700">Driver</span>
                    <span className="text-sm font-medium text-amber-900">{returnRide.driverName}</span>
                  </div>
                )}
              </div>

              {/* Last update */}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Last updated {formatTime(new Date().toISOString())}</span>
              </div>
            </div>
          </div>

          {/* Driver info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Driver Details</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-gray-900">{toClinicRide.driverName}</p>
                <p className="text-sm text-gray-500">{toClinicRide.vehicleType}</p>
                <p className="text-sm text-gray-500">{rideVendor.name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowRideDetail(true)}
              className="w-full text-center text-sm text-violet-600 font-medium hover:text-violet-700 pt-3 mt-3 border-t border-gray-100 cursor-pointer"
            >
              View full ride details
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{patient.firstName}'s Journey</h3>
            <div className="space-y-0">
              {timelineSteps.map((step, i) => {
                const isCompleted = i < currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2',
                        isCompleted && 'bg-emerald-500 border-emerald-500',
                        isCurrent && 'bg-violet-500 border-violet-500',
                        !isCompleted && !isCurrent && 'bg-white border-gray-300',
                      )}>
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : isCurrent ? (
                          <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        )}
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className={cn(
                          'w-0.5 h-7',
                          i < currentStep ? 'bg-emerald-500' : 'bg-gray-200',
                        )} />
                      )}
                    </div>
                    <div className={cn(
                      'pt-1 pb-3',
                      isCurrent && 'font-semibold text-violet-700',
                      isCompleted && 'text-gray-600',
                      !isCompleted && !isCurrent && 'text-gray-400',
                    )}>
                      <p className="text-sm leading-tight">{step.label}</p>
                      {step.key === 'picked_up' && toClinicRide.actualPickupTime && isCompleted && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(toClinicRide.actualPickupTime)}</p>
                      )}
                      {step.key === 'arrived_at_clinic' && toClinicRide.actualDropoffTime && isCompleted && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(toClinicRide.actualDropoffTime)}</p>
                      )}
                      {step.key === 'in_treatment' && isCurrent && (
                        <p className="text-xs text-violet-500 mt-0.5">Since {formatTime(toClinicRide.chairTime)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== ALERTS TAB ===== */}
      {tab === 'alerts' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
            <p className="text-base text-gray-500 mt-1">Updates about {patient.firstName}'s rides</p>
          </div>

          {/* Demo Notifications in Alerts */}
          {isDemo && <DemoAlertsSection />}

          {alerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </div>
              <p className="text-base font-medium text-gray-500">No alerts today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => {
                const style = alertStyles[alert.type];
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'rounded-2xl border p-4 transition-colors',
                      style.bg,
                      !alert.read && 'ring-2 ring-violet-300',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', style.iconBg)}>
                        {(alert.type === 'ride_scheduled' || alert.type === 'driver_assigned') && (
                          <svg className={cn('w-5 h-5', style.icon)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />
                          </svg>
                        )}
                        {(alert.type === 'picked_up' || alert.type === 'arrived_clinic' || alert.type === 'arrived_home') && (
                          <svg className={cn('w-5 h-5', style.icon)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        )}
                        {alert.type === 'return_requested' && (
                          <svg className={cn('w-5 h-5', style.icon)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                          </svg>
                        )}
                        {alert.type === 'on_way_home' && (
                          <svg className={cn('w-5 h-5', style.icon)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                          </svg>
                        )}
                        {alert.type === 'delayed' && (
                          <svg className={cn('w-5 h-5', style.icon)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                          </svg>
                        )}
                        {alert.type === 'action_needed' && (
                          <svg className={cn('w-5 h-5', style.icon)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-base font-semibold text-gray-900">{alert.title}</p>
                          {!alert.read && (
                            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{alert.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatAlertTime(alert.time)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notification preference */}
          <div className="bg-violet-50 rounded-2xl border border-violet-200 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-sm text-violet-800">
                <span className="font-semibold">Notifications:</span> You receive alerts via{' '}
                {caregiver.notificationPreference === 'both' ? 'SMS and email' :
                  caregiver.notificationPreference === 'sms' ? 'SMS' :
                  caregiver.notificationPreference === 'email' ? 'email' : 'none'}.
                Contact your clinic to change preferences.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== SCHEDULE TAB ===== */}
      {tab === 'schedule' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.firstName}'s Schedule</h1>
            <p className="text-base text-gray-500 mt-1">Recurring dialysis transportation</p>
          </div>

          {/* Treatment days */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Treatment Days</h3>
            <div className="flex gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div
                  key={d}
                  className={cn(
                    'flex-1 text-center py-3 rounded-xl text-sm font-semibold',
                    order.daysOfWeek.includes(d)
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-400',
                  )}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-2">
              <InfoRow label="Pickup time" value={formatTime(order.pickupTime)} />
              <InfoRow label="Chair time" value={formatTime(order.chairTime)} />
              <InfoRow label="Clinic" value={clinic.name} />
              <InfoRow label="Vehicle" value={toClinicRide.vehicleType} />
              <InfoRow label="Ride service" value={rideVendor.name} />
              <InfoRow label="Return mode" value={
                order.returnMode === 'scheduled' ? 'Scheduled return' :
                order.returnMode === 'will-call' ? 'Will-call' : 'Clinic-triggered'
              } />
            </div>
          </div>

          {/* Upcoming sessions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
            <div className="space-y-0">
              {getUpcomingSessions().map((s, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">{s.dayLabel}</p>
                    <p className="text-sm text-gray-500">Pickup {formatTime(order.pickupTime)} &middot; Chair {formatTime(order.chairTime)}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Patient info summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Patient Details</h3>
            <InfoRow label="Name" value={`${patient.firstName} ${patient.lastName}`} />
            <InfoRow label="Mobility" value={patient.mobilityLevel === 'wheelchair' ? 'Wheelchair' : patient.mobilityLevel === 'stretcher' ? 'Stretcher' : 'Ambulatory'} />
            <InfoRow label="Assistance" value={patient.assistanceLevel === 'door-through-door' ? 'Door-through-door' : patient.assistanceLevel === 'door-to-door' ? 'Door-to-door' : 'Independent'} />
            {patient.notes && <InfoRow label="Notes" value={patient.notes} />}
          </div>
        </div>
      )}

      {/* ===== HELP TAB ===== */}
      {tab === 'help' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">How Can We Help?</h1>
            <p className="text-base text-gray-500 mt-1">Actions for {patient.firstName}'s ride</p>
          </div>

          <div className="space-y-3">
            {/* Confirm patient is ready */}
            <button
              onClick={() => {
                if (!readyNotified) {
                  setReadyNotified(true);
                  addToast(`${patient.firstName}'s clinic has been notified that she is ready for pickup.`);
                  addGlobalToast('Caregiver confirmed patient ready');
                  addNotification({ recipientRole: 'clinic', patientId: patient.id, title: 'Caregiver Confirmed Ready', message: `${caregiver.name} (${caregiver.relationship}) confirmed ${patient.firstName} ${patient.lastName} is ready for pickup.`, severity: 'info' });
                  addAuditLogEntry({ actorRole: 'caregiver', actorName: caregiver.name, action: 'caregiver_confirmed_ready', target: `${patient.firstName} ${patient.lastName[0]}.`, details: `Caregiver confirmed patient is ready for pickup` });
                }
              }}
              disabled={readyNotified}
              className={cn(
                'flex items-center gap-4 w-full rounded-2xl p-5 border-2 transition-colors text-left cursor-pointer',
                readyNotified
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50/50',
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                readyNotified ? 'bg-emerald-100' : 'bg-emerald-100',
              )}>
                <svg className={cn('w-6 h-6', readyNotified ? 'text-emerald-600' : 'text-emerald-600')} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900">
                  {readyNotified ? 'Clinic Notified — Patient Ready' : 'Confirm Patient is Ready'}
                </span>
                <p className="text-sm text-gray-500 mt-0.5">
                  {readyNotified ? 'The clinic knows to expect pickup' : `Let the clinic know ${patient.firstName} is ready`}
                </p>
              </div>
              {!readyNotified && (
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </button>

            {/* Report patient is not going today */}
            <button
              onClick={() => {
                if (!notGoingNotified) setShowNotGoingConfirm(true);
              }}
              disabled={notGoingNotified}
              className={cn(
                'flex items-center gap-4 w-full rounded-2xl p-5 border-2 transition-colors text-left cursor-pointer',
                notGoingNotified
                  ? 'bg-gray-50 border-gray-300'
                  : 'bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50/50',
              )}
            >
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', notGoingNotified ? 'bg-gray-100' : 'bg-red-100')}>
                <svg className={cn('w-6 h-6', notGoingNotified ? 'text-gray-500' : 'text-red-600')} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900">
                  {notGoingNotified ? 'Ride Canceled for Today' : 'Patient is Not Going Today'}
                </span>
                <p className="text-sm text-gray-500 mt-0.5">
                  {notGoingNotified ? 'Clinic and ride service were notified' : 'Cancel today\'s ride and notify the clinic'}
                </p>
              </div>
              {!notGoingNotified && (
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </button>

            {/* Contact Clinic */}
            <button
              onClick={() => setShowCallClinic(true)}
              className="flex items-center gap-4 w-full rounded-2xl p-5 bg-white border-2 border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-colors text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900">Contact Clinic</span>
                <p className="text-sm text-gray-500 mt-0.5">Call {clinic.name}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Contact Ride Support */}
            <button
              onClick={() => setShowCallSupport(true)}
              className="flex items-center gap-4 w-full rounded-2xl p-5 bg-white border-2 border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-colors text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900">Contact Ride Support</span>
                <p className="text-sm text-gray-500 mt-0.5">Call {rideVendor.name}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Update temporary pickup note */}
            <button
              onClick={() => setShowPickupNote(true)}
              className="flex items-center gap-4 w-full rounded-2xl p-5 bg-white border-2 border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-colors text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900">Update Pickup Note</span>
                <p className="text-sm text-gray-500 mt-0.5">Add a temporary note for the driver</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Reassurance message */}
          <div className="bg-violet-50 rounded-2xl border border-violet-200 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <p className="text-sm text-violet-800">
                <span className="font-semibold">You're doing great.</span>{' '}
                We'll keep you updated on {patient.firstName}'s ride status. If anything needs attention, you'll see an alert right away.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Ride Detail Modal */}
      <Modal open={showRideDetail} onClose={() => setShowRideDetail(false)} title="Ride Details" wide>
        <RideDetail ride={toClinicRide} viewerRole="caregiver" />
      </Modal>

      {/* Call Clinic Modal */}
      <Modal open={showCallClinic} onClose={() => setShowCallClinic(false)} title="Call Clinic">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{clinic.name}</h3>
            <p className="text-2xl font-bold text-blue-600">{clinic.phone}</p>
            <p className="text-sm text-gray-500">Staff contact: {clinic.staffContact}</p>
          </div>
          <a
            href={`tel:${clinic.phone.replace(/\D/g, '')}`}
            className="block w-full text-center px-4 py-4 rounded-xl bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Call Now
          </a>
          <button
            onClick={() => setShowCallClinic(false)}
            className="block w-full text-center px-4 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Call Ride Support Modal */}
      <Modal open={showCallSupport} onClose={() => setShowCallSupport(false)} title="Call Ride Support">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{rideVendor.name}</h3>
            <p className="text-2xl font-bold text-gray-700">{rideVendor.phone}</p>
            <p className="text-sm text-gray-500">Your ride service provider</p>
          </div>
          <a
            href={`tel:${rideVendor.phone.replace(/\D/g, '')}`}
            className="block w-full text-center px-4 py-4 rounded-xl bg-gray-800 text-white text-lg font-semibold hover:bg-gray-900 transition-colors"
          >
            Call Now
          </a>
          <button
            onClick={() => setShowCallSupport(false)}
            className="block w-full text-center px-4 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Not Going Confirm Modal */}
      <Modal open={showNotGoingConfirm} onClose={() => setShowNotGoingConfirm(false)} title="Cancel Today's Ride">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-base text-amber-800">
              Are you sure <span className="font-semibold">{patient.firstName}</span> is not going to dialysis today? This will cancel today's ride and notify the clinic.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowNotGoingConfirm(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                setNotGoingNotified(true);
                setShowNotGoingConfirm(false);
                addToast(`Today's ride for ${patient.firstName} has been canceled. Clinic and ride service notified.`, 'warning');
                addNotification({ recipientRole: 'clinic', patientId: patient.id, title: 'Ride Canceled by Caregiver', message: `${caregiver.name} canceled today's ride for ${patient.firstName} ${patient.lastName}.`, severity: 'warning' });
                addNotification({ recipientRole: 'vendor', patientId: patient.id, title: 'Ride Canceled', message: `Today's ride for ${patient.firstName} ${patient.lastName[0]}. has been canceled by caregiver.`, severity: 'warning' });
                addAuditLogEntry({ actorRole: 'caregiver', actorName: caregiver.name, action: 'ride_canceled', target: `${patient.firstName} ${patient.lastName[0]}.`, details: `Caregiver canceled today's ride — clinic and vendor notified` });
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-base font-medium hover:bg-red-700 transition-colors cursor-pointer"
            >
              Cancel Ride
            </button>
          </div>
        </div>
      </Modal>

      {/* Pickup Note Modal */}
      <Modal open={showPickupNote} onClose={() => setShowPickupNote(false)} title="Temporary Pickup Note">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Add a note for {patient.firstName}'s driver. This note will apply to the next ride only.
          </p>
          <textarea
            value={pickupNote}
            onChange={(e) => setPickupNote(e.target.value)}
            placeholder={`e.g., "Use side entrance today" or "Patient will be 10 minutes late"`}
            rows={3}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowPickupNote(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (pickupNote.trim()) {
                  addToast('Pickup note saved. The driver will see it on the next ride.');
                } else {
                  addToast('Pickup note cleared.', 'info');
                }
                setShowPickupNote(false);
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-violet-600 text-white text-base font-medium hover:bg-violet-700 transition-colors cursor-pointer"
            >
              Save Note
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ===== Demo Scenario Components ===== */

const demoSeverityStyles: Record<string, { bg: string; border: string; icon: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' },
};

function DemoScenarioSection() {
  const { status, notifications, riskLevel, resetDemoScenario } = useDemoScenario();
  const demoStep = getDemoStepIndex(status);
  const isError = isDemoErrorStatus(status);

  const caregiverNotifs = notifications
    .filter(n => n.recipientRole === 'caregiver')
    .slice(0, 5);

  return (
    <>
      {/* Demo Banner */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
        <p className="text-sm text-violet-700 text-center font-medium">
          This is a sample interactive demo using fictional patient data.
        </p>
      </div>

      {/* Mary Johnson Status Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-violet-600 px-5 py-3 flex items-center justify-between">
          <span className="text-white font-semibold text-base">{DEMO_PATIENT.name}'s Ride</span>
          <DemoStatusBadge status={status} />
        </div>
        <div className="p-5 space-y-4">
          {/* Info rows */}
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Pickup</span>
              <span className="text-sm font-semibold text-gray-900">{formatTime(DEMO_RIDE_INFO.pickupTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Clinic</span>
              <span className="text-sm font-semibold text-gray-900">{DEMO_CLINIC_INFO.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Chair</span>
              <span className="text-sm font-semibold text-gray-900">{formatTime(DEMO_RIDE_INFO.chairTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Driver</span>
              <span className="text-sm font-semibold text-gray-900">{DEMO_RIDE_INFO.driverName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Vehicle</span>
              <span className="text-sm font-semibold text-gray-900">{DEMO_RIDE_INFO.rideType}</span>
            </div>
          </div>

          {/* Risk level badge */}
          {(riskLevel === 'medium' || riskLevel === 'high') && (
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold',
              riskLevel === 'medium' && 'bg-amber-100 text-amber-800',
              riskLevel === 'high' && 'bg-red-100 text-red-800',
            )}>
              <span className={cn(
                'w-2 h-2 rounded-full',
                riskLevel === 'medium' && 'bg-amber-500',
                riskLevel === 'high' && 'bg-red-500',
              )} />
              {riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
            </div>
          )}
        </div>
      </div>

      {/* Demo Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{DEMO_PATIENT.firstName}'s Journey</h3>
        <div className="space-y-0">
          {demoTimelineSteps.map((step, i) => {
            const isCompleted = i <= 1 || i < demoStep;
            const isCurrent = i === demoStep;
            const isErrorStep = isCurrent && isError;
            return (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2',
                    isErrorStep && 'bg-red-500 border-red-500',
                    !isErrorStep && isCompleted && 'bg-emerald-500 border-emerald-500',
                    !isErrorStep && isCurrent && 'bg-violet-500 border-violet-500',
                    !isErrorStep && !isCompleted && !isCurrent && 'bg-white border-gray-300',
                  )}>
                    {isErrorStep ? (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    ) : isCompleted ? (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : isCurrent ? (
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  {i < demoTimelineSteps.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-7',
                      (i <= 1 || i < demoStep) ? 'bg-emerald-500' : 'bg-gray-200',
                    )} />
                  )}
                </div>
                <div className={cn(
                  'pt-1 pb-3',
                  isErrorStep && 'font-semibold text-red-700',
                  !isErrorStep && isCurrent && 'font-semibold text-violet-700',
                  !isErrorStep && isCompleted && 'text-gray-600',
                  !isErrorStep && !isCompleted && !isCurrent && 'text-gray-400',
                )}>
                  <p className="text-sm leading-tight">{step.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Updates (Notifications) */}
      {caregiverNotifs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Updates</h3>
          <div className="space-y-3">
            {caregiverNotifs.map(notif => {
              const style = demoSeverityStyles[notif.severity] ?? demoSeverityStyles.info;
              return (
                <div
                  key={notif.id}
                  className={cn('rounded-xl border p-3', style.bg, style.border)}
                >
                  <p className={cn('text-sm font-semibold', style.icon)}>{notif.title}</p>
                  <p className="text-sm text-gray-700 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(notif.timestamp)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset Demo */}
      <div className="text-center">
        <button
          onClick={resetDemoScenario}
          className="text-sm text-violet-600 hover:text-violet-800 font-medium underline underline-offset-2 cursor-pointer"
        >
          Reset Demo
        </button>
      </div>
    </>
  );
}

function DemoAlertsSection() {
  const { notifications } = useDemoScenario();

  const caregiverNotifs = notifications
    .filter(n => n.recipientRole === 'caregiver')
    .slice(0, 5);

  if (caregiverNotifs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-violet-700">Demo Notifications</h2>
      {caregiverNotifs.map(notif => {
        const style = demoSeverityStyles[notif.severity] ?? demoSeverityStyles.info;
        return (
          <div
            key={notif.id}
            className={cn('rounded-2xl border p-4', style.bg, style.border)}
          >
            <div className="flex items-start gap-3">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                notif.severity === 'info' && 'bg-blue-100',
                notif.severity === 'success' && 'bg-emerald-100',
                notif.severity === 'warning' && 'bg-amber-100',
                notif.severity === 'critical' && 'bg-red-100',
              )}>
                {notif.severity === 'info' && (
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                )}
                {notif.severity === 'success' && (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                )}
                {notif.severity === 'warning' && (
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                )}
                {notif.severity === 'critical' && (
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900">{notif.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTime(notif.timestamp)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-base text-gray-500 shrink-0">{label}</span>
      <span className="text-base font-medium text-gray-900 text-right ml-4">{value}</span>
    </div>
  );
}
