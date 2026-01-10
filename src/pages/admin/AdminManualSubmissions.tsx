import { useEffect, useState } from 'react';
import { getAllManualSubmissions, type ManualSubmission } from '@/api/adminApi';
import { CyberCard } from '@/components/ui/CyberCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { FileText, CheckCircle2, XCircle, Clock, User, Target, Search } from 'lucide-react';

const AdminManualSubmissions = () => {
  const [submissions, setSubmissions] = useState<ManualSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await getAllManualSubmissions();
        setSubmissions(response.submissions);
      } catch (error) {
        console.error('Error fetching manual submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchSubmissions, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      submission.teamName.toLowerCase().includes(searchLower) ||
      submission.submittedByName.toLowerCase().includes(searchLower) ||
      submission.levelTitle.toLowerCase().includes(searchLower) ||
      submission.flag.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-neon-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Manual Submissions Monitor"
        subtitle={`${submissions.length} total submissions (${pendingCount} pending, ${approvedCount} approved, ${rejectedCount} rejected)`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CyberCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-cyber-text-secondary text-sm">Pending</div>
              <div className="text-2xl font-bold text-cyber-neon-yellow">{pendingCount}</div>
            </div>
            <Clock className="h-8 w-8 text-cyber-neon-yellow" />
          </div>
        </CyberCard>
        <CyberCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-cyber-text-secondary text-sm">Approved</div>
              <div className="text-2xl font-bold text-cyber-neon-green">{approvedCount}</div>
            </div>
            <CheckCircle2 className="h-8 w-8 text-cyber-neon-green" />
          </div>
        </CyberCard>
        <CyberCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-cyber-text-secondary text-sm">Rejected</div>
              <div className="text-2xl font-bold text-cyber-neon-red">{rejectedCount}</div>
            </div>
            <XCircle className="h-8 w-8 text-cyber-neon-red" />
          </div>
        </CyberCard>
      </div>

      {/* Search */}
      <CyberCard>
        <div className="flex items-center space-x-3">
          <Search className="h-5 w-5 text-cyber-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by team, participant, level, or flag..."
            className="flex-1 px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
          />
        </div>
      </CyberCard>

      {/* Submissions Table */}
      <CyberCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Team</th>
                <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Participant</th>
                <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Level</th>
                <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Flag</th>
                <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Captain</th>
                <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Submitted</th>
                <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold text-sm">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cyber-text-secondary">
                    {searchTerm ? 'No submissions match your search' : 'No manual submissions yet'}
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="border-b border-cyber-border/50 hover:bg-cyber-bg-darker/50"
                  >
                    <td className="py-3 px-4 text-cyber-text-primary text-sm">{submission.teamName}</td>
                    <td className="py-3 px-4 text-cyber-text-primary text-sm">{submission.submittedByName}</td>
                    <td className="py-3 px-4 text-cyber-text-secondary text-sm">{submission.levelTitle}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-cyber-neon-yellow break-all max-w-xs">
                        {submission.flag}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(submission.status)}</td>
                    <td className="py-3 px-4 text-cyber-text-secondary text-sm">
                      {submission.reviewedByName || '-'}
                    </td>
                    <td className="py-3 px-4 text-cyber-text-secondary text-xs">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-cyber-text-secondary text-xs">
                      {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CyberCard>
    </div>
  );
};

export default AdminManualSubmissions;
