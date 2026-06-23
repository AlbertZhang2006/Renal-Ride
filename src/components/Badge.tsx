interface BadgeProps {
  variant?: 'low' | 'medium' | 'high' | 'neutral' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, { bg: string; text: string }> = {
  low:     { bg: '#f4f4f5', text: '#737373' },
  medium:  { bg: '#fff7ed', text: '#b45309' },
  high:    { bg: '#fef2f2', text: '#b91c1c' },
  neutral: { bg: '#f4f4f5', text: '#737373' },
  success: { bg: '#ecfdf5', text: '#047857' },
  warning: { bg: '#fff7ed', text: '#b45309' },
  danger:  { bg: '#fef2f2', text: '#b91c1c' },
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const s = variantStyles[variant] || variantStyles.neutral;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        background: s.bg,
        color: s.text,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
