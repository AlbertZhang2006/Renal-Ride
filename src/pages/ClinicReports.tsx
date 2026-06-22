import { rides, patients, vendors, issues } from '../data/mock';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import type { RideStatus, RiskLevel } from '../types';

// ---------------------------------------------------------------------------
// Data derivation — all from mock data, no medical details
// ---------------------------------------------------------------------------

const missedRides = rides.filter(r => r.status === 'missed' || r.status === 'canceled');
const latePickups = rides.filter(r => r.status === 'delayed' || r.issueType === 'late_pickup');
const openIssues = issues.filter(i => !i.resolved);
const highRiskResolved = issues.filter(
  i => i.resolved && rides.find(r => r.id === i.rideId)?.riskLevel === 'high',
);

function avgPickupDelay(): number {
  const ridesWithActual = rides.filter(r => r.actualPickupTime);
  if (ridesWithActual.length === 0) return 0;
  const totalDelay = ridesWithActual.reduce((sum, r) => {
    const scheduled = new Date(r.pickupTime).getTime();
    const actual = new Date(r.actualPickupTime!).getTime();
    return sum + Math.max(0, (actual - scheduled) / 60000);
  }, 0);
  return Math.round(totalDelay / ridesWithActual.length);
}

function avgReturnWait(): number {
  const returnRides = rides.filter(
    r => r.direction === 'from-clinic' && r.status !== 'canceled',
  );
  if (returnRides.length === 0) return 0;
  return Math.round(
    returnRides.reduce((sum, r) => {
      const chair = new Date(r.pickupTime).getTime();
      const est = new Date(r.estimatedReturnTime).getTime();
      return sum + (est - chair) / 60000;
    }, 0) / returnRides.length,
  );
}

function vendorCancelRate(): string {
  const total = vendors.reduce((s, v) => s + v.cancellationRate, 0);
  return (total / vendors.length).toFixed(1);
}

// Status breakdown
type StatusGroup = { label: string; count: number; color: string };

function statusBreakdown(): StatusGroup[] {
  const groups: { label: string; statuses: RideStatus[]; color: string }[] = [
    { label: 'Scheduled', statuses: ['scheduled', 'driver_assigned'], color: 'bg-blue-400' },
    { label: 'En Route', statuses: ['driver_en_route', 'driver_arrived'], color: 'bg-brand-400' },
    { label: 'At Clinic', statuses: ['picked_up', 'arrived_at_clinic'], color: 'bg-teal-400' },
    { label: 'In Treatment', statuses: ['in_treatment'], color: 'bg-brand-600' },
    { label: 'Return', statuses: ['ready_for_return', 'return_assigned', 'returning_home', 'arrived_home'], color: 'bg-violet-400' },
    { label: 'Completed', statuses: ['completed'], color: 'bg-emerald-400' },
    { label: 'Issues', statuses: ['delayed', 'missed', 'canceled', 'issue_reported'], color: 'bg-red-400' },
  ];
  return groups.map(g => ({
    label: g.label,
    count: rides.filter(r => g.statuses.includes(r.status)).length,
    color: g.color,
  }));
}

