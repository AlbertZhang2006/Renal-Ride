import { useNavigate, useLocation } from 'react-router-dom';
import { useDemoScenario, isDemoErrorStatus, isDemoTerminalStatus } from '../data/DemoScenarioContext';
import type { DemoRideStatus } from '../data/DemoScenarioContext';
import type { UserRole } from '../types';
import { cn } from '../utils/cn';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GuidedStep {
  stepNumber: number;
  title: string;
  instruction: string;
  why: string;
  actionRole: UserRole;
  nextRole: UserRole | null;
  nextRoleMessage: string | null;
}

interface ExceptionGuidance {
  title: string;
  instruction: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GUIDED_STEPS: GuidedStep[] = [
  {
    stepNumber: 1,
    title: 'Patient Confirms Readiness',
    instruction: "As the patient, click 'I'm Ready' to confirm you're prepared for pickup.",
    why: 'In real life, a readiness check helps drivers avoid wasted trips and ensures patients are prepared on time.',
    actionRole: 'patient',
    nextRole: 'vendor',
    nextRoleMessage: 'Switch to Vendor to see the driver respond.',
  },
  {
    stepNumber: 2,
    title: 'Driver Marks Arrival',
    instruction: "As the driver, click 'Arrived' to indicate you've reached the patient's location.",
    why: 'Arrival confirmation triggers a notification to the patient, caregiver, and clinic in real time.',
    actionRole: 'vendor',
    nextRole: 'patient',
    nextRoleMessage: 'Switch to Patient or Caregiver to see the arrival notification.',
  },
  {
    stepNumber: 3,
    title: 'Driver Confirms Pickup',
    instruction: "As the driver, click 'Patient Onboard' to confirm Mary has been picked up.",
    why: "Pickup confirmation updates the clinic's transportation board and notifies the caregiver.",
    actionRole: 'vendor',
    nextRole: 'clinic',
    nextRoleMessage: "Switch to Clinic to see Mary's status update on the command center.",
  },
  {
    stepNumber: 4,
    title: 'Driver Arrives at Clinic',
    instruction: "As the driver, click 'Arrived at Clinic' to complete the transport.",
    why: 'Clinic staff are notified so they can prepare the dialysis chair and greet the patient.',
    actionRole: 'vendor',
    nextRole: 'clinic',
    nextRoleMessage: "Switch to Clinic to start Mary's treatment.",
  },
  {
    stepNumber: 5,
    title: 'Clinic Starts Treatment',
    instruction: "As the clinic coordinator, click 'Start Treatment' on Mary Johnson's card.",
    why: 'Starting treatment completes the transportation workflow and begins the clinical session.',
    actionRole: 'clinic',
    nextRole: null,
    nextRoleMessage: null,
  },
];

const EXCEPTION_GUIDANCE: Partial<Record<DemoRideStatus, ExceptionGuidance>> = {
  patient_needs_help: {
    title: 'Exception: Patient Needs Help',
    instruction:
      'Mary indicated she needs assistance. This triggered risk alerts across all roles. View the Vendor dashboard to see the driver notification, check the Clinic Risk Queue for the escalation, or switch to the Caregiver view to see the alert.',
  },
  patient_not_ready: {
    title: 'Exception: Patient Not Ready',
    instruction:
      'Mary is not ready for pickup. This raised a risk flag that could delay her chair time. View the Vendor dashboard to see the driver hold notification, check the Clinic Risk Queue for the delay alert, or switch to the Caregiver view.',
  },
  cancel_requested: {
    title: 'Exception: Ride Canceled',
    instruction:
      'Mary canceled her ride. This is a high-risk scenario -- a missed dialysis session can be life-threatening. Check the Clinic Risk Queue to see how coordinators are alerted to intervene.',
  },
  pickup_failed: {
    title: 'Exception: Pickup Failed',
    instruction:
      'The driver was unable to pick up Mary. This requires immediate rebooking. Switch to the Clinic view to see how the coordinator can respond and reschedule.',
  },
};

const PROGRESS_LABELS = ['Ready', 'Arrived', 'Picked Up', 'At Clinic', 'Treatment'];

function statusToStepIndex(status: DemoRideStatus): number {
  switch (status) {
    case 'driver_en_route_to_patient':
    case 'readiness_prompt_sent':
      return 0;
    case 'patient_ready':
      return 1;
    case 'driver_arrived':
      return 2;
    case 'en_route_to_clinic':
      return 3;
    case 'arrived_at_clinic':
      return 4;
    case 'in_treatment':
      return 5; // all complete
    default:
      return -1; // exception statuses
  }
}

function statusToGuidedStep(status: DemoRideStatus): GuidedStep | null {
  switch (status) {
    case 'driver_en_route_to_patient':
    case 'readiness_prompt_sent':
      return GUIDED_STEPS[0];
    case 'patient_ready':
      return GUIDED_STEPS[1];
    case 'driver_arrived':
      return GUIDED_STEPS[2];
    case 'en_route_to_clinic':
      return GUIDED_STEPS[3];
    case 'arrived_at_clinic':
      return GUIDED_STEPS[4];
    default:
      return null;
  }
}

function currentRoleFromPath(pathname: string): UserRole | null {
  if (pathname.includes('/patient')) return 'patient';
  if (pathname.includes('/caregiver')) return 'caregiver';
  if (pathname.includes('/clinic')) return 'clinic';
  if (pathname.includes('/vendor')) return 'vendor';
  return null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  caregiver: 'Caregiver',
  clinic: 'Clinic',
  vendor: 'Vendor',
  admin: 'Admin',
};

/* ------------------------------------------------------------------ */
/*  Progress Tracker                                                   */
/* ------------------------------------------------------------------ */

function ProgressTracker({ activeIndex }: { activeIndex: number }) {
  const allComplete = activeIndex >= 5;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      {PROGRESS_LABELS.map((label, i) => {
        const isComplete = allComplete || i < activeIndex;
        const isCurrent = !allComplete && i === activeIndex;

        return (
          <div key={label} className="flex items-center" style={{ flex: i < PROGRESS_LABELS.length - 1 ? 1 : 'none' }}>
            {/* Dot + label */}
            <div className="flex flex-col items-center" style={{ minWidth: 40 }}>
              <div className="relative flex items-center justify-center">
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    isComplete && 'bg-emerald-500',
                    isCurrent && 'bg-teal-600',
                    !isComplete && !isCurrent && 'bg-gray-300',
                  )}
                />
                {isCurrent && (
                  <span
                    className="absolute w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 whitespace-nowrap',
                  isComplete && 'text-emerald-600 font-medium',
                  isCurrent && 'text-teal-700 font-semibold',
                  !isComplete && !isCurrent && 'text-gray-400',
                )}
              >
                {label}
              </span>
            </div>

            {/* Connecting line */}
            {i < PROGRESS_LABELS.length - 1 && (
              <div
                className="flex-1 mx-1"
                style={{
                  height: 2,
                  marginBottom: 16,
                  borderRadius: 1,
                  background: i < activeIndex ? '#10b981' : '#d1d5db',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG)                                                 */
/* ------------------------------------------------------------------ */

function PlayIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  GuidedDemoAssistant                                                */
/* ------------------------------------------------------------------ */

export function GuidedDemoAssistant() {
  const demo = useDemoScenario();
  const navigate = useNavigate();
  const location = useLocation();

  if (!demo) return null;

  const { status, resetDemoScenario } = demo;
  const currentRole = currentRoleFromPath(location.pathname);
  const activeStepIndex = statusToStepIndex(status);

  /* ---------- Completion state ---------- */
  if (status === 'in_treatment') {
    return (
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: '#a7f3d0', background: '#ecfdf5' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: '#d1fae5', borderBottom: '1px solid #a7f3d0' }}
        >
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <CheckCircleIcon />
            Demo Complete!
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          <p className="text-sm text-emerald-900 font-medium">
            You've completed the guided demo!
          </p>
          <ul className="text-xs text-emerald-800 space-y-1.5 list-none pl-0">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">&#10003;</span>
              Patient readiness confirmation and real-time notifications
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">&#10003;</span>
              Driver status updates visible to all stakeholders
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">&#10003;</span>
              Clinic command center with live transportation board
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">&#10003;</span>
              End-to-end ride lifecycle from pickup to treatment
            </li>
          </ul>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => {
                resetDemoScenario();
                navigate('/demo/guided/patient');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer border-none"
            >
              Restart Guided Demo
            </button>
            <button
              onClick={() => navigate('/demo/operations')}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              Explore Operations Demo
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer border-none bg-transparent"
            >
              Return to Landing Page
            </button>
          </div>
        </div>

        <ProgressTracker activeIndex={activeStepIndex} />
        <div className="h-3" />
      </div>
    );
  }

  /* ---------- Exception / error states ---------- */
  if (isDemoErrorStatus(status) || status === 'patient_needs_help' || status === 'patient_not_ready') {
    const guidance = EXCEPTION_GUIDANCE[status];
    if (!guidance) return null;

    return (
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: '#fcd34d', background: '#fffbeb' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: '#fef3c7', borderBottom: '1px solid #fcd34d' }}
        >
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <WarningIcon />
            {guidance.title}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          <p className="text-sm text-amber-900">
            {guidance.instruction}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {!isDemoTerminalStatus(status) && (
              <>
                <button
                  onClick={() => navigate(`/demo/guided/vendor`)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer border-none"
                >
                  View Vendor Dashboard
                  <ArrowRightIcon />
                </button>
                <button
                  onClick={() => navigate(`/demo/guided/clinic`)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white text-amber-800 border border-amber-300 hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  View Clinic Risk Queue
                </button>
              </>
            )}
            <button
              onClick={() => {
                resetDemoScenario();
                navigate('/demo/guided/patient');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer border-none bg-transparent"
            >
              {isDemoTerminalStatus(status) ? 'Reset Demo & Restart' : 'Return to happy path (Reset)'}
            </button>
          </div>
        </div>

        <ProgressTracker activeIndex={activeStepIndex} />
        <div className="h-3" />
      </div>
    );
  }

  /* ---------- Normal guided step ---------- */
  const step = statusToGuidedStep(status);
  if (!step) return null;

  const onCorrectRole = currentRole === step.actionRole;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#99e0f2', background: '#f0fdfa' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: '#e0f7fa', borderBottom: '1px solid #99e0f2' }}
      >
        <div className="flex items-center gap-2 text-teal-800 font-semibold text-sm">
          <PlayIcon />
          Guided Demo Assistant
        </div>
        <span className="text-xs text-teal-600 font-medium">
          Step {step.stepNumber} of 5
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2.5">
        <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
        <p className="text-sm text-gray-700">{step.instruction}</p>

        {/* Why callout */}
        <div className="flex items-start gap-2 text-xs text-teal-700" style={{ background: '#e0f7fa', borderRadius: 8, padding: '8px 10px' }}>
          <LightbulbIcon />
          <span><span className="font-semibold">Why:</span> {step.why}</span>
        </div>

        {/* Navigation buttons */}
        <div className="space-y-2 pt-1">
          {/* Go to action role button (only when user is NOT on the correct role) */}
          {!onCorrectRole && (
            <button
              onClick={() => navigate(`/demo/guided/${step.actionRole}`)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-none"
              style={{ background: '#0e7490', color: '#ffffff' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#155e75'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#0e7490'; }}
            >
              Go to {ROLE_LABELS[step.actionRole]} View
              <ArrowRightIcon />
            </button>
          )}

          {/* After action: suggest next role to view */}
          {step.nextRole && step.nextRoleMessage && onCorrectRole && (
            <div className="space-y-1">
              <button
                onClick={() => navigate(`/demo/guided/${step.nextRole}`)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                style={{
                  background: 'transparent',
                  color: '#0e7490',
                  border: '1px solid #99e0f2',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e0f7fa'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                Go to {ROLE_LABELS[step.nextRole]} View
                <ArrowRightIcon />
              </button>
              <p className="text-[11px] text-teal-600 pl-0.5">{step.nextRoleMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress tracker */}
      <div className="px-4">
        <ProgressTracker activeIndex={activeStepIndex} />
      </div>
      <div className="h-3" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GuidedActionHighlight                                               */
/* ------------------------------------------------------------------ */

interface GuidedActionHighlightProps {
  isRecommended: boolean;
  children: React.ReactNode;
  className?: string;
}

export function GuidedActionHighlight({ isRecommended, children, className }: GuidedActionHighlightProps) {
  if (!isRecommended) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {/* "Next Step" badge */}
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-semibold bg-teal-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap"
      >
        Next Step &rarr;
      </span>

      {/* Pulsing ring wrapper */}
      <div className="relative rounded-lg">
        <div
          className="absolute -inset-[3px] rounded-lg border-2 border-teal-400 animate-pulse pointer-events-none"
        />
        {children}
      </div>
    </div>
  );
}
