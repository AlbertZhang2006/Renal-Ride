import { useState, useCallback } from 'react';
import { rides, patients, vendors, clinic } from '../data/mock';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { RideDetail } from '../components/RideDetail';
import { cn } from '../utils/cn';
import { getPatientName, formatTime } from '../utils/helpers';
import type { Ride, RideStatus, RiskLevel } from '../types';

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface KanbanColumn {
  key: string;
  label: string;
  statuses: RideStatus[];
  color: string;
  dot: string;
}

const columns: KanbanColumn[] = [
  { key: 'scheduled',   label: 'Scheduled',        statuses: ['scheduled'],                          color: 'border-t-blue-400',    dot: 'bg-blue-400' },
  { key: 'assigned',    label: 'Driver Assigned',   statuses: ['driver_assigned'],                    color: 'border-t-indigo-400',  dot: 'bg-indigo-400' },
  { key: 'en-route',    label: 'En Route',          statuses: ['driver_en_route', 'driver_arrived'],  color: 'border-t-brand-400',   dot: 'bg-brand-400' },
  { key: 'at-clinic',   label: 'At Clinic',         statuses: ['arrived_at_clinic'],                  color: 'border-t-teal-400',    dot: 'bg-teal-400' },
  { key: 'treatment',   label: 'In Treatment',      statuses: ['in_treatment'],                       color: 'border-t-brand-500',   dot: 'bg-brand-500' },
  { key: 'return',      label: 'Ready for Return',  statuses: ['ready_for_return'],                   color: 'border-t-amber-400',   dot: 'bg-amber-400' },
  { key: 'returning',   label: 'Returning Home',    statuses: ['return_assigned', 'returning_home', 'arrived_home'], color: 'border-t-violet-400', dot: 'bg-violet-400' },
  { key: 'completed',   label: 'Completed',         statuses: ['completed'],                          color: 'border-t-emerald-400', dot: 'bg-emerald-400' },
  { key: 'issue',       label: 'Issue',             statuses: ['delayed', 'missed', 'canceled', 'issue_reported'],   color: 'border-t-red-400',    dot: 'bg-red-400' },
];

function getRidesForColumn(col: KanbanColumn): Ride[] {
  return rides.filter((r) => col.statuses.includes(r.status));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const riskVariant: Record<RiskLevel, 'low' | 'medium' | 'high'> = {
  low: 'low', medium: 'medium', high: 'high',
};

const assistanceLabels: Record<string, string> = {
  independent: 'Independent',
  'door-to-door': 'Door-to-door',
  'door-through-door': 'Door-thru-door',
};

function getVendorShort(id: string): string {
  const name = vendors.find((v) => v.id === id)?.name ?? 'Unknown';
  return name.split(' ').slice(0, 2).join(' ');
}

// ---------------------------------------------------------------------------
// Ride card
// ---------------------------------------------------------------------------

function RideCard({ ride, onClick }: { ride: Ride; onClick: () => void }) {
  const patient = patients.find((p) => p.id === ride.patientId);
  const isUrgent = ['delayed', 'missed', 'issue_reported'].includes(ride.status);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-white rounded-lg border p-3 transition-all cursor-pointer',
        'hover:shadow-sm hover:border-gray-300',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        isUrgent ? 'border-red-200 bg-red-50/50' : 'border-gray-200',
      )}
    >
      {/* Patient name + risk */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-semibold text-gray-500 shrink-0">
            {patient ? `${patient.firstName[0]}${patient.lastName[0]}` : '?'}
          </div>
          <span className="text-xs font-medium text-gray-900 truncate">
            {patient ? getPatientName(patient) : 'Unknown'}
          </span>
        </div>
        <Badge variant={riskVariant[ride.riskLevel]} className="shrink-0">{ride.riskLevel}</Badge>
      </div>

      {/* Details grid */}
      <div className="space-y-1 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Pickup</span>
          <span className="text-gray-700 font-medium">{formatTime(ride.pickupTime)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Chair</span>
          <span className="text-gray-700">{formatTime(ride.chairTime)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Type</span>
          <span className={cn(
            'text-gray-700',
            ride.rideType === 'wheelchair' && 'font-medium text-amber-700',
          )}>
            {ride.rideType === 'wheelchair' ? 'Wheelchair' : 'Ambulatory'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Assist</span>
          <span className={cn(
            'text-gray-700',
            patient?.assistanceLevel === 'door-through-door' && 'font-medium text-amber-700',
          )}>
            {patient ? assistanceLabels[patient.assistanceLevel] : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Vendor</span>
          <span className="text-gray-700 truncate ml-2">{getVendorShort(ride.vendorId)}</span>
        </div>
      </div>

      {/* Status + direction */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
        <span className={cn(
          'inline-flex items-center gap-1 text-[10px] font-medium',
          ride.direction === 'to-clinic' ? 'text-brand-600' : 'text-violet-600',
        )}>
          {ride.direction === 'to-clinic' ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          )}
          {ride.direction === 'to-clinic' ? 'To clinic' : 'Return'}
        </span>
        <StatusPill status={ride.status} className="text-[9px] px-1.5 py-0.5" />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Ride detail modal
// ---------------------------------------------------------------------------

function RideDetailModal({ ride, onClose }: { ride: Ride; onClose: () => void }) {
  return (
    <Modal open title="Ride Details" onClose={onClose} wide>
      <RideDetail ride={ride} viewerRole="clinic" />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ClinicRidesBoard() {
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const closeModal = useCallback(() => setSelectedRide(null), []);

  const totalRides = rides.length;
  const issueCount = rides.filter((r) => ['delayed', 'missed', 'issue_reported'].includes(r.status)).length;

  return (
    <div>
      <PageHeader
        title="Today's Rides"
        subtitle={`${clinic.name} — ${totalRides} rides scheduled${issueCount > 0 ? `, ${issueCount} with issues` : ''}`}
      />

      {/* Kanban board */}
      <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4">
        <div className="inline-flex gap-3 min-w-max">
          {columns.map((col) => {
            const colRides = getRidesForColumn(col);
            return (
              <div key={col.key} className="w-56 shrink-0">
                {/* Column header */}
                <div className={cn(
                  'bg-white rounded-t-lg border border-gray-200 border-t-2 px-3 py-2.5 flex items-center justify-between',
                  col.color,
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                    <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium rounded-full px-1.5 py-0.5',
                    colRides.length > 0 ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400',
                  )}>
                    {colRides.length}
                  </span>
                </div>

                {/* Cards area */}
                <div className={cn(
                  'bg-gray-50/80 rounded-b-lg border border-t-0 border-gray-200 p-2 space-y-2 min-h-[120px]',
                  colRides.length === 0 && 'flex flex-col items-center justify-center',
                )}>
                  {colRides.length === 0 ? (
                    <div className="text-center py-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-1">
                        <span className={cn('w-2 h-2 rounded-full', col.dot, 'opacity-40')} />
                      </div>
                      <p className="text-[10px] text-gray-400">No rides</p>
                    </div>
                  ) : (
                    colRides.map((ride) => (
                      <RideCard
                        key={ride.id}
                        ride={ride}
                        onClick={() => setSelectedRide(ride)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selectedRide && (
        <RideDetailModal ride={selectedRide} onClose={closeModal} />
      )}
    </div>
  );
}
