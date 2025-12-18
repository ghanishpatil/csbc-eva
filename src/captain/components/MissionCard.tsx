import { Clock, Trophy } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Level } from '@/types';
import { useNavigate } from 'react-router-dom';

interface MissionCardProps {
  level: Level;
  onOpen?: (levelId: string) => void;
  onHint?: (levelId: string) => void;
}

const difficultyColor: Record<string, string> = {
  easy: 'bg-cyber-neon-green/15 text-cyber-neon-green border-cyber-neon-green/40',
  medium: 'bg-cyber-neon-yellow/15 text-cyber-neon-yellow border-cyber-neon-yellow/40',
  hard: 'bg-cyber-neon-red/15 text-cyber-neon-red border-cyber-neon-red/40',
  expert: 'bg-cyber-neon-purple/15 text-cyber-neon-purple border-cyber-neon-purple/40',
};

export const MissionCard: React.FC<MissionCardProps> = ({ level, onOpen, onHint }) => {
  const navigate = useNavigate();

  const statusBadge = () => {
    // Status is determined by completion, not stored on level
    // Return null for now - status can be determined from team progress if needed
    return null;
  };

  return (
    <CyberCard>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-cyber text-cyber-text-secondary">#{level.number || level.id}</div>
            <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${difficultyColor[level.difficulty || 'medium'] || difficultyColor.medium}`}>
              {level.difficulty?.toUpperCase() || 'MEDIUM'}
            </div>
            {statusBadge()}
          </div>
          <div>
            <h3 className="text-xl font-cyber font-bold text-cyber-text-primary">{level.title}</h3>
            <p className="text-cyber-text-secondary text-sm mt-1 line-clamp-2">{level.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-cyber-text-secondary">
            <span className="flex items-center space-x-1">
              <Trophy className="h-4 w-4 text-cyber-neon-yellow" />
              <span>{level.basePoints || 0} pts</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-cyber-text-secondary" />
              <span>Time: {level.timeLimit ? `${level.timeLimit}m` : 'Flexible'}</span>
            </span>
            <span className="text-cyber-text-secondary">
              Hints: {level.hints?.length || 0}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <NeonButton
            color="blue"
            onClick={() => {
              onOpen ? onOpen(level.id) : navigate(`/captain/levels/${level.id}`);
            }}
          >
            Open Level
          </NeonButton>
          <NeonButton
            color="green"
            onClick={() => onHint?.(level.id)}
          >
            Request Hint
          </NeonButton>
        </div>
      </div>
    </CyberCard>
  );
};

export default MissionCard;

