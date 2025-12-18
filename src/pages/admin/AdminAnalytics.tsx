import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { BarChart3, TrendingUp, Clock, Users, Target, Award, Activity, AlertCircle } from 'lucide-react';

interface AnalyticsData {
  submissions: any[];
  teams: any[];
  levels: any[];
  users: any[];
}

const AdminAnalytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    submissions: [],
    teams: [],
    levels: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snapshot) => {
      const submissions = snapshot.docs.map((doc) => doc.data());
      setData((prev) => ({ ...prev, submissions }));
      setLoading(false);
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData((prev) => ({ ...prev, teams }));
    });

    const unsubLevels = onSnapshot(collection(db, 'levels'), (snapshot) => {
      const levels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData((prev) => ({ ...prev, levels }));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map((doc) => doc.data());
      setData((prev) => ({ ...prev, users }));
    });

    return () => {
      unsubSubmissions();
      unsubTeams();
      unsubLevels();
      unsubUsers();
    };
  }, []);

  // Calculate analytics
  const analytics = {
    totalSubmissions: data.submissions.length,
    successRate: data.submissions.length > 0
      ? Math.round((data.submissions.length / (data.teams.length * data.levels.length)) * 100)
      : 0,
    averageScore: data.teams.length > 0
      ? Math.round(data.teams.reduce((sum, t) => sum + (t.score || 0), 0) / data.teams.length)
      : 0,
    totalHintsUsed: data.submissions.reduce((sum, s) => sum + (s.hintsUsed || 0), 0),
    averageTime: data.submissions.length > 0
      ? Math.round(data.submissions.reduce((sum, s) => sum + (s.timeTaken || 0), 0) / data.submissions.length)
      : 0,
    activeTeams: data.teams.filter((t) => (t.levelsCompleted || 0) > 0).length,
    activeLevels: data.levels.filter((l) => l.isActive).length,
    completionRate: data.teams.length > 0 && data.levels.length > 0
      ? Math.round((data.submissions.length / (data.teams.length * data.levels.length)) * 100)
      : 0,
  };

  // Level-wise statistics
  const levelStats = data.levels.map((level) => {
    const levelSubmissions = data.submissions.filter((s) => s.levelId === level.id);
    return {
      id: level.id,
      title: level.title,
      attempts: levelSubmissions.length,
      avgScore: levelSubmissions.length > 0
        ? Math.round(levelSubmissions.reduce((sum, s) => sum + (s.finalScore || 0), 0) / levelSubmissions.length)
        : 0,
      avgTime: levelSubmissions.length > 0
        ? Math.round(levelSubmissions.reduce((sum, s) => sum + (s.timeTaken || 0), 0) / levelSubmissions.length)
        : 0,
      hintsUsed: levelSubmissions.reduce((sum, s) => sum + (s.hintsUsed || 0), 0),
    };
  }).sort((a, b) => b.attempts - a.attempts);

  // Top performers
  const topTeams = [...data.teams]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  // Recent activity timeline
  const recentActivity = data.submissions
    .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
    .slice(0, 10)
    .map((sub) => {
      const team = data.teams.find((t) => t.id === sub.teamId);
      const level = data.levels.find((l) => l.id === sub.levelId);
      return {
        ...sub,
        teamName: team?.name || sub.teamId,
        levelTitle: level?.title || sub.levelId,
      };
    });

  // Submission trends (last 24 hours)
  const now = Date.now();
  const last24h = data.submissions.filter((s) => now - (s.submittedAt || 0) < 24 * 60 * 60 * 1000);
  const submissionsByHour = Array.from({ length: 24 }, (_, i) => {
    const hourStart = now - (24 - i) * 60 * 60 * 1000;
    const hourEnd = hourStart + 60 * 60 * 1000;
    return last24h.filter((s) => s.submittedAt >= hourStart && s.submittedAt < hourEnd).length;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 font-display mb-2">
          ANALYTICS DASHBOARD
        </h1>
        <p className="text-gray-400">Real-time competition insights and statistics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Submissions</p>
              <p className="text-3xl font-bold text-white">{analytics.totalSubmissions}</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-600 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="text-green-400 text-sm">{analytics.completionRate}%</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-white">{analytics.activeTeams}/{data.teams.length}</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-600 rounded-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">Average Score</p>
              <p className="text-3xl font-bold text-white">{analytics.averageScore}</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">Avg Solve Time</p>
              <p className="text-3xl font-bold text-white">{analytics.averageTime}m</p>
            </div>
          </div>

          {/* Submission Trend */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-green-500" />
              Submission Trend (Last 24 Hours)
            </h2>
            <div className="flex items-end space-x-2 h-48">
              {submissionsByHour.map((count, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-red-600 to-red-500 rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${Math.max(count * 10, 4)}%`,
                      minHeight: '4px',
                    }}
                    title={`${count} submissions`}
                  />
                  <span className="text-gray-500 text-xs mt-2">
                    {24 - index}h
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Level Statistics */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Target className="h-6 w-6 mr-2 text-purple-500" />
                Level Performance
              </h2>
              <div className="space-y-3">
                {levelStats.slice(0, 8).map((level) => (
                  <div key={level.id} className="bg-slate-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{level.title}</span>
                      <span className="text-gray-400 text-sm">{level.attempts} attempts</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Avg Score:</span>
                        <span className="text-green-400 ml-2 font-bold">{level.avgScore}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Avg Time:</span>
                        <span className="text-blue-400 ml-2 font-bold">{level.avgTime}m</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Hints:</span>
                        <span className="text-yellow-400 ml-2 font-bold">{level.hintsUsed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Teams */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Award className="h-6 w-6 mr-2 text-yellow-500" />
                Top Performers
              </h2>
              <div className="space-y-3">
                {topTeams.map((team, index) => (
                  <div key={team.id} className="flex items-center space-x-4 bg-slate-900 rounded-lg p-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : index === 1
                          ? 'bg-gradient-to-r from-gray-300 to-gray-500'
                          : index === 2
                          ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{team.name}</p>
                      <div className="flex items-center space-x-3 text-sm">
                        <span className="text-green-400">{team.score || 0} pts</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-blue-400">{team.levelsCompleted || 0} levels</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Activity className="h-6 w-6 mr-2 text-red-500" />
              Recent Activity
            </h2>
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-900 rounded-lg hover:bg-slate-850 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {activity.teamName} completed {activity.levelTitle}
                      </p>
                      <p className="text-gray-400 text-sm">
                        +{activity.finalScore} points • {activity.hintsUsed} hints used
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(activity.submittedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;

