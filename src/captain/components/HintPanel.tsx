import { useState } from 'react';
import { NeonButton } from '@/components/ui/NeonButton';
import { captainApi } from '@/captain/api/captainApi';
import { toast } from 'react-hot-toast';
import { Clock, MinusCircle, PlusCircle } from 'lucide-react';

interface HintPanelProps {
  teamId: string;
  levelId: string;
  pointsHintCost?: number;
  timePenaltyMinutes?: number;
  onHint?: () => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  teamId,
  levelId,
  pointsHintCost = 50,
  timePenaltyMinutes = 5,
  onHint,
}) => {
  const [loading, setLoading] = useState(false);

  const requestHint = async (type: 'points' | 'time') => {
    setLoading(true);
    try {
      await captainApi.requestHint({ teamId, levelId, hintType: type });
      toast.success('Hint requested');
      onHint?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Hint request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-cyber font-bold text-cyber-text-primary">Need a hint?</h3>
          <p className="text-sm text-cyber-text-secondary">Choose your penalty type</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-2">
            <MinusCircle className="h-5 w-5 text-cyber-neon-red" />
            <div className="text-sm text-cyber-text-primary font-semibold">Points-based hint</div>
          </div>
          <p className="text-sm text-cyber-text-secondary mb-3">Penalty: -{pointsHintCost} points</p>
          <NeonButton color="red" onClick={() => requestHint('points')} disabled={loading} size="sm">
            Request points hint
          </NeonButton>
        </div>

        <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="h-5 w-5 text-cyber-neon-yellow" />
            <div className="text-sm text-cyber-text-primary font-semibold">Time-based hint</div>
          </div>
          <p className="text-sm text-cyber-text-secondary mb-3">Penalty: +{timePenaltyMinutes} minutes</p>
          <NeonButton color="blue" onClick={() => requestHint('time')} disabled={loading} size="sm">
            Request time hint
          </NeonButton>
        </div>
      </div>
    </div>
  );
};

export default HintPanel;

