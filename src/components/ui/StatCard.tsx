import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  subtitle?: string; // Optional subtitle
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const colorMap = {
  red: {
    bg: 'bg-cyber-neon-red',
    text: 'text-cyber-neon-red',
    glow: '0 0 25px rgba(255, 59, 59, 0.4)',
    border: 'border-cyber-neon-red/30',
  },
  blue: {
    bg: 'bg-cyber-neon-blue',
    text: 'text-cyber-neon-blue',
    glow: '0 0 25px rgba(76, 156, 255, 0.4)',
    border: 'border-cyber-neon-blue/30',
  },
  green: {
    bg: 'bg-cyber-neon-green',
    text: 'text-cyber-neon-green',
    glow: '0 0 25px rgba(60, 207, 145, 0.4)',
    border: 'border-cyber-neon-green/30',
  },
  yellow: {
    bg: 'bg-cyber-neon-yellow',
    text: 'text-cyber-neon-yellow',
    glow: '0 0 25px rgba(255, 204, 77, 0.4)',
    border: 'border-cyber-neon-yellow/30',
  },
  purple: {
    bg: 'bg-cyber-neon-purple',
    text: 'text-cyber-neon-purple',
    glow: '0 0 25px rgba(167, 139, 250, 0.4)',
    border: 'border-cyber-neon-purple/30',
  },
};

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color, subtitle, trend }) => {
  const colors = colorMap[color];

  return (
    <div className={`stat-card group relative overflow-hidden border ${colors.border} hover:border-opacity-100`}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`absolute inset-0 ${colors.bg} opacity-5`}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className={`stat-card-icon ${colors.bg} group-hover:scale-110 transition-all duration-300`}
             style={{ boxShadow: `0 4px 20px rgba(0,0,0,0.3)` }}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-4xl font-cyber font-bold text-cyber-text-primary group-hover:scale-105 transition-transform duration-300">
            {value}
          </div>
          {trend && (
            <span className={`text-xs font-semibold ${trend.isPositive ? 'text-cyber-neon-green' : 'text-cyber-neon-red'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        
        <div className="text-sm text-cyber-text-secondary uppercase tracking-wider font-medium">
          {label}
        </div>
        {subtitle && (
          <div className="text-xs text-cyber-text-secondary/70 mt-1">
            {subtitle}
          </div>
        )}
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
           style={{ boxShadow: `inset ${colors.glow}` }}></div>
    </div>
  );
};
