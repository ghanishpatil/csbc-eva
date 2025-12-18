import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { adjustScore, createTeam, updateTeam, deleteTeam } from '../../api/adminApi';
import { Users, Edit2, Trash2, Plus, DollarSign, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  teamNumber?: number;
  groupId: string;
  captainId: string;
  score: number;
  levelsCompleted: number;
  members: string[];
  inviteCode?: string;
  createdAt?: number;
  status?: string;
}

const AdminTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Form states
  const [newTeam, setNewTeam] = useState({
    name: '',
    groupId: '',
    captainId: '',
  });

  const [scoreAdjustment, setScoreAdjustment] = useState({
    amount: 0,
    reason: '',
  });

  useEffect(() => {
    // Listen to teams
    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(teamsData);
      setLoading(false);
    });

    // Listen to groups
    const unsubGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(groupsData);
    });

    return () => {
      unsubTeams();
      unsubGroups();
    };
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    try {
      // Create team via backend API (team number auto-assigned by backend)
      const response = await createTeam({
        name: newTeam.name,
        groupId: newTeam.groupId || null,
        captainId: newTeam.captainId || null,
      });

      if (response.success) {
        toast.success(`Team #${response.teamNumber} created successfully`);
        setShowCreateModal(false);
        setNewTeam({ name: '', groupId: '', captainId: '' });
      } else {
        toast.error(response.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;

    try {
      await updateTeam(selectedTeam.id, {
        name: selectedTeam.name,
        groupId: selectedTeam.groupId,
        captainId: selectedTeam.captainId,
      });

      toast.success('Team updated successfully');
      setShowEditModal(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };

  const handleAdjustScore = async () => {
    if (!selectedTeam) return;

    try {
      const result = await adjustScore(
        selectedTeam.id,
        scoreAdjustment.amount,
        scoreAdjustment.reason
      );

      if (result.success) {
        toast.success(`Score adjusted by ${scoreAdjustment.amount > 0 ? '+' : ''}${scoreAdjustment.amount}`);
        setShowScoreModal(false);
        setScoreAdjustment({ amount: 0, reason: '' });
        setSelectedTeam(null);
      }
    } catch (error) {
      console.error('Error adjusting score:', error);
      toast.error('Failed to adjust score');
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"?`)) return;

    try {
      await deleteTeam(teamId);
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const handleDeleteAllTeams = async () => {
    if (teams.length === 0) {
      toast.error('No teams to delete');
      return;
    }

    setDeletingAll(true);
    try {
      // Delete all teams via API
      for (const team of teams) {
        await deleteTeam(team.id);
      }
      
      toast.success(`Successfully deleted ${teams.length} team(s)`);
      setShowDeleteAllModal(false);
    } catch (error) {
      console.error('Error deleting all teams:', error);
      toast.error('Failed to delete all teams');
    } finally {
      setDeletingAll(false);
    }
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || team.groupId === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 font-display mb-2">
          TEAM MANAGEMENT
        </h1>
        <p className="text-gray-400">Manage teams, groups, and captains</p>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 flex space-x-4">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-700 to-red-800 text-white px-6 py-2 rounded-lg hover:from-red-800 hover:to-red-900 transition-all border border-red-600"
              disabled={teams.length === 0}
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete All Teams</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* Teams Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Team #</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Team Name</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Group</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Invite Code</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Score</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Levels</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold">Members</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team) => (
                  <tr
                    key={team.id}
                    className="border-b border-slate-700 hover:bg-slate-900 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {team.teamNumber ? (
                        <span className="px-3 py-1 bg-red-600/20 border border-red-600/50 rounded-lg text-sm font-bold text-red-400">
                          #{team.teamNumber}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{team.name}</p>
                          <p className="text-gray-400 text-sm">{team.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-gray-300">
                        {team.groupId ? groups.find((g) => g.id === team.groupId)?.name || team.groupId : 'No Group'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {team.inviteCode ? (
                        <span className="px-3 py-1 bg-yellow-900/30 border border-yellow-600/50 rounded-lg text-sm font-mono text-yellow-400">
                          {team.inviteCode}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-bold">{team.score}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{team.levelsCompleted}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-white">{team.members?.length || 0}/2</span>
                        {team.members && team.members.length > 0 && (
                          <span className="text-xs text-gray-400">
                            ({team.members.length === 2 ? 'Full' : 'Open'})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowScoreModal(true);
                          }}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                          title="Adjust Score"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                          title="Edit Team"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                          title="Delete Team"
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
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Team</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Team Name *</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Group (Optional)</label>
                <select
                  value={newTeam.groupId}
                  onChange={(e) => setNewTeam({ ...newTeam, groupId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">No Group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateTeam}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
              >
                Create Team
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTeam({ name: '', groupId: '', captainId: '' });
                }}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Team</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Team Name</label>
                <input
                  type="text"
                  value={selectedTeam.name}
                  onChange={(e) =>
                    setSelectedTeam({ ...selectedTeam, name: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Group</label>
                <select
                  value={selectedTeam.groupId}
                  onChange={(e) =>
                    setSelectedTeam({ ...selectedTeam, groupId: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">No Group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateTeam}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Update Team
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTeam(null);
                }}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Adjustment Modal */}
      {showScoreModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2">Adjust Score</h2>
            <p className="text-gray-400 mb-6">
              Team: {selectedTeam.name} (Current: {selectedTeam.score})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Score Change</label>
                <input
                  type="number"
                  value={scoreAdjustment.amount}
                  onChange={(e) =>
                    setScoreAdjustment({
                      ...scoreAdjustment,
                      amount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter positive or negative number"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Reason (Optional)</label>
                <textarea
                  value={scoreAdjustment.reason}
                  onChange={(e) =>
                    setScoreAdjustment({ ...scoreAdjustment, reason: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-24"
                  placeholder="Enter reason for adjustment..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAdjustScore}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
              >
                Adjust Score
              </button>
              <button
                onClick={() => {
                  setShowScoreModal(false);
                  setSelectedTeam(null);
                  setScoreAdjustment({ amount: 0, reason: '' });
                }}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Teams Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border-2 border-red-600 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-600/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Delete All Teams</h2>
                <p className="text-red-400 text-sm">This action cannot be undone!</p>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4 mb-6">
              <p className="text-white mb-2">
                You are about to delete <span className="font-bold text-red-400">{teams.length}</span> team(s).
              </p>
              <p className="text-gray-300 text-sm">
                This will permanently remove all teams, their scores, and associated data. This action cannot be reversed.
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                <label className="block text-gray-400 mb-2 text-sm">
                  Type <span className="font-mono text-red-400">DELETE ALL</span> to confirm:
                </label>
                <input
                  type="text"
                  id="confirmDeleteInput"
                  placeholder="DELETE ALL"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={async () => {
                  const input = document.getElementById('confirmDeleteInput') as HTMLInputElement;
                  if (input?.value === 'DELETE ALL') {
                    await handleDeleteAllTeams();
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
                    <span>Delete All Teams</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteAllModal(false);
                  const input = document.getElementById('confirmDeleteInput') as HTMLInputElement;
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
    </div>
  );
};

export default AdminTeams;

