import { patients, vendors, issues, clinic, caregivers } from '../data/mock';
import { getPatientName, formatTime, getRideStatusLabel } from '../utils/helpers';
import { StatusPill } from './StatusPill';
import { Badge } from './Badge';
import { ModalRow } from './Modal';
import { cn } from '../utils/cn';
import type { Ride, RideStatus, RiskLevel, UserRole } from '../types';

// ---------------------------------------------------------------------------
// Privacy modes — determines what each role can see
// ---------------------------------------------------------------------------

type PrivacyLevel = 'full' | 'caregiver' | 'patient' | 'vendor' | 'admin';

function privacyFromRole(role: UserRole): PrivacyLevel {
  switch (role) {
    case 'clinic': return 'full';
    case 'admin': return 'admin';
    case 'caregiver': return 'caregiver';
    case 'patient': return 'patient';
    case 'vendor': return 'vendor';
  }
}

interface RideDetailProps {
  ride: Ride;
  viewerRole: UserRole;
  statusOverride?: RideStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const assistanceLabels: Record<string, string> = {
  independent: 'Independent',
  'door-to-door': 'Door-to-door',
  'door-through-door': 'Door-through-door',
};

const mobilityLabels: Record<string, string> = {
  ambulatory: 'Ambulatory',
  wheelchair: 'Wheelchair',
  stretcher: 'Stretcher',
};

const riskVariant: Record<RiskLevel, 'low' | 'medium' | 'high'> = {
  low: 'low', medium: 'medium', high: 'high',
};

function patientDisplayName(patientId: string, privacy: PrivacyLevel): string {
  const p = patients.find(pt => pt.id === patientId);
  if (!p) return 'Unknown';
  if (privacy === 'vendor') return `${p.firstName} ${p.lastName[0]}.`;
  return getPatientName(p);
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

const timelineSteps: { key: string; label: string }[] = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'driver_assigned', label: 'Driver Assigned' },
  { key: 'driver_en_route', label: 'Driver En Route' },
  { key: 'driver_arrived', label: 'Arrived at Pickup' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'arrived_at_clinic', label: 'Arrived at Clinic' },
  { key: 'in_treatment', label: 'In Treatment' },
  { key: 'ready_for_return', label: 'Ready for Return' },
  { key: 'returning_home', label: 'Returning Home' },
  { key: 'completed', label: 'Completed' },
];

function getStepIndex(status: RideStatus): number {
  const map: Record<string, number> = {
    scheduled: 0, driver_assigned: 1, driver_en_route: 2, driver_arrived: 3,
    picked_up: 4, arrived_at_clinic: 5, in_treatment: 6,
    ready_for_return: 7, return_assigned: 7, returning_home: 8,
    arrived_home: 9, completed: 9,
  };
  return map[status] ?? 0;
}

function isIssueStatus(status: RideStatus): boolean {
  return ['delayed', 'missed', 'canceled', 'issue_reported'].includes(status);
}

