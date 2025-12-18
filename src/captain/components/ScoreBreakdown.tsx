import { Trophy, MinusCircle, Clock, CheckCircle2 } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';

interface ScoreBreakdownProps {
  baseScore: number;
  hintPenalty?: number;
  timePenalty?: number;
  finalScore?: number;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  baseScore,
  hintPenalty = 0,
  timePenalty = 0,
  finalScore,
}) => {
  const computed = finalScore ?? Math.max(0, baseScore - hintPenalty - timePenalty);
  return (
    <CyberCard>
      <div className="flex items-center space-x-3 mb-4">
        <Trophy className="h-6 w-6 text-cyber-neon-yellow" />
        <h3 className="text-xl font-cyber font-bold text-cyber-text-primary">Score Breakdown</h3>
      </div>
      <div className="space-y-3 text-sm text-cyber-text-secondary">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-cyber-neon-green" />
            <span>Base Score</span>
          </span>
          <span className="text-cyber-text-primary font-semibold">{baseScore} pts</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <MinusCircle className="h-4 w-4 text-cyber-neon-red" />
            <span>Hint Penalty</span>
          </span>
          <span className="text-cyber-neon-red font-semibold">-{hintPenalty} pts</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-cyber-neon-yellow" />
            <span>Time Penalty</span>
          </span>
          <span className="text-cyber-neon-yellow font-semibold">-{timePenalty} pts</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-cyber-border">
          <span className="text-cyber-text-primary font-semibold">Final Score</span>
          <span className="text-cyber-neon-green font-bold text-lg">{computed} pts</span>
        </div>
      </div>
    </CyberCard>
  );
};

export default ScoreBreakdown;

