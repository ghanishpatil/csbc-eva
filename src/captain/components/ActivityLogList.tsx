import { CyberCard } from '@/components/ui/CyberCard';
import { Submission } from '@/types';

interface ActivityLogListProps {
  items: Submission[];
}

export const ActivityLogList: React.FC<ActivityLogListProps> = ({ items }) => {
  return (
    <CyberCard>
      <h3 className="text-xl font-cyber font-bold text-cyber-text-primary mb-4">Team Activity</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-cyber-text-primary">{item.levelTitle || item.levelId}</div>
              <div className="text-xs text-cyber-text-secondary">
                {item.status === 'correct' ? 'Correct' : 'Incorrect'} • {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '—'}
              </div>
            </div>
            <div className="text-sm font-semibold text-cyber-neon-green">{item.scoreAwarded ?? 0} pts</div>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-cyber-text-secondary">No activity yet.</div>}
      </div>
    </CyberCard>
  );
};

export default ActivityLogList;

