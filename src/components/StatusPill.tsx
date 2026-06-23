import type { RideStatus } from '../types';
import { getRideStatusLabel } from '../utils/helpers';

interface StatusPillProps {
  status: RideStatus;
  className?: string;
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  scheduled:        { bg: '#eef4ff', text: '#3056b3', dot: '#3b6fe0' },
  driver_assigned:  { bg: '#eef4ff', text: '#3056b3', dot: '#3b6fe0' },
  driver_en_route:  { bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  driver_arrived:   { bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  picked_up:        { bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  arrived_at_clinic:{ bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  in_treatment:     { bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  ready_for_return: { bg: '#fff7ed', text: '#b45309', dot: '#ea9006' },
  return_assigned:  { bg: '#eef4ff', text: '#3056b3', dot: '#3b6fe0' },
  returning_home:   { bg: '#ecf4f7', text: '#0e6a82', dot: '#0e7490' },
  arrived_home:     { bg: '#ecfdf5', text: '#047857', dot: '#10b981' },
  completed:        { bg: '#ecfdf5', text: '#047857', dot: '#10b981' },
  delayed:          { bg: '#fef2f2', text: '#b91c1c', dot: '#dc2626' },
  missed:           { bg: '#fef2f2', text: '#b91c1c', dot: '#dc2626' },
  canceled:         { bg: '#f4f4f5', text: '#737373', dot: '#a3a3a3' },
  issue_reported:   { bg: '#fef2f2', text: '#b91c1c', dot: '#dc2626' },
};

const fallback = { bg: '#f4f4f5', text: '#737373', dot: '#a3a3a3' };

export function StatusPill({ status, className }: StatusPillProps) {
  const s = statusStyles[status] || fallback;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        background: s.bg,
        color: s.text,
      }}
    >
      <span style={{ height: 6, width: 6, borderRadius: 999, background: s.dot, flexShrink: 0 }} />
      {getRideStatusLabel(status)}
    </span>
  );
}
