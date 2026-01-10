import { Link, useLocation } from 'react-router-dom';
import { Shield, Home, Users, Trophy, FileText, MessageSquare, CheckCircle2 } from 'lucide-react';

const tabs = [
  { to: '/captain/dashboard', label: 'Group Overview', icon: Home, color: 'text-cyber-neon-blue', activeBg: 'bg-cyber-neon-blue/10' },
  { to: '/captain/teams', label: 'Teams Performance', icon: Users, color: 'text-cyber-neon-green', activeBg: 'bg-cyber-neon-green/10' },
  { to: '/captain/leaderboard', label: 'Group Leaderboard', icon: Trophy, color: 'text-cyber-neon-yellow', activeBg: 'bg-cyber-neon-yellow/10' },
  { to: '/captain/logs', label: 'Submission Logs', icon: FileText, color: 'text-cyber-neon-purple', activeBg: 'bg-cyber-neon-purple/10' },
  { to: '/captain/flag-reviews', label: 'Flag Reviews', icon: CheckCircle2, color: 'text-cyber-neon-cyan', activeBg: 'bg-cyber-neon-cyan/10' },
  { to: '/captain/announcements', label: 'Announcements', icon: MessageSquare, color: 'text-cyber-neon-red', activeBg: 'bg-cyber-neon-red/10' },
];

export const CaptainNavbar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-cyber-bg-card border border-cyber-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-cyber-neon-blue/15 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-lg blur-lg bg-cyber-neon-blue/10"></div>
            <Shield className="h-6 w-6 text-cyber-neon-blue relative" />
          </div>
          <div>
            <div className="text-sm text-cyber-text-secondary">Group Captain Portal</div>
            <div className="text-lg font-cyber font-bold text-cyber-text-primary">Mission Exploit 2.0</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = isActive(tab.to);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg font-cyber text-xs sm:text-sm transition-all border ${
                active 
                  ? `${tab.activeBg} ${tab.color} border-cyber-border shadow-cyber-glow` 
                  : 'text-cyber-text-secondary border-cyber-border/60 hover:border-cyber-border hover:text-cyber-text-primary'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${active ? tab.color : 'text-cyber-text-secondary'}`} />
              <span className="whitespace-nowrap">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CaptainNavbar;
