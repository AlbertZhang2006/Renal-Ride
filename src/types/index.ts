export type UserRole = 'patient' | 'caregiver' | 'clinic' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

// --- Domain types ---

export type MobilityLevel = 'ambulatory' | 'wheelchair' | 'stretcher';
export type AssistanceLevel = 'independent' | 'door-to-door' | 'door-through-door';
export type RiskLevel = 'low' | 'medium' | 'high';
export type RideDirection = 'to-clinic' | 'from-clinic';
export type RideType = 'ambulatory' | 'wheelchair' | 'stretcher';
export type ReturnMode = 'scheduled' | 'will-call' | 'clinic-triggered';
export type NotificationPreference = 'sms' | 'email' | 'both' | 'none';

export type IssueType =
  | 'late_pickup'
  | 'no_show_driver'
  | 'no_show_patient'
  | 'wrong_vehicle'
  | 'patient_complaint'
  | 'driver_complaint'
  | 'safety_concern'
  | 'billing_dispute';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RideStatus =
  | 'scheduled'
  | 'driver_assigned'
  | 'driver_en_route'
  | 'driver_arrived'
  | 'picked_up'
  | 'arrived_at_clinic'
  | 'in_treatment'
  | 'ready_for_return'
  | 'return_assigned'
  | 'returning_home'
  | 'arrived_home'
  | 'completed'
  | 'delayed'
  | 'missed'
  | 'canceled'
  | 'issue_reported';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  dialysisClinicId: string;
  chairTime: string;
  treatmentDays: string[];
  mobilityLevel: MobilityLevel;
  assistanceLevel: AssistanceLevel;
  preferredLanguage: string;
  caregiverIds: string[];
  notes: string;
  riskLevel: RiskLevel;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  staffContact: string;
}

export interface Caregiver {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notificationPreference: NotificationPreference;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  serviceArea: string;
  supportsWheelchair: boolean;
  supportsDoorThroughDoor: boolean;
  onTimeRate: number;
  cancellationRate: number;
  averageDelayMinutes: number;
}

export interface Ride {
  id: string;
  patientId: string;
  clinicId: string;
  vendorId: string;
  driverName: string;
  vehicleType: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: string;
  chairTime: string;
  estimatedReturnTime: string;
  status: RideStatus;
  riskLevel: RiskLevel;
  rideType: RideType;
  direction: RideDirection;
  issueType: IssueType | null;
  notes: string;
  actualPickupTime: string | null;
  actualDropoffTime: string | null;
}

export interface StandingOrder {
  id: string;
  patientId: string;
  clinicId: string;
  vendorId: string;
  daysOfWeek: string[];
  pickupTime: string;
  chairTime: string;
  returnMode: ReturnMode;
  rideType: RideType;
  active: boolean;
  startDate: string;
  endDate: string | null;
  notes: string;
}

export interface Issue {
  id: string;
  rideId: string;
  patientId: string;
  severity: IssueSeverity;
  type: IssueType;
  description: string;
  createdAt: string;
  resolved: boolean;
}
