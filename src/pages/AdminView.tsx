import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { patients, caregivers, clinic, rides, vendors, issues, standingOrders } from '../data/mock';
import { formatTime } from '../utils/helpers';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { RideDetail } from '../components/RideDetail';
import { cn } from '../utils/cn';
import type { Ride } from '../types';

type Tab = 'overview' | 'orgs' | 'users' | 'vendors' | 'reports' | 'audit' | 'settings';

function tabFromPath(path: string): Tab {
  if (path.endsWith('/orgs')) return 'orgs';
  if (path.endsWith('/users')) return 'users';
  if (path.endsWith('/vendors')) return 'vendors';
  if (path.endsWith('/reports')) return 'reports';
  if (path.endsWith('/audit')) return 'audit';
  if (path.endsWith('/settings')) return 'settings';
  return 'overview';
}

interface Toast { id: number; message: string; type: 'success' | 'info' }

// Derived data
const todayRides = rides;
const openIssues = issues.filter(i => !i.resolved);
const highRiskRides = rides.filter(r => r.riskLevel === 'high');

// Demo users with expanded roles
const demoUserList = [
  { id: 'u-1', name: 'Maria Santos', email: 'maria@example.com', role: 'Patient', status: 'active' as const, lastLogin: '2026-06-21T08:15:00Z' },
  { id: 'u-2', name: 'Robert Johnson', email: 'robert@example.com', role: 'Patient', status: 'active' as const, lastLogin: '2026-06-21T07:30:00Z' },
  { id: 'u-3', name: 'Carlos Santos', email: 'carlos.santos@example.com', role: 'Caregiver', status: 'active' as const, lastLogin: '2026-06-21T06:45:00Z' },
  { id: 'u-4', name: 'Linh Nguyen', email: 'linh.nguyen@example.com', role: 'Caregiver', status: 'active' as const, lastLogin: '2026-06-20T14:20:00Z' },
  { id: 'u-5', name: 'Dr. Sarah Patel', email: 'sarah@fresenius.com', role: 'Clinic Admin', status: 'active' as const, lastLogin: '2026-06-21T09:00:00Z' },
  { id: 'u-6', name: 'Nurse Kim Davis', email: 'kim.d@fresenius.com', role: 'Clinic Staff', status: 'active' as const, lastLogin: '2026-06-21T08:45:00Z' },
  { id: 'u-7', name: 'Mike Thompson', email: 'mike@careride.com', role: 'Vendor Dispatcher', status: 'active' as const, lastLogin: '2026-06-21T05:00:00Z' },
  { id: 'u-8', name: 'Tony Reeves', email: 'tony@careride.com', role: 'Driver', status: 'active' as const, lastLogin: '2026-06-21T04:45:00Z' },
  { id: 'u-9', name: 'Sandra Lee', email: 'sandra@metroaccess.com', role: 'Driver', status: 'active' as const, lastLogin: '2026-06-21T05:15:00Z' },
  { id: 'u-10', name: 'Alex Rivera', email: 'alex@renalride.com', role: 'System Admin', status: 'active' as const, lastLogin: '2026-06-21T09:10:00Z' },
  { id: 'u-11', name: 'Ray Gutierrez', email: 'ray@valleyhealth.com', role: 'Driver', status: 'inactive' as const, lastLogin: '2026-06-19T16:30:00Z' },
];

