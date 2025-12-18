import { GroupOverview } from '@/captain/api/captainApi';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Activity } from 'lucide-react';

interface HeatmapProps {
  groupData: GroupOverview;
}

export const Heatmap: React.FC<HeatmapProps> = ({ groupData }) => {
  const { teams, levels, solveMatrix } = groupData;

  // Use solve matrix from backend, or create empty matrix if not provided
  const matrix = solveMatrix || teams.map(() => levels.map(() => 0));
  
  if (teams.length === 0 || levels.length === 0) {
    return (
      <CyberCard>
        <SectionTitle icon={Activity} title="Solve Heatmap" subtitle="Team vs Level completion matrix" />
        <div className="mt-4 text-center py-8 text-cyber-text-secondary">
          No data available for heatmap
        </div>
      </CyberCard>
    );
  }

  const getColor = (value: number) => {
    if (value === 1) return 'bg-cyber-neon-green/80';
    if (value === 0.5) return 'bg-cyber-neon-yellow/50';
    return 'bg-cyber-bg-darker';
  };

  return (
    <CyberCard>
      <SectionTitle icon={Activity} title="Solve Heatmap" subtitle="Team vs Level completion matrix" />
      <div className="mt-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-cyber-bg-card border border-cyber-border px-3 py-2 text-left text-xs text-cyber-text-secondary font-semibold">
                  Team
                </th>
                {levels.map((level, idx) => (
                  <th
                    key={level.id}
                    className="border border-cyber-border px-2 py-2 text-center text-xs text-cyber-text-secondary font-semibold min-w-[60px]"
                  >
                    L{idx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((team, teamIdx) => (
                <tr key={team.id}>
                  <td className="sticky left-0 z-10 bg-cyber-bg-card border border-cyber-border px-3 py-2 text-sm text-cyber-text-primary font-medium">
                    {team.name}
                  </td>
                  {matrix[teamIdx]?.map((value, levelIdx) => (
                    <td
                      key={levelIdx}
                      className={`border border-cyber-border p-1 ${getColor(value)} transition-all hover:opacity-80`}
                      title={`Team: ${team.name}, Level: ${levels[levelIdx]?.title || levelIdx + 1}`}
                    >
                      <div className="h-6 w-full flex items-center justify-center">
                        {value === 1 && (
                          <div className="h-3 w-3 rounded-full bg-cyber-neon-green" />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-cyber-text-secondary">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-cyber-neon-green" />
          <span>Solved</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-cyber-bg-darker border border-cyber-border" />
          <span>Not Solved</span>
        </div>
      </div>
    </CyberCard>
  );
};

