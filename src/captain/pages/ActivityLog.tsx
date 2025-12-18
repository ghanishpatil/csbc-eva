import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { MissionHeader } from '@/captain/components/MissionHeader';
import ActivityLogList from '@/captain/components/ActivityLogList';
import { useCaptainStore } from '@/captain/state/captainStore';
import { useAuth } from '@/hooks/useAuth';
import { ListChecks } from 'lucide-react';

export const ActivityLog: React.FC = () => {
  const { user } = useAuth();
  const teamId = user?.teamId || user?.id || user?.uid || user?.email;
  const { loadData, activity } = useCaptainStore();

  useEffect(() => {
    if (teamId) loadData(teamId);
  }, [teamId, loadData]);

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <MissionHeader
          icon={ListChecks}
          title="Activity Log"
          subtitle="Team-only mission events"
          status={{ label: 'LIVE', color: 'blue' }}
        />

        <ActivityLogList items={activity} />
      </div>
    </Layout>
  );
};

export default ActivityLog;

