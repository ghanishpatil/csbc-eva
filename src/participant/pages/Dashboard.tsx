import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { getTeamStatus } from '@/api/participantApi';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Shield, Target, Clock, MapPin, CheckCircle2, AlertCircle, ArrowRight, QrCode, Pause, StopCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NeonButton } from '@/components/ui/NeonButton';
import toast from 'react-hot-toast';
import type { TeamStatus } from '@/api/participantApi';
import type { EventConfig } from '@/types';

export const Dashboard = () => {
  const { user, isPlayer } = useAuth();
  const navigate = useNavigate();
  const [teamStatus, setTeamStatus] = useState<TeamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);

  // Redirect non-players
  useEffect(() => {
    if (user && !isPlayer) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'captain') {
        navigate('/captain/dashboard', { replace: true });
      }
    }
  }, [user, isPlayer, navigate]);

  // Subscribe to event config for real-time event status
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'event'), (snapshot) => {
      if (snapshot.exists()) {
        setEventConfig(snapshot.data() as EventConfig);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch team status
  useEffect(() => {
    if (!user?.teamId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        if (!user.teamId) return;
        const response = await getTeamStatus(user.teamId);
        if (response.success) {
          setTeamStatus(response.team);
          setTimeElapsed(response.team.timeElapsed);
        }
      } catch (error: any) {
        console.error('Error fetching team status:', error);
        toast.error('Failed to load team status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Subscribe to real-time team updates
    const unsubscribe = onSnapshot(doc(db, 'teams', user.teamId), async () => {
      try {
        if (!user.teamId) return;
        const response = await getTeamStatus(user.teamId);
        if (response.success) {
          setTeamStatus(response.team);
          setTimeElapsed(response.team.timeElapsed);
        }
      } catch (error) {
        console.error('Error updating team status:', error);
      }
    });

    return () => unsubscribe();
  }, [user?.teamId]);

  // Update timer every second - ONLY when event is active/running
  useEffect(() => {
    if (!teamStatus?.currentLevelStartTime) return;
    
    // Don't run timer if event is stopped or paused
    const eventStatus = eventConfig?.status || eventConfig?.eventStatus;
    if (eventStatus === 'stopped' || eventStatus === 'paused' || eventConfig?.isActive === false) {
      return;
    }

    const interval = setInterval(() => {
      if (teamStatus.currentLevelStartTime) {
        const elapsed = Math.floor((Date.now() - teamStatus.currentLevelStartTime) / 1000);
        setTimeElapsed(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [teamStatus?.currentLevelStartTime, eventConfig?.status, eventConfig?.eventStatus, eventConfig?.isActive]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      waiting: { label: 'WAITING', color: 'yellow', icon: AlertCircle, className: 'text-cyber-neon-yellow' },
      at_location: { label: 'AT LOCATION', color: 'blue', icon: MapPin, className: 'text-cyber-neon-blue' },
      solving: { label: 'SOLVING', color: 'green', icon: Target, className: 'text-cyber-neon-green' },
      moving: { label: 'MOVING', color: 'purple', icon: ArrowRight, className: 'text-cyber-neon-purple' },
    };
    return badges[status as keyof typeof badges] || badges.waiting;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-neon-blue"></div>
        </div>
      </Layout>
    );
  }

  if (!user?.teamId) {
    return (
      <Layout>
        <CyberCard>
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-cyber-neon-red mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cyber-text-primary mb-2">NO TEAM ASSIGNED</h2>
            <p className="text-cyber-text-secondary">Please contact an administrator to assign you to a team.</p>
          </div>
        </CyberCard>
      </Layout>
    );
  }

  const statusBadge = getStatusBadge(teamStatus?.status || 'waiting');
  const StatusIcon = statusBadge.icon;

  // Determine event status
  const eventStatus = eventConfig?.status || eventConfig?.eventStatus;
  const isEventPaused = eventStatus === 'paused';
  const isEventStopped = eventStatus === 'stopped' || eventConfig?.isActive === false;
  // const isEventRunning = eventStatus === 'running' || eventStatus === 'active' || (eventConfig?.isActive === true && !isEventPaused && !isEventStopped); // Unused

  return (
    <Layout>
      <div className="space-y-8">
        {/* Event Status Banner */}
        {(isEventPaused || isEventStopped) && (
          <div className={`rounded-xl p-4 border ${
            isEventStopped 
              ? 'bg-cyber-neon-red/10 border-cyber-neon-red/50' 
              : 'bg-cyber-neon-yellow/10 border-cyber-neon-yellow/50'
          }`}>
            <div className="flex items-center justify-center space-x-3">
              {isEventStopped ? (
                <>
                  <StopCircle className="h-6 w-6 text-cyber-neon-red animate-pulse" />
                  <span className="text-cyber-neon-red font-cyber font-bold text-lg">EVENT STOPPED</span>
                </>
              ) : (
                <>
                  <Pause className="h-6 w-6 text-cyber-neon-yellow animate-pulse" />
                  <span className="text-cyber-neon-yellow font-cyber font-bold text-lg">EVENT PAUSED</span>
                </>
              )}
            </div>
            <p className="text-center text-cyber-text-secondary text-sm mt-2">
              {isEventStopped 
                ? 'The event has ended. Timer has been stopped.' 
                : 'The event is temporarily paused. Timer is on hold.'}
            </p>
          </div>
        )}

        {/* Header */}
        <PageHeader
          icon={Shield}
          title="MISSION CONTROL"
          subtitle={`Team ${teamStatus?.name || 'Unknown'}`}
          status={{
            label: "EVENT",
            value: isEventStopped ? 'STOPPED' : isEventPaused ? 'PAUSED' : statusBadge.label,
            color: (isEventStopped ? 'red' : isEventPaused ? 'yellow' : statusBadge.color) as 'red' | 'blue' | 'green' | 'yellow',
          }}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Target}
            label="Current Level"
            value={teamStatus?.currentLevel || 1}
            color="purple"
          />
          <StatCard
            icon={CheckCircle2}
            label="Levels Completed"
            value={teamStatus?.levelsCompleted || 0}
            color="green"
          />
          <StatCard
            icon={Shield}
            label="Total Score"
            value={teamStatus?.score || 0}
            color="yellow"
          />
          <StatCard
            icon={Clock}
            label="Time Elapsed"
            value={isEventStopped ? 'STOPPED' : isEventPaused ? `${formatTime(timeElapsed)} (PAUSED)` : formatTime(timeElapsed)}
            color={isEventStopped ? 'red' : isEventPaused ? 'yellow' : 'blue'}
          />
        </div>

        {/* Current Mission Status */}
        <CyberCard>
          <SectionTitle icon={Target} title="CURRENT MISSION STATUS" />
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  statusBadge.color === 'yellow' ? 'bg-cyber-neon-yellow/20 border-cyber-neon-yellow/50' :
                  statusBadge.color === 'blue' ? 'bg-cyber-neon-blue/20 border-cyber-neon-blue/50' :
                  statusBadge.color === 'green' ? 'bg-cyber-neon-green/20 border-cyber-neon-green/50' :
                  'bg-cyber-neon-purple/20 border-cyber-neon-purple/50'
                }`}>
                  <StatusIcon className={`h-6 w-6 ${statusBadge.className}`} />
                </div>
                <div>
                  <div className="text-cyber-text-secondary text-sm">MISSION STATUS</div>
                  <div className={`text-xl font-bold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </div>
                </div>
              </div>
              {teamStatus?.groupName && (
                <div className="text-sm text-cyber-text-secondary">
                  Group: <span className="text-cyber-text-primary font-medium">{teamStatus.groupName}</span>
                </div>
              )}
            </div>

            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-6">
              <div className="text-cyber-text-secondary text-sm mb-2">CURRENT LEVEL</div>
              <div className="text-3xl font-bold text-cyber-text-primary mb-4">
                Level {teamStatus?.currentLevel || 1}
              </div>
              {teamStatus?.currentLevelStartTime && (
                <div className="text-sm text-cyber-text-secondary">
                  Started: {new Date(teamStatus.currentLevelStartTime).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </CyberCard>

        {/* Quick Actions */}
        <CyberCard>
          <SectionTitle icon={CheckCircle2} title="QUICK ACTIONS" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!teamStatus?.isCheckedIn && teamStatus?.currentLevel && (
              <NeonButton
                onClick={() => navigate('/participant/check-in')}
                className="w-full"
                color="blue"
                icon={QrCode}
              >
                Scan QR to Check In
              </NeonButton>
            )}

            {teamStatus?.isCheckedIn && (
              <NeonButton
                onClick={() => navigate('/participant/mission')}
                className="w-full"
                color="green"
                icon={Target}
              >
                View Active Mission
              </NeonButton>
            )}
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};

