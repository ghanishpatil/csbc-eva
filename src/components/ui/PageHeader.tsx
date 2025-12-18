import { LucideIcon } from 'lucide-react';
import { Activity } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    value: string;
    color?: 'green' | 'blue' | 'red' | 'yellow';
  };
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  icon: Icon, 
  title, 
  subtitle,
  status,
  action
}) => {
  const statusColors = {
    green: 'bg-cyber-neon-green/10 border-cyber-neon-green/30 text-cyber-neon-green',
    blue: 'bg-cyber-neon-blue/10 border-cyber-neon-blue/30 text-cyber-neon-blue',
    red: 'bg-cyber-neon-red/10 border-cyber-neon-red/30 text-cyber-neon-red',
    yellow: 'bg-cyber-neon-yellow/10 border-cyber-neon-yellow/30 text-cyber-neon-yellow',
  };

  const statusColor = status?.color || 'green';

  return (
    <div className="cyber-card">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-20 h-20 bg-cyber-neon-blue/20 rounded-xl flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-cyber-neon-blue/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <Icon className="w-12 h-12 text-cyber-neon-blue relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-cyber font-bold text-cyber-text-primary mb-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-cyber-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {status && (
          <div className={`flex items-center space-x-3 px-6 py-3 rounded-xl border ${statusColors[statusColor]}`}>
            <Activity className="w-5 h-5 animate-pulse" />
            <div className="text-left">
              <div className="text-xs uppercase tracking-wider opacity-70 font-medium">
                {status.label}
              </div>
              <div className="text-sm font-semibold">
                {status.value}
              </div>
            </div>
          </div>
        )}

        {action && (
          <div>
            {action}
          </div>
        )}
      </div>
    </div>
  );
};
