import { useState, useEffect } from 'react';
import { Monitor, Activity, Trophy, Clock, Zap, TrendingUp } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAppStore } from '@/store/appStore';
import { formatDate } from '@/utils/helpers';

interface RecentSubmission {
  id: string;
  teamId: string;
  levelId: string;
  finalScore: number;
  submittedAt: number;
}

export const LiveMonitor: React.FC = () => {
  const { teams, levels } = useAppStore();
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [liveActivity, setLiveActivity] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to recent submissions
    const q = query(
      collection(db, 'submissions'),
      orderBy('submittedAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const submissions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RecentSubmission[];
      
      setRecentSubmissions(submissions);

      // Add to activity feed
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as RecentSubmission;
          const team = teams.find(t => t.id === data.teamId);
          const level = levels.find(l => l.id === data.levelId);
          
          if (team && level) {
            const activity = `${team.name} completed "${level.title}" (+${data.finalScore} pts)`;
            setLiveActivity(prev => [activity, ...prev].slice(0, 20));
          }
        }
      });
    });

    return () => unsubscribe();
  }, [teams, levels]);

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  const getLevelTitle = (levelId: string) => {
    return levels.find(l => l.id === levelId)?.title || 'Unknown Mission';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-window p-6 border border-neon-green/30 scan-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="h-6 w-6 text-neon-green animate-pulse" />
            <h2 className="text-2xl font-cyber font-bold text-neon-green">LIVE MONITOR</h2>
          </div>
          <div className="flex items-center space-x-2 bg-neon-green/10 px-4 py-2 border border-neon-green/50">
            <Activity className="h-4 w-4 text-neon-green animate-pulse" />
            <span className="font-cyber text-neon-green text-sm">REAL-TIME</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="terminal-window p-6 border border-neon-blue/30">
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="h-5 w-5 text-neon-blue" />
            <h3 className="font-cyber text-neon-blue text-lg">RECENT SUBMISSIONS</h3>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {recentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="p-3 bg-dark-800/30 border border-cyan-900/30 hover:border-neon-blue/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-cyber text-cyan-100 text-sm">
                      {getTeamName(submission.teamId)}
                    </div>
                    <div className="text-xs text-cyan-500 font-mono">
                      {getLevelTitle(submission.levelId)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-cyber text-neon-green font-bold">
                      +{submission.finalScore}
                    </div>
                    <div className="text-xs text-cyan-600 font-mono">
                      PTS
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-cyan-700 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(submission.submittedAt)}</span>
                </div>
              </div>
            ))}
            {recentSubmissions.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-cyan-900 mx-auto mb-3" />
                <p className="text-cyan-600 font-mono text-sm">NO SUBMISSIONS YET</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="terminal-window p-6 border border-neon-green/30">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-neon-green" />
            <h3 className="font-cyber text-neon-green text-lg">ACTIVITY FEED</h3>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {liveActivity.map((activity, index) => (
              <div
                key={index}
                className="p-3 bg-dark-800/30 border border-cyan-900/30 animate-pulse-once"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start space-x-2">
                  <Zap className="h-4 w-4 text-neon-green flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-cyan-400 font-mono">{activity}</div>
                </div>
              </div>
            ))}
            {liveActivity.length === 0 && (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-cyan-900 mx-auto mb-3" />
                <p className="text-cyan-600 font-mono text-sm">NO RECENT ACTIVITY</p>
                <p className="text-cyan-800 text-xs mt-1">Activity will appear here in real-time</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="terminal-window p-4 border border-neon-blue/30">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-6 w-6 text-neon-blue" />
            <div className="text-2xl font-cyber font-bold text-neon-blue">
              {recentSubmissions.length}
            </div>
          </div>
          <div className="text-xs text-cyan-500 font-mono">SUBMISSIONS (LAST 10)</div>
        </div>

        <div className="terminal-window p-4 border border-neon-green/30">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="h-6 w-6 text-neon-green" />
            <div className="text-2xl font-cyber font-bold text-neon-green">
              {recentSubmissions.reduce((acc, s) => acc + s.finalScore, 0)}
            </div>
          </div>
          <div className="text-xs text-cyan-500 font-mono">POINTS EARNED</div>
        </div>

        <div className="terminal-window p-4 border border-neon-purple/30">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-6 w-6 text-neon-purple" />
            <div className="text-2xl font-cyber font-bold text-neon-purple">
              {teams.filter(t => t.levelsCompleted > 0).length}
            </div>
          </div>
          <div className="text-xs text-cyan-500 font-mono">ACTIVE TEAMS</div>
        </div>

        <div className="terminal-window p-4 border border-neon-yellow/30">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-6 w-6 text-neon-yellow" />
            <div className="text-2xl font-cyber font-bold text-neon-yellow">
              {liveActivity.length}
            </div>
          </div>
          <div className="text-xs text-cyan-500 font-mono">TOTAL EVENTS</div>
        </div>
      </div>
    </div>
  );
};

