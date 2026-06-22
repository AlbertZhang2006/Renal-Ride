import { useRole } from '../data/RoleContext';
import { roleLabels } from '../data/roles';
import { rides, patients, vendors, issues, clinic, caregivers } from '../data/mock';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { StatusPill } from '../components/StatusPill';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { getPatientName, formatTime, calculateRideRiskSummary } from '../utils/helpers';
import type { RiskLevel } from '../types';

const riskVariant: Record<RiskLevel, 'low' | 'medium' | 'high'> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
};

function useStats(role: string | null) {
  const activeRides = rides.filter((r) => !['completed', 'canceled', 'missed'].includes(r.status));
  const completedRides = rides.filter((r) => r.status === 'completed');
  const delayedRides = rides.filter((r) => r.status === 'delayed');
  const openIssues = issues.filter((i) => !i.resolved);
  const riskSummary = calculateRideRiskSummary(rides);

  switch (role) {
    case 'patient':
      return [
        { label: 'My Rides Today', value: String(rides.filter((r) => r.patientId === 'pt-1').length) },
        { label: 'Next Pickup', value: formatTime(rides.find((r) => r.patientId === 'pt-1' && r.status === 'ready_for_return')?.pickupTime ?? '') || 'None' },
        { label: 'Completed', value: String(completedRides.length) },
        { label: 'Clinic', value: clinic.name.split('—')[0].trim() },
      ];
    case 'caregiver':
      return [
        { label: 'Patients', value: String(caregivers.length) },
        { label: 'Active Rides', value: String(activeRides.length) },
        { label: 'Alerts', value: String(openIssues.length) },
        { label: 'Delayed', value: String(delayedRides.length) },
      ];
    case 'clinic':
      return [
        { label: 'Patients Today', value: String(new Set(rides.map((r) => r.patientId)).size) },
        { label: 'Rides Scheduled', value: String(rides.length) },
        { label: 'In Treatment', value: String(rides.filter((r) => r.status === 'in_treatment').length) },
        { label: 'Issues', value: String(openIssues.length) },
      ];
    case 'vendor':
      return [
        { label: 'Active Rides', value: String(activeRides.length) },
        { label: 'Completed Today', value: String(completedRides.length) },
        { label: 'Avg On-Time', value: `${Math.round(vendors.reduce((s, v) => s + v.onTimeRate, 0) / vendors.length)}%` },
        { label: 'Fleet Vehicles', value: String(vendors.length * 4) },
      ];
    default:
      return [
        { label: 'Total Patients', value: String(patients.length) },
        { label: 'Today\'s Rides', value: String(rides.length) },
        { label: 'High Risk', value: String(riskSummary.high) },
        { label: 'Open Issues', value: String(openIssues.length) },
      ];
  }
}

export function DashboardPage() {
  const { role } = useRole();
  const stats = useStats(role);
  const recentRides = rides.slice(0, 5);
  const riskSummary = calculateRideRiskSummary(rides);

  if (!role) return null;

  return (
    <div>
      <PageHeader
        title={`${roleLabels[role]} Dashboard`}
        subtitle={`${clinic.name} — ${rides.length} rides today`}
        action={<Button size="sm">New Ride Request</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent rides — takes 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Rides</CardTitle>
              <span className="text-xs text-gray-400">{rides.length} total</span>
            </div>
          </CardHeader>
          <div className="space-y-0">
            {recentRides.map((ride) => {
              const patient = patients.find((p) => p.id === ride.patientId);
              return (
                <div key={ride.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {patient ? getPatientName(patient) : 'Unknown'}
                      </p>
                      <Badge variant={riskVariant[ride.riskLevel]}>
                        {ride.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ride.direction === 'to-clinic' ? 'To clinic' : 'Return home'} · {formatTime(ride.pickupTime)} · {ride.vehicleType}
                    </p>
                  </div>
                  <StatusPill status={ride.status} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Risk summary */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Summary</CardTitle>
            </CardHeader>
            <div className="space-y-2.5">
              {(['high', 'medium', 'low'] as const).map((level) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={riskVariant[level]}>{level}</Badge>
                    <span className="text-sm text-gray-600">{level === 'high' ? 'High risk' : level === 'medium' ? 'Medium risk' : 'Low risk'}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{riskSummary[level]}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Open issues */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Open Issues</CardTitle>
                <Badge variant={issues.filter((i) => !i.resolved).length > 0 ? 'danger' : 'success'}>
                  {issues.filter((i) => !i.resolved).length}
                </Badge>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {issues.filter((i) => !i.resolved).slice(0, 3).map((issue) => {
                const patient = patients.find((p) => p.id === issue.patientId);
                return (
                  <div key={issue.id} className="text-sm">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge variant={issue.severity === 'critical' ? 'danger' : issue.severity === 'high' ? 'high' : 'medium'}>
                        {issue.severity}
                      </Badge>
                      <span className="text-gray-900 font-medium truncate">
                        {patient ? getPatientName(patient) : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{issue.description}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
