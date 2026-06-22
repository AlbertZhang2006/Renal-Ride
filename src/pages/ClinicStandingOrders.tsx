import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal, ModalRow } from '../components/Modal';
import { cn } from '../utils/cn';
import { patients, vendors, clinic, standingOrders as mockOrders } from '../data/mock';
import { getPatientName, formatTime, formatDate } from '../utils/helpers';
import type { StandingOrder, ReturnMode, RideType, AssistanceLevel } from '../types';

// ── Labels ──

const returnModeLabels: Record<ReturnMode, string> = {
  scheduled: 'Fixed-time return',
  'will-call': 'Call when ready',
  'clinic-triggered': 'Clinic-triggered',
};

const rideTypeLabels: Record<RideType, string> = {
  ambulatory: 'Ambulatory',
  wheelchair: 'Wheelchair',
  stretcher: 'Stretcher',
};

const assistanceLabels: Record<AssistanceLevel, string> = {
  independent: 'Independent',
  'door-to-door': 'Door-to-door',
  'door-through-door': 'Door-thru-door',
};

const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// ── Exception types ──

type ExceptionType = 'holiday_hold' | 'temp_address' | 'hospitalization' | 'cancel_occurrence' | 'chair_time_change';

interface ScheduleException {
  id: string;
  orderId: string;
  type: ExceptionType;
  date: string;
  endDate?: string;
  detail: string;
  resolved: boolean;
}

const exceptionTypeLabels: Record<ExceptionType, string> = {
  holiday_hold: 'Holiday Hold',
  temp_address: 'Temporary Pickup Address',
  hospitalization: 'Hospitalization Pause',
  cancel_occurrence: 'Cancel One Occurrence',
  chair_time_change: 'One-time Chair Time Change',
};

const exceptionTypeDescriptions: Record<ExceptionType, string> = {
  holiday_hold: 'Pause rides for a holiday or clinic closure',
  temp_address: 'Use a different pickup address for one or more dates',
  hospitalization: 'Pause all rides while patient is hospitalized',
  cancel_occurrence: 'Skip one specific ride occurrence',
  chair_time_change: 'Change chair time for a single treatment',
};

// ── Filters ──

type Filter = 'all' | 'active' | 'inactive' | 'mwf' | 'tts';

function getFilterLabel(f: Filter): string {
  const map: Record<Filter, string> = {
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    mwf: 'M/W/F',
    tts: 'T/Th/Sat',
  };
  return map[f];
}

function matchesFilter(o: StandingOrder, f: Filter): boolean {
  switch (f) {
    case 'active':
      return o.active;
    case 'inactive':
      return !o.active;
    case 'mwf':
      return o.daysOfWeek.some((d) => ['Mon', 'Wed', 'Fri'].includes(d));
    case 'tts':
      return o.daysOfWeek.some((d) => ['Tue', 'Thu', 'Sat'].includes(d));
    default:
      return true;
  }
}

// ── Mock Exceptions ──

function buildMockExceptions(): ScheduleException[] {
  return [
    {
      id: 'exc-1',
      orderId: 'so-1',
      type: 'holiday_hold',
      date: '2026-07-04',
      detail: 'Independence Day — clinic closed',
      resolved: false,
    },
    {
      id: 'exc-2',
      orderId: 'so-3',
      type: 'hospitalization',
      date: '2026-06-10',
      endDate: '2026-06-17',
      detail: 'Admitted to Sutter Medical — pneumonia',
      resolved: true,
    },
    {
      id: 'exc-3',
      orderId: 'so-4',
      type: 'temp_address',
      date: '2026-06-23',
      detail: "Staying at grandson's: 1520 J St, Sacramento, CA 95814",
      resolved: false,
    },
    {
      id: 'exc-4',
      orderId: 'so-7',
      type: 'chair_time_change',
      date: '2026-06-25',
      detail: 'Moved to 10:00 AM slot for cardiology consult at 2:00 PM',
      resolved: false,
    },
    {
      id: 'exc-5',
      orderId: 'so-8',
      type: 'cancel_occurrence',
      date: '2026-06-20',
      detail: 'Patient traveling out of town',
      resolved: true,
    },
  ];
}

// ── Empty Form ──

interface FormState {
  patientId: string;
  clinicId: string;
  vendorId: string;
  daysOfWeek: string[];
  pickupTime: string;
  chairTime: string;
  returnMode: ReturnMode;
  rideType: RideType;
  assistanceLevel: AssistanceLevel;
  startDate: string;
  endDate: string;
  notes: string;
  active: boolean;
}

