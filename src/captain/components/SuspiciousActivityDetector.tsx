import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { AlertTriangle, Target } from 'lucide-react';
import { SubmissionLog } from '@/captain/api/captainApi';

interface SuspiciousActivityDetectorProps {
  logs: SubmissionLog[];
  teams: Array<{ id: string; name: string }>;
}

export const SuspiciousActivityDetector: React.FC<SuspiciousActivityDetectorProps> = ({
  logs,
  teams,
}) => {
  // Detect suspicious patterns
  const detectSuspiciousActivity = () => {
    const suspicious: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      teamId?: string;
      teamName?: string;
    }> = [];

    // Group logs by team
    const logsByTeam = logs.reduce((acc, log) => {
      if (!acc[log.teamId]) acc[log.teamId] = [];
      acc[log.teamId].push(log);
      return acc;
    }, {} as Record<string, SubmissionLog[]>);

    // Check for too fast solves (less than 30 seconds)
    Object.entries(logsByTeam).forEach(([teamId, teamLogs]) => {
      const fastSolves = teamLogs.filter(
        log => log.status === 'correct' && (log.timeTaken || 0) < 30
      );
      if (fastSolves.length > 2) {
        const team = teams.find(t => t.id === teamId);
        suspicious.push({
          type: 'fast_solves',
          description: `${fastSolves.length} solves completed in less than 30 seconds`,
          severity: 'high',
          teamId,
          teamName: team?.name || 'Unknown',
        });
      }
    });

    // Check for multiple wrong attempts on same level
    Object.entries(logsByTeam).forEach(([teamId, teamLogs]) => {
      const attemptsByLevel = teamLogs.reduce((acc, log) => {
        if (log.status === 'incorrect') {
          if (!acc[log.levelId]) acc[log.levelId] = 0;
          acc[log.levelId]++;
        }
        return acc;
      }, {} as Record<string, number>);

      Object.entries(attemptsByLevel).forEach(([levelId, count]) => {
        if (count > 10) {
          const team = teams.find(t => t.id === teamId);
          suspicious.push({
            type: 'excessive_attempts',
            description: `${count} wrong attempts on level ${levelId}`,
            severity: 'medium',
            teamId,
            teamName: team?.name || 'Unknown',
          });
        }
      });
    });

    // Check for simultaneous solves (potential collaboration)
    const correctLogs = logs.filter(log => log.status === 'correct');
    const timeGroups = correctLogs.reduce((acc, log) => {
      const timeKey = Math.floor(log.submittedAt / 60000); // Group by minute
      if (!acc[timeKey]) acc[timeKey] = [];
      acc[timeKey].push(log);
      return acc;
    }, {} as Record<number, SubmissionLog[]>);

    Object.entries(timeGroups).forEach(([, logsAtTime]) => {
      if (logsAtTime.length > 3) {
        const uniqueTeams = new Set(logsAtTime.map(log => log.teamId));
        if (uniqueTeams.size > 2) {
          suspicious.push({
            type: 'simultaneous_solves',
            description: `${logsAtTime.length} solves from ${uniqueTeams.size} teams within 1 minute`,
            severity: 'medium',
          });
        }
      }
    });

    return suspicious;
  };

  const suspicious = detectSuspiciousActivity();

  if (suspicious.length === 0) {
    return (
      <CyberCard>
        <SectionTitle icon={AlertTriangle} title="Suspicious Activity Detector" />
        <div className="mt-4 text-center py-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-cyber-neon-green/20 mb-4">
            <Target className="h-8 w-8 text-cyber-neon-green" />
          </div>
          <p className="text-cyber-text-primary font-medium">No suspicious activity detected</p>
          <p className="text-cyber-text-secondary text-sm mt-2">All team activities appear normal</p>
        </div>
      </CyberCard>
    );
  }

  return (
    <CyberCard>
      <SectionTitle icon={AlertTriangle} title="Suspicious Activity Detector" />
      <div className="mt-4 space-y-3">
        {suspicious.map((item, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              item.severity === 'high'
                ? 'border-cyber-neon-red bg-cyber-neon-red/10'
                : item.severity === 'medium'
                ? 'border-cyber-neon-yellow bg-cyber-neon-yellow/10'
                : 'border-cyber-border bg-cyber-bg-darker'
            }`}
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  item.severity === 'high'
                    ? 'text-cyber-neon-red'
                    : item.severity === 'medium'
                    ? 'text-cyber-neon-yellow'
                    : 'text-cyber-text-secondary'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-cyber-text-primary font-medium capitalize">
                    {item.type.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      item.severity === 'high'
                        ? 'bg-cyber-neon-red/20 text-cyber-neon-red'
                        : item.severity === 'medium'
                        ? 'bg-cyber-neon-yellow/20 text-cyber-neon-yellow'
                        : 'bg-cyber-border text-cyber-text-secondary'
                    }`}
                  >
                    {item.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-cyber-text-secondary text-sm">{item.description}</p>
                {item.teamName && (
                  <p className="text-cyber-text-primary text-sm mt-1">
                    Team: <span className="font-medium">{item.teamName}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CyberCard>
  );
};

