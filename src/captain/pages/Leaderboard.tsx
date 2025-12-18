import { useEffect, useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { PageHeader } from '@/components/ui/PageHeader';
import LeaderboardTable from '@/captain/components/LeaderboardTable';
import { useAuth } from '@/hooks/useAuth';
import { Trophy } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { LeaderboardEntry, Team, Group } from '@/types';

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to leaderboard
    const leaderboardUnsub = onSnapshot(
      query(collection(db, 'leaderboard'), orderBy('score', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          ...doc.data(),
          rank: index + 1,
        })) as LeaderboardEntry[];
        setLeaderboard(data);
        setLoading(false);
      },
      (error) => {
        console.error('Leaderboard fetch error:', error);
        setLoading(false);
      }
    );

    // Subscribe to teams as fallback
    const teamsUnsub = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(data);
    });

    // Subscribe to groups
    const groupsUnsub = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
      setGroups(data);
    });

    return () => {
      leaderboardUnsub();
      teamsUnsub();
      groupsUnsub();
    };
  }, []);

  // Build display leaderboard from teams if leaderboard collection is empty
  const displayLeaderboard = useMemo(() => {
    if (leaderboard.length > 0) {
      return leaderboard;
    }
    
    // Fallback: Build from teams
    return teams
      .filter(team => team.score !== undefined && team.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((team, index) => ({
        id: team.id,
        teamId: team.id,
        teamName: team.name,
        teamNumber: team.teamNumber,
        groupId: team.groupId,
        score: team.score || 0,
        levelsCompleted: team.levelsCompleted || 0,
        totalTimePenalty: team.timePenalty || 0,
        lastSubmissionAt: team.updatedAt,
        rank: index + 1,
      }));
  }, [leaderboard, teams]);

  if (loading) {
    return (
      <Layout>
        <CaptainNavbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-neon-blue"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <PageHeader
          icon={Trophy}
          title="GLOBAL LEADERBOARD"
          subtitle="All teams across all groups (Read-only)"
          status={{ label: 'STATUS', value: 'LIVE', color: 'green' }}
        />

        <LeaderboardTable 
          data={displayLeaderboard} 
          title="All Teams Rankings"
        />
      </div>
    </Layout>
  );
};

export default Leaderboard;

