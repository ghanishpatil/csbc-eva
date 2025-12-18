import { Trophy, Target, TrendingUp } from 'lucide-react';
import { Team } from '@/captain/api/captainApi';

interface TeamPerformanceCardProps {
  team: Team;
  rank: number;
  avgScore: number;
  onClick?: () => void;
}

export const TeamPerformanceCard: React.FC<TeamPerformanceCardProps> = ({
  team,
  rank,
  avgScore,
  onClick,
}) => {
  const efficiency = team.levelsCompleted > 0 
    ? Math.round((team.score || 0) / team.levelsCompleted) 
    : 0;
  
  const status = team.levelsCompleted === 0
    ? { label: 'Inactive', color: 'text-cyber-text-secondary' }
    : (team.score || 0) > avgScore * 1.2
    ? { label: 'Leading', color: 'text-cyber-neon-green' }
    : (team.score || 0) < avgScore * 0.8
    ? { label: 'Behind', color: 'text-cyber-neon-red' }
    : { label: 'Active', color: 'text-cyber-neon-blue' };

  const progress = team.levelsCompleted || 0;

  return (
    <div
      onClick={onClick}
      className={`bg-cyber-bg-card border border-cyber-border rounded-xl p-4 hover:border-cyber-neon-blue/50 transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold ${
            rank <= 3 
              ? 'bg-cyber-neon-yellow/20 text-cyber-neon-yellow' 
              : 'bg-cyber-border text-cyber-text-secondary'
          }`}>
            {rank}
          </div>
          <div>
            <div className="text-cyber-text-primary font-bold">{team.name}</div>
            <div className="text-xs text-cyber-text-secondary">{team.id}</div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${status.color} bg-cyber-bg-darker`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-cyber-bg-darker rounded-lg p-2">
          <div className="flex items-center space-x-1 mb-1">
            <Trophy className="h-3 w-3 text-cyber-neon-yellow" />
            <span className="text-xs text-cyber-text-secondary">Score</span>
          </div>
          <div className="text-lg font-bold text-cyber-neon-yellow">{team.score || 0}</div>
        </div>
        <div className="bg-cyber-bg-darker rounded-lg p-2">
          <div className="flex items-center space-x-1 mb-1">
            <Target className="h-3 w-3 text-cyber-neon-green" />
            <span className="text-xs text-cyber-text-secondary">Levels</span>
          </div>
          <div className="text-lg font-bold text-cyber-neon-green">{team.levelsCompleted || 0}</div>
        </div>
        <div className="bg-cyber-bg-darker rounded-lg p-2">
          <div className="flex items-center space-x-1 mb-1">
            <TrendingUp className="h-3 w-3 text-cyber-neon-blue" />
            <span className="text-xs text-cyber-text-secondary">Eff.</span>
          </div>
          <div className="text-lg font-bold text-cyber-neon-blue">{efficiency}</div>
        </div>
      </div>

      {progress > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-cyber-text-secondary mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-cyber-bg-darker rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyber-neon-blue to-cyber-neon-green transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

