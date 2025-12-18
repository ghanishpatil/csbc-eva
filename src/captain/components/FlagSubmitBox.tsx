import { useState } from 'react';
import { NeonButton } from '@/components/ui/NeonButton';
import { captainApi } from '@/captain/api/captainApi';
import { toast } from 'react-hot-toast';

interface FlagSubmitBoxProps {
  teamId: string;
  levelId: string;
  onSuccess?: () => void;
}

export const FlagSubmitBox: React.FC<FlagSubmitBoxProps> = ({ teamId, levelId, onSuccess }) => {
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!flag) {
      toast.error('Enter a flag');
      return;
    }
    setLoading(true);
    try {
      // Note: Flag submission should use participant API, not captain API
      // This component may need refactoring to use the correct API endpoint
      await captainApi.post('/api/participant/submit-flag', { teamId, levelId, flag });
      toast.success('Flag submitted');
      setFlag('');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card">
      <div className="flex flex-col gap-3">
        <div className="text-sm font-cyber text-cyber-text-secondary">Submit Flag</div>
        <input
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          placeholder="FLAG{...}"
          className="w-full bg-cyber-bg-darker border border-cyber-border rounded-lg px-4 py-3 text-cyber-text-primary placeholder:text-cyber-text-secondary focus:outline-none focus:border-cyber-neon-blue"
        />
        <NeonButton color="green" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Flag'}
        </NeonButton>
      </div>
    </div>
  );
};

export default FlagSubmitBox;

