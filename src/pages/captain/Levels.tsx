import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { LevelCard } from '@/components/captain/LevelCard';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { firestoreAPI } from '@/utils/firestore';
import { Submission } from '@/types';
import { Target, Trophy, Clock, Shield, Activity, AlertTriangle } from 'lucide-react';

export const CaptainLevels: React.FC = () => {
  const { levels, teams } = useAppStore();
  const { user } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const team = teams.find((t) => t.captainId === user?.id);

  useEffect(() => {
    const loadSubmissions = async () => {
      if (team) {
        try {
          const data = await firestoreAPI.getTeamSubmissions(team.id);
          setSubmissions(data);
        } catch (error) {
          console.error('Error loading submissions:', error);
        }
      }
      setLoading(false);
    };

    loadSubmissions();
  }, [team]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="terminal-window p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
              <p className="font-mono text-cyan-400">LOADING MISSION DATA...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="terminal-window p-8 border-2 border-red-500/50">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <div>
              <h3 className="font-cyber text-xl text-red-400 mb-2">ACCESS DENIED</h3>
              <p className="text-cyan-400 font-mono">
                You are not assigned to any team. Contact the administrator for team assignment.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const completionRate = levels.length > 0 
    ? Math.round((team.levelsCompleted / levels.length) * 100) 
    : 0;

  const stats = [
    {
      icon: Trophy,
      label: 'Total Score',
      value: team.score.toString(),
      color: 'bg-yellow-500',
    },
    {
      icon: Target,
      label: 'Missions Completed',
      value: `${team.levelsCompleted}/${levels.length}`,
      color: 'bg-purple-500',
    },
    {
      icon: Clock,
      label: 'Time Penalty',
      value: `${team.timePenalty}m`,
      color: 'bg-red-500',
    },
    {
      icon: Activity,
      label: 'Progress',
      value: `${completionRate}%`,
      color: 'bg-blue-500',
      bgColor: 'bg-neon-blue/10',
      borderColor: 'border-neon-blue/30',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header - Admin Style */}
        <div className="terminal-window p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Shield className="h-16 w-16 text-neon-blue" />
              <div>
                <h1 className="text-4xl font-cyber font-bold text-white">
                  {team.name}
                </h1>
                <p className="text-cyan-400 font-mono text-sm mt-1">
                  Active Mission Control
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-6 py-3 bg-green-500/10 border border-green-500/30">
              <Activity className="h-5 w-5 animate-pulse text-green-500" />
              <div className="text-left">
                <div className="text-xs text-cyan-400 font-mono">STATUS</div>
                <div className="text-sm font-cyber font-bold text-green-500">OPERATIONAL</div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Admin Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="p-4 bg-dark-800/50 border border-cyan-800/30 hover:border-neon-blue/50 transition-all group"
                >
                  <div className={`${stat.color} p-3 inline-block mb-3`}>
                    <Icon className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-cyber font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-cyan-400">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 p-4 bg-dark-800 border border-neon-blue/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-cyber text-cyan-400">MISSION PROGRESS</span>
              <span className="text-sm font-mono text-neon-blue">{completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-dark-700 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-blue to-neon-green transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-scan"></div>
            </div>
          </div>
        </div>

        {/* Mission Brief - Admin Style */}
        <div className="terminal-window p-8">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="h-8 w-8 text-neon-green" />
            <h2 className="text-3xl font-cyber font-bold text-white">
              MISSION BRIEFING
            </h2>
          </div>
          <p className="text-cyan-300 leading-relaxed">
            Your objective is to complete all assigned missions and achieve maximum points. 
            Each mission has varying difficulty levels and point values. Request intel when 
            needed, but be aware of penalties. Time is tracked for all operations. Good luck, operator.
          </p>
        </div>

        {/* Levels Grid */}
        <div className="terminal-window p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-neon-purple" />
              <h2 className="text-3xl font-cyber font-bold text-white">
                AVAILABLE MISSIONS
              </h2>
            </div>
            <div className="text-sm font-mono text-cyan-400">
              {levels.filter(l => l.isActive).length} ACTIVE / {levels.length} TOTAL
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {levels.map((level) => (
              <LevelCard key={level.id} level={level} submissions={submissions} />
            ))}
          </div>

          {levels.length === 0 && (
            <div className="bg-dark-800/50 border border-cyan-800/30 p-12 text-center mt-6">
              <Target className="h-16 w-16 text-cyan-600 mx-auto mb-4" />
              <p className="text-cyan-100 font-cyber text-lg">NO MISSIONS AVAILABLE</p>
              <p className="text-cyan-400 text-sm mt-2">Check back later for new assignments</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
