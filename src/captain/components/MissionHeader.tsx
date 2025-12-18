import { LucideIcon } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';

interface MissionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  status?: { label: string; color: 'red' | 'green' | 'yellow' | 'blue' };
  right?: React.ReactNode;
}

const statusColorMap = {
  red: 'bg-cyber-neon-red/10 border-cyber-neon-red/40 text-cyber-neon-red',
  green: 'bg-cyber-neon-green/10 border-cyber-neon-green/40 text-cyber-neon-green',
  yellow: 'bg-cyber-neon-yellow/10 border-cyber-neon-yellow/40 text-cyber-neon-yellow',
  blue: 'bg-cyber-neon-blue/10 border-cyber-neon-blue/40 text-cyber-neon-blue',
};

export const MissionHeader: React.FC<MissionHeaderProps> = ({ icon: Icon, title, subtitle, status, right }) => {
  return (
    <CyberCard>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-cyber-neon-blue/15 rounded-xl flex items-center justify-center relative">
            <div className="absolute inset-0 bg-cyber-neon-blue/10 rounded-xl blur-xl"></div>
            <Icon className="w-10 h-10 text-cyber-neon-blue relative" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-cyber font-bold text-cyber-text-primary">{title}</h1>
            {subtitle && <p className="text-cyber-text-secondary mt-1">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {status && (
            <div className={`px-4 py-2 rounded-lg border ${statusColorMap[status.color]} text-sm font-semibold`}>
              {status.label}
            </div>
          )}
          {right}
        </div>
      </div>
    </CyberCard>
  );
};

export default MissionHeader;

