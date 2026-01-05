import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { Trophy, Medal, Award, TrendingUp, Zap, Shield, Target, Clock } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

interface LeaderboardProps {
  compact?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ compact = false }) => {
  const { leaderboard, groups, teams } = useAppStore();

  // Build leaderboard from teams if leaderboard collection is empty
  const displayLeaderboard = useMemo(() => {
    let dataToSort = [];
    
    if (leaderboard.length > 0) {
      // Use leaderboard data if available
      dataToSort = [...leaderboard];
    } else {
      // Fallback: Build leaderboard from teams data
      dataToSort = teams.map((team) => ({
        id: team.id,
        teamId: team.id,
        teamName: team.name,
        teamNumber: team.teamNumber,
        groupId: team.groupId,
        score: team.score || 0,
        levelsCompleted: team.levelsCompleted || 0,
        totalTimePenalty: team.timePenalty || 0,
        lastSubmissionAt: team.updatedAt,
      }));
    }
    
    // CRITICAL FIX: Proper sorting for leaderboard ranking
    // 1. Sort by score (descending) - highest score first
    // 2. If scores are equal, sort by levels completed (descending) - more levels first
    // 3. If levels are equal, sort by time penalty (ascending) - less penalty first (faster completion)
    // 4. If all equal, sort by last submission time (ascending) - earlier submission first
    const sorted = dataToSort.sort((a, b) => {
      // Primary: Score (descending)
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      
      // Secondary: Levels completed (descending)
      const levelsDiff = (b.levelsCompleted || 0) - (a.levelsCompleted || 0);
      if (levelsDiff !== 0) return levelsDiff;
      
      // Tertiary: Time penalty (ascending) - lower penalty = better rank
      const penaltyDiff = (a.totalTimePenalty || 0) - (b.totalTimePenalty || 0);
      if (penaltyDiff !== 0) return penaltyDiff;
      
      // Quaternary: Last submission time (ascending) - earlier = better rank
      const timeA = a.lastSubmissionAt || 0;
      const timeB = b.lastSubmissionAt || 0;
      return timeA - timeB;
    });
    
    // Assign ranks (handle ties properly)
    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [leaderboard, teams]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-neon-yellow animate-pulse" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-400" />;
    return <span className="text-cyan-400 font-cyber font-bold text-lg">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-neon-yellow shadow-lg shadow-yellow-500/20';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400/20 to-red-500/20 border-orange-400';
    return 'border-neon-blue/30 hover:border-neon-blue/50';
  };

  // Get group name helper
  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'Unassigned';
    const group = groups.find((g) => g.id === groupId);
    return group?.name || 'Unknown';
  };

  const displayedEntries = compact ? displayLeaderboard.slice(0, 5) : displayLeaderboard;

  return (
    <div className="terminal-window overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-800 to-dark-700 px-6 py-4 border-b border-neon-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-neon-green animate-pulse" />
            <div>
              <h2 className="text-2xl font-cyber font-bold text-neon-blue neon-text">
                LIVE RANKINGS
              </h2>
              <p className="text-xs text-cyan-400 font-mono mt-1">
                Real-time score updates • {displayLeaderboard.length} team{displayLeaderboard.length !== 1 ? 's' : ''} competing
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400">
            <Zap className="h-4 w-4 text-neon-green animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-800 border-b border-neon-blue/30">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-cyber text-neon-green uppercase tracking-wider">
                RANK
              </th>
              <th className="px-6 py-4 text-left text-xs font-cyber text-neon-green uppercase tracking-wider">
                TEAM
              </th>
              <th className="px-6 py-4 text-left text-xs font-cyber text-neon-green uppercase tracking-wider">
                GROUP
              </th>
              <th className="px-6 py-4 text-center text-xs font-cyber text-neon-green uppercase tracking-wider">
                SCORE
              </th>
              <th className="px-6 py-4 text-center text-xs font-cyber text-neon-green uppercase tracking-wider">
                MISSIONS
              </th>
              {!compact && (
                <>
                  <th className="px-6 py-4 text-center text-xs font-cyber text-neon-green uppercase tracking-wider">
                    PENALTIES
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-cyber text-neon-green uppercase tracking-wider">
                    LAST ACTIVITY
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {displayedEntries.map((entry, index) => {
              const rank = entry.rank || index + 1;
              const isTopThree = rank <= 3;
              const teamDisplayName = entry.teamNumber 
                ? `#${entry.teamNumber} ${entry.teamName}` 
                : entry.teamName;

              return (
                <tr
                  key={entry.id}
                  className={`transition-all border ${getRankBg(rank)} ${
                    isTopThree ? '' : 'hover:bg-dark-800/50'
                  }`}
                >
                  {/* Rank */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-12 h-12">
                      {getRankIcon(rank)}
                    </div>
                  </td>

                  {/* Team Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <Shield className={`h-5 w-5 ${isTopThree ? 'text-neon-green' : 'text-cyan-400'}`} />
                      <div>
                        <div className={`font-cyber font-bold ${
                          isTopThree ? 'text-neon-blue text-lg' : 'text-cyan-100'
                        }`}>
                          {teamDisplayName}
                        </div>
                        {isTopThree && (
                          <div className="text-xs text-neon-green font-mono">
                            TOP PERFORMER
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Group */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs font-cyber font-bold bg-neon-blue/20 text-neon-blue border border-neon-blue/50">
                      {getGroupName(entry.groupId)}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className={`font-cyber font-bold text-2xl ${
                      isTopThree ? 'text-neon-green' : 'text-cyan-100'
                    }`}>
                      {entry.score}
                    </div>
                    <div className="text-xs text-cyan-500 font-mono">POINTS</div>
                  </td>

                  {/* Missions Completed */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-dark-800 border border-neon-green/30">
                      <Target className="h-4 w-4 text-neon-green" />
                      <span className="font-cyber font-bold text-neon-green">
                        {entry.levelsCompleted}
                      </span>
                    </div>
                  </td>

                  {!compact && (
                    <>
                      {/* Time Penalties */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-900/20 border border-red-500/30">
                          <Clock className="h-4 w-4 text-red-400" />
                          <span className="font-mono text-red-400">
                            {entry.totalTimePenalty > 0
                              ? `+${entry.totalTimePenalty}m`
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-400 font-mono">
                        {entry.lastSubmissionAt
                          ? formatDate(entry.lastSubmissionAt)
                          : '—'}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {displayedEntries.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="h-20 w-20 text-cyber-text-secondary/20 mx-auto mb-6" />
            <p className="text-cyber-text-primary font-cyber text-xl mb-2">NO TEAMS RANKED YET</p>
            <p className="text-cyber-text-secondary text-sm">Teams will appear here once they start competing</p>
            <p className="text-cyber-text-secondary/60 text-xs mt-4">Complete missions to climb the rankings!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {compact && displayLeaderboard.length > 5 && (
        <div className="bg-dark-800 px-6 py-3 text-center border-t border-neon-blue/30">
          <p className="text-sm text-cyan-400 font-mono">
            Showing top 5 of {displayLeaderboard.length} teams •{' '}
            <a href="#/leaderboard" className="text-neon-blue hover:text-neon-green transition-colors">
              View Full Rankings →
            </a>
          </p>
        </div>
      )}
    </div>
  );
};
