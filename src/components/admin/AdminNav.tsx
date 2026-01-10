import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Shield,
  Target,
  Activity,
  BarChart3,
  Megaphone,
  Award,
  Settings,
  ChevronRight,
  Zap,
  FileText,
} from 'lucide-react';

const AdminNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', color: 'red' },
    { path: '/admin/event', icon: Zap, label: 'Event Control', color: 'lime' },
    { path: '/admin/teams', icon: Users, label: 'Teams', color: 'blue' },
    { path: '/admin/groups', icon: UsersRound, label: 'Groups', color: 'purple' },
    { path: '/admin/users', icon: Shield, label: 'Users', color: 'green' },
    { path: '/admin/levels', icon: Target, label: 'Missions', color: 'orange' },
    { path: '/admin/submissions', icon: Activity, label: 'Submissions', color: 'cyan' },
    { path: '/admin/manual-submissions', icon: FileText, label: 'Manual Submissions', color: 'indigo' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', color: 'pink' },
    { path: '/admin/announcements', icon: Megaphone, label: 'Announcements', color: 'yellow' },
    { path: '/admin/leaderboard', icon: Award, label: 'Leaderboard', color: 'emerald' },
    { path: '/admin/settings', icon: Settings, label: 'Settings', color: 'gray' },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      red: isActive ? 'bg-red-600 text-white' : 'text-red-400 hover:bg-red-900 hover:bg-opacity-20',
      blue: isActive ? 'bg-blue-600 text-white' : 'text-blue-400 hover:bg-blue-900 hover:bg-opacity-20',
      purple: isActive ? 'bg-purple-600 text-white' : 'text-purple-400 hover:bg-purple-900 hover:bg-opacity-20',
      green: isActive ? 'bg-green-600 text-white' : 'text-green-400 hover:bg-green-900 hover:bg-opacity-20',
      orange: isActive ? 'bg-orange-600 text-white' : 'text-orange-400 hover:bg-orange-900 hover:bg-opacity-20',
      cyan: isActive ? 'bg-cyan-600 text-white' : 'text-cyan-400 hover:bg-cyan-900 hover:bg-opacity-20',
      pink: isActive ? 'bg-pink-600 text-white' : 'text-pink-400 hover:bg-pink-900 hover:bg-opacity-20',
      yellow: isActive ? 'bg-yellow-600 text-white' : 'text-yellow-400 hover:bg-yellow-900 hover:bg-opacity-20',
      emerald: isActive ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-900 hover:bg-emerald-opacity-20',
      lime: isActive ? 'bg-lime-600 text-white' : 'text-lime-400 hover:bg-lime-900 hover:bg-opacity-20',
      gray: isActive ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-900 hover:bg-opacity-20',
      indigo: isActive ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:bg-indigo-900 hover:bg-opacity-20',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${getColorClasses(
                item.color,
                isActive
              )}`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminNav;

