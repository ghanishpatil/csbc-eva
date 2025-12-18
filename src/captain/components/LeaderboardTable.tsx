import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { LeaderboardEntry } from '@/types';
import { Trophy, Medal, Award, Target, TrendingUp } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  title?: string;
  showGroup?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ 
  data, 
  title = "Team Leaderboard",
  showGroup = false
}) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-cyber-neon-yellow" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-500" />;
    return <span className="text-cyber-text-secondary font-bold">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-cyber-neon-yellow/10 border-cyber-neon-yellow/30';
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/30';
    if (rank === 3) return 'bg-amber-500/10 border-amber-500/30';
    return 'border-cyber-border/50 hover:border-cyber-border';
  };

  // Sort data by score descending
  const sortedData = [...data].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <CyberCard>
      <div className="flex items-center justify-between mb-6">
        <SectionTitle icon={TrendingUp} title={title} subtitle="Real-time standings (Read-only)" />
        <div className="flex items-center space-x-2 text-xs text-cyber-neon-green font-mono">
          <span className="h-2 w-2 bg-cyber-neon-green rounded-full animate-pulse"></span>
          <span>LIVE</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-cyber-text-secondary text-xs uppercase tracking-wider border-b border-cyber-border">
              <th className="text-left py-3 px-4">Rank</th>
              <th className="text-left py-3 px-4">Team</th>
              <th className="text-center py-3 px-4">Score</th>
              <th className="text-center py-3 px-4">Missions</th>
              <th className="text-left py-3 px-4">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              const rank = row.rank || index + 1;
              const isTopThree = rank <= 3;
              const teamName = row.teamNumber 
                ? `#${row.teamNumber} ${row.teamName}` 
                : (row.teamName || row.teamId || 'Unknown');
              
              return (
                <tr 
                  key={row.id || row.teamId || index} 
                  className={`border-b ${getRankBg(rank)} transition-all`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center w-10 h-10">
                      {getRankIcon(rank)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`font-semibold ${isTopThree ? 'text-cyber-neon-yellow' : 'text-cyber-text-primary'}`}>
                      {teamName}
                    </div>
                    {isTopThree && (
                      <div className="text-xs text-cyber-neon-green font-mono">TOP PERFORMER</div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className={`text-xl font-bold ${isTopThree ? 'text-cyber-neon-yellow' : 'text-cyber-text-primary'}`}>
                      {row.score ?? 0}
                    </div>
                    <div className="text-xs text-cyber-text-secondary">pts</div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center space-x-1 px-2 py-1 bg-cyber-bg-darker rounded border border-cyber-neon-green/30">
                      <Target className="h-3 w-3 text-cyber-neon-green" />
                      <span className="text-cyber-neon-green font-bold">{row.levelsCompleted ?? 0}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-cyber-text-secondary text-sm font-mono">
                    {row.lastSubmissionAt ? formatDate(row.lastSubmissionAt) : '—'}
                  </td>
                </tr>
              );
            })}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <Trophy className="h-12 w-12 text-cyber-text-secondary/30 mx-auto mb-3" />
                  <p className="text-cyber-text-secondary">No teams ranked yet</p>
                  <p className="text-cyber-text-secondary/50 text-sm mt-1">Complete missions to appear on the leaderboard</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </CyberCard>
  );
};

export default LeaderboardTable;

