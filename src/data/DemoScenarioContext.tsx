/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { RiskLevel, UserRole } from '../types';

export type DemoRideStatus =
  | 'driver_en_route_to_patient'
  | 'readiness_prompt_sent'
  | 'patient_ready'
  | 'patient_needs_help'
  | 'patient_not_ready'
  | 'cancel_requested'
  | 'driver_arrived'
  | 'picked_up'
  | 'en_route_to_clinic'
  | 'arrived_at_clinic'
  | 'in_treatment'
  | 'pickup_failed';

export interface DemoEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorRole: UserRole;
  detail: string;
}

export interface DemoNotification {
  id: string;
  recipientRole: UserRole;
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export const DEMO_PATIENT = {
  name: 'Mary Johnson',
  firstName: 'Mary',
  lastName: 'Johnson',
  address: '742 Evergreen Ave, Sacramento, CA 95820',
  phone: '(916) 555-0199',
};

export const DEMO_CLINIC_INFO = {
  name: 'Eastside Kidney Care',
  address: '4500 J Street, Sacramento, CA 95819',
  phone: '(916) 555-0300',
};

export const DEMO_RIDE_INFO = {
  chairTime: '09:00',
  pickupTime: '08:15',
  rideType: 'Wheelchair Van',
  assistance: 'Door-to-door',
  driverName: 'Tony Reeves',
  driverPhone: '(916) 555-0501',
  vendorName: 'CareRide Medical Transport',
};

export const DEMO_CAREGIVER_INFO = {
  name: 'Robert Johnson',
  relationship: 'Spouse',
  phone: '(916) 555-0200',
};

export const demoStatusLabels: Record<DemoRideStatus, string> = {
  driver_en_route_to_patient: 'Driver En Route',
  readiness_prompt_sent: 'Awaiting Response',
  patient_ready: 'Patient Ready',
  patient_needs_help: 'Needs Assistance',
  patient_not_ready: 'Not Ready',
  cancel_requested: 'Cancel Requested',
  driver_arrived: 'Driver Arrived',
  picked_up: 'Picked Up',
  en_route_to_clinic: 'En Route to Clinic',
  arrived_at_clinic: 'Arrived at Clinic',
  in_treatment: 'In Treatment',
  pickup_failed: 'Pickup Failed',
};

export const demoStatusColors: Record<DemoRideStatus, { bg: string; text: string; dot: string }> = {
  driver_en_route_to_patient: { bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  readiness_prompt_sent: { bg: '#fff7ed', text: '#b45309', dot: '#ea9006' },
  patient_ready: { bg: '#ecfdf5', text: '#047857', dot: '#10b981' },
  patient_needs_help: { bg: '#fff7ed', text: '#b45309', dot: '#ea9006' },
  patient_not_ready: { bg: '#fef2f2', text: '#b91c1c', dot: '#dc2626' },
  cancel_requested: { bg: '#fef2f2', text: '#b91c1c', dot: '#dc2626' },
  driver_arrived: { bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  picked_up: { bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  en_route_to_clinic: { bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  arrived_at_clinic: { bg: '#ecfdf5', text: '#047857', dot: '#10b981' },
  in_treatment: { bg: '#ecfdf5', text: '#047857', dot: '#10b981' },
  pickup_failed: { bg: '#fef2f2', text: '#b91c1c', dot: '#dc2626' },
};

export function DemoStatusBadge({ status }: { status: DemoRideStatus }) {
  const s = demoStatusColors[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        background: s.bg,
        color: s.text,
      }}
    >
      <span style={{ height: 6, width: 6, borderRadius: 999, background: s.dot, flexShrink: 0 }} />
      {demoStatusLabels[status]}
    </span>
  );
}

export const demoTimelineSteps = [
  { key: 'scheduled', label: 'Ride Scheduled' },
  { key: 'driver_assigned', label: 'Driver Assigned' },
  { key: 'driver_heading', label: 'Driver Heading to You' },
  { key: 'confirm_readiness', label: 'Confirm Readiness' },
  { key: 'driver_arrived', label: 'Driver Arrived' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'en_route', label: 'On the Way to Clinic' },
  { key: 'arrived_clinic', label: 'Arrived at Clinic' },
  { key: 'in_treatment', label: 'In Treatment' },
];

export function getDemoStepIndex(status: DemoRideStatus): number {
  switch (status) {
    case 'driver_en_route_to_patient': return 2;
    case 'readiness_prompt_sent': return 3;
    case 'patient_ready': return 3;
    case 'patient_needs_help': return 3;
    case 'patient_not_ready': return 3;
    case 'cancel_requested': return 3;
    case 'driver_arrived': return 4;
    case 'picked_up': return 5;
    case 'en_route_to_clinic': return 6;
    case 'arrived_at_clinic': return 7;
    case 'in_treatment': return 8;
    case 'pickup_failed': return 4;
  }
}

export function isDemoTerminalStatus(status: DemoRideStatus): boolean {
  return status === 'cancel_requested' || status === 'pickup_failed' || status === 'in_treatment';
}

export function isDemoErrorStatus(status: DemoRideStatus): boolean {
  return status === 'cancel_requested' || status === 'pickup_failed';
}

interface DemoState {
  status: DemoRideStatus;
  events: DemoEvent[];
  notifications: DemoNotification[];
  riskLevel: RiskLevel;
}

const STORAGE_KEY = 'renal-ride-demo-scenario';

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function ts(): string {
  return new Date().toISOString();
}

function initialState(): DemoState {
  return {
    status: 'driver_en_route_to_patient',
    events: [
      {
        id: `e-${uid()}`, timestamp: ts(),
        action: 'Driver dispatched',
        actor: 'System', actorRole: 'admin',
        detail: 'Tony Reeves dispatched to pick up Mary Johnson. Wheelchair van en route to 742 Evergreen Ave.',
      },
    ],
    notifications: [
      {
        id: `n-${uid()}`, recipientRole: 'patient',
        title: 'Driver On the Way',
        message: 'Tony Reeves is heading to you in a wheelchair van. Estimated arrival: 8:15 AM.',
        timestamp: ts(), severity: 'info',
      },
      {
        id: `n-${uid()}`, recipientRole: 'caregiver',
        title: 'Driver Dispatched',
        message: 'Tony Reeves has been dispatched to pick up Mary Johnson.',
        timestamp: ts(), severity: 'info',
      },
    ],
    riskLevel: 'low',
  };
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.status && Array.isArray(parsed.events)) return parsed;
    }
  } catch { /* ignore */ }
  return initialState();
}

