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
import { useDemoScenario, DemoStatusBadge, demoTimelineSteps, getDemoStepIndex, isDemoErrorStatus, DEMO_PATIENT, DEMO_CLINIC_INFO, DEMO_RIDE_INFO } from '../data/DemoScenarioContext';
import { GuidedDemoAssistant, GuidedActionHighlight } from '../components/GuidedDemoAssistant';
import type { RideStatus } from '../types';

const patient = patients[0];
const caregiver = caregivers.find(c => c.patientId === patient.id)!;
const patientRides = rides.filter(r => r.patientId === patient.id);
const toClinicRide = patientRides.find(r => r.direction === 'to-clinic' && r.status !== 'completed' && r.status !== 'canceled')!;
const returnRide = patientRides.find(r => r.direction === 'from-clinic')!;
const order = standingOrders.find(so => so.patientId === patient.id)!;
const rideVendor = vendors.find(v => v.id === toClinicRide.vendorId)!;

type Tab = 'today' | 'schedule' | 'help' | 'profile';

function tabFromPath(path: string): Tab {
  if (path.endsWith('/schedule')) return 'schedule';
  if (path.endsWith('/help')) return 'help';
  if (path.endsWith('/profile')) return 'profile';
  return 'today';
}

const timelineSteps = [
  { key: 'scheduled', label: 'Ride Scheduled' },
  { key: 'driver_assigned', label: 'Driver Assigned' },
  { key: 'driver_en_route', label: 'Driver On the Way' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'arrived_at_clinic', label: 'At the Clinic' },
  { key: 'in_treatment', label: 'In Treatment' },
  { key: 'ready_for_return', label: 'Ready to Go Home' },
  { key: 'returning_home', label: 'Heading Home' },
  { key: 'arrived_home', label: 'Home Safe' },
];

function getStepIndex(status: RideStatus): number {
  const map: Record<string, number> = {
    scheduled: 0, driver_assigned: 1, driver_en_route: 2, driver_arrived: 2,
    picked_up: 3, arrived_at_clinic: 4, in_treatment: 5,
    ready_for_return: 6, return_assigned: 6, returning_home: 7,
    arrived_home: 8, completed: 8,
  };
  return map[status] ?? 0;
}

interface Toast { id: number; message: string; type: 'success' | 'info' | 'warning' }

const dayFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const helpIssues = [
  { id: 'late', label: 'My ride is late', response: "We've notified your ride service. They will contact you shortly.", color: 'bg-amber-100 text-amber-700' },
  { id: 'find-driver', label: 'I cannot find my driver', response: "We've contacted your driver. Check your phone for updates.", color: 'bg-blue-100 text-blue-700' },
  { id: 'not-ready', label: 'I am not ready yet', response: 'Your clinic has been notified. Take your time.', color: 'bg-purple-100 text-purple-700' },
  { id: 'wheelchair', label: 'I need wheelchair help', response: 'Wheelchair assistance has been requested. Someone will be with you shortly.', color: 'bg-teal-100 text-teal-700' },
  { id: 'cancel', label: 'I need to cancel today', response: "Your ride for today has been canceled. Your clinic has been notified.", color: 'bg-gray-100 text-gray-700' },
  { id: 'unwell', label: 'I feel unwell', response: '', color: 'bg-red-100 text-red-700' },
];

const mobilityLabels: Record<string, string> = { ambulatory: 'Can walk', wheelchair: 'Wheelchair', stretcher: 'Stretcher' };
const assistanceLabels: Record<string, string> = { independent: 'Independent', 'door-to-door': 'Door-to-door', 'door-through-door': 'Door-through-door' };

