import { useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { createGroup, updateGroup, deleteGroup, updateTeam } from '../../api/adminApi';
import { Users, Plus, Edit2, Trash2, Shuffle, TrendingUp, Award, BarChart3, AlertTriangle, Shield, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
  maxTeams?: number;
  captainId?: string;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'captain' | 'player';
}

interface Team {
  id: string;
  name: string;
  groupId: string;
  score: number;
  levelsCompleted: number;
}

const AdminGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showAssignCaptainModal, setShowAssignCaptainModal] = useState(false);
  const [showAssignTeamsModal, setShowAssignTeamsModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    maxTeams: 0,
  });

  const [bulkAssign, setBulkAssign] = useState({
    mode: 'auto',
    targetGroupId: '',
    selectedTeamIds: [] as string[],
  });

  useEffect(() => {
    const unsubGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
      setGroups(groupsData.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(teamsData);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    });

    return () => {
      unsubGroups();
      unsubTeams();
      unsubUsers();
    };
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const response = await createGroup({
        ...newGroup,
      });

      if (response.success) {
        toast.success('Group created successfully');
        setShowCreateModal(false);
        setNewGroup({ name: '', description: '', color: '#3b82f6', maxTeams: 0 });
      } else {
        toast.error(response.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    try {
      await updateGroup(selectedGroup.id, {
        name: selectedGroup.name,
        description: selectedGroup.description,
        color: selectedGroup.color,
        maxTeams: selectedGroup.maxTeams,
      });

      toast.success('Group updated successfully');
      setShowEditModal(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    }
  };

  const handleAssignCaptain = async () => {
    if (!selectedGroup) return;

    try {
      // If no captain selected, remove captain assignment
      if (!selectedCaptainId) {
        await updateGroup(selectedGroup.id, {
          captainId: null,
        });
        toast.success('Captain removed successfully');
        setShowAssignCaptainModal(false);
        setSelectedGroup(null);
        setSelectedCaptainId('');
        return;
      }

      // Check if captain is already assigned to another group
      const existingGroup = groups.find(g => g.captainId === selectedCaptainId && g.id !== selectedGroup.id);
      if (existingGroup) {
        if (!confirm(`This captain is already assigned to ${existingGroup.name}. Do you want to reassign?`)) {
          return;
        }
        // Remove captain from previous group
        await updateGroup(existingGroup.id, {
          captainId: null,
        });
      }

      // Assign captain to selected group
      await updateGroup(selectedGroup.id, {
        captainId: selectedCaptainId,
      });

      toast.success('Captain assigned successfully');
      setShowAssignCaptainModal(false);
      setSelectedGroup(null);
      setSelectedCaptainId('');
    } catch (error) {
      console.error('Error assigning captain:', error);
      toast.error('Failed to assign captain');
    }
  };

  const handleAssignTeams = async () => {
    if (!selectedGroup) return;
    if (selectedTeamIds.length === 0) {
      toast.error('Please select at least one team');
      return;
    }

    try {
      // Assign selected teams to the group via API
      for (const teamId of selectedTeamIds) {
        await updateTeam(teamId, {
          groupId: selectedGroup.id,
        });
      }
      
      toast.success(`Successfully assigned ${selectedTeamIds.length} team(s) to ${selectedGroup.name}`);
      setShowAssignTeamsModal(false);
      setSelectedGroup(null);
      setSelectedTeamIds([]);
    } catch (error) {
      console.error('Error assigning teams:', error);
      toast.error('Failed to assign teams');
    }
  };

  const handleRemoveCaptain = async (groupId: string) => {
    if (!confirm('Remove captain from this group?')) return;

    try {
      await updateGroup(groupId, {
        captainId: null,
      });
      toast.success('Captain removed successfully');
    } catch (error) {
      console.error('Error removing captain:', error);
      toast.error('Failed to remove captain');
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const teamsInGroup = teams.filter((t) => t.groupId === groupId);

    if (teamsInGroup.length > 0) {
      if (!confirm(`This group has ${teamsInGroup.length} teams. Teams will be unassigned. Continue?`)) {
        return;
      }
    }

    if (!confirm(`Delete group "${groupName}"?`)) return;

    try {
      // Remove group assignment from teams via API
      for (const team of teamsInGroup) {
        await updateTeam(team.id, { groupId: null });
      }

      // Delete group via API
      await deleteGroup(groupId);
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleDeleteAllGroups = async () => {
    if (groups.length === 0) {
      toast.error('No groups to delete');
      return;
    }

    setDeletingAll(true);
    try {
      // Get all teams that belong to these groups
      const teamsInGroups = teams.filter((t) => t.groupId && groups.some((g) => g.id === t.groupId));

      // Unassign teams from groups via API
      for (const team of teamsInGroups) {
        await updateTeam(team.id, { groupId: null });
      }

      // Delete all groups via API
      for (const group of groups) {
        await deleteGroup(group.id);
      }
      
      toast.success(`Successfully deleted ${groups.length} group(s) and unassigned ${teamsInGroups.length} team(s)`);
      setShowDeleteAllModal(false);
    } catch (error) {
      console.error('Error deleting all groups:', error);
      toast.error('Failed to delete all groups');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleAutoBalance = async () => {
    if (groups.length === 0) {
      toast.error('Create groups first');
      return;
    }

    if (!confirm('Auto-balance all teams across groups?')) return;

    try {
      const teamsPerGroup = Math.ceil(teams.length / groups.length);

      for (let index = 0; index < teams.length; index++) {
        const team = teams[index];
        const groupIndex = Math.floor(index / teamsPerGroup);
        const targetGroup = groups[groupIndex];
        if (targetGroup) {
          await updateTeam(team.id, { groupId: targetGroup.id });
        }
      }

      toast.success('Teams balanced successfully');
    } catch (error) {
      console.error('Error balancing teams:', error);
      toast.error('Failed to balance teams');
    }
  };

  const handleBulkAssign = async () => {
    if (bulkAssign.mode === 'manual' && bulkAssign.selectedTeamIds.length === 0) {
      toast.error('Select teams to assign');
      return;
    }

    if (!bulkAssign.targetGroupId) {
      toast.error('Select target group');
      return;
    }

    try {
      const teamsToAssign =
        bulkAssign.mode === 'auto'
          ? teams.filter((t) => !t.groupId || t.groupId === '')
          : teams.filter((t) => bulkAssign.selectedTeamIds.includes(t.id));

      for (const team of teamsToAssign) {
        await updateTeam(team.id, { groupId: bulkAssign.targetGroupId });
      }

      toast.success(`Assigned ${teamsToAssign.length} teams to group`);
      setShowBulkAssignModal(false);
      setBulkAssign({ mode: 'auto', targetGroupId: '', selectedTeamIds: [] });
    } catch (error) {
      console.error('Error bulk assigning:', error);
      toast.error('Failed to assign teams');
    }
  };

  const getGroupStats = (groupId: string) => {
    const groupTeams = teams.filter((t) => t.groupId === groupId);
    return {
      teamCount: groupTeams.length,
      totalScore: groupTeams.reduce((sum, t) => sum + (t.score || 0), 0),
      avgScore: groupTeams.length > 0 ? Math.round(groupTeams.reduce((sum, t) => sum + (t.score || 0), 0) / groupTeams.length) : 0,
      totalLevels: groupTeams.reduce((sum, t) => sum + (t.levelsCompleted || 0), 0),
    };
  };

  const colorOptions = [
    { value: '#3b82f6', label: 'Blue', class: 'bg-blue-500' },
    { value: '#ef4444', label: 'Red', class: 'bg-red-500' },
    { value: '#10b981', label: 'Green', class: 'bg-green-500' },
    { value: '#f59e0b', label: 'Orange', class: 'bg-orange-500' },
    { value: '#8b5cf6', label: 'Purple', class: 'bg-purple-500' },
    { value: '#ec4899', label: 'Pink', class: 'bg-pink-500' },
    { value: '#06b6d4', label: 'Cyan', class: 'bg-cyan-500' },
    { value: '#84cc16', label: 'Lime', class: 'bg-lime-500' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 font-display mb-2">
          GROUP MANAGEMENT
        </h1>
        <p className="text-gray-400">Organize teams into competitive groups</p>
      </div>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
          >
            <Plus className="h-5 w-5" />
            <span>Create Group</span>
          </button>

          <button
            onClick={() => setShowBulkAssignModal(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
          >
            <Users className="h-5 w-5" />
            <span>Bulk Assign</span>
          </button>

          <button
            onClick={handleAutoBalance}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all"
          >
            <Shuffle className="h-5 w-5" />
            <span>Auto Balance</span>
          </button>

          <div className="flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg px-4">
            <span className="text-gray-400 text-sm">
              {groups.length} Groups | {teams.filter((t) => !t.groupId).length} Unassigned
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-700 to-red-800 text-white px-6 py-2 rounded-lg hover:from-red-800 hover:to-red-900 transition-all border border-red-600"
            disabled={groups.length === 0}
          >
            <Trash2 className="h-5 w-5" />
            <span>Delete All Groups</span>
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-4">No groups created yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
          >
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const stats = getGroupStats(group.id);
            return (
              <div
                key={group.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-red-500 transition-all"
                style={{ borderLeftWidth: '4px', borderLeftColor: group.color }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: group.color }}
                    >
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{group.name}</h3>
                      <p className="text-gray-400 text-sm">{group.description || 'No description'}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400 text-xs">Teams</span>
                    </div>
                    <p className="text-white font-bold text-lg">{stats.teamCount}</p>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Award className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-400 text-xs">Total Score</span>
                    </div>
                    <p className="text-white font-bold text-lg">{stats.totalScore}</p>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400 text-xs">Avg Score</span>
                    </div>
                    <p className="text-white font-bold text-lg">{stats.avgScore}</p>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-400 text-xs">Levels Done</span>
                    </div>
                    <p className="text-white font-bold text-lg">{stats.totalLevels}</p>
                  </div>
                </div>

                {/* Captain Info */}
                {group.captainId && (
                  <div className="mb-3 p-3 bg-slate-900 rounded-lg border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-gray-400">Captain:</span>
                        <span className="text-sm text-blue-400 font-medium">
                          {users.find(u => u.id === group.captainId)?.displayName || 'Unknown'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveCaptain(group.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                        title="Remove Captain"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowAssignCaptainModal(true);
                      setSelectedCaptainId(group.captainId || '');
                    }}
                    className="flex items-center justify-center space-x-1 bg-blue-600 text-white px-2 py-2 rounded-lg hover:bg-blue-700 transition-all text-xs"
                  >
                    <Shield className="h-3 w-3" />
                    <span>{group.captainId ? 'Change' : 'Assign'} Captain</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowAssignTeamsModal(true);
                      setSelectedTeamIds(teams.filter(t => t.groupId === group.id).map(t => t.id));
                    }}
                    className="flex items-center justify-center space-x-1 bg-green-600 text-white px-2 py-2 rounded-lg hover:bg-green-700 transition-all text-xs"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>Assign Teams</span>
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowEditModal(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    className="flex items-center justify-center bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Group</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Group Name *</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Group Alpha"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-20"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewGroup({ ...newGroup, color: color.value })}
                      className={`h-12 rounded-lg ${color.class} ${
                        newGroup.color === color.value ? 'ring-2 ring-white' : ''
                      } hover:opacity-80 transition-all`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Max Teams (Optional)</label>
                <input
                  type="number"
                  value={newGroup.maxTeams}
                  onChange={(e) => setNewGroup({ ...newGroup, maxTeams: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0 = unlimited"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateGroup}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
              >
                Create Group
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroup({ name: '', description: '', color: '#3b82f6', maxTeams: 0 });
                }}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Group</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Group Name</label>
                <input
                  type="text"
                  value={selectedGroup.name}
                  onChange={(e) => setSelectedGroup({ ...selectedGroup, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Description</label>
                <textarea
                  value={selectedGroup.description}
                  onChange={(e) => setSelectedGroup({ ...selectedGroup, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-20"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedGroup({ ...selectedGroup, color: color.value })}
                      className={`h-12 rounded-lg ${color.class} ${
                        selectedGroup.color === color.value ? 'ring-2 ring-white' : ''
                      } hover:opacity-80 transition-all`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateGroup}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Update Group
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedGroup(null);
                }}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Bulk Assign Teams</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Assignment Mode</label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setBulkAssign({ ...bulkAssign, mode: 'auto' })}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      bulkAssign.mode === 'auto'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-gray-300'
                    }`}
                  >
                    Auto (Unassigned Teams)
                  </button>
                  <button
                    onClick={() => setBulkAssign({ ...bulkAssign, mode: 'manual' })}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      bulkAssign.mode === 'manual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-gray-300'
                    }`}
                  >
                    Manual Selection
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Target Group</label>
                <select
                  value={bulkAssign.targetGroupId}
                  onChange={(e) => setBulkAssign({ ...bulkAssign, targetGroupId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {bulkAssign.mode === 'manual' && (
                <div>
                  <label className="block text-gray-400 mb-2">Select Teams</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {teams.map((team) => (
                      <label key={team.id} className="flex items-center space-x-3 py-2 hover:bg-slate-800 px-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkAssign.selectedTeamIds.includes(team.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkAssign({
                                ...bulkAssign,
                                selectedTeamIds: [...bulkAssign.selectedTeamIds, team.id],
                              });
                            } else {
                              setBulkAssign({
                                ...bulkAssign,
                                selectedTeamIds: bulkAssign.selectedTeamIds.filter((id) => id !== team.id),
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-white">{team.name}</span>
                        <span className="text-gray-400 text-sm ml-auto">
                          {team.groupId ? groups.find((g) => g.id === team.groupId)?.name || 'Unknown' : 'Unassigned'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  {bulkAssign.mode === 'auto'
                    ? `Will assign ${teams.filter((t) => !t.groupId).length} unassigned teams`
                    : `Will assign ${bulkAssign.selectedTeamIds.length} selected teams`}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleBulkAssign}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Assign Teams
              </button>
              <button
                onClick={() => {
                  setShowBulkAssignModal(false);
                  setBulkAssign({ mode: 'auto', targetGroupId: '', selectedTeamIds: [] });
                }}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Groups Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border-2 border-red-600 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-600/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Delete All Groups</h2>
                <p className="text-red-400 text-sm">This action cannot be undone!</p>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4 mb-6">
              <p className="text-white mb-2">
                You are about to delete <span className="font-bold text-red-400">{groups.length}</span> group(s).
              </p>
              <p className="text-gray-300 text-sm mb-2">
                This will permanently remove all groups. Teams assigned to these groups will be unassigned.
              </p>
              <p className="text-gray-300 text-sm">
                <span className="font-bold text-yellow-400">
                  {teams.filter((t) => t.groupId && groups.some((g) => g.id === t.groupId)).length}
                </span> team(s) will be unassigned.
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                <label className="block text-gray-400 mb-2 text-sm">
                  Type <span className="font-mono text-red-400">DELETE ALL</span> to confirm:
                </label>
                <input
                  type="text"
                  id="confirmDeleteGroupsInput"
                  placeholder="DELETE ALL"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={async () => {
                  const input = document.getElementById('confirmDeleteGroupsInput') as HTMLInputElement;
                  if (input?.value === 'DELETE ALL') {
                    await handleDeleteAllGroups();
                  } else {
                    toast.error('Confirmation text does not match. Please type "DELETE ALL" exactly.');
                  }
                }}
                disabled={deletingAll}
                className="flex-1 bg-gradient-to-r from-red-700 to-red-800 text-white px-4 py-2 rounded-lg hover:from-red-800 hover:to-red-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {deletingAll ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete All Groups</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteAllModal(false);
                  const input = document.getElementById('confirmDeleteGroupsInput') as HTMLInputElement;
                  if (input) input.value = '';
                }}
                disabled={deletingAll}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Captain Modal */}
      {showAssignCaptainModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Assign Captain to {selectedGroup.name}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Select Captain</label>
                <select
                  value={selectedCaptainId}
                  onChange={(e) => setSelectedCaptainId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Captain (Remove Assignment)</option>
                  {users
                    .filter(u => u.role === 'captain')
                    .map((captain) => {
                      const assignedToGroup = groups.find(g => g.captainId === captain.id && g.id !== selectedGroup.id);
                      return (
                        <option key={captain.id} value={captain.id}>
                          {captain.displayName} ({captain.email})
                          {assignedToGroup ? ` - Currently: ${assignedToGroup.name}` : ''}
                        </option>
                      );
                    })}
                </select>
                {selectedCaptainId && groups.find(g => g.captainId === selectedCaptainId && g.id !== selectedGroup.id) && (
                  <p className="text-yellow-400 text-xs mt-2">
                    ⚠️ This captain is assigned to another group. They will be reassigned.
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAssignCaptain}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Assign Captain
              </button>
              <button
                onClick={() => {
                  setShowAssignCaptainModal(false);
                  setSelectedGroup(null);
                  setSelectedCaptainId('');
                }}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teams Modal */}
      {showAssignTeamsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Assign Teams to {selectedGroup.name}</h2>

            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-4">
                <p className="text-blue-400 text-sm">
                  Select teams to assign to this group. Teams can only belong to one group at a time.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-gray-400">Select Teams</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const groupTeams = teams.filter(t => t.groupId === selectedGroup.id).map(t => t.id);
                        setSelectedTeamIds(groupTeams);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Select Current
                    </button>
                    <button
                      onClick={() => setSelectedTeamIds([])}
                      className="text-xs text-gray-400 hover:text-gray-300"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {teams.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No teams available</p>
                  ) : (
                    teams.map((team) => {
                      const currentGroup = groups.find(g => g.id === team.groupId);
                      return (
                        <label
                          key={team.id}
                          className="flex items-center space-x-3 py-3 hover:bg-slate-800 px-2 rounded cursor-pointer border-b border-slate-700/50 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTeamIds.includes(team.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeamIds([...selectedTeamIds, team.id]);
                              } else {
                                setSelectedTeamIds(selectedTeamIds.filter((id) => id !== team.id));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <span className="text-white font-medium">{team.name}</span>
                            <div className="text-xs text-gray-400">
                              {team.id} {currentGroup && team.groupId !== selectedGroup.id && (
                                <span className="text-yellow-400">(Currently: {currentGroup.name})</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Score: <span className="text-green-400">{team.score || 0}</span></div>
                            <div className="text-xs text-gray-400">Levels: {team.levelsCompleted || 0}</div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  Selected: <span className="text-white font-bold">{selectedTeamIds.length}</span> team(s)
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAssignTeams}
                disabled={selectedTeamIds.length === 0}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign {selectedTeamIds.length} Team(s)
              </button>
              <button
                onClick={() => {
                  setShowAssignTeamsModal(false);
                  setSelectedGroup(null);
                  setSelectedTeamIds([]);
                }}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all"
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

export default AdminGroups;

