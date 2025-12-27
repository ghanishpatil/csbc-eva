import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface NeonButtonProps {
  children: ReactNode;
  onClick?: () => void;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'purple';
  icon?: LucideIcon;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  onClick,
  color = 'blue',
  icon: Icon,
  className = '',
  type = 'button',
  disabled = false,
  size = 'md',
}) => {
  const colorClasses = {
    red: 'neon-button-red hover:brightness-110',
    blue: 'neon-button-blue hover:brightness-110',
    green: 'neon-button-green hover:brightness-110',
    yellow: 'neon-button bg-cyber-neon-yellow text-gray-900 hover:brightness-110',
    gray: 'bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 hover:brightness-110',
    purple: 'bg-purple-600 border border-purple-500 text-white hover:bg-purple-500 hover:brightness-110',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]',
    md: 'px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]',
    lg: 'px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg min-h-[52px] sm:min-h-[56px]',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorClasses[color]} 
        ${sizeClasses[size]}
        inline-flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'} 
        font-cyber
        font-semibold
        uppercase
        tracking-wider
        relative
        overflow-visible
        group
        rounded-lg
        transition-all
        duration-200
        text-center
        ${!className.includes('whitespace-nowrap') ? 'whitespace-normal' : ''}
        ${!className.includes('break-words') && !className.includes('whitespace-nowrap') ? 'break-words' : ''}
        ${className}
      `}
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-lg"></div>
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 text-center">
        {Icon && <Icon className={`${iconSizes[size]} flex-shrink-0`} />}
        <span className="leading-tight inline-block">{children}</span>
      </span>
    </button>
  );
};
