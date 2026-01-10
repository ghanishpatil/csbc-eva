import { useEffect, useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { CaptainNavbar } from '@/captain/components/CaptainNavbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NeonButton } from '@/components/ui/NeonButton';
import { captainApiClient, type ManualSubmission } from '@/captain/api/captainApi';
import { FileText, CheckCircle2, XCircle, Clock, User, Target } from 'lucide-react';
import toast from 'react-hot-toast';

export const FlagReviews = () => {
  const [submissions, setSubmissions] = useState<ManualSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const isFirstLoadRef = useRef(true);

  // Fetch all teams in captain's group and their manual submissions
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchSubmissions = async () => {
      // Prevent concurrent fetches
      if (fetchingRef.current) {
        return;
      }
      
      try {
        fetchingRef.current = true;
        const groupOverview = await captainApiClient.getGroupOverview();
        const allSubmissions: ManualSubmission[] = [];

        // Fetch submissions for each team in the group
        for (const team of groupOverview.teams) {
          try {
            const response = await captainApiClient.getTeamManualSubmissions(team.id);
            if (response && response.submissions) {
              allSubmissions.push(...response.submissions);
            }
          } catch (error: any) {
            console.error(`Error fetching submissions for team ${team.id}:`, error);
            // Continue with other teams even if one fails
          }
        }

        // Sort by submittedAt (newest first)
        allSubmissions.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        
        if (isMounted) {
          setSubmissions(allSubmissions);
          setLoading(false);
          isFirstLoadRef.current = false;
        }
      } catch (error: any) {
        console.error('Error fetching submissions:', error);
        if (isMounted) {
          setLoading(false);
          // Only show error toast on initial load
          if (isFirstLoadRef.current) {
            const errorMessage = error.response?.data?.error || error.message || 'Failed to load submissions';
            toast.error(errorMessage);
          }
          isFirstLoadRef.current = false;
        }
      } finally {
        fetchingRef.current = false;
      }
    };

    // Initial fetch
    fetchSubmissions();
    
    // Refresh every 30 seconds (reduced frequency to avoid overwhelming)
    intervalId = setInterval(() => {
      if (isMounted && !fetchingRef.current) {
        fetchSubmissions();
      }
    }, 30000);

    return () => {
      isMounted = false;
      fetchingRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []); // Empty deps - only run on mount

  const handleApprove = async (submissionId: string) => {
    if (!confirm('Are you sure you want to approve this submission? Points will be awarded to the team.')) {
      return;
    }

    setProcessingId(submissionId);
    try {
      const response = await captainApiClient.approveManualSubmission(submissionId);
      if (response.success) {
        toast.success(`Submission approved! ${response.data?.scoreAwarded ? `${response.data.scoreAwarded} points awarded.` : ''}`);
        // Refresh submissions
        const groupOverview = await captainApiClient.getGroupOverview();
        const allSubmissions: ManualSubmission[] = [];
        for (const team of groupOverview.teams) {
          try {
            const response = await captainApiClient.getTeamManualSubmissions(team.id);
            allSubmissions.push(...response.submissions);
          } catch (error) {
            console.error(`Error fetching submissions for team ${team.id}:`, error);
          }
        }
        allSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);
        setSubmissions(allSubmissions);
      } else {
        toast.error(response.message || 'Failed to approve submission');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve submission');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    setProcessingId(submissionId);
    try {
      const response = await captainApiClient.rejectManualSubmission(submissionId, reason || undefined);
      if (response.success) {
        toast.success('Submission rejected');
        // Refresh submissions
        const groupOverview = await captainApiClient.getGroupOverview();
        const allSubmissions: ManualSubmission[] = [];
        for (const team of groupOverview.teams) {
          try {
            const response = await captainApiClient.getTeamManualSubmissions(team.id);
            allSubmissions.push(...response.submissions);
          } catch (error) {
            console.error(`Error fetching submissions for team ${team.id}:`, error);
          }
        }
        allSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);
        setSubmissions(allSubmissions);
      } else {
        toast.error(response.message || 'Failed to reject submission');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject submission');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 bg-cyber-neon-yellow/20 text-cyber-neon-yellow rounded-lg text-xs font-medium flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>PENDING</span>
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 bg-cyber-neon-green/20 text-cyber-neon-green rounded-lg text-xs font-medium flex items-center space-x-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>APPROVED</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-cyber-neon-red/20 text-cyber-neon-red rounded-lg text-xs font-medium flex items-center space-x-1">
            <XCircle className="h-3 w-3" />
            <span>REJECTED</span>
          </span>
        );
      default:
        return null;
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const processedSubmissions = submissions.filter(s => s.status !== 'pending');

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
        <CaptainNavbar />

        <PageHeader
          icon={FileText}
          title="Flag Reviews"
          subtitle={`${pendingSubmissions.length} pending, ${processedSubmissions.length} processed`}
        />

        {/* Pending Submissions */}
        {pendingSubmissions.length > 0 && (
          <CyberCard>
            <SectionTitle icon={Clock} title="Pending Reviews" />
            <div className="mt-4 space-y-4">
              {pendingSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-cyber-bg-darker border border-cyber-neon-yellow/30 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-cyber-text-secondary" />
                        <span className="text-cyber-text-primary font-medium">{submission.submittedByName}</span>
                        <span className="text-cyber-text-secondary">•</span>
                        <span className="text-cyber-text-secondary text-sm">{submission.teamName}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-cyber-text-secondary" />
                        <span className="text-cyber-text-secondary text-sm">{submission.levelTitle}</span>
                      </div>
                      <div className="bg-cyber-bg border border-cyber-border rounded-lg p-3 mt-2">
                        <div className="text-cyber-text-secondary text-xs mb-1">Submitted Flag:</div>
                        <div className="text-cyber-neon-yellow font-mono text-sm break-all">{submission.flag}</div>
                      </div>
                      <div className="text-cyber-text-secondary text-xs mt-2">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="ml-4">{getStatusBadge(submission.status)}</div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <NeonButton
                      onClick={() => handleApprove(submission.id)}
                      disabled={processingId === submission.id}
                      color="green"
                      size="sm"
                      icon={CheckCircle2}
                    >
                      {processingId === submission.id ? 'Processing...' : 'Approve'}
                    </NeonButton>
                    <NeonButton
                      onClick={() => handleReject(submission.id)}
                      disabled={processingId === submission.id}
                      color="red"
                      size="sm"
                      icon={XCircle}
                    >
                      {processingId === submission.id ? 'Processing...' : 'Reject'}
                    </NeonButton>
                  </div>
                </div>
              ))}
            </div>
          </CyberCard>
        )}

        {/* Processed Submissions */}
        {processedSubmissions.length > 0 && (
          <CyberCard>
            <SectionTitle icon={FileText} title="Processed Submissions" />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyber-border">
                    <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Participant</th>
                    <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Team</th>
                    <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Level</th>
                    <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Flag</th>
                    <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Reviewed By</th>
                    <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {processedSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-cyber-border/50 hover:bg-cyber-bg-darker/50">
                      <td className="py-3 px-4 text-cyber-text-primary text-sm">{submission.submittedByName}</td>
                      <td className="py-3 px-4 text-cyber-text-secondary text-sm">{submission.teamName}</td>
                      <td className="py-3 px-4 text-cyber-text-secondary text-sm">{submission.levelTitle}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-cyber-neon-yellow break-all max-w-xs">
                          {submission.flag}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(submission.status)}</td>
                      <td className="py-3 px-4 text-cyber-text-secondary text-sm">
                        {submission.reviewedByName || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-cyber-text-secondary text-xs">
                        {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CyberCard>
        )}

        {submissions.length === 0 && (
          <CyberCard>
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-cyber-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-cyber-text-primary mb-2">No Submissions</h3>
              <p className="text-cyber-text-secondary">No manual flag submissions to review yet.</p>
            </div>
          </CyberCard>
        )}
      </div>
    </Layout>
  );
};
