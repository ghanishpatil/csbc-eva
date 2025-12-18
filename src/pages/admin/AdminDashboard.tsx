import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { getPlatformStats, getRecentActivity, checkBackendHealth } from '../../api/adminApi';
import { Activity, Users, Target, TrendingUp, Award, Clock, AlertTriangle, MapPin, Filter, ChevronRight } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface Team {
  id: string;
  name: string;
  teamNumber?: number;
  groupId?: string;
  currentLevel?: number;
  status?: string;
  score?: number;
}

interface Level {
  id: string;
  title?: string;
  number?: number;
  qrCodeId?: string;
  groupId?: string;
}

interface Group {
  id: string;
  name: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const {
    platformStats,
    setPlatformStats,
    recentActivity,
    setRecentActivity,
    backendHealth,
    setBackendHealth,
  } = useAdminStore();

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filterGroup, setFilterGroup] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
    checkBackend();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      checkBackend();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch teams, levels, and groups for name lookups
  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(teamsData);
    });

    const unsubLevels = onSnapshot(collection(db, 'levels'), (snapshot) => {
      const levelsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Level[];
      setLevels(levelsData);
    });

    const unsubGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
      setGroups(groupsData);
    });

    return () => {
      unsubTeams();
      unsubLevels();
      unsubGroups();
    };
  }, []);

  // Create lookup maps for teams and levels
  const teamMap = useMemo(() => {
    const map: Record<string, Team> = {};
    teams.forEach((team) => {
      map[team.id] = team;
    });
    return map;
  }, [teams]);

  const levelMap = useMemo(() => {
    const map: Record<string, Level> = {};
    levels.forEach((level) => {
      map[level.id] = level;
    });
    return map;
  }, [levels]);

  const groupMap = useMemo(() => {
    const map: Record<string, Group> = {};
    groups.forEach((group) => {
      map[group.id] = group;
    });
    return map;
  }, [groups]);

  // Filter teams by selected group
  const filteredTeams = useMemo(() => {
    if (filterGroup === 'all') return teams;
    return teams.filter((team) => team.groupId === filterGroup);
  }, [teams, filterGroup]);

  // Group teams by their current level
  const teamsByLevel = useMemo(() => {
    const grouped: Record<number, Team[]> = {};
    filteredTeams.forEach((team) => {
      const level = team.currentLevel || 1;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(team);
    });
    return grouped;
  }, [filteredTeams]);

  // Get max level number for the progress display
  const maxLevel = useMemo(() => {
    const groupLevels = filterGroup === 'all' 
      ? levels 
      : levels.filter(l => l.groupId === filterGroup);
    return Math.max(...groupLevels.map(l => l.number || 0), 1);
  }, [levels, filterGroup]);

  // Get group name
  const getGroupName = (groupId: string) => {
    const group = groupMap[groupId];
    return group?.name || 'Unassigned';
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'solving': return 'bg-yellow-500';
      case 'checked_in': return 'bg-blue-500';
      case 'moving': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get status text
  const getStatusText = (status?: string) => {
    switch (status) {
      case 'solving': return 'Solving';
      case 'checked_in': return 'Checked In';
      case 'moving': return 'Moving';
      case 'completed': return 'Completed';
      case 'waiting': return 'Waiting';
      default: return 'Unknown';
    }
  };

  // Helper function to get team display name
  const getTeamDisplayName = (teamId: string) => {
    const team = teamMap[teamId];
    if (team) {
      return team.teamNumber ? `Team #${team.teamNumber} - ${team.name}` : team.name;
    }
    return `Team ${teamId.slice(0, 8)}...`;
  };

  // Helper function to get level display name
  const getLevelDisplayName = (levelId: string) => {
    const level = levelMap[levelId];
    if (level) {
      if (level.title) {
        return level.number ? `Level ${level.number} - ${level.title}` : level.title;
      }
      return level.number ? `Level ${level.number}` : `Level ${levelId.slice(0, 8)}...`;
    }
    return `Level ${levelId.slice(0, 8)}...`;
  };

  const loadDashboardData = async () => {
    try {
      const [stats, activity] = await Promise.all([
        getPlatformStats(),
        getRecentActivity(10),
      ]);

      if (stats.success) {
        setPlatformStats(stats.stats);
      }

      if (activity.success) {
        setRecentActivity(activity.activity);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBackend = async () => {
    try {
      setBackendHealth('checking');
      await checkBackendHealth();
      setBackendHealth('connected');
    } catch (error) {
      setBackendHealth('disconnected');
    }
  };

  const statCards = [
    {
      title: 'Total Teams',
      value: platformStats?.totalTeams || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      link: '/admin/teams',
    },
    {
      title: 'Active Levels',
      value: `${platformStats?.activeLevels || 0}/${platformStats?.totalLevels || 0}`,
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      link: '/admin/levels',
    },
    {
      title: 'Total Submissions',
      value: platformStats?.totalSubmissions || 0,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      link: '/admin/submissions',
    },
    {
      title: 'Avg Team Score',
      value: platformStats?.averageScore || 0,
      icon: Award,
      color: 'from-yellow-500 to-yellow-600',
      link: '/admin/leaderboard',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 font-display">
              CONTROL CENTER
            </h1>
            <p className="text-gray-400 mt-2">Real-time platform overview</p>
          </div>

          {/* Backend Status */}
          <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <div
              className={`h-3 w-3 rounded-full ${
                backendHealth === 'connected'
                  ? 'bg-green-500 animate-pulse'
                  : backendHealth === 'disconnected'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-gray-300 text-sm">
              Backend: {backendHealth === 'connected' ? 'Connected' : backendHealth === 'disconnected' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/admin/teams')}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
          >
            Manage Teams
          </button>
          <button
            onClick={() => navigate('/admin/levels')}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
          >
            Manage Levels
          </button>
          <button
            onClick={() => navigate('/admin/settings')}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
          >
            Settings
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div
                key={index}
                onClick={() => navigate(stat.link)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-red-500 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Team Progress Tracker */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <MapPin className="h-6 w-6 mr-2 text-blue-500" />
                Team Progress Tracker
              </h2>
              <div className="flex items-center space-x-3">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Groups</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredTeams.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No teams found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Level Progress Bar */}
                <div className="flex items-center justify-between mb-4 px-2">
                  {Array.from({ length: maxLevel }, (_, i) => i + 1).map((levelNum) => (
                    <div key={levelNum} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        teamsByLevel[levelNum]?.length 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-gray-400'
                      }`}>
                        {levelNum}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {teamsByLevel[levelNum]?.length || 0} team{(teamsByLevel[levelNum]?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Team Cards grouped by level */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {Object.keys(teamsByLevel)
                    .sort((a, b) => Number(b) - Number(a))
                    .map((level) => (
                      <div key={level} className="bg-slate-900 rounded-lg border border-slate-700 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white flex items-center">
                            <Target className="h-5 w-5 mr-2 text-purple-400" />
                            Level {level}
                          </h3>
                          <span className="text-sm text-gray-400">
                            {teamsByLevel[Number(level)].length} team{teamsByLevel[Number(level)].length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {teamsByLevel[Number(level)].map((team) => (
                            <div
                              key={team.id}
                              className="bg-slate-800 rounded-lg p-3 border border-slate-600 hover:border-blue-500 transition-all cursor-pointer"
                              onClick={() => navigate('/admin/teams')}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium text-sm">
                                  {team.teamNumber ? `#${team.teamNumber}` : ''} {team.name}
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-purple-400">
                                  {getGroupName(team.groupId || '')}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className={`w-2 h-2 rounded-full ${getStatusColor(team.status)}`}></span>
                                  <span className="text-xs text-gray-400">{getStatusText(team.status)}</span>
                                </div>
                              </div>
                              {team.score !== undefined && (
                                <div className="mt-2 text-xs text-green-400">
                                  {team.score.toLocaleString()} pts
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Activity className="h-6 w-6 mr-2 text-red-500" />
                Recent Activity
              </h2>
              <button
                onClick={() => navigate('/admin/submissions')}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                View All →
              </button>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent submissions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {getTeamDisplayName(activity.teamId)} → {getLevelDisplayName(activity.levelId)}
                        </p>
                        <div className="flex items-center space-x-3 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Award className="h-3 w-3 mr-1" />
                            +{activity.finalScore} points
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(activity.submittedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm mb-2">Completion Rate</h3>
              <p className="text-4xl font-bold text-white mb-2">
                {platformStats?.completionRate || 0}%
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${platformStats?.completionRate || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm mb-2">Total Score</h3>
              <p className="text-4xl font-bold text-white">
                {platformStats?.totalScore?.toLocaleString() || 0}
              </p>
              <p className="text-green-400 text-sm mt-2">Across all teams</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm mb-2">Active Users</h3>
              <p className="text-4xl font-bold text-white">
                {platformStats?.totalUsers || 0}
              </p>
              <p className="text-blue-400 text-sm mt-2">Registered participants</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

