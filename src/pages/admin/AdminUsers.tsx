import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
// import { signInWithCustomToken as firebaseSignInWithCustomToken } from 'firebase/auth'; // Unused
import { Users, Shield, UserX, Search, Filter, Edit2, Trash2, Ban, CheckCircle, Building, GraduationCap, Phone, Mail, Calendar, Eye, X, LogIn, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { CyberCard } from '@/components/ui/CyberCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { impersonateUser } from '@/api/adminApi';
// import { NeonButton } from '@/components/ui/NeonButton'; // Unused

interface User {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  institute?: string;
  branch?: string;
  year?: string;
  role: 'admin' | 'captain' | 'player';
  teamId?: string;
  createdAt: number;
  lastLoginAt?: number;
  isBlocked?: boolean;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setLoading(false);
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeams(teamsData);
    });

    return () => {
      unsubUsers();
      unsubTeams();
    };
  }, []);

  // const handleUpdateRole = async (userId: string, newRole: string) => {
  //   try {
  //     await updateDoc(doc(db, 'users', userId), { role: newRole });
  //     toast.success('User role updated successfully');
  //   } catch (error) {
  //     console.error('Error updating role:', error);
  //     toast.error('Failed to update role');
  //   }
  // }; // Unused function

  const handleToggleBlock = async (user: User) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isBlocked: !user.isBlocked,
      });
      toast.success(user.isBlocked ? 'User unblocked' : 'User blocked');
    } catch (error) {
      console.error('Error toggling block:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    if (!confirm(`Delete user "${displayName}"? This action cannot be undone!`)) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        displayName: selectedUser.displayName,
        role: selectedUser.role,
        teamId: selectedUser.teamId || null,
      });

      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleImpersonate = async () => {
    if (!selectedUser) return;

    // Don't allow impersonating admins
    if (selectedUser.role === 'admin') {
      toast.error('Cannot impersonate admin users');
      return;
    }

    setImpersonating(true);
    try {
      const response = await impersonateUser(selectedUser.email);
      
      if (response.success && response.customToken) {
        // Sign in with the custom token in a new window
        // Store current admin session info (commented out as unused)
        // const currentAdmin = auth.currentUser;
        
        toast.success(`Impersonation ready for ${selectedUser.displayName}`);
        
        // Open in new tab with token passed via sessionStorage
        const impersonateUrl = `${window.location.origin}/#/impersonate?token=${encodeURIComponent(response.customToken)}&role=${response.user.role}`;
        window.open(impersonateUrl, '_blank');
        
        setShowImpersonateModal(false);
        setSelectedUser(null);
      } else {
        toast.error(response.error || 'Failed to generate impersonation token');
      }
    } catch (error: any) {
      console.error('Error impersonating user:', error);
      toast.error(error.response?.data?.error || 'Failed to impersonate user');
    } finally {
      setImpersonating(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      user.displayName?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search) ||
      user.institute?.toLowerCase().includes(search) ||
      user.branch?.toLowerCase().includes(search) ||
      user.year?.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    captains: users.filter((u) => u.role === 'captain').length,
    players: users.filter((u) => u.role === 'player').length,
    blocked: users.filter((u) => u.isBlocked).length,
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-900 text-red-300 border-red-500',
      captain: 'bg-blue-900 text-blue-300 border-blue-500',
      player: 'bg-green-900 text-green-300 border-green-500',
    };
    return styles[role as keyof typeof styles] || styles.player;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="USER MANAGEMENT"
        subtitle="Manage user accounts, roles, and permissions"
        status={{ label: 'TOTAL', value: `${stats.total} users`, color: 'blue' }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <CyberCard className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </CyberCard>

        <CyberCard className="text-center border-red-500/50">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-red-400" />
            <span className="text-gray-400 text-sm">Admins</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{stats.admins}</p>
        </CyberCard>

        <CyberCard className="text-center border-blue-500/50">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Captains</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{stats.captains}</p>
        </CyberCard>

        <CyberCard className="text-center border-green-500/50">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Users className="h-5 w-5 text-green-400" />
            <span className="text-gray-400 text-sm">Players</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{stats.players}</p>
        </CyberCard>

        <CyberCard className="text-center border-yellow-500/50">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <UserX className="h-5 w-5 text-yellow-400" />
            <span className="text-gray-400 text-sm">Blocked</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{stats.blocked}</p>
        </CyberCard>
      </div>

      {/* Controls */}
      <CyberCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, institute, branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-cyber-bg-darker border border-cyber-border rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-cyber-bg-darker border border-cyber-border rounded-lg pl-10 pr-8 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue appearance-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="captain">Captains</option>
                <option value="player">Players</option>
              </select>
            </div>
          </div>
        </div>
      </CyberCard>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-neon-blue"></div>
        </div>
      ) : (
        <CyberCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cyber-bg-darker border-b border-cyber-border">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">User</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Contact</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Institute</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Role</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-sm">Status</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-cyber-border/50 hover:bg-cyber-bg-darker transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          user.role === 'admin' ? 'bg-red-600/20 border border-red-500/50' :
                          user.role === 'captain' ? 'bg-blue-600/20 border border-blue-500/50' :
                          'bg-green-600/20 border border-green-500/50'
                        }`}>
                          <span className={`text-lg font-bold ${
                            user.role === 'admin' ? 'text-red-400' :
                            user.role === 'captain' ? 'text-blue-400' :
                            'text-green-400'
                          }`}>
                            {user.displayName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user.displayName || 'Unknown'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {user.year && (
                              <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">
                                {user.year}
                              </span>
                            )}
                            {user.branch && (
                              <span className="text-xs text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded">
                                {user.branch}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="truncate max-w-[150px]">{user.email || 'N/A'}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {user.institute ? (
                          <>
                            <div className="flex items-center gap-2 text-white text-sm">
                              <Building className="h-3 w-3 text-gray-500" />
                              <span className="truncate max-w-[150px]">{user.institute}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500 text-sm">Not provided</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(user.role)}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <span className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-xs font-semibold border border-red-500/50">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs font-semibold border border-green-500/50">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Impersonate Button - only for non-admins */}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowImpersonateModal(true);
                            }}
                            className="p-2 bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-600/30 transition-all"
                            title="Login as User"
                          >
                            <LogIn className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowViewModal(true);
                          }}
                          className="p-2 bg-purple-600/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-blue-600/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all"
                          title="Edit User"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleToggleBlock(user)}
                          className={`p-2 ${
                            user.isBlocked 
                              ? 'bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30' 
                              : 'bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/30'
                          } rounded-lg transition-all`}
                          title={user.isBlocked ? 'Unblock User' : 'Block User'}
                        >
                          {user.isBlocked ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user.id, user.displayName)}
                          className="p-2 bg-red-600/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm text-gray-600 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </CyberCard>
      )}

      {/* View User Details Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cyber-bg-card border border-cyber-border rounded-2xl w-full max-w-lg">
            {/* Header */}
            <div className="p-6 border-b border-cyber-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-xl flex items-center justify-center ${
                  selectedUser.role === 'admin' ? 'bg-red-600/20 border border-red-500/50' :
                  selectedUser.role === 'captain' ? 'bg-blue-600/20 border border-blue-500/50' :
                  'bg-green-600/20 border border-green-500/50'
                }`}>
                  <span className={`text-2xl font-bold ${
                    selectedUser.role === 'admin' ? 'text-red-400' :
                    selectedUser.role === 'captain' ? 'text-blue-400' :
                    'text-green-400'
                  }`}>
                    {selectedUser.displayName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedUser.displayName}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(selectedUser.role)}`}>
                    {selectedUser.role.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="bg-cyber-bg-darker rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h3>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-white">{selectedUser.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Academic Info */}
              <div className="bg-cyber-bg-darker rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Academic Information</h3>
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-500">Institute / College</p>
                    <p className="text-white">{selectedUser.institute || 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-500">Year</p>
                      <p className="text-white">{selectedUser.year || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-gray-500">Branch</p>
                      <p className="text-white">{selectedUser.branch || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team & Status */}
              <div className="bg-cyber-bg-darker rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="text-xs text-gray-500">Team</p>
                      <p className="text-white">
                        {selectedUser.teamId 
                          ? teams.find((t) => t.id === selectedUser.teamId)?.name || 'Unknown' 
                          : 'No Team'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-pink-400" />
                    <div>
                      <p className="text-xs text-gray-500">Joined</p>
                      <p className="text-white text-sm">
                        {selectedUser.createdAt 
                          ? new Date(selectedUser.createdAt).toLocaleDateString() 
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {selectedUser.isBlocked ? (
                    <span className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-xs font-semibold border border-red-500/50">
                      🚫 BLOCKED
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs font-semibold border border-green-500/50">
                      ✅ ACTIVE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-cyber-border flex gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setShowEditModal(true);
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit User
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-cyber-bg-darker border border-cyber-border text-white px-4 py-2 rounded-lg hover:bg-cyber-bg-card transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cyber-bg-card border border-cyber-border rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Edit2 className="h-6 w-6 text-blue-400" />
              Edit User
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2 text-sm">Display Name</label>
                <input
                  type="text"
                  value={selectedUser.displayName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, displayName: e.target.value })}
                  className="w-full bg-cyber-bg-darker border border-cyber-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                  className="w-full bg-cyber-bg-darker border border-cyber-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                >
                  <option value="player">Player</option>
                  <option value="captain">Captain</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm">Team (Optional)</label>
                <select
                  value={selectedUser.teamId || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, teamId: e.target.value || undefined })}
                  className="w-full bg-cyber-bg-darker border border-cyber-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                >
                  <option value="">No Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Changing user roles affects their access level immediately.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateUser}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                Update User
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-cyber-bg-darker border border-cyber-border text-white px-4 py-3 rounded-lg hover:bg-cyber-bg-card transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impersonate User Modal */}
      {showImpersonateModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cyber-bg-card border border-cyan-500/50 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-cyan-600/20 border border-cyan-500/50 flex items-center justify-center">
                <LogIn className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Login as User</h2>
                <p className="text-sm text-gray-400">Impersonate for debugging</p>
              </div>
            </div>

            <div className="bg-cyber-bg-darker rounded-xl p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${
                  selectedUser.role === 'captain' 
                    ? 'bg-blue-600/20 border border-blue-500/50' 
                    : 'bg-green-600/20 border border-green-500/50'
                }`}>
                  <span className={`text-xl font-bold ${
                    selectedUser.role === 'captain' ? 'text-blue-400' : 'text-green-400'
                  }`}>
                    {selectedUser.displayName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{selectedUser.displayName}</p>
                  <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                    selectedUser.role === 'captain' 
                      ? 'bg-blue-900/50 text-blue-300 border border-blue-500/50' 
                      : 'bg-green-900/50 text-green-300 border border-green-500/50'
                  }`}>
                    {selectedUser.role.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium text-sm">Opens in New Tab</p>
                  <p className="text-yellow-300/70 text-xs mt-1">
                    This will open a new browser tab logged in as this user. Your admin session remains active in this tab.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImpersonate}
                disabled={impersonating}
                className="flex-1 bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {impersonating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Login as {selectedUser.displayName?.split(' ')[0] || 'User'}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowImpersonateModal(false);
                  setSelectedUser(null);
                }}
                disabled={impersonating}
                className="flex-1 bg-cyber-bg-darker border border-cyber-border text-white px-4 py-3 rounded-lg hover:bg-cyber-bg-card transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

