import { cn } from '../utils/cn';
import type { RideStatus } from '../types';
import { getRideStatusLabel } from '../utils/helpers';

interface StatusPillProps {
  status: RideStatus;
  className?: string;
}

type StatusCategory = 'info' | 'active' | 'success' | 'warning' | 'danger' | 'neutral';

const statusCategory: Record<RideStatus, StatusCategory> = {
  scheduled: 'info',
  driver_assigned: 'info',
  driver_en_route: 'active',
  driver_arrived: 'active',
  picked_up: 'active',
  arrived_at_clinic: 'active',
  in_treatment: 'active',
  ready_for_return: 'warning',
  return_assigned: 'info',
  returning_home: 'active',
  arrived_home: 'success',
  completed: 'success',
  delayed: 'warning',
  missed: 'danger',
  canceled: 'neutral',
  issue_reported: 'danger',
};

const categoryStyles: Record<StatusCategory, { dot: string; bg: string; text: string }> = {
  info:    { dot: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700' },
  active:  { dot: 'bg-brand-500',   bg: 'bg-brand-50',   text: 'text-brand-700' },
  success: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  warning: { dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700' },
  danger:  { dot: 'bg-red-500',     bg: 'bg-red-50',     text: 'text-red-700' },
  neutral: { dot: 'bg-gray-400',    bg: 'bg-gray-50',    text: 'text-gray-600' },
};

export function StatusPill({ status, className }: StatusPillProps) {
  const cat = statusCategory[status];
  const c = categoryStyles[cat];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        c.bg,
        c.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {getRideStatusLabel(status)}
    </span>
  );
}
