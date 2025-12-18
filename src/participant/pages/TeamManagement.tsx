import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { createTeam, joinTeam, getTeamDetails, leaveTeam } from '@/api/participantApi';
import { Users, Plus, UserPlus, Copy, CheckCircle2, LogOut } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NeonButton } from '@/components/ui/NeonButton';
import toast from 'react-hot-toast';
import type { TeamDetails } from '@/api/participantApi';

export const TeamManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if join code is in URL
    const joinCode = searchParams.get('join');
    if (joinCode && joinCode.length === 6) {
      setInviteCode(joinCode.toUpperCase());
      setShowJoinForm(true);
    }

    if (user.teamId) {
      loadTeamDetails();
    } else {
      setLoading(false);
    }
  }, [user, navigate, searchParams]);

  const loadTeamDetails = async () => {
    if (!user?.teamId || !user?.id) return;

    try {
      setLoading(true);
      const response = await getTeamDetails(user.teamId, user.id);
      if (response.success && response.team) {
        setTeamDetails(response.team);
      }
    } catch (error: any) {
      console.error('Error loading team details:', error);
      toast.error(error.response?.data?.error || 'Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim() || teamName.trim().length < 3) {
      toast.error('Team name must be at least 3 characters');
      return;
    }

    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }

    setCreating(true);
    try {
      const response = await createTeam({
        teamName: teamName.trim(),
        creatorId: user.id,
      });

      if (response.success && response.team) {
        toast.success(`Team #${response.team.teamNumber} "${response.team.name}" created successfully!`);
        setShowCreateForm(false);
        setTeamName('');
        // Reload user data to get teamId
        window.location.reload();
      } else {
        toast.error(response.error || 'Failed to create team');
      }
    } catch (error: any) {
      console.error('Error creating team:', error);
      toast.error(error.response?.data?.error || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim() || inviteCode.trim().length !== 6) {
      toast.error('Invite code must be 6 characters');
      return;
    }

    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }

    setJoining(true);
    try {
      const response = await joinTeam({
        inviteCode: inviteCode.trim().toUpperCase(),
        participantId: user.id,
      });

      if (response.success && response.team) {
        toast.success(`Successfully joined "${response.team.name}"!`);
        setShowJoinForm(false);
        setInviteCode('');
        // Reload user data to get teamId
        window.location.reload();
      } else {
        toast.error(response.error || 'Failed to join team');
      }
    } catch (error: any) {
      console.error('Error joining team:', error);
      toast.error(error.response?.data?.error || 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user?.teamId || !user?.id) {
      return;
    }

    if (!confirm('Are you sure you want to leave this team? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await leaveTeam({
        teamId: user.teamId,
        participantId: user.id,
      });

      if (response.success) {
        toast.success('Successfully left team');
        setTeamDetails(null);
        // Reload user data
        window.location.reload();
      } else {
        toast.error(response.error || 'Failed to leave team');
      }
    } catch (error: any) {
      console.error('Error leaving team:', error);
      toast.error(error.response?.data?.error || 'Failed to leave team');
    }
  };

  const copyInviteCode = () => {
    if (!teamDetails?.inviteCode) return;

    const inviteLink = `${window.location.origin}/participant/team?join=${teamDetails.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteCodeOnly = () => {
    if (!teamDetails?.inviteCode) return;

    navigator.clipboard.writeText(teamDetails.inviteCode);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          icon={Users}
          title="TEAM MANAGEMENT"
          subtitle="Create or join a team to start competing"
        />

        {/* If user has no team yet OR team details failed to load, show create/join options */}
        {!user?.teamId || !teamDetails ? (
          // No active team - show create/join options
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Team Card */}
            <CyberCard>
              <SectionTitle icon={Plus} title="CREATE TEAM" />
              <p className="text-cyber-text-secondary text-sm mb-6">
                Create a new team and invite your teammate with a unique invite code.
              </p>

              {!showCreateForm ? (
                <NeonButton
                  onClick={() => setShowCreateForm(true)}
                  color="green"
                  className="w-full"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Team
                </NeonButton>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-cyber-text-secondary text-sm mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name (min 3 characters)"
                      className="w-full bg-cyber-bg-darker border border-cyber-border rounded-lg px-4 py-3 text-cyber-text-primary placeholder:text-cyber-text-secondary focus:outline-none focus:border-cyber-neon-green"
                      maxLength={50}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <NeonButton
                      onClick={handleCreateTeam}
                      disabled={creating || !teamName.trim()}
                      color="green"
                      className="flex-1"
                    >
                      {creating ? 'Creating...' : 'Create Team'}
                    </NeonButton>
                    <NeonButton
                      onClick={() => {
                        setShowCreateForm(false);
                        setTeamName('');
                      }}
                      color="blue"
                    >
                      Cancel
                    </NeonButton>
                  </div>
                </div>
              )}
            </CyberCard>

            {/* Join Team Card */}
            <CyberCard>
              <SectionTitle icon={UserPlus} title="JOIN TEAM" />
              <p className="text-cyber-text-secondary text-sm mb-6">
                Enter the 6-character invite code from your teammate to join their team.
              </p>

              {!showJoinForm ? (
                <NeonButton
                  onClick={() => setShowJoinForm(true)}
                  color="blue"
                  className="w-full"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Join Existing Team
                </NeonButton>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-cyber-text-secondary text-sm mb-2">
                      Invite Code
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character code"
                      className="w-full bg-cyber-bg-darker border border-cyber-border rounded-lg px-4 py-3 text-cyber-text-primary placeholder:text-cyber-text-secondary focus:outline-none focus:border-cyber-neon-blue text-center text-2xl font-mono tracking-widest"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <NeonButton
                      onClick={handleJoinTeam}
                      disabled={joining || inviteCode.length !== 6}
                      color="blue"
                      className="flex-1"
                    >
                      {joining ? 'Joining...' : 'Join Team'}
                    </NeonButton>
                    <NeonButton
                      onClick={() => {
                        setShowJoinForm(false);
                        setInviteCode('');
                      }}
                      color="blue"
                    >
                      Cancel
                    </NeonButton>
                  </div>
                </div>
              )}
            </CyberCard>
          </div>
        ) : (
          // Has team - show team details
          teamDetails && (
            <CyberCard>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <SectionTitle icon={Users} title={`TEAM: ${teamDetails.name}`} />
                  {teamDetails.teamNumber && (
                    <p className="text-cyber-text-secondary text-sm mt-2">
                      Team #{teamDetails.teamNumber}
                    </p>
                  )}
                </div>
                <NeonButton
                  onClick={handleLeaveTeam}
                  color="red"
                  className="text-sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Team
                </NeonButton>
              </div>

              <div className="space-y-6">
                {/* Invite Code Section */}
                <div className="bg-cyber-bg-darker border border-cyber-neon-yellow/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-cyber-neon-yellow font-bold mb-1">INVITE CODE</h3>
                      <p className="text-cyber-text-secondary text-sm">
                        Share this code with your teammate to join
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 bg-cyber-bg-card border border-cyber-border rounded-lg px-6 py-4">
                      <div className="text-cyber-text-secondary text-sm mb-1">Code</div>
                      <div className="text-3xl font-mono font-bold text-cyber-neon-yellow tracking-widest">
                        {teamDetails.inviteCode}
                      </div>
                    </div>
                    <NeonButton
                      onClick={copyInviteCodeOnly}
                      color="yellow"
                      className="whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-5 w-5 mr-2" />
                          Copy Code
                        </>
                      )}
                    </NeonButton>
                    <NeonButton
                      onClick={copyInviteCode}
                      color="blue"
                      className="whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-5 w-5 mr-2" />
                          Copy Link
                        </>
                      )}
                    </NeonButton>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <h3 className="text-cyber-text-primary font-bold mb-4">TEAM MEMBERS ({teamDetails.members.length}/2)</h3>
                  <div className="space-y-3">
                    {teamDetails.members.map((member, index) => (
                      <div
                        key={member.id}
                        className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-cyber-neon-blue/20 flex items-center justify-center border border-cyber-neon-blue/40">
                            <span className="text-cyber-neon-blue font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <div className="text-cyber-text-primary font-medium">
                              {member.name}
                            </div>
                            {member.email && (
                              <div className="text-cyber-text-secondary text-sm">
                                {member.email}
                              </div>
                            )}
                          </div>
                        </div>
                        {member.id === user.id && (
                          <span className="text-cyber-neon-green text-sm font-medium">(You)</span>
                        )}
                      </div>
                    ))}
                    {teamDetails.members.length < 2 && (
                      <div className="bg-cyber-bg-darker/50 border border-cyber-border border-dashed rounded-lg p-4 text-center text-cyber-text-secondary">
                        Waiting for teammate to join...
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4 text-center">
                    <div className="text-cyber-text-secondary text-sm mb-1">Score</div>
                    <div className="text-2xl font-bold text-cyber-neon-yellow">
                      {teamDetails.score}
                    </div>
                  </div>
                  <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4 text-center">
                    <div className="text-cyber-text-secondary text-sm mb-1">Levels</div>
                    <div className="text-2xl font-bold text-cyber-neon-green">
                      {teamDetails.levelsCompleted}
                    </div>
                  </div>
                  <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4 text-center">
                    <div className="text-cyber-text-secondary text-sm mb-1">Status</div>
                    <div className="text-lg font-bold text-cyber-neon-blue capitalize">
                      {teamDetails.status}
                    </div>
                  </div>
                </div>
              </div>
            </CyberCard>
          )
        )}
      </div>
    </Layout>
  );
};