// Audit log events
function buildAuditLog() {
  const today = new Date();
  const at = (h: number, m: number) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  return [
    { id: 'al-1', time: at(4, 30), event: 'Ride Created', detail: 'Standing order generated 12 rides for today', actor: 'System', category: 'ride' as const },
    { id: 'al-2', time: at(4, 45), event: 'Vendor Assigned', detail: 'CareRide Medical Transport assigned to 6 rides', actor: 'System', category: 'vendor' as const },
    { id: 'al-3', time: at(4, 46), event: 'Vendor Assigned', detail: 'Valley Health Shuttle assigned to 3 rides', actor: 'System', category: 'vendor' as const },
    { id: 'al-4', time: at(4, 47), event: 'Vendor Assigned', detail: 'Metro Access Transport assigned to 3 rides', actor: 'System', category: 'vendor' as const },
    { id: 'al-5', time: at(5, 15), event: 'Ride Status Changed', detail: 'Maria S. — driver_en_route (Tony Reeves dispatched)', actor: 'CareRide Dispatch', category: 'ride' as const },
    { id: 'al-6', time: at(5, 18), event: 'Ride Status Changed', detail: 'Maria S. — picked_up at 1815 Alhambra Blvd', actor: 'Driver: Tony Reeves', category: 'ride' as const },
    { id: 'al-7', time: at(5, 20), event: 'Caregiver Notified', detail: 'Carlos Santos notified via SMS + email: Maria picked up', actor: 'System', category: 'notification' as const },
    { id: 'al-8', time: at(5, 22), event: 'Ride Status Changed', detail: 'Robert J. — picked_up by Sandra Lee', actor: 'Driver: Sandra Lee', category: 'ride' as const },
    { id: 'al-9', time: at(5, 25), event: 'Issue Reported', detail: 'Fatima A. — wrong_vehicle (male driver sent, female requested)', actor: 'Valley Health Dispatch', category: 'issue' as const },
    { id: 'al-10', time: at(5, 52), event: 'Ride Status Changed', detail: 'Maria S. — arrived_at_clinic', actor: 'Driver: Tony Reeves', category: 'ride' as const },
    { id: 'al-11', time: at(5, 55), event: 'Ride Status Changed', detail: 'Robert J. — arrived_at_clinic', actor: 'Driver: Sandra Lee', category: 'ride' as const },
    { id: 'al-12', time: at(6, 0), event: 'Ride Status Changed', detail: 'Maria S., Robert J. — in_treatment', actor: 'Clinic Staff', category: 'ride' as const },
    { id: 'al-13', time: at(6, 10), event: 'Issue Reported', detail: 'James C. — safety_concern (driver texting while driving)', actor: 'Patient', category: 'issue' as const },
    { id: 'al-14', time: at(9, 5), event: 'Issue Reported', detail: 'Dorothy W. — no_show_driver (original driver called off)', actor: 'CareRide Dispatch', category: 'issue' as const },
    { id: 'al-15', time: at(9, 8), event: 'Vendor Assigned', detail: 'Kevin Park assigned as replacement for Dorothy W.', actor: 'CareRide Dispatch', category: 'vendor' as const },
    { id: 'al-16', time: at(9, 33), event: 'Issue Reported', detail: 'Linda M. — late_pickup (driver 18min late, traffic on Florin)', actor: 'System', category: 'issue' as const },
    { id: 'al-17', time: at(10, 15), event: 'Return Ride Requested', detail: 'Maria S. — return ride triggered, estimated pickup 10:30 AM', actor: 'Clinic Staff', category: 'ride' as const },
    { id: 'al-18', time: at(10, 16), event: 'Caregiver Notified', detail: 'Carlos Santos notified: Maria ready for return', actor: 'System', category: 'notification' as const },
    { id: 'al-19', time: at(6, 5), event: 'Issue Resolved', detail: 'Patient complaint (vehicle cleanliness) for Robert J. resolved', actor: 'Clinic Staff', category: 'issue' as const },
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

const auditLog = buildAuditLog();

const auditCategoryStyles: Record<string, { bg: string; text: string }> = {
  ride: { bg: 'bg-blue-50', text: 'text-blue-700' },
  vendor: { bg: 'bg-amber-50', text: 'text-amber-700' },
  notification: { bg: 'bg-violet-50', text: 'text-violet-700' },
  issue: { bg: 'bg-red-50', text: 'text-red-700' },
};

const roleColors: Record<string, string> = {
  Patient: 'bg-blue-50 text-blue-700',
  Caregiver: 'bg-violet-50 text-violet-700',
  'Clinic Staff': 'bg-teal-50 text-teal-700',
  'Clinic Admin': 'bg-emerald-50 text-emerald-700',
  'Vendor Dispatcher': 'bg-amber-50 text-amber-700',
  Driver: 'bg-orange-50 text-orange-700',
  'System Admin': 'bg-slate-100 text-slate-700',
};

export function AdminView() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = tabFromPath(location.pathname);
  const isDemo = location.pathname.startsWith('/demo');

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settings, setSettings] = useState({
    pickupBufferMinutes: 45,
    highRiskThreshold: 3,
    caregiverNotifications: true,
    returnEscalationMinutes: 30,
    vendorBackupEscalation: true,
  });
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts(prev => prev.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const base = isDemo ? '/demo/admin' : '/app/admin';
  const tabItems: { key: Tab; label: string; path: string }[] = [
    { key: 'overview', label: 'Overview', path: base },
    { key: 'orgs', label: 'Orgs', path: `${base}/orgs` },
    { key: 'users', label: 'Users', path: `${base}/users` },
    { key: 'vendors', label: 'Vendors', path: `${base}/vendors` },
    { key: 'reports', label: 'Reports', path: `${base}/reports` },
    { key: 'audit', label: 'Audit', path: `${base}/audit` },
    { key: 'settings', label: 'Settings', path: `${base}/settings` },
  ];

  const filteredAudit = auditFilter === 'all'
    ? auditLog
    : auditLog.filter(e => e.category === auditFilter);

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
              'flex-1 py-2.5 px-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer text-center',
              tab === t.key
                ? 'bg-slate-100 text-slate-800 border-b-2 border-slate-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">System Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">Renal Ride administration dashboard</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Clinics', value: '1', sub: 'Fresenius Riverside', color: 'border-l-teal-400', icon: 'teal' },
              { label: 'Patients', value: String(patients.length), sub: `${patients.filter(p => p.riskLevel === 'high').length} high-risk`, color: 'border-l-blue-400', icon: 'blue' },
              { label: 'Vendors', value: String(vendors.length), sub: `${vendors.filter(v => v.supportsWheelchair).length} wheelchair-capable`, color: 'border-l-amber-400', icon: 'amber' },
              { label: 'Rides Today', value: String(todayRides.length), sub: `${todayRides.filter(r => r.direction === 'to-clinic').length} to clinic, ${todayRides.filter(r => r.direction === 'from-clinic').length} returns`, color: 'border-l-brand-400', icon: 'brand' },
              { label: 'Open Issues', value: String(openIssues.length), sub: `${openIssues.filter(i => i.severity === 'critical').length} critical`, color: 'border-l-red-400', icon: 'red' },
              { label: 'High-Risk Rides', value: String(highRiskRides.length), sub: `${((highRiskRides.length / todayRides.length) * 100).toFixed(0)}% of today's rides`, color: 'border-l-orange-400', icon: 'orange' },
            ].map(card => (
              <div key={card.label} className={cn('bg-white rounded-xl border border-gray-200 border-l-4 p-4', card.color)}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Quick stats row */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Today's Performance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {todayRides.filter(r => r.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-brand-600">
                  {todayRides.filter(r => r.status === 'in_treatment').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">In Treatment</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {todayRides.filter(r => ['scheduled', 'driver_assigned', 'driver_en_route'].includes(r.status)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {todayRides.filter(r => ['delayed', 'missed', 'issue_reported'].includes(r.status)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Issues</p>
              </div>
            </div>
          </div>

          {/* Standing orders + caregivers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Standing Orders</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active orders</span>
                  <span className="font-medium text-gray-900">{standingOrders.filter(s => s.active).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Wheelchair rides</span>
                  <span className="font-medium text-gray-900">{standingOrders.filter(s => s.rideType === 'wheelchair').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Will-call returns</span>
                  <span className="font-medium text-gray-900">{standingOrders.filter(s => s.returnMode === 'will-call').length}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Caregivers</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registered</span>
                  <span className="font-medium text-gray-900">{caregivers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">SMS notifications</span>
                  <span className="font-medium text-gray-900">{caregivers.filter(c => c.notificationPreference === 'sms' || c.notificationPreference === 'both').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email notifications</span>
                  <span className="font-medium text-gray-900">{caregivers.filter(c => c.notificationPreference === 'email' || c.notificationPreference === 'both').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent audit events */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
              <button
                onClick={() => navigate(`${base}/audit`)}
                className="text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                View all &rarr;
              </button>
            </div>
            <div className="space-y-3">
              {auditLog.slice(0, 5).map(entry => {
                const style = auditCategoryStyles[entry.category];
                return (
                  <div key={entry.id} className="flex items-start gap-3">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide shrink-0 mt-0.5', style.bg, style.text)}>
                      {entry.category}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 font-medium">{entry.event}</p>
                      <p className="text-xs text-gray-500 truncate">{entry.detail}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">{formatTime(entry.time)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== ORGANIZATIONS TAB ===== */}
      {tab === 'orgs' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Organizations</h1>
            <p className="text-sm text-gray-500 mt-0.5">Clinics and vendor organizations in the system</p>
          </div>

          {/* Clinic */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Clinics</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900">{clinic.name}</h4>
                  <p className="text-sm text-gray-500">{clinic.address}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>{clinic.phone}</span>
                    <span>Contact: {clinic.staffContact}</span>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{patients.length}</p>
                  <p className="text-xs text-gray-500">Patients</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{standingOrders.filter(s => s.active).length}</p>
                  <p className="text-xs text-gray-500">Active Orders</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{todayRides.length}</p>
                  <p className="text-xs text-gray-500">Rides Today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vendors */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Vendors</h3>
            <div className="space-y-3">
              {vendors.map(v => {
                const vRides = rides.filter(r => r.vendorId === v.id);
                return (
                  <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{v.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{v.serviceArea} &middot; {v.phone}</p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {v.supportsWheelchair && <Badge variant="neutral">Wheelchair</Badge>}
                      {v.supportsDoorThroughDoor && <Badge variant="neutral">Door-thru-door</Badge>}
                    </div>
                    <div className="border-t border-gray-100 mt-3 pt-3 grid grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{vRides.length}</p>
                        <p className="text-[10px] text-gray-500">Rides Today</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-600">{v.onTimeRate}%</p>
                        <p className="text-[10px] text-gray-500">On-Time</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-600">{v.averageDelayMinutes}m</p>
                        <p className="text-[10px] text-gray-500">Avg Delay</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-600">{v.cancellationRate}%</p>
                        <p className="text-[10px] text-gray-500">Cancel</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== USERS TAB ===== */}
      {tab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Users</h1>
              <p className="text-sm text-gray-500 mt-0.5">{demoUserList.length} registered users</p>
            </div>
          </div>

          {/* Role breakdown */}
          <div className="flex flex-wrap gap-2">
            {['Patient', 'Caregiver', 'Clinic Staff', 'Clinic Admin', 'Vendor Dispatcher', 'Driver', 'System Admin'].map(role => {
              const count = demoUserList.filter(u => u.role === role).length;
              return (
                <span key={role} className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', roleColors[role])}>
                  {role} ({count})
                </span>
              );
            })}
          </div>

          {/* User table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {demoUserList.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', roleColors[user.role])}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={user.status === 'active' ? 'success' : 'neutral'}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {new Date(user.lastLogin).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== VENDORS TAB ===== */}
      {tab === 'vendors' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Vendor Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Transportation vendor performance and configuration</p>
          </div>

          {vendors.map(v => {
            const vRides = rides.filter(r => r.vendorId === v.id);
            const vIssues = issues.filter(i => vRides.some(r => r.id === i.rideId));
            return (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{v.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{v.serviceArea} &middot; {v.phone}</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <p className="text-xl font-bold text-emerald-600">{v.onTimeRate}%</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">On-Time Rate</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <p className="text-xl font-bold text-amber-600">{v.averageDelayMinutes} min</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Avg Delay</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <p className="text-xl font-bold text-red-600">{v.cancellationRate}%</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Cancel Rate</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <p className="text-xl font-bold text-gray-900">{vRides.length}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Rides Today</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Capabilities</h4>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={v.supportsWheelchair ? 'success' : 'neutral'}>
                        {v.supportsWheelchair ? 'Wheelchair' : 'No Wheelchair'}
                      </Badge>
                      <Badge variant={v.supportsDoorThroughDoor ? 'success' : 'neutral'}>
                        {v.supportsDoorThroughDoor ? 'Door-thru-door' : 'No Door-thru-door'}
                      </Badge>
                    </div>
                  </div>

                  {vIssues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Open Issues ({vIssues.filter(i => !i.resolved).length})</h4>
                      {vIssues.filter(i => !i.resolved).map(issue => (
                        <div key={issue.id} className="bg-red-50 rounded-lg px-3 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-red-800">{issue.type.replace(/_/g, ' ')}</span>
                            <Badge variant={issue.severity === 'critical' ? 'danger' : issue.severity === 'high' ? 'high' : 'warning'}>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-red-700 mt-0.5">{issue.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== REPORTS TAB ===== */}
      {tab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">System-wide metrics and reporting</p>
          </div>

          {/* Ride breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Today's Ride Status Breakdown</h3>
            <div className="space-y-2">
              {[
                { label: 'Scheduled', count: rides.filter(r => r.status === 'scheduled').length, color: 'bg-blue-400' },
                { label: 'Driver Assigned', count: rides.filter(r => r.status === 'driver_assigned').length, color: 'bg-indigo-400' },
                { label: 'En Route', count: rides.filter(r => ['driver_en_route', 'driver_arrived'].includes(r.status)).length, color: 'bg-brand-400' },
                { label: 'In Treatment', count: rides.filter(r => r.status === 'in_treatment').length, color: 'bg-brand-600' },
                { label: 'Ready for Return', count: rides.filter(r => r.status === 'ready_for_return').length, color: 'bg-amber-400' },
                { label: 'Completed', count: rides.filter(r => r.status === 'completed').length, color: 'bg-emerald-400' },
                { label: 'Issues', count: rides.filter(r => ['delayed', 'missed', 'issue_reported'].includes(r.status)).length, color: 'bg-red-400' },
              ].filter(s => s.count > 0).map(stat => (
                <div key={stat.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-32 shrink-0">{stat.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full flex items-center justify-end pr-2', stat.color)}
                      style={{ width: `${Math.max((stat.count / rides.length) * 100, 12)}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{stat.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Patient Risk Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Low Risk', count: patients.filter(p => p.riskLevel === 'low').length, color: 'text-sky-600', bg: 'bg-sky-50' },
                { label: 'Medium Risk', count: patients.filter(p => p.riskLevel === 'medium').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'High Risk', count: patients.filter(p => p.riskLevel === 'high').length, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(r => (
                <div key={r.label} className={cn('rounded-xl p-4 text-center', r.bg)}>
                  <p className={cn('text-3xl font-bold', r.color)}>{r.count}</p>
                  <p className="text-xs text-gray-600 mt-1">{r.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor comparison */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Vendor Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">Vendor</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-500">Rides</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-500">On-Time</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-500">Avg Delay</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-500">Cancel</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(v => (
                    <tr key={v.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 font-medium text-gray-900 text-xs">{v.name}</td>
                      <td className="py-2.5 text-center text-xs">{rides.filter(r => r.vendorId === v.id).length}</td>
                      <td className="py-2.5 text-center">
                        <span className={cn('text-xs font-medium', v.onTimeRate >= 90 ? 'text-emerald-600' : 'text-amber-600')}>
                          {v.onTimeRate}%
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-xs">{v.averageDelayMinutes}m</td>
                      <td className="py-2.5 text-center text-xs">{v.cancellationRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Issue summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Issue Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['low', 'medium', 'high', 'critical'].map(sev => {
                const count = issues.filter(i => i.severity === sev).length;
                const colors: Record<string, string> = {
                  low: 'bg-sky-50 text-sky-700 border-sky-200',
                  medium: 'bg-amber-50 text-amber-700 border-amber-200',
                  high: 'bg-orange-50 text-orange-700 border-orange-200',
                  critical: 'bg-red-50 text-red-700 border-red-200',
                };
                return (
                  <div key={sev} className={cn('rounded-xl border p-3 text-center', colors[sev])}>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-[10px] font-medium mt-0.5 capitalize">{sev}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== AUDIT LOG TAB ===== */}
      {tab === 'audit' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500 mt-0.5">System events and activity trail</p>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'ride', label: 'Rides' },
              { key: 'vendor', label: 'Vendors' },
              { key: 'notification', label: 'Notifications' },
              { key: 'issue', label: 'Issues' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setAuditFilter(f.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
                  auditFilter === f.key
                    ? 'bg-slate-800 border-slate-800 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filteredAudit.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No events match this filter</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAudit.map(entry => {
                  const style = auditCategoryStyles[entry.category];
                  return (
                    <div
                      key={entry.id}
                      className={cn('px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors', entry.detail.includes('ride-') && 'cursor-pointer')}
                      onClick={() => {
                        const match = entry.detail.match(/ride-\d+/);
                        if (match) {
                          const ride = rides.find(r => r.id === match[0]);
                          if (ride) setSelectedRide(ride);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center shrink-0 pt-0.5">
                        <div className={cn('w-2.5 h-2.5 rounded-full', style.text.replace('text-', 'bg-'))} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{entry.event}</span>
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide', style.bg, style.text)}>
                            {entry.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{entry.detail}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">By {entry.actor}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{formatTime(entry.time)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {tab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure system behavior for demo mode</p>
          </div>

          <div className="space-y-4">
            {/* Pickup buffer */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Pickup Buffer Minutes</h3>
                  <p className="text-xs text-gray-500 mt-0.5">How many minutes before chair time should the ride arrive at the clinic</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={15}
                  max={90}
                  step={5}
                  value={settings.pickupBufferMinutes}
                  onChange={e => setSettings(prev => ({ ...prev, pickupBufferMinutes: Number(e.target.value) }))}
                  className="flex-1 accent-slate-600"
                />
                <span className="text-sm font-bold text-gray-900 w-16 text-right">{settings.pickupBufferMinutes} min</span>
              </div>
            </div>

            {/* High-risk threshold */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">High-Risk Threshold</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Number of risk factors before a ride is flagged as high-risk</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={settings.highRiskThreshold}
                  onChange={e => setSettings(prev => ({ ...prev, highRiskThreshold: Number(e.target.value) }))}
                  className="flex-1 accent-slate-600"
                />
                <span className="text-sm font-bold text-gray-900 w-16 text-right">{settings.highRiskThreshold}</span>
              </div>
            </div>

            {/* Caregiver notifications */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Caregiver Notifications</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically notify caregivers of ride status changes</p>
                </div>
                <button
                  onClick={() => {
                    const next = !settings.caregiverNotifications;
                    setSettings(prev => ({ ...prev, caregiverNotifications: next }));
                    addToast(`Caregiver notifications ${next ? 'enabled' : 'disabled'}`);
                  }}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors cursor-pointer',
                    settings.caregiverNotifications ? 'bg-emerald-500' : 'bg-gray-300',
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                    settings.caregiverNotifications && 'translate-x-5',
                  )} />
                </button>
              </div>
            </div>

            {/* Return escalation */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Return Ride Escalation</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Minutes after "ready for return" before escalating to clinic staff</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={60}
                  step={5}
                  value={settings.returnEscalationMinutes}
                  onChange={e => setSettings(prev => ({ ...prev, returnEscalationMinutes: Number(e.target.value) }))}
                  className="flex-1 accent-slate-600"
                />
                <span className="text-sm font-bold text-gray-900 w-16 text-right">{settings.returnEscalationMinutes} min</span>
              </div>
            </div>

            {/* Vendor backup escalation */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Vendor Backup Escalation</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically assign a backup vendor when the primary vendor cancels</p>
                </div>
                <button
                  onClick={() => {
                    const next = !settings.vendorBackupEscalation;
                    setSettings(prev => ({ ...prev, vendorBackupEscalation: next }));
                    addToast(`Vendor backup escalation ${next ? 'enabled' : 'disabled'}`);
                  }}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors cursor-pointer',
                    settings.vendorBackupEscalation ? 'bg-emerald-500' : 'bg-gray-300',
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                    settings.vendorBackupEscalation && 'translate-x-5',
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={() => addToast('Settings saved successfully')}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Save Settings
          </button>

          {/* Demo mode info */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Demo Mode:</span> Settings are stored in local state and will reset when you reload the page. In production, these would persist to the database.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ride Detail Modal */}
      <Modal open={selectedRide !== null} onClose={() => setSelectedRide(null)} title="Ride Details" wide>
        {selectedRide && <RideDetail ride={selectedRide} viewerRole="admin" />}
      </Modal>
    </div>
  );
}