function persist(state: DemoState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function transition(prev: DemoState, cfg: {
  status: DemoRideStatus;
  riskLevel?: RiskLevel;
  event: Omit<DemoEvent, 'id' | 'timestamp'>;
  notifs: Omit<DemoNotification, 'id' | 'timestamp'>[];
}): DemoState {
  return {
    status: cfg.status,
    riskLevel: cfg.riskLevel ?? prev.riskLevel,
    events: [{ ...cfg.event, id: `e-${uid()}`, timestamp: ts() }, ...prev.events],
    notifications: [
      ...cfg.notifs.map(n => ({ ...n, id: `n-${uid()}`, timestamp: ts() })),
      ...prev.notifications,
    ],
  };
}

interface DemoScenarioContextValue {
  status: DemoRideStatus;
  events: DemoEvent[];
  notifications: DemoNotification[];
  riskLevel: RiskLevel;
  sendReadinessPrompt: () => void;
  patientReady: () => void;
  patientNeedsHelp: () => void;
  patientNotReady: () => void;
  patientCancelRequest: () => void;
  driverArrived: () => void;
  patientPickedUp: () => void;
  arrivedAtClinic: () => void;
  startTreatment: () => void;
  pickupFailed: () => void;
  resetDemoScenario: () => void;
}

const DemoScenarioContext = createContext<DemoScenarioContextValue | null>(null);

export function DemoScenarioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(loadState);

  const apply = useCallback((fn: (prev: DemoState) => DemoState) => {
    setState(prev => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const sendReadinessPrompt = useCallback(() => {
    apply(prev => {
      if (prev.status !== 'driver_en_route_to_patient') return prev;
      return transition(prev, {
        status: 'readiness_prompt_sent',
        event: { action: 'Readiness prompt sent', actor: 'System', actorRole: 'clinic', detail: 'Readiness check sent to Mary Johnson — driver is 10 minutes away.' },
        notifs: [
          { recipientRole: 'patient', title: 'Are You Ready?', message: 'Your driver is almost there. Please confirm you are ready for pickup.', severity: 'info' },
        ],
      });
    });
  }, [apply]);

  const patientReady = useCallback(() => {
    apply(prev => {
      if (prev.status !== 'driver_en_route_to_patient' && prev.status !== 'readiness_prompt_sent') return prev;
      return transition(prev, {
        status: 'patient_ready', riskLevel: 'low',
        event: { action: 'Patient confirmed ready', actor: 'Mary Johnson', actorRole: 'patient', detail: 'Mary Johnson confirmed she is ready for pickup. Driver, clinic, and caregiver notified.' },
        notifs: [
          { recipientRole: 'vendor', title: 'Patient Ready', message: 'Mary Johnson confirmed she is ready for pickup at 742 Evergreen Ave.', severity: 'success' },
          { recipientRole: 'clinic', title: 'Patient Ready', message: 'Mary Johnson is ready for pickup. Driver Tony Reeves is on the way.', severity: 'success' },
          { recipientRole: 'caregiver', title: 'Mary is Ready', message: 'Mary confirmed she is ready for her ride to Eastside Kidney Care.', severity: 'info' },
        ],
      });
    });
  }, [apply]);

  const patientNeedsHelp = useCallback(() => {
    apply(prev => {
      if (prev.status !== 'driver_en_route_to_patient' && prev.status !== 'readiness_prompt_sent') return prev;
      return transition(prev, {
        status: 'patient_needs_help', riskLevel: 'medium',
        event: { action: 'Patient needs help', actor: 'Mary Johnson', actorRole: 'patient', detail: 'Mary Johnson indicated she needs assistance before pickup. Door-to-door help may be required.' },
        notifs: [
          { recipientRole: 'vendor', title: 'Patient Needs Help', message: 'Mary Johnson needs assistance. Driver should prepare for door-to-door support.', severity: 'warning' },
          { recipientRole: 'clinic', title: 'Patient Needs Help', message: 'Mary Johnson needs assistance before pickup. Consider contacting caregiver.', severity: 'warning' },
          { recipientRole: 'caregiver', title: 'Mary Needs Help', message: 'Mary indicated she needs help getting ready for her ride. Please check on her.', severity: 'warning' },
        ],
      });
    });
  }, [apply]);

  const patientNotReady = useCallback(() => {
    apply(prev => {
      if (prev.status !== 'driver_en_route_to_patient' && prev.status !== 'readiness_prompt_sent') return prev;
      return transition(prev, {
        status: 'patient_not_ready', riskLevel: 'medium',
        event: { action: 'Patient not ready', actor: 'Mary Johnson', actorRole: 'patient', detail: 'Mary Johnson is not ready for pickup. Driver will wait. Potential delay to chair time.' },
        notifs: [
          { recipientRole: 'vendor', title: 'Patient Not Ready', message: 'Mary Johnson is not ready. Driver Tony Reeves should wait or circle back.', severity: 'warning' },
          { recipientRole: 'clinic', title: 'Patient Not Ready', message: 'Mary Johnson is not ready for pickup. Chair time 9:00 AM may be affected.', severity: 'warning' },
          { recipientRole: 'caregiver', title: 'Mary Not Ready', message: 'Mary is not ready for her ride. The driver has been notified to wait.', severity: 'warning' },
        ],
      });
    });
  }, [apply]);

  const patientCancelRequest = useCallback(() => {
    apply(prev => {
      if (prev.status === 'cancel_requested' || prev.status === 'pickup_failed' || prev.status === 'in_treatment') return prev;
      return transition(prev, {
        status: 'cancel_requested', riskLevel: 'high',
        event: { action: 'Ride cancellation requested', actor: 'Mary Johnson', actorRole: 'patient', detail: 'Mary Johnson requested to cancel today\'s ride. Treatment session at risk.' },
        notifs: [
          { recipientRole: 'vendor', title: 'Ride Canceled', message: 'Mary Johnson canceled today\'s ride. Recall driver Tony Reeves.', severity: 'critical' },
          { recipientRole: 'clinic', title: 'Ride Canceled', message: 'Mary Johnson canceled today\'s ride. 9:00 AM chair time will not be filled. Follow up needed.', severity: 'critical' },
          { recipientRole: 'caregiver', title: 'Ride Canceled', message: 'Mary canceled her ride to dialysis today. Please check on her.', severity: 'critical' },
        ],
      });
    });
  }, [apply]);

  const driverArrived = useCallback(() => {
    apply(prev => {
      const allowed: DemoRideStatus[] = ['driver_en_route_to_patient', 'readiness_prompt_sent', 'patient_ready', 'patient_needs_help', 'patient_not_ready'];
      if (!allowed.includes(prev.status)) return prev;
      return transition(prev, {
        status: 'driver_arrived', riskLevel: prev.riskLevel === 'high' ? 'high' : 'low',
        event: { action: 'Driver arrived', actor: 'Tony Reeves', actorRole: 'vendor', detail: 'Tony Reeves arrived at 742 Evergreen Ave. Waiting for Mary Johnson.' },
        notifs: [
          { recipientRole: 'patient', title: 'Driver Has Arrived', message: 'Tony Reeves is outside in the wheelchair van. He is ready when you are.', severity: 'info' },
          { recipientRole: 'clinic', title: 'Driver Arrived', message: 'Tony Reeves arrived at Mary Johnson\'s location.', severity: 'info' },
          { recipientRole: 'caregiver', title: 'Driver Arrived', message: 'The driver has arrived at Mary\'s location to pick her up.', severity: 'info' },
        ],
      });
    });
  }, [apply]);

  const patientPickedUp = useCallback(() => {
    apply(prev => {
      if (prev.status !== 'driver_arrived') return prev;
      return transition(prev, {
        status: 'en_route_to_clinic', riskLevel: 'low',
        event: { action: 'Patient picked up', actor: 'Tony Reeves', actorRole: 'vendor', detail: 'Mary Johnson picked up at 742 Evergreen Ave. En route to Eastside Kidney Care.' },
        notifs: [
          { recipientRole: 'patient', title: 'You\'re On Your Way', message: 'You\'re heading to Eastside Kidney Care. Estimated arrival in 20 minutes.', severity: 'success' },
          { recipientRole: 'clinic', title: 'Patient Picked Up', message: 'Mary Johnson picked up and en route. ETA approximately 20 minutes.', severity: 'success' },
          { recipientRole: 'caregiver', title: 'Mary Picked Up', message: 'Mary has been picked up and is on her way to the clinic.', severity: 'success' },
        ],
      });
    });
  }, [apply]);

  const arrivedAtClinic = useCallback(() => {
    apply(prev => {
      if (prev.status !== 'en_route_to_clinic') return prev;
      return transition(prev, {
        status: 'arrived_at_clinic', riskLevel: 'low',
        event: { action: 'Arrived at clinic', actor: 'Tony Reeves', actorRole: 'vendor', detail: 'Mary Johnson arrived at Eastside Kidney Care. Handed off to clinic staff.' },
        notifs: [
          { recipientRole: 'patient', title: 'You\'ve Arrived', message: 'Welcome to Eastside Kidney Care. Your chair is being prepared.', severity: 'success' },
          { recipientRole: 'clinic', title: 'Patient Arrived', message: 'Mary Johnson has arrived. Please prepare chair for 9:00 AM treatment.', severity: 'success' },
          { recipientRole: 'caregiver', title: 'Mary Arrived', message: 'Mary has arrived safely at Eastside Kidney Care.', severity: 'success' },
        ],
      });
    });
  }, [apply]);

  const startTreatment = useCallback(() => {
    apply(prev => {
      if (prev.status !== 'arrived_at_clinic') return prev;
      return transition(prev, {
        status: 'in_treatment', riskLevel: 'low',
        event: { action: 'Treatment started', actor: 'Dr. Sarah Patel', actorRole: 'clinic', detail: 'Mary Johnson\'s dialysis treatment has started. Chair time began at 9:00 AM.' },
        notifs: [
          { recipientRole: 'patient', title: 'Treatment Started', message: 'Your dialysis treatment has begun. Estimated duration: 4 hours.', severity: 'info' },
          { recipientRole: 'caregiver', title: 'Treatment Started', message: 'Mary\'s dialysis treatment has started at Eastside Kidney Care.', severity: 'info' },
        ],
      });
    });
  }, [apply]);

  const pickupFailed = useCallback(() => {
    apply(prev => {
      const allowed: DemoRideStatus[] = ['driver_en_route_to_patient', 'readiness_prompt_sent', 'patient_ready', 'patient_needs_help', 'patient_not_ready', 'driver_arrived'];
      if (!allowed.includes(prev.status)) return prev;
      return transition(prev, {
        status: 'pickup_failed', riskLevel: 'high',
        event: { action: 'Pickup failed', actor: 'Tony Reeves', actorRole: 'vendor', detail: 'Unable to pick up Mary Johnson. Reason to be determined. Treatment session at risk.' },
        notifs: [
          { recipientRole: 'patient', title: 'Pickup Issue', message: 'There was a problem with your pickup. Your clinic is working on a solution.', severity: 'critical' },
          { recipientRole: 'clinic', title: 'Pickup Failed', message: 'Tony Reeves unable to pick up Mary Johnson. Immediate rebooking needed for 9:00 AM chair time.', severity: 'critical' },
          { recipientRole: 'caregiver', title: 'Pickup Issue', message: 'There was a problem picking up Mary. The clinic has been notified.', severity: 'critical' },
        ],
      });
    });
  }, [apply]);

  const resetDemoScenario = useCallback(() => {
    const fresh = initialState();
    persist(fresh);
    setState(fresh);
  }, []);

  return (
    <DemoScenarioContext.Provider value={{
      status: state.status,
      events: state.events,
      notifications: state.notifications,
      riskLevel: state.riskLevel,
      sendReadinessPrompt,
      patientReady,
      patientNeedsHelp,
      patientNotReady,
      patientCancelRequest,
      driverArrived,
      patientPickedUp,
      arrivedAtClinic,
      startTreatment,
      pickupFailed,
      resetDemoScenario,
    }}>
      {children}
    </DemoScenarioContext.Provider>
  );
}

export function useDemoScenario(): DemoScenarioContextValue {
  const ctx = useContext(DemoScenarioContext);
  if (!ctx) throw new Error('useDemoScenario must be used within DemoScenarioProvider');
  return ctx;
}
