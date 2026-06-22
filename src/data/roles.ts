import type { User, UserRole, NavItem } from '../types';

export const roleLabels: Record<UserRole, string> = {
  patient: 'Patient',
  caregiver: 'Caregiver',
  clinic: 'Clinic Staff',
  vendor: 'Transport Vendor',
  admin: 'Admin',
};

export const roleDescriptions: Record<UserRole, string> = {
  patient: 'View and manage your ride schedule',
  caregiver: 'Coordinate rides for your patients',
  clinic: 'Manage clinic appointments and rides',
  vendor: 'Dispatch drivers and manage fleet',
  admin: 'System administration and oversight',
};

export const roleColors: Record<UserRole, { bg: string; text: string; dot: string }> = {
  patient: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  caregiver: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  clinic: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  vendor: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  admin: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
};

export const demoUsers: Record<UserRole, User> = {
  patient: { id: '1', name: 'Maria Santos', email: 'maria@example.com', role: 'patient' },
  caregiver: { id: '2', name: 'James Chen', email: 'james@example.com', role: 'caregiver' },
  clinic: { id: '3', name: 'Dr. Sarah Patel', email: 'sarah@example.com', role: 'clinic' },
  vendor: { id: '4', name: 'Mike Thompson', email: 'mike@example.com', role: 'vendor' },
  admin: { id: '5', name: 'Alex Rivera', email: 'alex@example.com', role: 'admin' },
};

export const roleNavItems: Record<UserRole, NavItem[]> = {
  patient: [
    { label: 'Today', path: '/app/patient', icon: 'dashboard' },
    { label: 'Schedule', path: '/app/patient/schedule', icon: 'schedule' },
    { label: 'Help', path: '/app/patient/help', icon: 'help' },
    { label: 'Profile', path: '/app/patient/profile', icon: 'profile' },
  ],
  caregiver: [
    { label: 'Status', path: '/app/caregiver', icon: 'dashboard' },
    { label: 'Alerts', path: '/app/caregiver/alerts', icon: 'alerts' },
    { label: 'Schedule', path: '/app/caregiver/schedule', icon: 'schedule' },
    { label: 'Help', path: '/app/caregiver/help', icon: 'help' },
  ],
  clinic: [
    { label: 'Dashboard', path: '/app/clinic', icon: 'dashboard' },
    { label: "Today's Rides", path: '/app/clinic/rides', icon: 'rides' },
    { label: 'Patients', path: '/app/clinic/patients', icon: 'patients' },
    { label: 'Standing Orders', path: '/app/clinic/standing-orders', icon: 'standing-orders' },
    { label: 'Return Rides', path: '/app/clinic/returns', icon: 'return-rides' },
    { label: 'Risk Queue', path: '/app/clinic/risk-queue', icon: 'risk-queue' },
    { label: 'Vendors', path: '/app/clinic/vendors', icon: 'vendors' },
    { label: 'Reports', path: '/app/clinic/reports', icon: 'reports' },
    { label: 'Settings', path: '/app/clinic/settings', icon: 'settings' },
  ],
  vendor: [
    { label: 'Dispatch', path: '/app/vendor', icon: 'dashboard' },
    { label: 'Trips', path: '/app/vendor/trips', icon: 'rides' },
    { label: 'Drivers', path: '/app/vendor/drivers', icon: 'drivers' },
    { label: 'Issues', path: '/app/vendor/issues', icon: 'risk-queue' },
    { label: 'Done', path: '/app/vendor/completed', icon: 'schedule' },
  ],
  admin: [
    { label: 'Overview', path: '/app/admin', icon: 'dashboard' },
    { label: 'Orgs', path: '/app/admin/orgs', icon: 'vendors' },
    { label: 'Users', path: '/app/admin/users', icon: 'users' },
    { label: 'Vendors', path: '/app/admin/vendors', icon: 'fleet' },
    { label: 'Reports', path: '/app/admin/reports', icon: 'reports' },
    { label: 'Audit', path: '/app/admin/audit', icon: 'audit' },
    { label: 'Settings', path: '/app/admin/settings', icon: 'settings' },
  ],
};
