import { useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { MissionHeader } from '@/captain/components/MissionHeader';
import MissionCard from '@/captain/components/MissionCard';
import { useCaptainStore } from '@/captain/state/captainStore';
import { Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const Levels: React.FC = () => {
  const { user } = useAuth();
  const teamId = user?.teamId || user?.id || user?.email;
  const navigate = useNavigate();
  const { levels, loadData } = useCaptainStore();

  useEffect(() => {
    if (teamId) loadData(teamId);
  }, [teamId, loadData]);

  const active = useMemo(() => levels.filter((l) => l.isActive ?? true), [levels]);

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <MissionHeader
          icon={Target}
          title="Levels & Missions"
          subtitle="Browse missions assigned to your team"
          status={{ label: `${active.length} Active`, color: 'green' }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levels.map((level) => (
            <MissionCard
              key={level.id}
              level={level}
              onOpen={(id) => navigate(`/captain/levels/${id}`)}
            />
          ))}
          {levels.length === 0 && (
            <div className="cyber-card text-cyber-text-secondary">No missions assigned yet.</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Levels;