function StatusTimeline({ status }: { status: RideStatus }) {
  const currentStep = getStepIndex(status);
  const hasIssue = isIssueStatus(status);

  return (
    <div className="space-y-0">
      {timelineSteps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const isLast = i === timelineSteps.length - 1;

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center w-5 shrink-0">
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2',
                isCompleted && 'bg-emerald-500 border-emerald-500',
                isCurrent && !hasIssue && 'bg-brand-500 border-brand-500',
                isCurrent && hasIssue && 'bg-red-500 border-red-500',
                !isCompleted && !isCurrent && 'bg-white border-gray-300',
              )}>
                {isCompleted && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
                {isCurrent && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
              </div>
              {!isLast && (
                <div className={cn(
                  'w-0.5 h-5',
                  i < currentStep ? 'bg-emerald-400' : 'bg-gray-200',
                )} />
              )}
            </div>
            <div className={cn(
              'pb-1 min-w-0 -mt-0.5',
              isCurrent && !hasIssue && 'font-semibold text-brand-700',
              isCurrent && hasIssue && 'font-semibold text-red-700',
              isCompleted && 'text-gray-600',
              !isCompleted && !isCurrent && 'text-gray-400',
            )}>
              <p className="text-xs leading-tight">{step.label}</p>
            </div>
          </div>
        );
      })}

      {/* Issue indicator */}
      {hasIssue && (
        <div className="flex items-start gap-3 mt-1">
          <div className="flex flex-col items-center w-5 shrink-0">
            <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-500 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold text-red-700 -mt-0.5">{getRideStatusLabel(status)}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RideDetail({ ride, viewerRole, statusOverride }: RideDetailProps) {
  const privacy = privacyFromRole(viewerRole);
  const status = statusOverride ?? ride.status;
  const patient = patients.find(p => p.id === ride.patientId);
  const vendor = vendors.find(v => v.id === ride.vendorId);
  const rideIssues = issues.filter(i => i.rideId === ride.id);
  const caregiver = patient ? caregivers.find(c => c.patientId === patient.id) : null;

  const canSeePatientDetails = privacy === 'full' || privacy === 'admin' || privacy === 'patient';
  const canSeeMedicalDetails = privacy === 'full' || privacy === 'admin';
  const canSeeCaregiverDetails = privacy !== 'vendor';

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
          {patient ? `${patient.firstName[0]}${patient.lastName[0]}` : '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {patientDisplayName(ride.patientId, privacy)}
          </p>
          <p className="text-[11px] text-gray-400">
            {ride.direction === 'to-clinic' ? 'To clinic' : 'Return home'}
            {' · '}{formatTime(ride.pickupTime)}
            {' · '}{ride.vehicleType}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={riskVariant[ride.riskLevel]}>
            {ride.riskLevel} risk
          </Badge>
          <StatusPill status={status} />
        </div>
      </div>

      {/* ── Patient details (privacy-gated) ── */}
      {canSeePatientDetails && patient && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Patient</p>
          <div className="space-y-0">
            {privacy !== 'patient' && <ModalRow label="Phone">{patient.phone}</ModalRow>}
            <ModalRow label="Language">{patient.preferredLanguage}</ModalRow>
            <ModalRow label="Mobility">{mobilityLabels[patient.mobilityLevel]}</ModalRow>
            <ModalRow label="Assistance">{assistanceLabels[patient.assistanceLevel]}</ModalRow>
            {canSeeMedicalDetails && (
              <ModalRow label="Schedule">{patient.treatmentDays.join(', ')}</ModalRow>
            )}
            {canSeeMedicalDetails && patient.notes && (
              <ModalRow label="Patient Notes">{patient.notes}</ModalRow>
            )}
          </div>
        </div>
      )}

      {/* Vendor sees only transport-relevant patient info */}
      {privacy === 'vendor' && patient && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Patient</p>
          <div className="space-y-0">
            <ModalRow label="Mobility">{mobilityLabels[patient.mobilityLevel]}</ModalRow>
            <ModalRow label="Assistance">{assistanceLabels[patient.assistanceLevel]}</ModalRow>
            <ModalRow label="Language">{patient.preferredLanguage}</ModalRow>
          </div>
        </div>
      )}

      {/* Caregiver sees linked patient */}
      {privacy === 'caregiver' && patient && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Patient</p>
          <div className="space-y-0">
            <ModalRow label="Phone">{patient.phone}</ModalRow>
            <ModalRow label="Language">{patient.preferredLanguage}</ModalRow>
            <ModalRow label="Mobility">{mobilityLabels[patient.mobilityLevel]}</ModalRow>
            <ModalRow label="Assistance">{assistanceLabels[patient.assistanceLevel]}</ModalRow>
            <ModalRow label="Schedule">{patient.treatmentDays.join(', ')}</ModalRow>
          </div>
        </div>
      )}

      {/* ── Ride details ── */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Ride</p>
        <div className="space-y-0">
          <ModalRow label="Pickup">{ride.pickupAddress}</ModalRow>
          <ModalRow label="Drop-off">{ride.dropoffAddress}</ModalRow>
          <ModalRow label="Pickup Time">{formatTime(ride.pickupTime)}</ModalRow>
          <ModalRow label="Chair Time">{formatTime(ride.chairTime)}</ModalRow>
          {ride.actualPickupTime && <ModalRow label="Actual Pickup">{formatTime(ride.actualPickupTime)}</ModalRow>}
          {ride.actualDropoffTime && <ModalRow label="Actual Dropoff">{formatTime(ride.actualDropoffTime)}</ModalRow>}
          <ModalRow label="Est. Return">{formatTime(ride.estimatedReturnTime)}</ModalRow>
          <ModalRow label="Vehicle">{ride.vehicleType}</ModalRow>
          <ModalRow label="Driver">{ride.driverName || 'Unassigned'}</ModalRow>
          <ModalRow label="Vendor">{vendor?.name ?? 'Unknown'}</ModalRow>
          {ride.notes && <ModalRow label="Notes">{ride.notes}</ModalRow>}
          {privacy !== 'vendor' && (
            <ModalRow label="Clinic Contact">{clinic.phone}</ModalRow>
          )}
          {privacy === 'vendor' && (
            <ModalRow label="Clinic">{clinic.phone}</ModalRow>
          )}
        </div>
      </div>

      {/* ── Caregiver info (clinic/admin only) ── */}
      {canSeeCaregiverDetails && caregiver && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Caregiver</p>
          <div className="space-y-0">
            <ModalRow label="Name">{caregiver.name}</ModalRow>
            <ModalRow label="Relationship">{caregiver.relationship}</ModalRow>
            <ModalRow label="Phone">{caregiver.phone}</ModalRow>
          </div>
        </div>
      )}

      {/* ── Status Timeline ── */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Status Timeline</p>
        <StatusTimeline status={status} />
      </div>

      {/* ── Issues ── */}
      {rideIssues.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Issues</p>
          <div className="space-y-2">
            {rideIssues.map(issue => (
              <div key={issue.id} className={cn(
                'rounded-lg border p-2.5',
                issue.resolved ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200',
              )}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge variant={!issue.resolved && (issue.severity === 'critical' || issue.severity === 'high') ? 'danger' : issue.resolved ? 'neutral' : 'warning'}>
                    {issue.severity}
                  </Badge>
                  <span className="text-xs text-gray-600">{issue.type.replace(/_/g, ' ')}</span>
                  {issue.resolved && <span className="text-[10px] text-emerald-600 font-medium ml-auto">Resolved</span>}
                </div>
                <p className="text-xs text-gray-500">{issue.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { StatusTimeline };