export function PatientView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useRole();
  const tab = tabFromPath(location.pathname);
  const isDemo = location.pathname.startsWith('/demo');
  const isGuidedDemo = location.pathname.startsWith('/demo/guided');

  const { addNotification, addAuditLogEntry, addToast } = useNotifications();
  const demo = useDemoScenario();
  const [readyNotified, setReadyNotified] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showUnwell, setShowUnwell] = useState(false);
  const [showCallClinic, setShowCallClinic] = useState(false);
  const [showCallSupport, setShowCallSupport] = useState(false);
  const [helpConfirm, setHelpConfirm] = useState<string | null>(null);
  const [showRideDetail, setShowRideDetail] = useState(false);

  const addLocalToast = (message: string, type: Toast['type'] = 'success') => {
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

  const base = isGuidedDemo ? '/demo/guided/patient' : isDemo ? '/demo/operations/patient' : '/app/patient';
  const tabItems: { key: Tab; label: string; path: string }[] = [
    { key: 'today', label: 'Today', path: base },
    { key: 'schedule', label: 'Schedule', path: `${base}/schedule` },
    { key: 'help', label: 'Help', path: `${base}/help` },
    { key: 'profile', label: 'Profile', path: `${base}/profile` },
  ];

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

      {/* Authenticated empty state — no real ride data yet */}
      {!isDemo && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h17.25a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-.375m-17.25 0h17.25M6.75 6.75h10.5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 text-center">No ride schedule yet</h1>
          <p className="text-sm text-gray-500 text-center mt-3 max-w-sm leading-relaxed">
            Your dialysis transportation schedule has not been added to Renal Ride yet. Once your clinic connects your account, you'll see your next pickup, driver status, return ride, and caregiver notifications here.
          </p>
          <div className="mt-8 w-full max-w-xs space-y-3">
            <button className="w-full px-4 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors cursor-pointer">
              Enter Clinic Invite Code
            </button>
            <button className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
              Request Help
            </button>
            <button
              onClick={() => navigate('/demo')}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              View Demo
            </button>
          </div>
        </div>
      )}

      {isDemo && (<>
      {/* Bottom Tab Navigation */}
      <div className="flex rounded-2xl bg-white border border-gray-200 shadow-sm mb-6 overflow-hidden">
        {tabItems.map(t => (
          <button
            key={t.key}
            onClick={() => navigate(t.path)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-colors cursor-pointer',
              tab === t.key
                ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            {t.key === 'today' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            )}
            {t.key === 'schedule' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            )}
            {t.key === 'help' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
            )}
            {t.key === 'profile' && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            )}
            <span className="text-[13px]">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ===== TODAY TAB ===== */}
      {tab === 'today' && (
        <div className="space-y-5">
          {/* Guided Demo Scenario Section */}
          {isGuidedDemo && demo && (() => {
            const demoStepIndex = getDemoStepIndex(demo.status);
            const isError = isDemoErrorStatus(demo.status);
            const showReadinessAlert = demo.status === 'driver_en_route_to_patient' || demo.status === 'readiness_prompt_sent';
            const showPatientFeedback = ['patient_ready', 'patient_needs_help', 'patient_not_ready', 'cancel_requested'].includes(demo.status);
            const showPostPickup = ['driver_arrived', 'en_route_to_clinic', 'arrived_at_clinic', 'in_treatment', 'pickup_failed'].includes(demo.status);

            return (
              <>
                {/* Guided Demo Assistant */}
                <GuidedDemoAssistant />

                {/* Mary Johnson's Journey Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Today's Journey — {DEMO_PATIENT.name}</h2>
                    <DemoStatusBadge status={demo.status} />
                  </div>
                  <div className="px-5 pb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>Pickup {formatTime(DEMO_RIDE_INFO.pickupTime)}</span>
                    <span>&middot;</span>
                    <span>{DEMO_CLINIC_INFO.name}</span>
                    <span>&middot;</span>
                    <span>Chair {formatTime(DEMO_RIDE_INFO.chairTime)}</span>
                    <span>&middot;</span>
                    <span>{DEMO_RIDE_INFO.rideType}</span>
                    <span>&middot;</span>
                    <span>{DEMO_RIDE_INFO.assistance}</span>
                  </div>

                  {/* Readiness Alert */}
                  {showReadinessAlert && (
                    <div className="px-5 pb-5">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-base font-semibold text-amber-800 mb-3">Your driver is on the way. Are you ready for pickup?</p>
                        <div className="grid grid-cols-2 gap-2">
                          <GuidedActionHighlight isRecommended={showReadinessAlert}>
                            <button
                              onClick={() => demo.patientReady()}
                              className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              I'm Ready
                            </button>
                          </GuidedActionHighlight>
                          <button
                            onClick={() => demo.patientNeedsHelp()}
                            className="px-4 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
                          >
                            I Need Help
                          </button>
                          <button
                            onClick={() => demo.patientNotReady()}
                            className="px-4 py-3 rounded-xl bg-gray-500 text-white text-sm font-semibold hover:bg-gray-600 transition-colors cursor-pointer"
                          >
                            I'm Not Ready
                          </button>
                          <button
                            onClick={() => demo.patientCancelRequest()}
                            className="px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                          >
                            Cancel / Cannot Go Today
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Feedback */}
                  {showPatientFeedback && (
                    <div className="px-5 pb-5">
                      {demo.status === 'patient_ready' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span className="text-sm text-emerald-800">You confirmed you're ready. Your driver is on the way.</span>
                        </div>
                      )}
                      {demo.status === 'patient_needs_help' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                          </svg>
                          <span className="text-sm text-amber-800">Help is being coordinated. Your driver and clinic have been notified.</span>
                        </div>
                      )}
                      {demo.status === 'patient_not_ready' && (
                        <div className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span className="text-sm text-gray-700">Your driver has been notified you're not ready. Take your time.</span>
                        </div>
                      )}
                      {demo.status === 'cancel_requested' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span className="text-sm text-red-800">Your cancellation has been sent. Your clinic will follow up.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post-pickup Messages */}
                  {showPostPickup && (
                    <div className="px-5 pb-5">
                      {demo.status === 'driver_arrived' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          <span className="text-sm text-blue-800">Your driver has arrived! {DEMO_RIDE_INFO.driverName} is waiting outside.</span>
                        </div>
                      )}
                      {demo.status === 'en_route_to_clinic' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h3.75L9 11.25m0 0L11.25 3h5.625l2.625 8.25H9Z" />
                          </svg>
                          <span className="text-sm text-blue-800">You're on your way to {DEMO_CLINIC_INFO.name}.</span>
                        </div>
                      )}
                      {demo.status === 'arrived_at_clinic' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span className="text-sm text-emerald-800">Welcome to {DEMO_CLINIC_INFO.name}.</span>
                        </div>
                      )}
                      {demo.status === 'in_treatment' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                          </svg>
                          <span className="text-sm text-emerald-800">Your dialysis treatment is in progress.</span>
                        </div>
                      )}
                      {demo.status === 'pickup_failed' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                          </svg>
                          <span className="text-sm text-red-800">There was an issue with your pickup. Your clinic is working on it.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Interactive Timeline */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                  <div className="space-y-0">
                    {demoTimelineSteps.map((step, i) => {
                      const isCompleted = i <= 1 || i < demoStepIndex;
                      const isCurrent = i === demoStepIndex;
                      const isFuture = !isCompleted && !isCurrent;
                      return (
                        <div key={step.key} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
                              isCompleted && 'bg-emerald-500 border-emerald-500',
                              isCurrent && !isError && 'bg-brand-500 border-brand-500',
                              isCurrent && isError && 'bg-red-500 border-red-500',
                              isFuture && 'bg-white border-gray-300',
                            )}>
                              {isCompleted ? (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              ) : isCurrent ? (
                                <div className={cn(
                                  'w-3 h-3 rounded-full animate-pulse',
                                  isError ? 'bg-white' : 'bg-white',
                                )} />
                              ) : (
                                <div className="w-2 h-2 bg-gray-300 rounded-full" />
                              )}
                            </div>
                            {i < demoTimelineSteps.length - 1 && (
                              <div className={cn(
                                'w-0.5 h-8',
                                i < demoStepIndex || i <= 0 ? 'bg-emerald-500' : 'bg-gray-200',
                              )} />
                            )}
                          </div>
                          <div className={cn(
                            'pt-1.5 pb-4',
                            isCurrent && !isError && 'font-semibold text-brand-700',
                            isCurrent && isError && 'font-semibold text-red-700',
                            isCompleted && 'text-gray-600',
                            isFuture && 'text-gray-400',
                          )}>
                            <p className="text-base leading-tight">{step.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reset Demo Button */}
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => demo.resetDemoScenario()}
                      className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Reset Demo
                    </button>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Greeting — hidden in guided demo since Mary Johnson's card handles it */}
          {!isGuidedDemo && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting}, {isDemo ? patient.firstName : (user?.name?.split(' ')[0] ?? patient.firstName)}</h1>
            <p className="text-base text-gray-500 mt-1">{dateStr}</p>
          </div>
          )}

          {/* Active Ride Card — operations demo and production only */}
          {!isGuidedDemo && (<>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-brand-600 px-5 py-3 flex items-center justify-between">
              <span className="text-white font-semibold text-base">Your Ride Today</span>
              <StatusPill status={toClinicRide.status} />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{formatTime(toClinicRide.pickupTime)}</span>
                <span className="text-base text-gray-500">pickup</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Going to</p>
                    <p className="text-base font-medium text-gray-900">{clinic.name}</p>
                    <p className="text-sm text-gray-500">{clinic.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Driver</p>
                    <p className="text-base font-medium text-gray-900">{toClinicRide.driverName}</p>
                    <p className="text-sm text-gray-500">{toClinicRide.vehicleType} &middot; {rideVendor.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chair time</p>
                    <p className="text-base font-medium text-gray-900">{formatTime(toClinicRide.chairTime)}</p>
                    <p className="text-sm text-gray-500">Estimated end &middot; {formatTime(toClinicRide.estimatedReturnTime)}</p>
                  </div>
                </div>
              </div>

              {toClinicRide.actualPickupTime && (
                <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm text-emerald-800">Picked up at {formatTime(toClinicRide.actualPickupTime)}</span>
                </div>
              )}

              <button
                onClick={() => setShowRideDetail(true)}
                className="w-full text-center text-sm text-brand-600 font-medium hover:text-brand-700 py-2 cursor-pointer"
              >
                View full ride details
              </button>
            </div>
          </div>

          {/* Return Ride Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Return Ride</h3>
              <StatusPill status={returnRide.status} />
            </div>
            <div className="space-y-2 text-base">
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated pickup</span>
                <span className="font-medium text-gray-900">{formatTime(returnRide.pickupTime)}</span>
              </div>
              {returnRide.driverName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Driver</span>
                  <span className="font-medium text-gray-900">{returnRide.driverName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium text-gray-900">{returnRide.vehicleType}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                if (!readyNotified) {
                  setReadyNotified(true);
                  addLocalToast('Your clinic has been notified that you are ready for pickup.');
                  addToast('Patient marked ready for pickup');
                  addNotification({ recipientRole: 'clinic', patientId: patient.id, title: 'Patient Ready', message: `${patient.firstName} ${patient.lastName} has indicated they are ready for pickup.`, severity: 'info' });
                  addNotification({ recipientRole: 'caregiver', patientId: patient.id, title: 'Patient Ready', message: `${patient.firstName} is ready for pickup.`, severity: 'info' });
                  addAuditLogEntry({ actorRole: 'patient', actorName: `${patient.firstName} ${patient.lastName}`, action: 'patient_ready', target: `${patient.firstName} ${patient.lastName[0]}. (${toClinicRide.id})`, details: 'Patient clicked "I\'m Ready" — clinic and caregiver notified' });
                }
              }}
              disabled={readyNotified}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl p-5 min-h-[96px] font-semibold text-lg transition-colors cursor-pointer',
                readyNotified
                  ? 'bg-emerald-100 text-emerald-700 cursor-default'
                  : 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
              )}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {readyNotified ? 'Clinic Notified' : "I'm Ready"}
            </button>

            <button
              onClick={() => navigate(`${base}/help`)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl p-5 min-h-[96px] font-semibold text-lg bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transition-colors cursor-pointer"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              I Need Help
            </button>

            <button
              onClick={() => setShowCallClinic(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl p-5 min-h-[96px] font-semibold text-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              Call Clinic
            </button>

            <button
              onClick={() => setShowCallSupport(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl p-5 min-h-[96px] font-semibold text-lg bg-gray-700 text-white hover:bg-gray-800 active:bg-gray-900 transition-colors cursor-pointer"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              Ride Support
            </button>
          </div>

          {/* Ride Timeline — static */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Journey</h3>
            <div className="space-y-0">
              {timelineSteps.map((step, i) => {
                const isCompleted = i < currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
                        isCompleted && 'bg-emerald-500 border-emerald-500',
                        isCurrent && 'bg-brand-500 border-brand-500',
                        !isCompleted && !isCurrent && 'bg-white border-gray-300',
                      )}>
                        {isCompleted ? (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : isCurrent ? (
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        )}
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className={cn(
                          'w-0.5 h-8',
                          i < currentStep ? 'bg-emerald-500' : 'bg-gray-200',
                        )} />
                      )}
                    </div>
                    <div className={cn(
                      'pt-1.5 pb-4',
                      isCurrent && 'font-semibold text-brand-700',
                      isCompleted && 'text-gray-600',
                      !isCompleted && !isCurrent && 'text-gray-400',
                    )}>
                      <p className="text-base leading-tight">{step.label}</p>
                      {step.key === 'picked_up' && toClinicRide.actualPickupTime && isCompleted && (
                        <p className="text-sm text-gray-400 mt-0.5">{formatTime(toClinicRide.actualPickupTime)}</p>
                      )}
                      {step.key === 'arrived_at_clinic' && toClinicRide.actualDropoffTime && isCompleted && (
                        <p className="text-sm text-gray-400 mt-0.5">{formatTime(toClinicRide.actualDropoffTime)}</p>
                      )}
                      {step.key === 'in_treatment' && isCurrent && (
                        <p className="text-sm text-brand-500 mt-0.5">Chair time {formatTime(toClinicRide.chairTime)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </>)}
        </div>
      )}

      {/* ===== SCHEDULE TAB ===== */}
      {tab === 'schedule' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Schedule</h1>
            <p className="text-base text-gray-500 mt-1">Recurring dialysis transportation</p>
          </div>

          {/* Schedule summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Treatment Days</h3>
            <div className="flex gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div
                  key={d}
                  className={cn(
                    'flex-1 text-center py-3 rounded-xl text-sm font-semibold',
                    order.daysOfWeek.includes(d)
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-400',
                  )}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Pickup time</span>
                <span className="font-medium text-gray-900">{formatTime(order.pickupTime)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Chair time</span>
                <span className="font-medium text-gray-900">{formatTime(order.chairTime)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Clinic</span>
                <span className="font-medium text-gray-900 text-right max-w-[200px]">{clinic.name}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium text-gray-900">{toClinicRide.vehicleType}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Ride service</span>
                <span className="font-medium text-gray-900">{rideVendor.name}</span>
              </div>
            </div>
          </div>

          {/* Upcoming sessions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
            <div className="space-y-0">
              {getUpcomingSessions().map((s, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">{s.dayLabel}</p>
                    <p className="text-sm text-gray-500">Pickup {formatTime(order.pickupTime)} &middot; Chair {formatTime(order.chairTime)}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-brand-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Standing order info */}
          <div className="bg-blue-50 rounded-2xl border border-blue-200 px-5 py-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Standing order active since {new Date(order.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</span>{' '}
              Your rides are automatically scheduled based on your treatment days. Contact your clinic to make changes.
            </p>
          </div>
        </div>
      )}

      {/* ===== HELP TAB ===== */}
      {tab === 'help' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Need Help?</h1>
            <p className="text-base text-gray-500 mt-1">Tap a button to report an issue</p>
          </div>

          <div className="space-y-3">
            {helpIssues.map(issue => (
              <button
                key={issue.id}
                onClick={() => {
                  if (issue.id === 'unwell') {
                    setShowUnwell(true);
                  } else {
                    setHelpConfirm(issue.id);
                  }
                }}
                className="flex items-center gap-4 w-full rounded-2xl p-5 bg-white border-2 border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors text-left cursor-pointer"
              >
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', issue.color)}>
                  {issue.id === 'late' && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                  {issue.id === 'find-driver' && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  )}
                  {issue.id === 'not-ready' && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                  {issue.id === 'wheelchair' && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  )}
                  {issue.id === 'cancel' && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                  {issue.id === 'unwell' && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  )}
                </div>
                <span className="text-lg font-medium text-gray-900">{issue.label}</span>
                <svg className="w-5 h-5 text-gray-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>

          {/* Emergency Info */}
          <div className="bg-red-50 rounded-2xl border-2 border-red-200 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <p className="text-base font-semibold text-red-800">For medical emergencies, call 911</p>
                <p className="text-sm text-red-700 mt-1">Renal Ride does not provide emergency medical services. If you are experiencing a medical emergency, call 911 immediately.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PROFILE TAB ===== */}
      {tab === 'profile' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-base text-gray-500 mt-1">Your information and preferences</p>
          </div>

          {/* Avatar + Name */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold shrink-0">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h2>
              <p className="text-base text-gray-500">Born {new Date(patient.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
            <ProfileRow label="Phone" value={patient.phone} />
            <ProfileRow label="Address" value={patient.address} />
            <ProfileRow label="Language" value={patient.preferredLanguage} />
          </div>

          {/* Dialysis Schedule */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Dialysis Schedule</h3>
            <ProfileRow label="Clinic" value={clinic.name} />
            <ProfileRow label="Treatment days" value={order.daysOfWeek.join(', ')} />
            <ProfileRow label="Chair time" value={formatTime(order.chairTime)} />
            <ProfileRow label="Pickup time" value={formatTime(order.pickupTime)} />
          </div>

          {/* Mobility & Transport */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Transport Needs</h3>
            <ProfileRow label="Mobility" value={mobilityLabels[patient.mobilityLevel] || patient.mobilityLevel} />
            <ProfileRow label="Assistance" value={assistanceLabels[patient.assistanceLevel] || patient.assistanceLevel} />
            <ProfileRow label="Ride type" value={toClinicRide.vehicleType} />
            {patient.notes && <ProfileRow label="Special notes" value={patient.notes} />}
          </div>

          {/* Caregiver */}
          {caregiver && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Caregiver</h3>
              <ProfileRow label="Name" value={caregiver.name} />
              <ProfileRow label="Relationship" value={caregiver.relationship} />
              <ProfileRow label="Phone" value={caregiver.phone} />
              <ProfileRow label="Email" value={caregiver.email} />
            </div>
          )}

          {/* Ride Service */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Ride Service</h3>
            <ProfileRow label="Provider" value={rideVendor.name} />
            <ProfileRow label="Phone" value={rideVendor.phone} />
            <ProfileRow label="Service area" value={rideVendor.serviceArea} />
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Ride Detail Modal */}
      <Modal open={showRideDetail} onClose={() => setShowRideDetail(false)} title="Ride Details" wide>
        <RideDetail ride={toClinicRide} viewerRole="patient" />
      </Modal>

      {/* Help Confirm Modal */}
      <Modal open={helpConfirm !== null} onClose={() => setHelpConfirm(null)} title="Confirm Report">
        {helpConfirm && (
          <div className="space-y-4">
            <p className="text-base text-gray-700">
              Are you sure you want to report: <span className="font-semibold">{helpIssues.find(h => h.id === helpConfirm)?.label}</span>?
            </p>
            <p className="text-sm text-gray-500">Your clinic and ride service will be notified.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setHelpConfirm(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const issue = helpIssues.find(h => h.id === helpConfirm);
                  if (issue) {
                    addLocalToast(issue.response);
                    addToast(`Patient reported: ${issue.label}`, 'warning');
                    addNotification({ recipientRole: 'clinic', patientId: patient.id, title: 'Patient Help Request', message: `${patient.firstName} ${patient.lastName} reported: ${issue.label}`, severity: 'warning' });
                    addAuditLogEntry({ actorRole: 'patient', actorName: `${patient.firstName} ${patient.lastName}`, action: 'issue_reported', target: `${patient.firstName} ${patient.lastName[0]}.`, details: `Patient reported: ${issue.label}` });
                  }
                  setHelpConfirm(null);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-brand-600 text-white text-base font-medium hover:bg-brand-700 transition-colors cursor-pointer"
              >
                Report Issue
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* I Feel Unwell Modal */}
      <Modal open={showUnwell} onClose={() => setShowUnwell(false)} title="I Feel Unwell">
        <div className="space-y-4">
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <p className="text-lg font-bold text-red-800 text-center">
              If this is a medical emergency, call 911 immediately.
            </p>
            <p className="text-base text-red-700 text-center mt-2">
              Renal Ride does not provide emergency medical services.
            </p>
            <div className="mt-4">
              <a
                href="tel:911"
                className="block w-full text-center px-4 py-4 rounded-xl bg-red-600 text-white text-xl font-bold hover:bg-red-700 transition-colors"
              >
                Call 911
              </a>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-base text-gray-700 font-medium mb-3">Not an emergency?</p>
            <p className="text-sm text-gray-500 mb-4">If you are not feeling well but it is not an emergency, we can notify your clinic staff.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnwell(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addLocalToast('Your clinic staff has been notified. Someone will check on you shortly.', 'warning');
                  addNotification({ recipientRole: 'clinic', patientId: patient.id, title: 'Patient Feeling Unwell', message: `${patient.firstName} ${patient.lastName} reported feeling unwell (non-emergency). Staff check requested.`, severity: 'critical' });
                  addAuditLogEntry({ actorRole: 'patient', actorName: `${patient.firstName} ${patient.lastName}`, action: 'unwell_reported', target: `${patient.firstName} ${patient.lastName[0]}.`, details: 'Patient reported feeling unwell (non-emergency) — clinic staff notified' });
                  setShowUnwell(false);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-500 text-white text-base font-medium hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Notify Clinic
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Call Clinic Modal */}
      <Modal open={showCallClinic} onClose={() => setShowCallClinic(false)} title="Call Your Clinic">
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
      </>)}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-base text-gray-500 shrink-0">{label}</span>
      <span className="text-base font-medium text-gray-900 text-right ml-4">{value}</span>
    </div>
  );
}
