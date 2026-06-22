import { useState, useCallback } from 'react';
import { patients, caregivers, rides, standingOrders, vendors } from '../data/mock';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { StatusPill } from '../components/StatusPill';
import { Modal, ModalRow } from '../components/Modal';
import { cn } from '../utils/cn';
import { getPatientName, formatTime, formatDate } from '../utils/helpers';
import type { Patient, RiskLevel, Caregiver, MobilityLevel, AssistanceLevel } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const riskVariant: Record<RiskLevel, 'low' | 'medium' | 'high'> = { low: 'low', medium: 'medium', high: 'high' };

const assistanceLabels: Record<string, string> = {
  independent: 'Independent',
  'door-to-door': 'Door-to-door',
  'door-through-door': 'Door-thru-door',
};

function getPatientCaregivers(patientId: string): Caregiver[] {
  return caregivers.filter((c) => c.patientId === patientId);
}

function getPatientRides(patientId: string) {
  return rides.filter((r) => r.patientId === patientId);
}

function age(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

type FilterKey = 'all' | 'high-risk' | 'wheelchair' | 'door-through-door' | 'mwf' | 'tts';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'high-risk', label: 'High Risk' },
  { key: 'wheelchair', label: 'Wheelchair' },
  { key: 'door-through-door', label: 'Door-thru-door' },
  { key: 'mwf', label: 'M / W / F' },
  { key: 'tts', label: 'T / Th / Sat' },
];

function applyFilter(key: FilterKey, list: Patient[]): Patient[] {
  switch (key) {
    case 'high-risk': return list.filter((p) => p.riskLevel === 'high');
    case 'wheelchair': return list.filter((p) => p.mobilityLevel === 'wheelchair');
    case 'door-through-door': return list.filter((p) => p.assistanceLevel === 'door-through-door');
    case 'mwf': return list.filter((p) => p.treatmentDays.includes('Mon'));
    case 'tts': return list.filter((p) => p.treatmentDays.includes('Tue'));
    default: return list;
  }
}

function filterCount(key: FilterKey): number {
  return key === 'all' ? patients.length : applyFilter(key, patients).length;
}

// ---------------------------------------------------------------------------
// Modal types
// ---------------------------------------------------------------------------

type ModalState =
  | { type: 'profile'; patient: Patient }
  | { type: 'edit'; patient: Patient }
  | { type: 'standing-order'; patient: Patient }
  | { type: 'notify'; patient: Patient }
  | null;

// ---------------------------------------------------------------------------
// Patient profile modal
// ---------------------------------------------------------------------------

