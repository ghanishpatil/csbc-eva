import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { getTeamStatus, startMission } from '@/api/participantApi';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Shield, Target, Clock, MapPin, CheckCircle2, AlertCircle, ArrowRight, QrCode, Pause, StopCircle, Play } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NeonButton } from '@/components/ui/NeonButton';
import { QRScanner } from '@/components/QRScanner';
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
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [missionStarted, setMissionStarted] = useState(false);
  const [missionData, setMissionData] = useState<{
    level: number;
    description: string;
    timeLimit: number;
    startTime: number;
  } | null>(null);
  const [missionTimer, setMissionTimer] = useState(0);

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

    // Subscribe to real-time team updates - use Firestore data directly (REAL-TIME)
    const unsubscribe = onSnapshot(doc(db, 'teams', user.teamId), (snapshot) => {
      if (snapshot.exists()) {
        const teamData = snapshot.data();
        
        // Calculate timeElapsed from currentLevelStartTime (real-time calculation)
        // This ensures we always have the latest time from Firestore
        let calculatedTimeElapsed = 0;
        if (teamData.currentLevelStartTime) {
          calculatedTimeElapsed = Math.floor((Date.now() - teamData.currentLevelStartTime) / 1000);
        }
        
        // Get group name from team data (groupName might not be in team doc, use from initial fetch)
        const groupName = teamStatus?.groupName || teamData.groupName || '';
        
        // Update team status with real-time Firestore data
        setTeamStatus({
          id: snapshot.id,
          name: teamData.name || '',
          score: teamData.score || 0,
          levelsCompleted: teamData.levelsCompleted || 0,
          currentLevel: teamData.currentLevel || 1,
          status: teamData.status || 'waiting',
          groupId: teamData.groupId || '',
          groupName: groupName,
          timeElapsed: calculatedTimeElapsed,
          currentLevelStartTime: teamData.currentLevelStartTime || null,
          isCheckedIn: teamData.isCheckedIn || false,
        });
        
        // Update timeElapsed state (real-time from Firestore)
        setTimeElapsed(calculatedTimeElapsed);
      }
    }, (error) => {
      console.error('Error in team snapshot:', error);
    });

    return () => unsubscribe();
  }, [user?.teamId]);

  // Update timer display every second when event is running (visual refresh)
  // Calculation uses real-time Firestore data as source of truth
  useEffect(() => {
    // Get event status
    const eventStatus = eventConfig?.status || eventConfig?.eventStatus;
    const isEventRunning = (eventStatus === 'running' || eventStatus === 'active') && eventConfig?.isActive === true;
    
    // Only update timer visually if event is running
    if (!isEventRunning) {
      return;
    }

    // Update timer display every second (visual refresh, calculation from Firestore data)
    const interval = setInterval(() => {
      // Calculate from event start time (total event elapsed time)
      if (eventConfig?.startTime) {
        const calculatedTimeElapsed = Math.floor((Date.now() - eventConfig.startTime) / 1000);
        setTimeElapsed(calculatedTimeElapsed);
      } else if (teamStatus?.currentLevelStartTime) {
        // Fallback: use level start time if event start time not available
        const calculatedTimeElapsed = Math.floor((Date.now() - teamStatus.currentLevelStartTime) / 1000);
        setTimeElapsed(calculatedTimeElapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [teamStatus?.currentLevelStartTime, eventConfig?.status, eventConfig?.eventStatus, eventConfig?.isActive, eventConfig?.startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle QR scan success
  const handleQRScanSuccess = async (qrData: string) => {
    if (!user?.teamId) {
      toast.error('No team assigned');
      return;
    }

    try {
      setShowQRScanner(false);
      toast.loading('Starting mission...', { id: 'mission-start' });

      const response = await startMission({ qrData });

      if (response.success) {
        toast.success(`✅ ${response.message}`, { id: 'mission-start' });
        
        setMissionStarted(true);
        setMissionData({
          level: response.level,
          description: response.description,
          timeLimit: response.timeLimit,
          startTime: response.startTime,
        });
        setMissionTimer(0);

        // Refresh team status
        if (user.teamId) {
          const statusResponse = await getTeamStatus(user.teamId);
          if (statusResponse.success) {
            setTeamStatus(statusResponse.team);
          }
        }

        // Navigate to mission page after a short delay
        setTimeout(() => {
          navigate('/participant/mission');
        }, 2000);
      } else {
        toast.error(response.error || 'Failed to start mission', { id: 'mission-start' });
      }
    } catch (error: any) {
      console.error('Mission start error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to start mission';
      toast.error(`❌ ${errorMessage}`, { id: 'mission-start' });
    }
  };

  // Update mission timer
  useEffect(() => {
    if (!missionStarted || !missionData) return;

    const eventStatus = eventConfig?.status || eventConfig?.eventStatus;
    if (eventStatus === 'stopped' || eventStatus === 'paused' || eventConfig?.isActive === false) {
      return;
    }

    const interval = setInterval(() => {
      if (!missionData) return;
      const elapsed = Math.floor((Date.now() - missionData.startTime) / 1000);
      setMissionTimer(elapsed);

      // Check if time limit exceeded
      if (missionData.timeLimit > 0 && elapsed >= missionData.timeLimit) {
        toast.error('⏰ Time limit exceeded!', { duration: 5000 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [missionStarted, missionData, eventConfig]);

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
  const isEventRunning = (eventStatus === 'running' || eventStatus === 'active') && eventConfig?.isActive === true;
  const isEventPaused = eventStatus === 'paused';
  const isEventStopped = eventStatus === 'stopped' || eventConfig?.isActive === false;
  const isEventNotStarted = !isEventRunning && !isEventPaused && !isEventStopped;

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
            value={
              isEventNotStarted 
                ? 'NOT STARTED' 
                : isEventStopped 
                  ? 'STOPPED' 
                  : isEventPaused 
                    ? `${formatTime(timeElapsed)} (PAUSED)` 
                    : formatTime(timeElapsed)
            }
            color={
              isEventNotStarted 
                ? 'yellow' 
                : isEventStopped 
                  ? 'red' 
                  : isEventPaused 
                    ? 'yellow' 
                    : 'blue'
            }
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

        {/* QR Scanner Section */}
        {showQRScanner && (
          <QRScanner
            onScanSuccess={handleQRScanSuccess}
            onClose={() => setShowQRScanner(false)}
            disabled={loading || !user?.teamId}
          />
        )}

        {/* Mission Started View */}
        {missionStarted && missionData && !showQRScanner && (
          <CyberCard>
            <SectionTitle icon={Play} title="MISSION ACTIVE" />
            <div className="space-y-4">
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-6">
                <div className="text-cyber-text-secondary text-sm mb-2">CURRENT CHALLENGE</div>
                <div className="text-2xl font-bold text-cyber-text-primary mb-2">
                  Level {missionData.level}
                </div>
                <div className="text-cyber-text-secondary mb-4">
                  {missionData.description}
                </div>
                {missionData.timeLimit > 0 && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-cyber-neon-blue" />
                    <span className="text-cyber-text-primary font-medium">
                      Time Limit: {formatTime(missionData.timeLimit)}
                    </span>
                    <span className="text-cyber-text-secondary ml-4">
                      Elapsed: {formatTime(missionTimer)}
                    </span>
                    {missionData.timeLimit > 0 && missionTimer >= missionData.timeLimit && (
                      <span className="text-cyber-neon-red ml-4 font-bold">⏰ TIME UP</span>
                    )}
                  </div>
                )}
              </div>
              <NeonButton
                onClick={() => navigate('/participant/mission')}
                className="w-full"
                color="green"
                icon={Target}
              >
                View Full Mission Details
              </NeonButton>
            </div>
          </CyberCard>
        )}

        {/* Quick Actions */}
        <CyberCard>
          <SectionTitle icon={CheckCircle2} title="QUICK ACTIONS" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!showQRScanner && !missionStarted && (
              <NeonButton
                onClick={() => setShowQRScanner(true)}
                className="w-full"
                color="blue"
                icon={QrCode}
              >
                Scan QR to Start Mission
              </NeonButton>
            )}

            {!teamStatus?.isCheckedIn && teamStatus?.currentLevel && !showQRScanner && (
              <NeonButton
                onClick={() => navigate('/participant/check-in')}
                className="w-full"
                color="blue"
                icon={QrCode}
              >
                Scan QR to Check In
              </NeonButton>
            )}

            {teamStatus?.isCheckedIn && !showQRScanner && (
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