// Issue types breakdown
function issuesByType(): { label: string; count: number; color: string }[] {
  const typeMap: Record<string, { label: string; color: string }> = {
    late_pickup: { label: 'Late Pickup', color: 'bg-amber-400' },
    no_show_driver: { label: 'Driver No-Show', color: 'bg-red-400' },
    no_show_patient: { label: 'Patient No-Show', color: 'bg-orange-400' },
    wrong_vehicle: { label: 'Wrong Vehicle', color: 'bg-purple-400' },
    patient_complaint: { label: 'Patient Complaint', color: 'bg-blue-400' },
    driver_complaint: { label: 'Driver Complaint', color: 'bg-indigo-400' },
    safety_concern: { label: 'Safety Concern', color: 'bg-red-600' },
    billing_dispute: { label: 'Billing Dispute', color: 'bg-gray-400' },
  };
  const counts: Record<string, number> = {};
  issues.forEach(i => {
    counts[i.type] = (counts[i.type] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([type, count]) => ({
      label: typeMap[type]?.label || type,
      count,
      color: typeMap[type]?.color || 'bg-gray-400',
    }))
    .sort((a, b) => b.count - a.count);
}

// Return ride wait times (mock distribution)
function returnWaitDistribution(): { label: string; count: number; color: string }[] {
  const returnRides = rides.filter(r => r.direction === 'from-clinic');
  const buckets = [
    { label: '< 15 min', min: 0, max: 15, color: 'bg-emerald-400' },
    { label: '15-30 min', min: 15, max: 30, color: 'bg-brand-400' },
    { label: '30-45 min', min: 30, max: 45, color: 'bg-amber-400' },
    { label: '45-60 min', min: 45, max: 60, color: 'bg-orange-400' },
    { label: '60+ min', min: 60, max: Infinity, color: 'bg-red-400' },
  ];
  return buckets.map(b => {
    const count = returnRides.filter(r => {
      const wait = (new Date(r.estimatedReturnTime).getTime() - new Date(r.pickupTime).getTime()) / 60000;
      return wait >= b.min && wait < b.max;
    }).length;
    return { label: b.label, count, color: b.color };
  });
}

// Missed treatment risk trend (mock weekly data)
const weeklyTrend = [
  { day: 'Mon', missed: 0, late: 1, onTime: 10 },
  { day: 'Tue', missed: 1, late: 2, onTime: 8 },
  { day: 'Wed', missed: 0, late: 0, onTime: 11 },
  { day: 'Thu', missed: 0, late: 1, onTime: 9 },
  { day: 'Fri', missed: 1, late: 3, onTime: 7 },
  { day: 'Sat', missed: 0, late: 1, onTime: 6 },
  { day: 'Today', missed: missedRides.length, late: latePickups.length, onTime: rides.filter(r => r.status !== 'delayed' && r.status !== 'missed' && r.status !== 'canceled').length },
];

const riskVariant: Record<RiskLevel, 'low' | 'medium' | 'high'> = {
  low: 'low', medium: 'medium', high: 'high',
};

// ---------------------------------------------------------------------------
// Bar chart components
// ---------------------------------------------------------------------------

function HorizontalBarChart({ data, maxValue }: { data: { label: string; count: number; color: string }[]; maxValue?: number }) {
  const max = maxValue ?? Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-28 shrink-0 text-right">{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            {d.count > 0 && (
              <div
                className={cn('h-full rounded-full flex items-center justify-end pr-2 transition-all', d.color)}
                style={{ width: `${Math.max((d.count / max) * 100, 8)}%` }}
              >
                <span className="text-[10px] font-bold text-white">{d.count}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StackedBarChart({ data }: { data: typeof weeklyTrend }) {
  const maxTotal = Math.max(...data.map(d => d.missed + d.late + d.onTime), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map(d => {
        const total = d.missed + d.late + d.onTime;
        const height = (total / maxTotal) * 100;
        const missedH = total > 0 ? (d.missed / total) * height : 0;
        const lateH = total > 0 ? (d.late / total) * height : 0;
        const onTimeH = total > 0 ? (d.onTime / total) * height : 0;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end rounded-t-md overflow-hidden" style={{ height: `${height}%` }}>
              {missedH > 0 && (
                <div className="bg-red-400 w-full" style={{ height: `${(missedH / height) * 100}%`, minHeight: '4px' }} />
              )}
              {lateH > 0 && (
                <div className="bg-amber-400 w-full" style={{ height: `${(lateH / height) * 100}%`, minHeight: '4px' }} />
              )}
              {onTimeH > 0 && (
                <div className="bg-emerald-400 w-full" style={{ height: `${(onTimeH / height) * 100}%`, minHeight: '4px' }} />
              )}
            </div>
            <span className={cn(
              'text-[10px] font-medium',
              d.day === 'Today' ? 'text-brand-700 font-semibold' : 'text-gray-500',
            )}>
              {d.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function VendorOnTimeChart() {
  return (
    <div className="space-y-3">
      {vendors.map(v => {
        const otColor = v.onTimeRate >= 92 ? 'bg-emerald-400' : v.onTimeRate >= 88 ? 'bg-amber-400' : 'bg-red-400';
        return (
          <div key={v.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">{v.name}</span>
              <span className={cn(
                'text-xs font-bold',
                v.onTimeRate >= 92 ? 'text-emerald-600' : v.onTimeRate >= 88 ? 'text-amber-600' : 'text-red-600',
              )}>
                {v.onTimeRate}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', otColor)}
                style={{ width: `${v.onTimeRate}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function exportCSV() {
  const header = 'Vendor,On-Time Rate,Cancellation Rate,Average Delay (min),Wheelchair Support,Door-Through-Door,Open Issues,Rides Today';
  const rows = vendors.map(v => {
    const vRides = rides.filter(r => r.vendorId === v.id);
    const vIssues = issues.filter(i => !i.resolved && vRides.some(r => r.id === i.rideId));
    return [
      `"${v.name}"`,
      v.onTimeRate,
      v.cancellationRate,
      v.averageDelayMinutes,
      v.supportsWheelchair ? 'Yes' : 'No',
      v.supportsDoorThroughDoor ? 'Yes' : 'No',
      vIssues.length,
      vRides.length,
    ].join(',');
  });

  const rideHeader = '\n\nRide ID,Patient,Direction,Status,Risk,Vendor,Pickup Time,Actual Pickup,Driver,Vehicle,Issue';
  const rideRows = rides.map(r => {
    const p = patients.find(pt => pt.id === r.patientId);
    const v = vendors.find(vn => vn.id === r.vendorId);
    return [
      r.id,
      p ? `"${p.firstName} ${p.lastName}"` : 'Unknown',
      r.direction,
      r.status,
      r.riskLevel,
      v ? `"${v.name}"` : 'Unknown',
      new Date(r.pickupTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      r.actualPickupTime ? new Date(r.actualPickupTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '',
      `"${r.driverName || 'Unassigned'}"`,
      `"${r.vehicleType}"`,
      r.issueType || '',
    ].join(',');
  });

  const csv = header + '\n' + rows.join('\n') + rideHeader + '\n' + rideRows.join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `renal-ride-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ClinicReports() {
  const statusData = statusBreakdown();
  const issueData = issuesByType();
  const returnData = returnWaitDistribution();
  const delayMin = avgPickupDelay();
  const returnWait = avgReturnWait();

  return (
    <div>
      <PageHeader
        title="Transportation Reports"
        subtitle="Transportation reliability metrics and vendor performance."
        action={
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </Button>
        }
      />

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <SummaryCard
          label="Missed Rides"
          value={missedRides.length}
          sub="this week"
          accent={missedRides.length > 0}
          color="border-l-red-400"
        />
        <SummaryCard
          label="Late Pickups"
          value={latePickups.length}
          sub="today"
          accent={latePickups.length > 0}
          color="border-l-amber-400"
        />
        <SummaryCard
          label="Avg Pickup Delay"
          value={`${delayMin}m`}
          sub="across all rides"
          accent={delayMin > 5}
          color="border-l-orange-400"
        />
        <SummaryCard
          label="Avg Return Wait"
          value={`${returnWait}m`}
          sub="from ready to pickup"
          accent={returnWait > 30}
          color="border-l-violet-400"
        />
        <SummaryCard
          label="Vendor Cancel Rate"
          value={`${vendorCancelRate()}%`}
          sub="avg across vendors"
          accent={false}
          color="border-l-gray-400"
        />
        <SummaryCard
          label="High-Risk Resolved"
          value={highRiskResolved.length}
          sub={`of ${openIssues.length + highRiskResolved.length} total`}
          accent={false}
          color="border-l-emerald-400"
        />
      </div>

      {/* ===== CHART GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* 1. Rides by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Rides by Status</h3>
          <HorizontalBarChart data={statusData} />
        </div>

        {/* 2. Vendor On-Time Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Vendor On-Time Performance</h3>
          <VendorOnTimeChart />
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> 92%+</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 88-91%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> &lt;88%</span>
          </div>
        </div>

        {/* 3. Transportation Issues by Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Transportation Issues by Type</h3>
          <p className="text-xs text-gray-400 mb-4">{issues.length} total issues &middot; {openIssues.length} unresolved</p>
          {issueData.length > 0 ? (
            <HorizontalBarChart data={issueData} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No issues reported</p>
          )}
        </div>

        {/* 4. Return Ride Wait Times */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Return Ride Wait Times</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution of estimated wait after treatment</p>
          <HorizontalBarChart data={returnData} />
        </div>
      </div>

      {/* 5. Missed Treatment Risk Trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Missed Treatment Risk Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">Daily breakdown of ride outcomes this week</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" /> On Time</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Late</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-400 inline-block" /> Missed</span>
          </div>
        </div>
        <StackedBarChart data={weeklyTrend} />
        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-emerald-600">
              {weeklyTrend.reduce((s, d) => s + d.onTime, 0)}
            </p>
            <p className="text-[10px] text-gray-500">On Time (week)</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">
              {weeklyTrend.reduce((s, d) => s + d.late, 0)}
            </p>
            <p className="text-[10px] text-gray-500">Late (week)</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">
              {weeklyTrend.reduce((s, d) => s + d.missed, 0)}
            </p>
            <p className="text-[10px] text-gray-500">Missed (week)</p>
          </div>
        </div>
      </div>

      {/* ===== VENDOR RELIABILITY TABLE ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Vendor Reliability</h3>
          <span className="text-xs text-gray-400">{vendors.length} vendors</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">On-Time Rate</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cancel Rate</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Delay</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Wheelchair</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Door-thru-door</th>
                <th className="text-center px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Open Issues</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => {
                const vRides = rides.filter(r => r.vendorId === v.id);
                const vOpenIssues = issues.filter(
                  i => !i.resolved && vRides.some(r => r.id === i.rideId),
                );
                return (
                  <tr key={v.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-400">{v.serviceArea} &middot; {vRides.length} rides today</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        'text-sm font-bold',
                        v.onTimeRate >= 92 ? 'text-emerald-600' :
                        v.onTimeRate >= 88 ? 'text-amber-600' : 'text-red-600',
                      )}>
                        {v.onTimeRate}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        'text-sm font-medium',
                        v.cancellationRate <= 2 ? 'text-emerald-600' :
                        v.cancellationRate <= 4 ? 'text-amber-600' : 'text-red-600',
                      )}>
                        {v.cancellationRate}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        'text-sm font-medium',
                        v.averageDelayMinutes <= 4 ? 'text-emerald-600' :
                        v.averageDelayMinutes <= 6 ? 'text-amber-600' : 'text-red-600',
                      )}>
                        {v.averageDelayMinutes} min
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center hidden md:table-cell">
                      {v.supportsWheelchair ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="neutral">No</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center hidden md:table-cell">
                      {v.supportsDoorThroughDoor ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="neutral">No</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {vOpenIssues.length > 0 ? (
                        <Badge variant="danger">{vOpenIssues.length}</Badge>
                      ) : (
                        <Badge variant="success">0</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer with overall stats */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>System average: {Math.round(vendors.reduce((s, v) => s + v.onTimeRate, 0) / vendors.length)}% on-time</span>
            <span>{openIssues.length} total open issues</span>
          </div>
        </div>
      </div>

      {/* Open issues detail */}
      {openIssues.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Unresolved Issues</h3>
          <div className="space-y-3">
            {openIssues.map(issue => {
              const ride = rides.find(r => r.id === issue.rideId);
              const patient = ride ? patients.find(p => p.id === ride.patientId) : null;
              const vendor = ride ? vendors.find(v => v.id === ride.vendorId) : null;
              return (
                <div
                  key={issue.id}
                  className={cn(
                    'rounded-lg border p-3',
                    issue.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    issue.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                    'bg-amber-50 border-amber-200',
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        issue.severity === 'critical' || issue.severity === 'high' ? 'danger' : 'warning'
                      }>
                        {issue.severity}
                      </Badge>
                      <span className="text-xs font-medium text-gray-700">
                        {issue.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {ride && <Badge variant={riskVariant[ride.riskLevel]}>{ride.riskLevel} risk</Badge>}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                    {patient && <span>{patient.firstName} {patient.lastName}</span>}
                    {vendor && <span>&middot; {vendor.name}</span>}
                    <span>&middot; {new Date(issue.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({ label, value, sub, accent, color }: {
  label: string;
  value: string | number;
  sub: string;
  accent: boolean;
  color: string;
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 border-l-4 px-4 py-3', color)}>
      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={cn('text-2xl font-bold mt-0.5', accent ? 'text-red-600' : 'text-gray-900')}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
