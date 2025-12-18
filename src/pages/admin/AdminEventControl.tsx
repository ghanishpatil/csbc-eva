import { useState, useEffect } from 'react';
import { startEvent, stopEvent, pauseEvent, getEventStatus } from '../../api/adminApi';
import { Play, Pause, Square, Clock, AlertTriangle, RefreshCw, Zap, Users, Target, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { CyberCard } from '@/components/ui/CyberCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface EventStatus {
  isActive: boolean;
  currentPhase: 'preparation' | 'active' | 'paused' | 'completed';
  startTime?: number;
  endTime?: number;
  pausedAt?: number;
}

const AdminEventControl = () => {
  const [eventStatus, setEventStatus] = useState<EventStatus | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTeams: 0,
    activeTeams: 0,
    totalSubmissions: 0,
    correctSubmissions: 0,
  });

  useEffect(() => {
    fetchEventStatus();
    
    // Real-time listener for teams
    const teamsUnsubscribe = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teams = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        totalTeams: teams.length,
        activeTeams: teams.filter(t => t.status === 'solving' || t.status === 'at_location').length,
      }));
    });

    // Real-time listener for submissions
    const submissionsUnsubscribe = onSnapshot(collection(db, 'submissions'), (snapshot) => {
      const submissions = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        totalSubmissions: submissions.length,
        correctSubmissions: submissions.filter(s => s.status === 'correct').length,
      }));
    });

    return () => {
      teamsUnsubscribe();
      submissionsUnsubscribe();
    };
  }, []);

  const fetchEventStatus = async () => {
    setRefreshing(true);
    try {
      const response = await getEventStatus();
      if (response.success) {
        setEventStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching event status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartEvent = async () => {
    if (!confirm('🚀 Are you sure you want to START the event?\n\nParticipants will be able to check in and submit flags.')) {
      return;
    }
    setEventLoading(true);
    try {
      const response = await startEvent();
      if (response.success) {
        toast.success('🚀 Event started successfully!');
        fetchEventStatus();
      }
    } catch (error: any) {
      console.error('Error starting event:', error);
      toast.error(error.response?.data?.error || 'Failed to start event');
    } finally {
      setEventLoading(false);
    }
  };

  const handlePauseEvent = async () => {
    if (!confirm('⏸️ Are you sure you want to PAUSE the event?\n\nParticipants will not be able to submit flags until resumed.')) {
      return;
    }
    setEventLoading(true);
    try {
      const response = await pauseEvent();
      if (response.success) {
        toast.success('⏸️ Event paused');
        fetchEventStatus();
      }
    } catch (error: any) {
      console.error('Error pausing event:', error);
      toast.error(error.response?.data?.error || 'Failed to pause event');
    } finally {
      setEventLoading(false);
    }
  };

  const handleStopEvent = async () => {
    if (!confirm('🛑 Are you sure you want to STOP the event?\n\n⚠️ This will END the competition for all participants!')) {
      return;
    }
    setEventLoading(true);
    try {
      const response = await stopEvent();
      if (response.success) {
        toast.success('🛑 Event stopped');
        fetchEventStatus();
      }
    } catch (error: any) {
      console.error('Error stopping event:', error);
      toast.error(error.response?.data?.error || 'Failed to stop event');
    } finally {
      setEventLoading(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'active': return 'text-green-400 bg-green-900/30 border-green-500';
      case 'paused': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500';
      case 'completed': return 'text-red-400 bg-red-900/30 border-red-500';
      default: return 'text-gray-400 bg-slate-800 border-slate-600';
    }
  };

  const getElapsedTime = () => {
    if (!eventStatus?.startTime) return '00:00:00';
    const elapsed = Date.now() - eventStatus.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update elapsed time every second
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  useEffect(() => {
    const interval = setInterval(() => {
      if (eventStatus?.isActive) {
        setElapsedTime(getElapsedTime());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [eventStatus?.startTime, eventStatus?.isActive]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Zap}
        title="EVENT CONTROL"
        subtitle="Start, pause, or stop the CTF competition"
        status={{
          label: eventStatus?.currentPhase?.toUpperCase() || 'NOT STARTED',
          value: eventStatus?.isActive ? 'LIVE' : 'OFFLINE',
          color: eventStatus?.isActive ? 'green' : 'red'
        }}
      />

      {/* Big Status Display */}
      <CyberCard className="border-2 border-cyber-neon-blue">
        <div className="text-center py-8">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2 ${getPhaseColor(eventStatus?.currentPhase || 'preparation')} mb-6`}>
            {eventStatus?.isActive ? (
              <span className="h-4 w-4 bg-green-400 rounded-full animate-pulse"></span>
            ) : (
              <span className="h-4 w-4 bg-gray-500 rounded-full"></span>
            )}
            <span className="text-3xl font-bold uppercase tracking-wider">
              {eventStatus?.currentPhase || 'Not Started'}
            </span>
          </div>

          {/* Elapsed Time */}
          {eventStatus?.startTime && (
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">ELAPSED TIME</p>
              <p className="text-5xl font-mono font-bold text-cyber-text-primary">
                {elapsedTime}
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
              <p className="text-xs text-gray-400">Total Teams</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <Zap className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.activeTeams}</p>
              <p className="text-xs text-gray-400">Active Now</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <Target className="h-6 w-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.totalSubmissions}</p>
              <p className="text-xs text-gray-400">Submissions</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.correctSubmissions}</p>
              <p className="text-xs text-gray-400">Correct Flags</p>
            </div>
          </div>
        </div>
      </CyberCard>

      {/* Control Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* START Button */}
        <button
          onClick={handleStartEvent}
          disabled={eventLoading || eventStatus?.currentPhase === 'active'}
          className={`relative group p-8 rounded-2xl transition-all transform hover:scale-[1.02] ${
            eventStatus?.currentPhase === 'active'
              ? 'bg-slate-800 border-2 border-slate-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-br from-green-900/50 to-green-800/30 border-2 border-green-500 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20'
          }`}
        >
          <div className="text-center">
            <div className={`h-20 w-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
              eventStatus?.currentPhase === 'active' ? 'bg-slate-700' : 'bg-green-600'
            }`}>
              <Play className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {eventStatus?.currentPhase === 'paused' ? 'RESUME' : 'START'} EVENT
            </h3>
            <p className="text-gray-400 text-sm">
              {eventStatus?.currentPhase === 'paused' 
                ? 'Resume the paused competition'
                : 'Begin the CTF competition'
              }
            </p>
          </div>
        </button>

        {/* PAUSE Button */}
        <button
          onClick={handlePauseEvent}
          disabled={eventLoading || eventStatus?.currentPhase !== 'active'}
          className={`relative group p-8 rounded-2xl transition-all transform hover:scale-[1.02] ${
            eventStatus?.currentPhase !== 'active'
              ? 'bg-slate-800 border-2 border-slate-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-2 border-yellow-500 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20'
          }`}
        >
          <div className="text-center">
            <div className={`h-20 w-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
              eventStatus?.currentPhase !== 'active' ? 'bg-slate-700' : 'bg-yellow-600'
            }`}>
              <Pause className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">PAUSE EVENT</h3>
            <p className="text-gray-400 text-sm">
              Temporarily halt submissions
            </p>
          </div>
        </button>

        {/* STOP Button */}
        <button
          onClick={handleStopEvent}
          disabled={eventLoading || (!eventStatus?.isActive && eventStatus?.currentPhase !== 'paused')}
          className={`relative group p-8 rounded-2xl transition-all transform hover:scale-[1.02] ${
            !eventStatus?.isActive && eventStatus?.currentPhase !== 'paused'
              ? 'bg-slate-800 border-2 border-slate-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-br from-red-900/50 to-red-800/30 border-2 border-red-500 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20'
          }`}
        >
          <div className="text-center">
            <div className={`h-20 w-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
              !eventStatus?.isActive && eventStatus?.currentPhase !== 'paused' ? 'bg-slate-700' : 'bg-red-600'
            }`}>
              <Square className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">STOP EVENT</h3>
            <p className="text-gray-400 text-sm">
              End the competition
            </p>
          </div>
        </button>
      </div>

      {/* Event Timeline */}
      <CyberCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-cyber-neon-blue" />
            Event Timeline
          </h2>
          <button
            onClick={fetchEventStatus}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="space-y-4">
          {/* Start Time */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="h-12 w-12 rounded-xl bg-green-600/20 flex items-center justify-center">
              <Play className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Event Started</p>
              <p className="text-gray-400 text-sm">
                {eventStatus?.startTime 
                  ? new Date(eventStatus.startTime).toLocaleString()
                  : 'Not started yet'
                }
              </p>
            </div>
            {eventStatus?.startTime && (
              <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-xs">
                Completed
              </span>
            )}
          </div>

          {/* Paused */}
          {eventStatus?.pausedAt && (
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="h-12 w-12 rounded-xl bg-yellow-600/20 flex items-center justify-center">
                <Pause className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Event Paused</p>
                <p className="text-gray-400 text-sm">
                  {new Date(eventStatus.pausedAt).toLocaleString()}
                </p>
              </div>
              {eventStatus.currentPhase === 'paused' && (
                <span className="px-3 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-xs animate-pulse">
                  Currently Paused
                </span>
              )}
            </div>
          )}

          {/* End Time */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="h-12 w-12 rounded-xl bg-red-600/20 flex items-center justify-center">
              <Square className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Event Ended</p>
              <p className="text-gray-400 text-sm">
                {eventStatus?.endTime 
                  ? new Date(eventStatus.endTime).toLocaleString()
                  : 'In progress...'
                }
              </p>
            </div>
            {eventStatus?.endTime && (
              <span className="px-3 py-1 bg-red-900/50 text-red-400 rounded-full text-xs">
                Completed
              </span>
            )}
          </div>
        </div>
      </CyberCard>

      {/* Warning Box */}
      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-yellow-400 font-bold mb-2">Important Notes</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• <strong>START:</strong> Begins the event. Participants can check in at physical locations and submit flags.</li>
              <li>• <strong>PAUSE:</strong> Temporarily halts submissions. Timer continues but participants cannot submit flags.</li>
              <li>• <strong>STOP:</strong> Ends the event permanently. Final scores are locked.</li>
              <li>• Make sure all missions are configured before starting the event.</li>
              <li>• All teams should be created and assigned to groups before starting.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEventControl;

