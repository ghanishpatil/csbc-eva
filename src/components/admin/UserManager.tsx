import { useState, useEffect } from 'react';
import { firestoreAPI } from '@/utils/firestore';
import { UserCog, Shield, Users as UsersIcon, Edit2, Crown, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, UserRole } from '@/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('player');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map((doc) => doc.data() as User);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('[ FAILED TO LOAD USERS ]');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    try {
      await firestoreAPI.updateUser(userId, { role: newRole });
      toast.success('[ ROLE UPDATED ]');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('[ UPDATE FAILED ]');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  const getRoleColor = (role: UserRole) => {
    const colors = {
      admin: 'text-red-400 bg-red-500/20 border-red-500/50',
      captain: 'text-neon-purple bg-neon-purple/20 border-neon-purple/50',
      player: 'text-neon-green bg-neon-green/20 border-neon-green/50',
    };
    return colors[role];
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === 'admin') return <Crown className="h-4 w-4" />;
    if (role === 'captain') return <Shield className="h-4 w-4" />;
    return <UsersIcon className="h-4 w-4" />;
  };

  const roleStats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    captain: users.filter(u => u.role === 'captain').length,
    player: users.filter(u => u.role === 'player').length,
  };

  if (loading) {
    return (
      <div className="terminal-window p-12 text-center border border-neon-blue/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
        <p className="text-cyan-400 font-mono">LOADING USER DATA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="terminal-window p-4 border border-cyan-900/30">
          <div className="text-2xl font-cyber font-bold text-cyan-100">{roleStats.total}</div>
          <div className="text-xs text-cyan-500 font-mono">TOTAL USERS</div>
        </div>
        <div className="terminal-window p-4 border border-red-500/30">
          <div className="text-2xl font-cyber font-bold text-red-400">{roleStats.admin}</div>
          <div className="text-xs text-cyan-500 font-mono">ADMINS</div>
        </div>
        <div className="terminal-window p-4 border border-neon-purple/30">
          <div className="text-2xl font-cyber font-bold text-neon-purple">{roleStats.captain}</div>
          <div className="text-xs text-cyan-500 font-mono">CAPTAINS</div>
        </div>
        <div className="terminal-window p-4 border border-neon-green/30">
          <div className="text-2xl font-cyber font-bold text-neon-green">{roleStats.player}</div>
          <div className="text-xs text-cyan-500 font-mono">PLAYERS</div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="terminal-window p-6 border border-neon-purple/30">
        <div className="flex items-center space-x-3 mb-6">
          <UserCog className="h-6 w-6 text-neon-purple" />
          <h2 className="text-2xl font-cyber font-bold text-neon-purple">USER MANAGEMENT</h2>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-cyber text-cyan-300 mb-2 flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>SEARCH USERS</span>
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full px-4 py-2 bg-dark-900 border border-neon-purple/30 text-cyan-100 font-mono focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-cyber text-cyan-300 mb-2 flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>FILTER BY ROLE</span>
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
              className="w-full px-4 py-2 bg-dark-900 border border-neon-purple/30 text-cyan-100 font-mono focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50 outline-none"
            >
              <option value="all">ALL ROLES</option>
              <option value="admin">ADMIN</option>
              <option value="captain">CAPTAIN</option>
              <option value="player">PLAYER</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-2">
          <div className="text-sm font-mono text-cyan-500 mb-3">
            SHOWING {filteredUsers.length} OF {users.length} USERS
          </div>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-dark-800/30 border border-cyan-900/30 hover:border-neon-purple/50 transition-all"
            >
              <div className="flex-1">
                {editingUser === user.id ? (
                  <div className="flex items-center space-x-3">
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="px-3 py-1 bg-dark-900 border border-neon-purple/30 text-cyan-100 font-mono focus:ring-2 focus:ring-neon-purple/50 outline-none"
                    >
                      <option value="player">PLAYER</option>
                      <option value="captain">CAPTAIN</option>
                      <option value="admin">ADMIN</option>
                    </select>
                    <button
                      onClick={() => handleUpdateRole(user.id)}
                      className="px-3 py-1 bg-neon-green text-dark-900 font-cyber font-bold hover:bg-neon-green/80"
                    >
                      SAVE
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="px-3 py-1 bg-dark-700 text-cyan-400 font-cyber hover:bg-dark-600"
                    >
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 border font-cyber text-xs ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span>{user.role.toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="font-cyber text-cyan-100 font-bold">{user.displayName}</div>
                      <div className="text-xs text-cyan-500 font-mono">{user.email}</div>
                    </div>
                  </div>
                )}
              </div>
              {editingUser !== user.id && (
                <button
                  onClick={() => {
                    setEditingUser(user.id);
                    setNewRole(user.role);
                  }}
                  className="p-2 text-neon-purple hover:bg-neon-purple/10 border border-transparent hover:border-neon-purple/30 transition-all"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 bg-dark-800/20 border border-dashed border-cyan-900/30">
              <UserCog className="h-12 w-12 text-cyan-900 mx-auto mb-3" />
              <p className="text-cyan-600 font-mono">NO USERS FOUND</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

