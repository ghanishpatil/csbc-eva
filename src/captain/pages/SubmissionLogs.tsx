import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { captainApiClient, SubmissionLog } from '@/captain/api/captainApi';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const SubmissionLogs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<SubmissionLog[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await captainApiClient.getSubmissionLogs(200);
      setLogs(data.logs);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      toast.error(error.response?.data?.error || 'Failed to load submission logs');
    } finally {
      setLoading(false);
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

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <PageHeader
          icon={FileText}
          title="Submission Logs"
          subtitle={`${logs.length} submissions from your group`}
        />

        <CyberCard>
          <SectionTitle icon={FileText} title="Group Submission History" />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border">
                  <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold">Time</th>
                  <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold">Team</th>
                  <th className="text-left py-3 px-4 text-cyber-text-secondary font-semibold">Level</th>
                  <th className="text-center py-3 px-4 text-cyber-text-secondary font-semibold">Status</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Points</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Hints</th>
                  <th className="text-right py-3 px-4 text-cyber-text-secondary font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-cyber-border/50 hover:bg-cyber-bg-darker/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-cyber-text-secondary text-sm">
                        {new Date(log.submittedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-cyber-text-primary font-medium">{log.teamName}</td>
                      <td className="py-3 px-4 text-cyber-text-primary">Level {log.levelId}</td>
                      <td className="py-3 px-4 text-center">
                        {log.status === 'correct' ? (
                          <span className="flex items-center justify-center space-x-1 text-cyber-neon-green">
                            <CheckCircle className="h-4 w-4" />
                            <span>Correct</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center space-x-1 text-cyber-neon-red">
                            <XCircle className="h-4 w-4" />
                            <span>Incorrect</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.status === 'correct' ? (
                          <span className="text-cyber-neon-yellow font-bold">+{log.scoreAwarded}</span>
                        ) : (
                          <span className="text-cyber-text-secondary">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-cyber-text-primary">
                        {log.hintsUsed > 0 ? (
                          <span className="text-cyber-neon-red">{log.hintsUsed}</span>
                        ) : (
                          <span className="text-cyber-text-secondary">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-cyber-text-secondary text-sm">
                        {log.timeTaken ? (
                          <span className="flex items-center justify-end space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{log.timeTaken}s</span>
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-cyber-text-secondary">
                      No submissions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};

