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
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorClasses[color]} 
        ${sizeClasses[size]}
        flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'} 
        ${className}
        font-cyber
        font-semibold
        uppercase
        tracking-wider
        relative
        overflow-hidden
        group
        rounded-lg
        transition-all
        duration-200
      `}
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      
      {/* Content */}
      <span className="relative z-10 flex items-center space-x-2">
        {Icon && <Icon className="w-5 h-5" />}
        <span>{children}</span>
      </span>
    </button>
  );
};
