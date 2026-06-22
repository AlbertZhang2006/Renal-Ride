import type {
  Patient,
  Clinic,
  Vendor,
  Ride,
  StandingOrder,
  Issue,
  RideStatus,
  IssueType,
  IssueSeverity,
} from '../types';
import {
  patients as mockPatients,
  clinic as mockClinic,
  vendors as mockVendors,
  rides as mockRides,
  standingOrders as mockStandingOrders,
  issues as mockIssues,
} from './mock';

const patients = [...mockPatients];
const clinics = [mockClinic];
const vendors = [...mockVendors];
const rides = [...mockRides];
let standingOrders = [...mockStandingOrders];
let issues = [...mockIssues];

const nextId = {
  ride: rides.length + 1,
  standingOrder: standingOrders.length + 1,
  issue: issues.length + 1,
};

// ---- Reads ----

export function getPatients(): Patient[] {
  return patients;
}

export function getClinics(): Clinic[] {
  return clinics;
}

export function getVendors(): Vendor[] {
  return vendors;
}

export function getRides(): Ride[] {
  return rides;
}

export function getStandingOrders(): StandingOrder[] {
  return standingOrders;
}

export function getIssues(): Issue[] {
  return issues;
}

// ---- Writes ----

export function updateRideStatus(
  rideId: string,
  status: RideStatus,
  updates?: Partial<Ride>,
): Ride | null {
  const idx = rides.findIndex((r) => r.id === rideId);
  if (idx === -1) return null;
  rides[idx] = { ...rides[idx], status, ...updates };
  return rides[idx];
}

export function createStandingOrder(
  data: Omit<StandingOrder, 'id'>,
): StandingOrder {
  const order: StandingOrder = { id: `so-${nextId.standingOrder++}`, ...data };
  standingOrders = [...standingOrders, order];
  return order;
}

export function updateStandingOrder(
  id: string,
  updates: Partial<StandingOrder>,
): StandingOrder | null {
  const idx = standingOrders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  standingOrders[idx] = { ...standingOrders[idx], ...updates };
  return standingOrders[idx];
}

export function createIssue(data: {
  rideId: string;
  patientId: string;
  severity: IssueSeverity;
  type: IssueType;
  description: string;
}): Issue {
  const issue: Issue = {
    id: `issue-${nextId.issue++}`,
    createdAt: new Date().toISOString(),
    resolved: false,
    ...data,
  };
  issues = [...issues, issue];
  return issue;
}

export function resolveIssue(issueId: string): Issue | null {
  const idx = issues.findIndex((i) => i.id === issueId);
  if (idx === -1) return null;
  issues[idx] = { ...issues[idx], resolved: true };
  return issues[idx];
}
