import { CyberCard } from '@/components/ui/CyberCard';

interface ProgressPoint {
  label: string;
  value: number;
  color?: string;
}

interface TeamProgressGraphProps {
  data: ProgressPoint[];
}

export const TeamProgressGraph: React.FC<TeamProgressGraphProps> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <CyberCard>
      <h3 className="text-xl font-cyber font-bold text-cyber-text-primary mb-4">Progress Overview</h3>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyber-text-secondary">
              <span>{d.label}</span>
              <span className="text-cyber-text-primary font-semibold">{d.value}</span>
            </div>
            <div className="w-full h-2 bg-cyber-bg-darker rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  background: d.color || 'linear-gradient(90deg, #4C9CFF, #3CCF91)',
                }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="text-sm text-cyber-text-secondary">No data yet.</div>}
      </div>
    </CyberCard>
  );
};

export default TeamProgressGraph;

