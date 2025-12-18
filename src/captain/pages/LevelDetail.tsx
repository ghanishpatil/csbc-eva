import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { MissionHeader } from '@/captain/components/MissionHeader';
import MissionStatCard from '@/captain/components/MissionStatCard';
import ScoreBreakdown from '@/captain/components/ScoreBreakdown';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { CyberCard } from '@/components/ui/CyberCard';
import { useCaptainStore } from '@/captain/state/captainStore';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Target, Clock, AlertTriangle } from 'lucide-react';

export const LevelDetail: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const { user } = useAuth();
  const teamId = user?.teamId || user?.id || user?.email;
  const { levels, submissions, loadData } = useCaptainStore();

  useEffect(() => {
    if (teamId) loadData(teamId);
  }, [teamId, loadData]);

  const level = useMemo(() => levels.find((l) => l.id === levelId), [levels, levelId]);
  const submission = useMemo(() => submissions.find((s) => s.levelId === levelId), [submissions, levelId]);

  if (!level) {
    return (
      <Layout>
        <div className="space-y-6">
          <CaptainNavbar />
          <div className="cyber-card text-cyber-text-secondary">Mission not found.</div>
        </div>
      </Layout>
    );
  }

  const hintsUsed = submission?.hintsUsed || 0;
  const timePenalty = submission?.timePenalty || 0;
  const scoreAwarded = submission?.scoreAwarded || submission?.finalScore || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <MissionHeader
          icon={Target}
          title={level.title}
          subtitle={`Mission #${level.number || level.id}`}
          status={{
            label: submission ? 'COMPLETED' : 'IN PROGRESS',
            color: submission ? 'green' : 'yellow',
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MissionStatCard icon={Trophy} label="Base Score" value={`${level.basePoints || 0}`} color="yellow" />
          <MissionStatCard icon={Clock} label="Time Penalty" value={`${timePenalty} pts`} color="blue" />
          <MissionStatCard icon={AlertTriangle} label="Hints Used" value={hintsUsed} color="red" />
        </div>

        <CyberCard>
          <SectionTitle icon={Target} title="Mission Briefing" />
          <p className="text-cyber-text-secondary text-sm leading-relaxed">{level.description || 'Mission details not provided.'}</p>
          <div className="flex flex-wrap gap-3 text-xs text-cyber-text-secondary mt-3">
            <span className="px-3 py-1 rounded-full border border-cyber-border bg-cyber-bg-darker">Difficulty: {level.difficulty || 'Medium'}</span>
            <span className="px-3 py-1 rounded-full border border-cyber-border bg-cyber-bg-darker">Hints: {level.hints?.length || 0}</span>
          </div>
        </CyberCard>

        <CyberCard>
          <SectionTitle icon={Target} title="Read-Only View" />
          <div className="text-cyber-text-secondary text-sm">
            <p className="mb-4">This is a read-only monitoring view. Captains cannot submit flags or modify team progress.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-cyber-bg-darker border border-cyber-border rounded-lg">
                <div className="text-xs font-cyber text-cyber-neon-blue mb-2">SUBMISSION STATUS</div>
                {submission ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-cyber-neon-green font-bold">COMPLETED</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Score Awarded:</span>
                      <span className="text-cyber-neon-yellow">{scoreAwarded} PTS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hints Used:</span>
                      <span>{hintsUsed}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-cyber-text-secondary">No submission recorded</div>
                )}
              </div>
              <ScoreBreakdown
                baseScore={level.basePoints || 0}
                hintPenalty={hintsUsed * 50}
                timePenalty={timePenalty}
                finalScore={scoreAwarded}
              />
            </div>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};

export default LevelDetail;

