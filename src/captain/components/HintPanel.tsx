import { Clock, MinusCircle } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';

interface HintPanelProps {
  pointsHintCost?: number;
  timePenaltyMinutes?: number;
  hintsAvailable?: number;
  hintsUsed?: number;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  pointsHintCost = 50,
  timePenaltyMinutes = 5,
  hintsAvailable,
  hintsUsed,
}) => {
  return (
    <CyberCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-cyber font-bold text-cyber-text-primary">
            Hint System (Read‑only)
          </h3>
          <p className="text-sm text-cyber-text-secondary">
            Hints are requested by players in the mission view. Captains can monitor costs and usage here.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-2">
            <MinusCircle className="h-5 w-5 text-cyber-neon-red" />
            <div className="text-sm text-cyber-text-primary font-semibold">Points-based hint</div>
          </div>
          <p className="text-sm text-cyber-text-secondary mb-3">Penalty: -{pointsHintCost} points</p>
        </div>

        <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="h-5 w-5 text-cyber-neon-yellow" />
            <div className="text-sm text-cyber-text-primary font-semibold">Time-based hint</div>
          </div>
          <p className="text-sm text-cyber-text-secondary mb-3">Penalty: +{timePenaltyMinutes} minutes</p>
        </div>
      </div>

      {typeof hintsAvailable === 'number' && (
        <div className="mt-4 text-xs text-cyber-text-secondary">
          Hints used by this team on the current level:{' '}
          <span className="text-cyber-neon-yellow">
            {hintsUsed ?? 0} / {hintsAvailable}
          </span>
        </div>
      )}
    </CyberCard>
  );
};

export default HintPanel;