function emptyForm(): FormState {
  return {
    patientId: '',
    clinicId: clinic.id,
    vendorId: '',
    daysOfWeek: [],
    pickupTime: '',
    chairTime: '',
    returnMode: 'scheduled',
    rideType: 'ambulatory',
    assistanceLevel: 'independent',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    notes: '',
    active: true,
  };
}

function orderToForm(o: StandingOrder): FormState {
  const patient = patients.find((p) => p.id === o.patientId);
  return {
    patientId: o.patientId,
    clinicId: o.clinicId,
    vendorId: o.vendorId,
    daysOfWeek: [...o.daysOfWeek],
    pickupTime: o.pickupTime,
    chairTime: o.chairTime,
    returnMode: o.returnMode,
    rideType: o.rideType,
    assistanceLevel: patient?.assistanceLevel ?? 'independent',
    startDate: o.startDate,
    endDate: o.endDate ?? '',
    notes: o.notes,
    active: o.active,
  };
}

// ── Exception Form ──

interface ExceptionFormState {
  type: ExceptionType;
  date: string;
  endDate: string;
  detail: string;
}

function emptyExceptionForm(): ExceptionFormState {
  return {
    type: 'holiday_hold',
    date: '',
    endDate: '',
    detail: '',
  };
}

// ══════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════

