import { Level, Submission } from '@/types';
import { useAppStore } from '@/store/appStore';
import { Trophy, CheckCircle, Lock, Terminal, Eye } from 'lucide-react';

interface LevelCardProps {
  level: Level;
  submissions: Submission[];
}

export const LevelCard: React.FC<LevelCardProps> = ({ level, submissions }) => {
  const { teams } = useAppStore();
  
  // Find all teams that have completed this level (read-only view)
  const completedTeams = teams.filter((team) =>
    submissions.some(
      (s) => s.levelId === level.id && s.teamId === team.id
    )
  );
  
  const isCompleted = completedTeams.length > 0;

  const getDifficultyBadge = (difficulty: string) => {
    const badges = {
      easy: { text: 'RECON', color: 'text-neon-green', bg: 'bg-neon-green/20', border: 'border-neon-green/50' },
      medium: { text: 'TACTICAL', color: 'text-neon-yellow', bg: 'bg-neon-yellow/20', border: 'border-neon-yellow/50' },
      hard: { text: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' },
    };
    return badges[difficulty as keyof typeof badges] || badges.medium;
  };

  const difficultyBadge = getDifficultyBadge(level.difficulty);

  return (
    <div
      className={`terminal-window border-2 transition-all relative overflow-hidden ${
        isCompleted
          ? 'border-neon-green shadow-lg shadow-neon-green/20'
          : level.isActive
          ? 'border-neon-blue/30 hover:border-neon-blue/50'
          : 'border-dark-600 opacity-60'
      }`}
    >
      {/* Status Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isCompleted ? 'bg-neon-green' : level.isActive ? 'bg-neon-blue' : 'bg-dark-600'
      }`}></div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className={`flex items-center justify-center w-14 h-14 border-2 ${
                isCompleted ? 'border-neon-green text-neon-green' : 'border-neon-blue text-neon-blue'
              } font-cyber font-bold text-xl`}>
                {level.number}
              </div>
              {isCompleted && (
                <CheckCircle className="h-6 w-6 text-neon-green absolute -top-2 -right-2 animate-pulse" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-3 py-1 text-xs font-cyber font-bold border ${difficultyBadge.border} ${difficultyBadge.bg} ${difficultyBadge.color}`}>
                  {difficultyBadge.text}
                </span>
                <span className="flex items-center space-x-1 text-sm font-mono text-cyan-400">
                  <Trophy className="h-4 w-4 text-neon-yellow" />
                  <span className="text-neon-yellow font-bold">{level.basePoints}</span>
                  <span>PTS</span>
                </span>
              </div>
              <h3 className="text-2xl font-cyber font-bold text-neon-blue">
                {level.title}
              </h3>
            </div>
          </div>

          {/* Status Badge */}
          {isCompleted ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-neon-green/20 border border-neon-green text-neon-green font-cyber">
              <CheckCircle className="h-5 w-5" />
              <span>COMPLETE</span>
            </div>
          ) : !level.isActive ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-dark-700 border border-dark-600 text-cyan-700 font-cyber">
              <Lock className="h-5 w-5" />
              <span>LOCKED</span>
            </div>
          ) : null}
        </div>

        {/* Description */}
        <div className="mb-6 p-4 bg-dark-800/50 border border-neon-blue/20">
          <div className="flex items-center space-x-2 mb-2">
            <Terminal className="h-4 w-4 text-neon-blue" />
            <span className="text-xs font-cyber text-neon-blue">MISSION BRIEF</span>
          </div>
          <p className="text-cyan-100 leading-relaxed font-mono text-sm">
            {level.description}
          </p>
        </div>

        {/* Read-Only Status Information */}
        {level.isActive && (
          <div className="mt-6 p-4 bg-dark-800/50 border border-neon-blue/20">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="h-4 w-4 text-neon-blue" />
              <span className="text-xs font-cyber text-neon-blue">READ-ONLY VIEW</span>
            </div>
            <div className="space-y-2 text-sm font-mono text-cyan-400">
              <div className="flex justify-between">
                <span>Teams Completed:</span>
                <span className="text-neon-green font-bold">{completedTeams.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Base Points:</span>
                <span className="text-neon-yellow">{level.basePoints} PTS</span>
              </div>
              {level.hintsAvailable > 0 && (
                <div className="flex justify-between">
                  <span>Hints Available:</span>
                  <span>{level.hintsAvailable}</span>
                </div>
              )}
            </div>
            {completedTeams.length > 0 && (
              <div className="mt-3 pt-3 border-t border-neon-blue/20">
                <div className="text-xs font-cyber text-neon-green mb-2">COMPLETED BY:</div>
                <div className="flex flex-wrap gap-2">
                  {completedTeams.map((team) => (
                    <span
                      key={team.id}
                      className="px-2 py-1 bg-neon-green/20 border border-neon-green/50 text-neon-green text-xs font-mono"
                    >
                      {team.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