function PatientProfileModal({ patient, onClose, onAction }: {
  patient: Patient;
  onClose: () => void;
  onAction: (type: 'edit' | 'standing-order' | 'notify') => void;
}) {
  const cgs = getPatientCaregivers(patient.id);
  const patientRides = getPatientRides(patient.id);
  const recentRides = patientRides.slice(0, 4);
  const patientOrders = standingOrders.filter((o) => o.patientId === patient.id);
  const vendor = patientOrders.length > 0
    ? vendors.find((v) => v.id === patientOrders[0].vendorId)
    : null;

  return (
    <Modal open title="Patient Profile" onClose={onClose} wide>
      {/* Header with actions */}
      <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{getPatientName(patient)}</p>
            <p className="text-[11px] text-gray-400">
              {age(patient.dateOfBirth)} years old · {patient.preferredLanguage} · {patient.treatmentDays.join('/')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={riskVariant[patient.riskLevel]}>{patient.riskLevel} risk</Badge>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Button size="sm" variant="outline" onClick={() => onAction('edit')}>Edit Profile</Button>
        <Button size="sm" variant="outline" onClick={() => onAction('standing-order')}>Create Standing Order</Button>
        <Button size="sm" variant="outline" onClick={() => onAction('notify')}>Notify Caregiver</Button>
        <Button size="sm" variant="ghost">View Ride History</Button>
      </div>

      {/* Section 1: Basic Information */}
      <Section title="Basic Information">
        <ModalRow label="Full Name">{getPatientName(patient)}</ModalRow>
        <ModalRow label="Date of Birth">{formatDate(patient.dateOfBirth)} (age {age(patient.dateOfBirth)})</ModalRow>
        <ModalRow label="Phone">{patient.phone}</ModalRow>
        <ModalRow label="Address">{patient.address}</ModalRow>
        <ModalRow label="Language">{patient.preferredLanguage}</ModalRow>
      </Section>

      {/* Section 2: Dialysis Schedule */}
      <Section title="Dialysis Schedule">
        <ModalRow label="Treatment Days">
          <div className="flex gap-1 justify-end">
            {patient.treatmentDays.map((d) => (
              <span key={d} className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-semibold">{d}</span>
            ))}
          </div>
        </ModalRow>
        <ModalRow label="Chair Time">{formatTime(patient.chairTime)}</ModalRow>
        {patientOrders.length > 0 && (
          <>
            <ModalRow label="Standing Order">{patientOrders[0].active ? 'Active' : 'Inactive'} since {formatDate(patientOrders[0].startDate)}</ModalRow>
            <ModalRow label="Return Mode">{patientOrders[0].returnMode === 'will-call' ? 'Will-call' : 'Scheduled'}</ModalRow>
          </>
        )}
      </Section>

      {/* Section 3: Mobility and Assistance */}
      <Section title="Mobility & Assistance">
        <ModalRow label="Mobility">
          <span className={cn(patient.mobilityLevel === 'wheelchair' && 'font-medium text-amber-700')}>
            {patient.mobilityLevel}
          </span>
        </ModalRow>
        <ModalRow label="Assistance">
          <span className={cn(patient.assistanceLevel === 'door-through-door' && 'font-medium text-amber-700')}>
            {assistanceLabels[patient.assistanceLevel]}
          </span>
        </ModalRow>
      </Section>

      {/* Section 4: Caregiver Contacts */}
      <Section title="Caregiver Contacts">
        {cgs.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No caregivers on file</p>
        ) : (
          cgs.map((cg) => (
            <div key={cg.id} className="py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-900">{cg.name}</p>
                  <p className="text-[11px] text-gray-400">{cg.relationship} · {cg.phone}</p>
                </div>
                <Badge variant="neutral">{cg.notificationPreference}</Badge>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{cg.email}</p>
            </div>
          ))
        )}
      </Section>

      {/* Section 5: Transportation Preferences */}
      <Section title="Transportation Preferences">
        <ModalRow label="Ride Type">{patient.mobilityLevel === 'wheelchair' ? 'Wheelchair Van' : 'Sedan / SUV'}</ModalRow>
        <ModalRow label="Preferred Vendor">{vendor?.name ?? 'No preference'}</ModalRow>
        {patient.notes && patient.notes.toLowerCase().includes('driver') && (
          <ModalRow label="Driver Pref.">{patient.notes}</ModalRow>
        )}
      </Section>

      {/* Section 6: Recent Ride History */}
      <Section title="Recent Ride History">
        {recentRides.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No rides recorded</p>
        ) : (
          <div className="space-y-0">
            {recentRides.map((ride) => (
              <div key={ride.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-900">
                    {ride.direction === 'to-clinic' ? 'To clinic' : 'Return home'} · {formatTime(ride.pickupTime)}
                  </p>
                  <p className="text-[11px] text-gray-400">{ride.vehicleType} · {ride.driverName || 'Unassigned'}</p>
                </div>
                <StatusPill status={ride.status} className="text-[10px] px-1.5 py-0.5 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Section 7: Notes */}
      {patient.notes && (
        <Section title="Notes" last>
          <p className="text-xs text-gray-600 leading-relaxed">{patient.notes}</p>
        </Section>
      )}
    </Modal>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn(!last && 'mb-4')}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Profile modal
// ---------------------------------------------------------------------------

function EditProfileModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const [form, setForm] = useState({
    phone: patient.phone,
    address: patient.address,
    language: patient.preferredLanguage,
    mobility: patient.mobilityLevel,
    assistance: patient.assistanceLevel,
    notes: patient.notes,
  });

  return (
    <Modal open title="Edit Patient Profile" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{getPatientName(patient)}</p>
            <p className="text-[11px] text-gray-400">Editing profile</p>
          </div>
        </div>

        <FormField label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </FormField>

        <FormField label="Address">
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </FormField>

        <FormField label="Preferred Language">
          <select
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {['English', 'Spanish', 'Vietnamese', 'Arabic', 'Chinese', 'Russian'].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Mobility Level">
            <select
              value={form.mobility}
              onChange={(e) => setForm({ ...form, mobility: e.target.value as MobilityLevel })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ambulatory">Ambulatory</option>
              <option value="wheelchair">Wheelchair</option>
              <option value="stretcher">Stretcher</option>
            </select>
          </FormField>
          <FormField label="Assistance Level">
            <select
              value={form.assistance}
              onChange={(e) => setForm({ ...form, assistance: e.target.value as AssistanceLevel })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="independent">Independent</option>
              <option value="door-to-door">Door-to-door</option>
              <option value="door-through-door">Door-through-door</option>
            </select>
          </FormField>
        </div>

        <FormField label="Notes">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onClose}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Standing Order modal
// ---------------------------------------------------------------------------

function StandingOrderModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  return (
    <Modal open title="Create Standing Order" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="bg-brand-50 border border-brand-200/60 rounded-lg p-3">
          <p className="text-xs font-medium text-brand-800">New standing order for {getPatientName(patient)}</p>
          <p className="text-[11px] text-brand-600">This will auto-generate rides for each treatment day.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Treatment Days">
            <div className="flex gap-1.5 pt-1">
              {['Mon', 'Wed', 'Fri'].map((d) => (
                <label key={d} className="flex items-center gap-1">
                  <input type="checkbox" defaultChecked={patient.treatmentDays.includes(d)} className="rounded border-gray-300" />
                  <span className="text-xs text-gray-700">{d}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {['Tue', 'Thu', 'Sat'].map((d) => (
                <label key={d} className="flex items-center gap-1">
                  <input type="checkbox" defaultChecked={patient.treatmentDays.includes(d)} className="rounded border-gray-300" />
                  <span className="text-xs text-gray-700">{d}</span>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Chair Time">
            <input type="time" defaultValue={patient.chairTime} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ride Type">
            <select defaultValue={patient.mobilityLevel === 'wheelchair' ? 'wheelchair' : 'ambulatory'} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="ambulatory">Ambulatory</option>
              <option value="wheelchair">Wheelchair</option>
              <option value="stretcher">Stretcher</option>
            </select>
          </FormField>
          <FormField label="Return Mode">
            <select defaultValue="scheduled" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="scheduled">Scheduled</option>
              <option value="will-call">Will-call</option>
            </select>
          </FormField>
        </div>

        <FormField label="Preferred Vendor">
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">No preference</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </FormField>

        <FormField label="Notes">
          <textarea rows={2} placeholder="Special instructions for this standing order..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onClose}>Create Standing Order</Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Notify Caregiver modal
// ---------------------------------------------------------------------------

function NotifyCaregiverModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const cgs = getPatientCaregivers(patient.id);

  return (
    <Modal open title="Notify Caregiver" onClose={onClose}>
      <div className="space-y-4">
        {cgs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">No caregivers on file for {getPatientName(patient)}.</p>
            <p className="text-xs text-gray-400 mt-1">Add a caregiver to send notifications.</p>
          </div>
        ) : (
          <>
            <FormField label="Recipient">
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
                {cgs.map((cg) => (
                  <option key={cg.id} value={cg.id}>
                    {cg.name} ({cg.relationship}) — {cg.notificationPreference}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Channel">
              <select defaultValue={cgs[0]?.notificationPreference ?? 'sms'} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="both">Both SMS & Email</option>
              </select>
            </FormField>

            <FormField label="Message">
              <textarea
                rows={3}
                defaultValue={`Hello, this is an update regarding ${patient.firstName}'s dialysis transportation today.`}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </FormField>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[11px] text-gray-500">
                Caregiver: <span className="font-medium text-gray-700">{cgs[0].name}</span> · {cgs[0].phone} · {cgs[0].email}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={onClose}>Send Notification</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Form field wrapper
// ---------------------------------------------------------------------------

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ClinicPatients() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [modal, setModal] = useState<ModalState>(null);

  const closeModal = useCallback(() => setModal(null), []);

  const filtered = applyFilter(filter, patients).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
  });

  function openProfile(p: Patient) {
    setModal({ type: 'profile', patient: p });
  }

  function handleProfileAction(type: 'edit' | 'standing-order' | 'notify') {
    if (!modal || modal.type !== 'profile') return;
    setModal({ type, patient: modal.patient });
  }

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} dialysis patients enrolled at this clinic.`}
      />

      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-0">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                  filter === f.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
                )}
              >
                {f.label}
                <span className={cn(
                  'text-[10px] rounded-full px-1.5 py-px',
                  filter === f.key ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-500',
                )}>
                  {filterCount(f.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 pl-4 sm:pl-5 pr-3 py-2.5">Patient</th>
                <th className="text-left font-medium text-gray-500 px-3 py-2.5 hidden sm:table-cell">Phone</th>
                <th className="text-left font-medium text-gray-500 px-3 py-2.5">Schedule</th>
                <th className="text-left font-medium text-gray-500 px-3 py-2.5 hidden lg:table-cell">Chair Time</th>
                <th className="text-left font-medium text-gray-500 px-3 py-2.5 hidden md:table-cell">Mobility</th>
                <th className="text-left font-medium text-gray-500 px-3 py-2.5 hidden xl:table-cell">Assistance</th>
                <th className="text-left font-medium text-gray-500 px-3 py-2.5 hidden xl:table-cell">Caregiver</th>
                <th className="text-left font-medium text-gray-500 px-3 py-2.5">Risk</th>
                <th className="text-left font-medium text-gray-500 px-3 py-2.5 hidden lg:table-cell">Today</th>
                <th className="text-right font-medium text-gray-500 pl-3 pr-4 sm:pr-5 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-sm text-gray-400">
                    No patients match your search.
                  </td>
                </tr>
              )}
              {filtered.map((patient) => {
                const cgs = getPatientCaregivers(patient.id);
                const todayRides = getPatientRides(patient.id);
                const hasActiveRide = todayRides.some((r) =>
                  !['completed', 'canceled', 'missed'].includes(r.status),
                );

                return (
                  <tr
                    key={patient.id}
                    onClick={() => openProfile(patient)}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
                    {/* Patient */}
                    <td className="pl-4 sm:pl-5 pr-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-500 shrink-0">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{getPatientName(patient)}</p>
                          <p className="text-[11px] text-gray-400 sm:hidden">{patient.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2.5 text-gray-600 hidden sm:table-cell whitespace-nowrap">{patient.phone}</td>

                    {/* Treatment Days */}
                    <td className="px-3 py-2.5">
                      <div className="flex gap-0.5">
                        {patient.treatmentDays.map((d) => (
                          <span key={d} className="px-1 py-0.5 rounded bg-brand-50 text-brand-700 text-[9px] font-semibold">{d}</span>
                        ))}
                      </div>
                    </td>

                    {/* Chair Time */}
                    <td className="px-3 py-2.5 text-gray-600 hidden lg:table-cell whitespace-nowrap">{formatTime(patient.chairTime)}</td>

                    {/* Mobility */}
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className={cn(
                        'text-xs',
                        patient.mobilityLevel === 'wheelchair' ? 'font-medium text-amber-700' : 'text-gray-600',
                      )}>
                        {patient.mobilityLevel}
                      </span>
                    </td>

                    {/* Assistance */}
                    <td className="px-3 py-2.5 hidden xl:table-cell">
                      <span className={cn(
                        'text-xs',
                        patient.assistanceLevel === 'door-through-door' ? 'font-medium text-amber-700' : 'text-gray-500',
                      )}>
                        {assistanceLabels[patient.assistanceLevel]}
                      </span>
                    </td>

                    {/* Caregiver */}
                    <td className="px-3 py-2.5 hidden xl:table-cell">
                      {cgs.length > 0 ? (
                        <div>
                          <p className="text-xs text-gray-700">{cgs[0].name}</p>
                          <p className="text-[10px] text-gray-400">{cgs[0].relationship}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Risk */}
                    <td className="px-3 py-2.5">
                      <Badge variant={riskVariant[patient.riskLevel]}>{patient.riskLevel}</Badge>
                    </td>

                    {/* Today status */}
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      {todayRides.length > 0 ? (
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[11px] font-medium',
                          hasActiveRide ? 'text-brand-600' : 'text-gray-400',
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', hasActiveRide ? 'bg-brand-500' : 'bg-gray-300')} />
                          {todayRides.length} ride{todayRides.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-300">No rides</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="pl-3 pr-4 sm:pr-5 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => openProfile(patient)}>
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
            {filter !== 'all' && ` · filtered by "${filters.find((f) => f.key === filter)?.label}"`}
          </p>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'profile' && (
        <PatientProfileModal
          patient={modal.patient}
          onClose={closeModal}
          onAction={handleProfileAction}
        />
      )}
      {modal?.type === 'edit' && (
        <EditProfileModal patient={modal.patient} onClose={closeModal} />
      )}
      {modal?.type === 'standing-order' && (
        <StandingOrderModal patient={modal.patient} onClose={closeModal} />
      )}
      {modal?.type === 'notify' && (
        <NotifyCaregiverModal patient={modal.patient} onClose={closeModal} />
      )}
    </div>
  );
}
