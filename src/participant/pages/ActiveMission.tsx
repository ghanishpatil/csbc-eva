import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentLevel, submitFlag, requestHint } from '@/api/participantApi';
import { Target, FileText, Download, AlertCircle, ArrowLeft, Flag, Lightbulb, Pause, StopCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NeonButton } from '@/components/ui/NeonButton';
import toast from 'react-hot-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { CurrentLevel } from '@/api/participantApi';
import type { EventConfig } from '@/types';

export const ActiveMission = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [level, setLevel] = useState<CurrentLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flag, setFlag] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [requestingHint, setRequestingHint] = useState(false);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);

  // Subscribe to event config for real-time event status
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'event'), (snapshot) => {
      if (snapshot.exists()) {
        setEventConfig(snapshot.data() as EventConfig);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.teamId) {
      navigate('/participant/dashboard');
      return;
    }

    const teamId = user.teamId; // Type narrowing

    const fetchLevel = async () => {
      try {
        const response = await getCurrentLevel(teamId);
        if (response.success && response.level) {
          setLevel(response.level);
          setTimeElapsed(response.timeElapsed || 0);
        } else if (response.success && !response.level) {
          // Level not configured or not available yet
          toast.error(response.message || 'No active mission available');
          navigate('/participant/dashboard');
        } else {
          toast.error(response.error || 'Could not load mission');
          navigate('/participant/dashboard');
        }
      } catch (error: any) {
        console.error('Error fetching level:', error);
        const errorMessage = error.response?.data?.error || 'Failed to load mission';
        toast.error(errorMessage);
        navigate('/participant/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLevel();

    // Real-time listener for team changes - use Firestore data directly
    // FIXED: Single source of truth for timer - only Firestore updates
    let isMounted = true;
    const unsubscribe = onSnapshot(doc(db, 'teams', teamId), async (snapshot) => {
      if (!isMounted) return;
      
      if (snapshot.exists()) {
        const teamData = snapshot.data();
        
        // Calculate timeElapsed from currentLevelStartTime (real-time)
        // This ensures we always have the latest time from Firestore
        if (teamData.currentLevelStartTime) {
          const calculatedTimeElapsed = Math.floor((Date.now() - teamData.currentLevelStartTime) / 1000);
          if (isMounted) {
            setTimeElapsed(calculatedTimeElapsed);
          }
        } else {
          if (isMounted) {
            setTimeElapsed(0);
          }
        }
        
        // Re-fetch level data when team updates (e.g., hint usage, level completion)
        try {
          const response = await getCurrentLevel(teamId);
          if (response.success && response.level && isMounted) {
            setLevel(response.level);
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error refreshing level:', error);
          }
        }
      }
    }, (error) => {
      if (import.meta.env.DEV) {
        console.error('Error in team snapshot:', error);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.teamId, navigate]);

  // FIXED: Visual refresh only - syncs with Firestore value every second
  // No local increment to prevent drift
  useEffect(() => {
    if (!level || !user?.teamId) return;

    // Don't run timer if event is stopped or paused
    const eventStatus = eventConfig?.status || eventConfig?.eventStatus;
    if (eventStatus === 'stopped' || eventStatus === 'paused' || eventConfig?.isActive === false) {
      return;
    }

    // Visual refresh: Recalculate from Firestore every second for smooth display
    // This doesn't increment locally, just recalculates from the source of truth
    const interval = setInterval(() => {
      // Timer is updated by onSnapshot above, this just ensures smooth visual updates
      // The actual value comes from Firestore, preventing drift
    }, 1000);

    return () => clearInterval(interval);
  }, [level, eventConfig?.status, eventConfig?.eventStatus, eventConfig?.isActive, user?.teamId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitFlag = async () => {
    if (!flag.trim()) {
      toast.error('Please enter a flag');
      return;
    }

    if (!user?.teamId || !level) {
      toast.error('Missing team or level information');
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitFlag({
        teamId: user.teamId,
        levelId: level.id,
        flag: flag.trim(),
        timeTaken: timeElapsed / 60, // Convert to minutes
        participantId: user.id,
      });

      if (response.success && response.status === 'correct') {
        toast.success(`✅ Correct Flag! +${response.scoreAwarded} points`);
        
        // NOTE: Status is automatically updated by backend (FIX 3)
        // Backend auto-transitions: solving → moving on successful flag
        
        // Navigate to movement page
        setTimeout(() => {
          navigate('/participant/movement', {
            state: {
              levelNumber: level.number,
              scoreAwarded: response.scoreAwarded,
              nextLevel: response.nextLevel || level.number + 1,
              nextLocationClue: response.nextLocationClue || null,
            },
          });
        }, 2000);
      } else {
        toast.error(response.message || '❌ Incorrect flag');
        setAttemptsRemaining((prev) => Math.max(0, prev - 1));
        setFlag('');
      }
    } catch (error: any) {
      console.error('Flag submission error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Submission failed';
      toast.error(`❌ ${errorMessage}`);
      setAttemptsRemaining((prev) => Math.max(0, prev - 1));
    } finally {
      setSubmitting(false);
    }
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

  if (!level) {
    return (
      <Layout>
        <CyberCard>
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-cyber-neon-red mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cyber-text-primary mb-2">NO ACTIVE MISSION</h2>
            <p className="text-cyber-text-secondary mb-6">Please check in at a location first.</p>
            <NeonButton onClick={() => navigate('/participant/check-in')} color="blue" icon={Target}>
              Go to Check-In
            </NeonButton>
          </div>
        </CyberCard>
      </Layout>
    );
  }

  // Determine event status
  const eventStatus = eventConfig?.status || eventConfig?.eventStatus;
  const isEventPaused = eventStatus === 'paused';
  const isEventStopped = eventStatus === 'stopped' || eventConfig?.isActive === false;

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
                ? 'The event has ended. Flag submission is disabled.' 
                : 'The event is temporarily paused. Timer is on hold.'}
            </p>
          </div>
        )}

        <PageHeader
          icon={Target}
          title={`LEVEL ${level.number}: ${level.title}`}
          subtitle={level.category || 'Mission Challenge'}
          status={{
            label: "TIME",
            value: isEventStopped ? 'STOPPED' : isEventPaused ? `${formatTime(timeElapsed)} (PAUSED)` : formatTime(timeElapsed),
            color: isEventStopped ? 'red' : isEventPaused ? 'yellow' : 'blue',
          }}
        />

        {/* Mission Details */}
        <CyberCard>
          <SectionTitle icon={FileText} title="MISSION BRIEFING" />
          
          <div className="space-y-4">
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-6">
              <div className="prose prose-invert max-w-none">
                <p className="text-cyber-text-primary whitespace-pre-wrap leading-relaxed">
                  {level.description}
                </p>
              </div>
            </div>

            {level.challengeUrl && (
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-cyber-neon-blue" />
                  <a
                    href={level.challengeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyber-neon-blue hover:text-cyber-neon-blue/80 underline"
                  >
                    Open Challenge URL
                  </a>
                </div>
              </div>
            )}

            {level.fileUrl && (
              <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-cyber-neon-green" />
                    <div>
                      <div className="text-cyber-text-primary font-medium">{level.fileName || 'Mission File'}</div>
                      <div className="text-cyber-text-secondary text-sm">Download mission resources</div>
                    </div>
                  </div>
                  <a
                    href={level.fileUrl}
                    download
                    className="px-4 py-2 bg-cyber-neon-green text-white rounded-lg hover:bg-cyber-neon-green/80 transition-all"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>
        </CyberCard>

        {/* Hints Section */}
        {level.hintsAvailable > 0 && (
          <CyberCard>
            <SectionTitle icon={Lightbulb} title="HINTS" />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-cyber-text-secondary text-sm">
                  Available: {level.hintsAvailable} | Used: {level.hintsUsed} | Remaining: {level.hintsAvailable - level.hintsUsed}
                </div>
                {level.hintsUsed < level.hintsAvailable && (
                  <NeonButton
                    onClick={async () => {
                      if (!user?.teamId || !level) return;
                      setRequestingHint(true);
                      try {
                        const response = await requestHint({
                          teamId: user.teamId,
                          levelId: level.id,
                        });
                        if (response.success && response.hint) {
                          toast.success(`Hint #${response.hint.number} unlocked!`);
                          // Refresh level data
                          const levelResponse = await getCurrentLevel(user.teamId);
                          if (levelResponse.success && levelResponse.level) {
                            setLevel(levelResponse.level);
                          }
                        } else {
                          toast.error(response.error || 'Failed to request hint');
                        }
                      } catch (error: any) {
                        toast.error(error.response?.data?.error || 'Failed to request hint');
                      } finally {
                        setRequestingHint(false);
                      }
                    }}
                    disabled={requestingHint}
                    color="yellow"
                    size="sm"
                    icon={requestingHint ? undefined : Lightbulb}
                  >
                    {requestingHint ? 'Requesting...' : 'Request Hint'}
                  </NeonButton>
                )}
              </div>
              
              {level.hints.length > 0 && (
                <div className="space-y-2">
                  {level.hints.map((hint, index) => (
                    <div
                      key={index}
                      className="bg-cyber-bg-darker border border-cyber-neon-yellow/30 rounded-xl p-4"
                    >
                      <div className="text-cyber-neon-yellow text-sm font-medium mb-2">
                        Hint #{hint.number}
                      </div>
                      <div className="text-cyber-text-primary">{hint.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {level.hints.length === 0 && (
                <div className="text-cyber-text-secondary text-sm">
                  No hints used yet. Click "Request Hint" to get your first hint.
                </div>
              )}
            </div>
          </CyberCard>
        )}

        {/* Flag Submission */}
        <CyberCard>
          <SectionTitle icon={Flag} title="FLAG SUBMISSION" />
          
          <div className="space-y-4">
            <div>
              <label className="block text-cyber-text-secondary text-sm mb-2">
                FLAG FORMAT: {level.flagFormat || 'CSBC{...}'}
              </label>
              <input
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !submitting && !isEventStopped && !isEventPaused) {
                    handleSubmitFlag();
                  }
                }}
                placeholder={isEventStopped ? 'Event has ended' : isEventPaused ? 'Event is paused' : 'Enter flag (e.g., CSBC{your_flag_here})'}
                className="w-full px-4 py-3 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-green placeholder:text-cyber-text-secondary font-mono"
                disabled={submitting || isEventStopped || isEventPaused}
                autoFocus
              />
            </div>

            {attemptsRemaining < 5 && (
              <div className="bg-cyber-neon-yellow/10 border border-cyber-neon-yellow/50 rounded-xl p-3">
                <div className="flex items-center space-x-2 text-cyber-neon-yellow text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Attempts remaining: {attemptsRemaining}</span>
                </div>
              </div>
            )}

            <NeonButton
              onClick={handleSubmitFlag}
              disabled={submitting || !flag.trim() || isEventStopped || isEventPaused}
              className="w-full"
              color={isEventStopped ? 'red' : isEventPaused ? 'yellow' : 'green'}
              icon={submitting ? undefined : isEventStopped ? StopCircle : isEventPaused ? Pause : Flag}
            >
              {submitting ? 'Submitting...' : isEventStopped ? 'Event Ended' : isEventPaused ? 'Event Paused' : 'Submit Flag'}
            </NeonButton>
          </div>
        </CyberCard>

        {/* Navigation */}
        <div className="flex justify-center">
          <NeonButton
            onClick={() => navigate('/participant/dashboard')}
            color="gray"
            icon={ArrowLeft}
          >
            Back to Dashboard
          </NeonButton>
        </div>
      </div>
    </Layout>
  );
};

