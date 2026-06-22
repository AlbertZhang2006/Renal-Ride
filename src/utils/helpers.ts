import type { Patient, Ride, RideStatus, RiskLevel } from '../types';

export function getPatientName(patient: Patient): string {
  return `${patient.firstName} ${patient.lastName}`;
}

const rideStatusLabels: Record<RideStatus, string> = {
  scheduled: 'Scheduled',
  driver_assigned: 'Driver Assigned',
  driver_en_route: 'Driver En Route',
  driver_arrived: 'Driver Arrived',
  picked_up: 'Picked Up',
  arrived_at_clinic: 'Arrived at Clinic',
  in_treatment: 'In Treatment',
  ready_for_return: 'Ready for Return',
  return_assigned: 'Return Assigned',
  returning_home: 'Returning Home',
  arrived_home: 'Arrived Home',
  completed: 'Completed',
  delayed: 'Delayed',
  missed: 'Missed',
  canceled: 'Canceled',
  issue_reported: 'Issue Reported',
};

export function getRideStatusLabel(status: RideStatus): string {
  return rideStatusLabels[status];
}

const riskLabels: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function getRiskLabel(level: RiskLevel): string {
  return riskLabels[level];
}

export function getTodayRides(rides: Ride[]): Ride[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return rides.filter((r) => {
    const pickup = new Date(r.pickupTime);
    return pickup >= today && pickup < tomorrow;
  });
}

export function calculateRideRiskSummary(rides: Ride[]): { low: number; medium: number; high: number } {
  const summary = { low: 0, medium: 0, high: 0 };
  for (const r of rides) {
    summary[r.riskLevel]++;
  }
  return summary;
}

export function formatTime(isoOrTime: string): string {
  if (isoOrTime.includes('T')) {
    const d = new Date(isoOrTime);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  const [h, m] = isoOrTime.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
