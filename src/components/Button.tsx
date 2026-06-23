import { cn } from '../utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[#0e7490] text-white hover:bg-[#155e75] active:bg-[#155e75] border-transparent shadow-sm',
  secondary:
    'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 border-transparent shadow-sm',
  outline:
    'bg-white text-[#404040] border-[#e2e2e2] hover:bg-gray-50 active:bg-gray-100 shadow-sm',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border-transparent shadow-sm',
  ghost:
    'text-[#525252] hover:text-gray-900 hover:bg-gray-100 active:bg-gray-150 border-transparent',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-[32px] px-3 text-[12px]',
  md: 'h-[36px] px-[14px] text-[13px]',
  lg: 'h-[44px] px-[22px] text-[15px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-[7px] rounded-lg font-medium transition-colors cursor-pointer border',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e7490]',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
