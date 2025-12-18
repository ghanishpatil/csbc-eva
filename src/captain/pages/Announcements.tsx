import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import CaptainNavbar from '@/captain/components/CaptainNavbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { CyberCard } from '@/components/ui/CyberCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NeonButton } from '@/components/ui/NeonButton';
import { captainApiClient } from '@/captain/api/captainApi';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Announcements: React.FC = () => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSending(true);
      await captainApiClient.sendAnnouncement(message.trim());
      toast.success('Announcement sent successfully');
      setMessage('');
    } catch (error: any) {
      console.error('Error sending announcement:', error);
      toast.error(error.response?.data?.error || 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <CaptainNavbar />

        <PageHeader
          icon={MessageSquare}
          title="Group Announcements"
          subtitle="Send messages to all teams in your group"
        />

        <CyberCard>
          <SectionTitle icon={MessageSquare} title="Send Announcement" />
          <div className="mt-4 space-y-4">
            <div className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <AlertCircle className="h-5 w-5 text-cyber-neon-yellow flex-shrink-0 mt-0.5" />
                <div className="text-sm text-cyber-text-secondary">
                  Announcements will be visible to all teams in your assigned group. Use this feature to provide
                  important updates, reminders, or guidance.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-cyber-text-secondary mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your announcement message..."
                className="w-full px-4 py-3 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue placeholder:text-cyber-text-secondary resize-none"
                rows={6}
                maxLength={500}
              />
              <div className="text-xs text-cyber-text-secondary mt-1 text-right">
                {message.length}/500 characters
              </div>
            </div>

            <div className="flex justify-end">
              <NeonButton
                color="blue"
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{sending ? 'Sending...' : 'Send Announcement'}</span>
              </NeonButton>
            </div>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
};

