import { LucideIcon } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

export interface MissionStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  trend?: { value: string; isPositive: boolean };
}

export const MissionStatCard: React.FC<MissionStatCardProps> = ({
  icon,
  label,
  value,
  color = 'blue',
  trend,
}) => {
  return <StatCard icon={icon} label={label} value={value} color={color} trend={trend} />;
};

export default MissionStatCard;

