import { useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { MissionHeader } from '@/captain/components/MissionHeader';
import MissionStatCard from '@/captain/components/MissionStatCard';
import TeamProgressGraph from '@/captain/components/TeamProgressGraph';
import ActivityLogList from '@/captain/components/ActivityLogList';
import { useCaptainStore } from '@/captain/state/captainStore';
import { useAuth } from '@/hooks/useAuth';
import { Activity, Target, Trophy, Clock } from 'lucide-react';

export const TeamProgress: React.FC = () => {
  const { user } = useAuth();
  const teamId = user?.teamId || user?.id || user?.email;
  const { loadData, levels, submissions, activity } = useCaptainStore();

  useEffect(() => {
    if (teamId) loadData(teamId);
  }, [teamId, loadData]);

  const completed = submissions.filter((s) => s.status === 'correct' || s.finalScore > 0).length;
  const score = submissions.reduce((sum, s) => sum + (s.scoreAwarded || s.finalScore || 0), 0);

  // Average solve time in minutes based on server-calculated timeTaken for correct submissions
  const avgSolveTime = useMemo(() => {
    const correctSubs = submissions.filter(
      (s) => (s.status === 'correct' || (s.finalScore || 0) > 0) && typeof s.timeTaken === 'number'
    );
    if (!correctSubs.length) return 0;
    const totalTime = correctSubs.reduce((sum, s) => sum + (s.timeTaken || 0), 0);
    return Math.round(totalTime / correctSubs.length);
  }, [submissions]);

  const progressData = useMemo(() => {
    return levels.map((l) => ({
      label: l.title,
      value: submissions.find((s) => s.levelId === l.id)?.scoreAwarded || submissions.find((s) => s.levelId === l.id)?.finalScore || 0,
      color: 'linear-gradient(90deg, #4C9CFF, #3CCF91)',
    }));
  }, [levels, submissions]);

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <MissionHeader
          icon={Activity}
          title="Team Progress"
          subtitle="Scores, time, and activity"
          status={{ label: `${completed}/${levels.length} Completed`, color: 'green' }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MissionStatCard icon={Trophy} label="Total Score" value={score} color="yellow" />
          <MissionStatCard icon={Target} label="Levels Completed" value={`${completed}/${levels.length}`} color="purple" />
          <MissionStatCard icon={Clock} label="Avg Solve Time" value={`${avgSolveTime} min`} color="blue" />
        </div>

        <TeamProgressGraph data={progressData} />

        <ActivityLogList items={activity.slice(0, 10)} />
      </div>
    </Layout>
  );
};

export default TeamProgress;

