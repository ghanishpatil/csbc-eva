import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Activity, Award, Clock, Users, Target, TrendingUp, CheckCircle, Calendar, Hash } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { PageHeader } from '@/components/ui/PageHeader';

interface Submission {
  id: string;
  teamId: string;
  levelId: string;
  finalScore: number;
  baseScore: number;
  hintsUsed: number;
  pointDeduction: number;
  timePenalty: number;
  timeTaken: number;
  submittedAt: number;
  submittedBy: string;
  status?: string;
}

interface Team {
  id: string;
  name: string;
  teamNumber?: number;
  groupId?: string;
}

interface Level {
  id: string;
  title: string;
  number: number;
  groupId?: string;
}

interface Group {
  id: string;
  name: string;
}

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [levels, setLevels] = useState<Record<string, Level>>({});
  const [groups, setGroups] = useState<Record<string, Group>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch teams
    const teamsUnsubscribe = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teamsMap: Record<string, Team> = {};
      snapshot.docs.forEach((doc) => {
        teamsMap[doc.id] = { id: doc.id, ...doc.data() } as Team;
      });
      setTeams(teamsMap);
    });

    // Fetch levels
    const levelsUnsubscribe = onSnapshot(collection(db, 'levels'), (snapshot) => {
      const levelsMap: Record<string, Level> = {};
      snapshot.docs.forEach((doc) => {
        levelsMap[doc.id] = { id: doc.id, ...doc.data() } as Level;
      });
      setLevels(levelsMap);
    });

    // Fetch groups
    const groupsUnsubscribe = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const groupsMap: Record<string, Group> = {};
      snapshot.docs.forEach((doc) => {
        groupsMap[doc.id] = { id: doc.id, ...doc.data() } as Group;
      });
      setGroups(groupsMap);
    });

    // Fetch submissions
    const q = query(
      collection(db, 'submissions'),
      orderBy('submittedAt', 'desc'),
      limit(100)
    );

    const submissionsUnsubscribe = onSnapshot(q, (snapshot) => {
      const submissionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Submission[];
      setSubmissions(submissionsData);
      setLoading(false);
    });

    return () => {
      teamsUnsubscribe();
      levelsUnsubscribe();
      groupsUnsubscribe();
      submissionsUnsubscribe();
    };
  }, []);

  // Helper functions
  const getTeamName = (teamId: string) => {
    const team = teams[teamId];
    if (team) {
      return team.teamNumber ? `Team #${team.teamNumber} - ${team.name}` : team.name;
    }
    return teamId.slice(0, 8) + '...';
  };

  const getTeamGroup = (teamId: string) => {
    const team = teams[teamId];
    if (team?.groupId && groups[team.groupId]) {
      return groups[team.groupId].name;
    }
    return null;
  };

  const getLevelInfo = (levelId: string) => {
    const level = levels[levelId];
    if (level) {
      return { title: level.title, number: level.number };
    }
    return { title: levelId.slice(0, 8) + '...', number: 0 };
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const teamName = getTeamName(sub.teamId).toLowerCase();
    const levelInfo = getLevelInfo(sub.levelId);
    const search = searchTerm.toLowerCase();
    
    return (
      teamName.includes(search) ||
      levelInfo.title.toLowerCase().includes(search) ||
      sub.teamId.toLowerCase().includes(search) ||
      sub.levelId.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: submissions.length,
    totalScore: submissions.reduce((sum, sub) => sum + (sub.finalScore || 0), 0),
    averageScore: submissions.length
      ? Math.round(submissions.reduce((sum, sub) => sum + (sub.finalScore || 0), 0) / submissions.length)
      : 0,
    totalHints: submissions.reduce((sum, sub) => sum + (sub.hintsUsed || 0), 0),
    uniqueTeams: new Set(submissions.map(s => s.teamId)).size,
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes < 0) return '-';
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="SUBMISSION MONITOR"
        subtitle="Real-time flag submission tracking"
        status={{ label: 'LIVE', value: `${stats.total} submissions`, color: 'green' }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <CyberCard className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-gray-400 text-sm">Total Submissions</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </CyberCard>

        <CyberCard className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Award className="h-5 w-5 text-yellow-400" />
            <span className="text-gray-400 text-sm">Total Score</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{stats.totalScore.toLocaleString()}</p>
        </CyberCard>

        <CyberCard className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Average Score</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{stats.averageScore}</p>
        </CyberCard>

        <CyberCard className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Users className="h-5 w-5 text-purple-400" />
            <span className="text-gray-400 text-sm">Teams Solved</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">{stats.uniqueTeams}</p>
        </CyberCard>

        <CyberCard className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Target className="h-5 w-5 text-orange-400" />
            <span className="text-gray-400 text-sm">Hints Used</span>
          </div>
          <p className="text-3xl font-bold text-orange-400">{stats.totalHints}</p>
        </CyberCard>
      </div>

      {/* Search */}
      <CyberCard>
        <input
          type="text"
          placeholder="Search by team name, level title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-cyber-bg-darker border border-cyber-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue placeholder:text-gray-500"
        />
      </CyberCard>

      {/* Submissions Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-neon-blue"></div>
        </div>
      ) : (
        <CyberCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cyber-bg-darker border-b border-cyber-border">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Time
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Mission
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Base</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Hints</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Penalty</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Final
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Taken
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission, index) => {
                  const teamGroup = getTeamGroup(submission.teamId);
                  const levelInfo = getLevelInfo(submission.levelId);
                  
                  return (
                    <tr
                      key={submission.id}
                      className={`border-b border-cyber-border/50 hover:bg-cyber-bg-darker transition-colors ${
                        index === 0 ? 'bg-green-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-white text-sm font-medium">
                            {new Date(submission.submittedAt).toLocaleTimeString()}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <div className="text-white font-semibold text-sm">
                                {getTeamName(submission.teamId)}
                              </div>
                              {teamGroup && (
                                <div className="text-xs text-purple-400">{teamGroup}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                            <Hash className="h-4 w-4 text-purple-400" />
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">
                              Level {levelInfo.number}
                            </div>
                            <div className="text-gray-400 text-xs truncate max-w-[150px]">
                              {levelInfo.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 font-medium">{submission.baseScore || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                            (submission.hintsUsed || 0) > 0
                              ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/50'
                              : 'bg-green-900/50 text-green-300 border border-green-500/50'
                          }`}
                        >
                          {submission.hintsUsed || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${(submission.pointDeduction || 0) > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                          {(submission.pointDeduction || 0) > 0 ? `-${submission.pointDeduction}` : '0'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold text-lg">
                            +{submission.finalScore || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-300 text-sm font-medium">
                            {formatDuration(submission.timeTaken)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No submissions yet</p>
              <p className="text-sm text-gray-600 mt-1">Submissions will appear here in real-time</p>
            </div>
          )}
        </CyberCard>
      )}
    </div>
  );
};

export default AdminSubmissions;