export function ClinicStandingOrders() {
  const [orders, setOrders] = useState<StandingOrder[]>(mockOrders);
  const [exceptions, setExceptions] = useState<ScheduleException[]>(buildMockExceptions);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [viewOrder, setViewOrder] = useState<StandingOrder | null>(null);

  const [excModalOpen, setExcModalOpen] = useState(false);
  const [excOrderId, setExcOrderId] = useState<string | null>(null);
  const [excForm, setExcForm] = useState<ExceptionFormState>(emptyExceptionForm);

  // ── Derived ──

  const filtered = orders.filter((o) => {
    const patient = patients.find((p) => p.id === o.patientId);
    if (!patient) return false;
    if (search && !getPatientName(patient).toLowerCase().includes(search.toLowerCase())) return false;
    return matchesFilter(o, filter);
  });

  const counts: Record<Filter, number> = {
    all: orders.length,
    active: orders.filter((o) => o.active).length,
    inactive: orders.filter((o) => !o.active).length,
    mwf: orders.filter((o) => o.daysOfWeek.some((d) => ['Mon', 'Wed', 'Fri'].includes(d))).length,
    tts: orders.filter((o) => o.daysOfWeek.some((d) => ['Tue', 'Thu', 'Sat'].includes(d))).length,
  };

  // ── Handlers ──

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(o: StandingOrder) {
    setEditingId(o.id);
    setForm(orderToForm(o));
    setFormOpen(true);
  }

  function saveOrder() {
    if (editingId) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editingId
            ? {
                ...o,
                patientId: form.patientId,
                clinicId: form.clinicId,
                vendorId: form.vendorId,
                daysOfWeek: form.daysOfWeek,
                pickupTime: form.pickupTime,
                chairTime: form.chairTime,
                returnMode: form.returnMode,
                rideType: form.rideType,
                startDate: form.startDate,
                endDate: form.endDate || null,
                notes: form.notes,
                active: form.active,
              }
            : o,
        ),
      );
    } else {
      const newOrder: StandingOrder = {
        id: `so-${Date.now()}`,
        patientId: form.patientId,
        clinicId: form.clinicId,
        vendorId: form.vendorId,
        daysOfWeek: form.daysOfWeek,
        pickupTime: form.pickupTime,
        chairTime: form.chairTime,
        returnMode: form.returnMode,
        rideType: form.rideType,
        startDate: form.startDate,
        endDate: form.endDate || null,
        notes: form.notes,
        active: form.active,
      };
      setOrders((prev) => [...prev, newOrder]);
    }
    setFormOpen(false);
  }

  function toggleActive(id: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o)));
  }

  function openExceptions(orderId: string) {
    setExcOrderId(orderId);
    setExcForm(emptyExceptionForm());
    setExcModalOpen(true);
  }

  function addException() {
    if (!excOrderId || !excForm.date || !excForm.detail) return;
    const exc: ScheduleException = {
      id: `exc-${Date.now()}`,
      orderId: excOrderId,
      type: excForm.type,
      date: excForm.date,
      endDate: excForm.endDate || undefined,
      detail: excForm.detail,
      resolved: false,
    };
    setExceptions((prev) => [...prev, exc]);
    setExcForm(emptyExceptionForm());
  }

  function resolveException(id: string) {
    setExceptions((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: !e.resolved } : e)));
  }

  // ── Stats ──

  const stats = [
    { label: 'Total Orders', value: orders.length, color: 'text-gray-900' },
    { label: 'Active', value: counts.active, color: 'text-emerald-600' },
    { label: 'Inactive', value: counts.inactive, color: 'text-gray-400' },
    {
      label: 'Upcoming Exceptions',
      value: exceptions.filter((e) => !e.resolved).length,
      color: 'text-amber-600',
    },
  ];

  // ══════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title="Standing Orders"
        subtitle="Manage recurring dialysis transportation schedules"
        action={
          <Button onClick={openCreate} size="sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Standing Order
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="!p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={cn('text-2xl font-semibold mt-1', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-brand-50 border border-brand-100 mb-6">
        <svg className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
        <div>
          <p className="text-sm font-medium text-brand-900">Standing orders drive daily ride generation</p>
          <p className="text-xs text-brand-700 mt-0.5">
            Each active standing order automatically generates rides for the patient's treatment days. Use schedule exceptions to handle holidays, hospitalizations, and one-time changes without modifying the base order.
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-300 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'active', 'inactive', 'mwf', 'tts'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {getFilterLabel(f)}
              <span className={cn('ml-1.5', filter === f ? 'text-gray-300' : 'text-gray-400')}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Patient', 'Treatment Days', 'Pickup', 'Chair Time', 'Return Mode', 'Ride Type', 'Vendor', 'Status', ''].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const patient = patients.find((p) => p.id === o.patientId);
                const vendor = vendors.find((v) => v.id === o.vendorId);
                const orderExceptions = exceptions.filter((e) => e.orderId === o.id && !e.resolved);
                return (
                  <tr
                    key={o.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setViewOrder(o)}
                  >
                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {patient ? patient.firstName[0] + patient.lastName[0] : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {patient ? getPatientName(patient) : 'Unknown'}
                          </p>
                          {orderExceptions.length > 0 && (
                            <p className="text-[11px] text-amber-600 mt-0.5">
                              {orderExceptions.length} exception{orderExceptions.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Days */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {o.daysOfWeek.map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center justify-center w-7 h-6 rounded text-[11px] font-medium bg-gray-100 text-gray-700"
                          >
                            {d.slice(0, 2)}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Pickup */}
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatTime(o.pickupTime)}</td>
                    {/* Chair */}
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatTime(o.chairTime)}</td>
                    {/* Return Mode */}
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          o.returnMode === 'will-call'
                            ? 'warning'
                            : o.returnMode === 'clinic-triggered'
                              ? 'low'
                              : 'neutral'
                        }
                      >
                        {returnModeLabels[o.returnMode]}
                      </Badge>
                    </td>
                    {/* Ride Type */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          o.rideType === 'wheelchair' ? 'text-amber-700' : o.rideType === 'stretcher' ? 'text-red-700' : 'text-gray-600',
                        )}
                      >
                        {rideTypeLabels[o.rideType]}
                      </span>
                    </td>
                    {/* Vendor */}
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">
                      {vendor?.name ?? '—'}
                    </td>
                    {/* Active */}
                    <td className="px-4 py-3">
                      <Badge variant={o.active ? 'success' : 'neutral'}>
                        {o.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(o)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openExceptions(o.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Schedule Exceptions"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleActive(o.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors cursor-pointer',
                            o.active
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50',
                          )}
                          title={o.active ? 'Deactivate' : 'Activate'}
                        >
                          {o.active ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                    No standing orders match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer count */}
      <p className="text-xs text-gray-400 mt-3">
        Showing {filtered.length} of {orders.length} standing order{orders.length !== 1 ? 's' : ''}
        {filter !== 'all' && ` (${getFilterLabel(filter)})`}
      </p>

      {/* ════ View Detail Modal ════ */}
      <ViewDetailModal
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        exceptions={exceptions.filter((e) => e.orderId === viewOrder?.id)}
        onEdit={() => {
          if (viewOrder) {
            setViewOrder(null);
            openEdit(viewOrder);
          }
        }}
        onExceptions={() => {
          if (viewOrder) {
            const id = viewOrder.id;
            setViewOrder(null);
            openExceptions(id);
          }
        }}
      />

      {/* ════ Create/Edit Form Modal ════ */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Edit Standing Order' : 'Create Standing Order'} wide>
        <div className="space-y-4">
          {/* Patient */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Patient</label>
            <select
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {getPatientName(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Clinic + Vendor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Clinic</label>
              <select
                value={form.clinicId}
                onChange={(e) => setForm({ ...form, clinicId: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={clinic.id}>{clinic.name}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vendor</label>
              <select
                value={form.vendorId}
                onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Treatment Days</label>
            <div className="flex gap-2">
              {allDays.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    const days = form.daysOfWeek.includes(d)
                      ? form.daysOfWeek.filter((x) => x !== d)
                      : [...form.daysOfWeek, d];
                    setForm({ ...form, daysOfWeek: days });
                  }}
                  className={cn(
                    'w-10 h-9 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    form.daysOfWeek.includes(d)
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {d.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Time</label>
              <input
                type="time"
                value={form.pickupTime}
                onChange={(e) => setForm({ ...form, pickupTime: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Chair Time</label>
              <input
                type="time"
                value={form.chairTime}
                onChange={(e) => setForm({ ...form, chairTime: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Return Mode + Ride Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Return Mode</label>
              <select
                value={form.returnMode}
                onChange={(e) => setForm({ ...form, returnMode: e.target.value as ReturnMode })}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="scheduled">Fixed-time return</option>
                <option value="will-call">Call when ready</option>
                <option value="clinic-triggered">Clinic-triggered</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ride Type</label>
              <select
                value={form.rideType}
                onChange={(e) => setForm({ ...form, rideType: e.target.value as RideType })}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ambulatory">Ambulatory</option>
                <option value="wheelchair">Wheelchair</option>
                <option value="stretcher">Stretcher</option>
              </select>
            </div>
          </div>

          {/* Assistance Level */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assistance Level</label>
            <select
              value={form.assistanceLevel}
              onChange={(e) => setForm({ ...form, assistanceLevel: e.target.value as AssistanceLevel })}
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="independent">Independent</option>
              <option value="door-to-door">Door-to-door</option>
              <option value="door-through-door">Door-thru-door</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">Leave blank for ongoing</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Driver preferences, special instructions..."
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">Generate rides for this schedule</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={cn(
                'relative w-10 h-6 rounded-full transition-colors cursor-pointer',
                form.active ? 'bg-brand-600' : 'bg-gray-300',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  form.active ? 'left-5' : 'left-1',
                )}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveOrder}
              disabled={!form.patientId || !form.vendorId || form.daysOfWeek.length === 0 || !form.pickupTime || !form.chairTime}
            >
              {editingId ? 'Save Changes' : 'Create Order'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ════ Schedule Exception Modal ════ */}
      <Modal open={excModalOpen} onClose={() => setExcModalOpen(false)} title="Schedule Exceptions" wide>
        {excOrderId && (
          <div className="space-y-5">
            {/* Existing exceptions */}
            {(() => {
              const orderExc = exceptions.filter((e) => e.orderId === excOrderId);
              const patient = patients.find(
                (p) => p.id === orders.find((o) => o.id === excOrderId)?.patientId,
              );
              return (
                <>
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                      {patient ? patient.firstName[0] + patient.lastName[0] : '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {patient ? getPatientName(patient) : 'Unknown'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {orderExc.length} exception{orderExc.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {orderExc.length > 0 ? (
                    <div className="space-y-2">
                      {orderExc.map((e) => (
                        <div
                          key={e.id}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border',
                            e.resolved ? 'bg-gray-50 border-gray-100' : 'bg-amber-50/50 border-amber-100',
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant={e.resolved ? 'neutral' : 'warning'}>
                                {exceptionTypeLabels[e.type]}
                              </Badge>
                              {e.resolved && <Badge variant="success">Resolved</Badge>}
                            </div>
                            <p className="text-xs text-gray-700 mt-1.5">{e.detail}</p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              {formatDate(e.date)}
                              {e.endDate && ` — ${formatDate(e.endDate)}`}
                            </p>
                          </div>
                          <button
                            onClick={() => resolveException(e.id)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                            title={e.resolved ? 'Unresolve' : 'Resolve'}
                          >
                            {e.resolved ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No exceptions for this order</p>
                  )}
                </>
              );
            })()}

            {/* Add exception form */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-900 mb-3">Add Exception</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Exception Type</label>
                  <select
                    value={excForm.type}
                    onChange={(e) => setExcForm({ ...excForm, type: e.target.value as ExceptionType })}
                    className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {(Object.keys(exceptionTypeLabels) as ExceptionType[]).map((t) => (
                      <option key={t} value={t}>
                        {exceptionTypeLabels[t]}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">{exceptionTypeDescriptions[excForm.type]}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={excForm.date}
                      onChange={(e) => setExcForm({ ...excForm, date: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  {(excForm.type === 'hospitalization' || excForm.type === 'holiday_hold') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={excForm.endDate}
                        onChange={(e) => setExcForm({ ...excForm, endDate: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Details</label>
                  <textarea
                    value={excForm.detail}
                    onChange={(e) => setExcForm({ ...excForm, detail: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    placeholder={
                      excForm.type === 'temp_address'
                        ? 'Enter temporary address...'
                        : excForm.type === 'chair_time_change'
                          ? 'Enter new chair time and reason...'
                          : 'Reason for exception...'
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={addException}
                    disabled={!excForm.date || !excForm.detail}
                  >
                    Add Exception
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── View Detail Modal ──

function ViewDetailModal({
  order,
  onClose,
  exceptions,
  onEdit,
  onExceptions,
}: {
  order: StandingOrder | null;
  onClose: () => void;
  exceptions: ScheduleException[];
  onEdit: () => void;
  onExceptions: () => void;
}) {
  if (!order) return null;

  const patient = patients.find((p) => p.id === order.patientId);
  const vendor = vendors.find((v) => v.id === order.vendorId);
  const pendingExc = exceptions.filter((e) => !e.resolved);

  return (
    <Modal open={!!order} onClose={onClose} title="Standing Order Details" wide>
      <div className="space-y-5">
        {/* Patient header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
            {patient ? patient.firstName[0] + patient.lastName[0] : '?'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {patient ? getPatientName(patient) : 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">{patient?.phone}</p>
          </div>
          <Badge variant={order.active ? 'success' : 'neutral'}>
            {order.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Schedule */}
        <div>
          <p className="text-xs font-semibold text-gray-900 mb-2">Schedule</p>
          <ModalRow label="Treatment Days">
            <div className="flex gap-1 justify-end">
              {order.daysOfWeek.map((d) => (
                <span key={d} className="inline-flex items-center justify-center w-7 h-5 rounded text-[11px] font-medium bg-brand-100 text-brand-700">
                  {d.slice(0, 2)}
                </span>
              ))}
            </div>
          </ModalRow>
          <ModalRow label="Pickup Time">{formatTime(order.pickupTime)}</ModalRow>
          <ModalRow label="Chair Time">{formatTime(order.chairTime)}</ModalRow>
          <ModalRow label="Start Date">{formatDate(order.startDate)}</ModalRow>
          <ModalRow label="End Date">{order.endDate ? formatDate(order.endDate) : 'Ongoing'}</ModalRow>
        </div>

        {/* Transportation */}
        <div>
          <p className="text-xs font-semibold text-gray-900 mb-2">Transportation</p>
          <ModalRow label="Return Mode">
            <Badge
              variant={
                order.returnMode === 'will-call'
                  ? 'warning'
                  : order.returnMode === 'clinic-triggered'
                    ? 'low'
                    : 'neutral'
              }
            >
              {returnModeLabels[order.returnMode]}
            </Badge>
          </ModalRow>
          <ModalRow label="Ride Type">{rideTypeLabels[order.rideType]}</ModalRow>
          <ModalRow label="Vendor">{vendor?.name ?? '—'}</ModalRow>
          {patient && (
            <>
              <ModalRow label="Mobility">
                {patient.mobilityLevel.charAt(0).toUpperCase() + patient.mobilityLevel.slice(1)}
              </ModalRow>
              <ModalRow label="Assistance">{assistanceLabels[patient.assistanceLevel]}</ModalRow>
            </>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-2">Notes</p>
            <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{order.notes}</p>
          </div>
        )}

        {/* Exceptions preview */}
        {pendingExc.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-2">
              Upcoming Exceptions
              <span className="ml-1.5 text-amber-600">({pendingExc.length})</span>
            </p>
            <div className="space-y-2">
              {pendingExc.map((e) => (
                <div key={e.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                  <Badge variant="warning">{exceptionTypeLabels[e.type]}</Badge>
                  <span className="text-xs text-gray-700 flex-1 truncate">{e.detail}</span>
                  <span className="text-[11px] text-gray-400 shrink-0">{formatDate(e.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Edit Order
          </Button>
          <Button variant="outline" size="sm" onClick={onExceptions} className="flex-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Exceptions
          </Button>
        </div>
      </div>
    </Modal>
  );
}
