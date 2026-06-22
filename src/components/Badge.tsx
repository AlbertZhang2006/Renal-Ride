import { cn } from '../utils/cn';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'low' | 'medium' | 'high';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral:  'bg-gray-100 text-gray-600',
  success:  'bg-emerald-50 text-emerald-700',
  warning:  'bg-amber-50 text-amber-700',
  danger:   'bg-red-50 text-red-700',
  low:      'bg-sky-50 text-sky-700',
  medium:   'bg-amber-50 text-amber-700',
  high:     'bg-red-50 text-red-700',
};

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
