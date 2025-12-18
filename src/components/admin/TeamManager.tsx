import { useState } from 'react';
import { firestoreAPI } from '@/utils/firestore';
import { useAppStore } from '@/store/appStore';
import { Users, Edit2, Trash2, Plus, Zap, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateTeamName, generateGroupName } from '@/utils/helpers';

export const TeamManager: React.FC = () => {
  const { teams, groups } = useAppStore();
  const [numberOfTeams, setNumberOfTeams] = useState(10);
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');

  const handleGenerateTeams = async () => {
    if (numberOfTeams < 1 || numberOfGroups < 1) {
      toast.error('[ INVALID INPUT ]');
      return;
    }

    setLoading(true);
    try {
      const groupIds: string[] = [];
      for (let i = 0; i < numberOfGroups; i++) {
        const groupId = await firestoreAPI.createGroup({
          name: generateGroupName(i),
          teamIds: [],
          createdAt: Date.now(),
        });
        groupIds.push(groupId);
      }

      // const distribution = distributeTeamsIntoGroups(numberOfTeams, numberOfGroups); // Unused

      for (let i = 0; i < numberOfTeams; i++) {
        const groupIndex = Math.floor(i / Math.ceil(numberOfTeams / numberOfGroups));
        const groupId = groupIds[Math.min(groupIndex, groupIds.length - 1)];

        await firestoreAPI.createTeam({
          name: generateTeamName(i),
          groupId,
          captainId: '',
          members: [],
          score: 0,
          levelsCompleted: 0,
          timePenalty: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      toast.success(`[ CREATED ${numberOfTeams} TEAMS IN ${numberOfGroups} GROUPS ]`);
    } catch (error) {
      console.error('Error creating teams:', error);
      toast.error('[ OPERATION FAILED ]');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeamName = async (teamId: string) => {
    if (!newTeamName.trim()) {
      toast.error('[ INVALID TEAM NAME ]');
      return;
    }

    try {
      await firestoreAPI.updateTeam(teamId, { name: newTeamName });
      toast.success('[ TEAM NAME UPDATED ]');
      setEditingTeam(null);
      setNewTeamName('');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('[ UPDATE FAILED ]');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('[ CONFIRM DELETE OPERATION ]')) return;

    try {
      await firestoreAPI.deleteTeam(teamId);
      toast.success('[ TEAM DELETED ]');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('[ DELETE FAILED ]');
    }
  };

  return (
    <div className="terminal-window p-6 border border-neon-blue/30">
      <div className="flex items-center space-x-3 mb-6">
        <Users className="h-6 w-6 text-neon-blue" />
        <h2 className="text-2xl font-cyber font-bold text-neon-blue">TEAM MANAGEMENT</h2>
      </div>

      {/* Generate Teams Form */}
      <div className="bg-dark-800/50 border border-neon-green/20 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-5 w-5 text-neon-green" />
          <h3 className="text-lg font-cyber text-neon-green">GENERATE TEAMS & GROUPS</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-cyber text-cyan-300 mb-2">
              NUMBER OF TEAMS
            </label>
            <input
              type="number"
              min="1"
              value={numberOfTeams}
              onChange={(e) => setNumberOfTeams(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-dark-900 border border-neon-blue/30 text-cyan-100 font-mono focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-cyber text-cyan-300 mb-2">
              NUMBER OF GROUPS
            </label>
            <input
              type="number"
              min="1"
              value={numberOfGroups}
              onChange={(e) => setNumberOfGroups(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-dark-900 border border-neon-blue/30 text-cyan-100 font-mono focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateTeams}
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-blue to-neon-green text-dark-900 px-6 py-2 font-cyber font-bold hover:shadow-lg hover:shadow-neon-blue/50 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{loading ? 'CREATING...' : 'GENERATE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-cyber text-cyan-100">
            EXISTING TEAMS ({teams.length})
          </h3>
        </div>
        <div className="space-y-2">
          {teams.map((team) => {
            const group = groups.find((g) => g.id === team.groupId);
            return (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 bg-dark-800/30 border border-cyan-900/30 hover:border-neon-blue/50 transition-all"
              >
                <div className="flex-1">
                  {editingTeam === team.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="px-3 py-1 bg-dark-900 border border-neon-blue/30 text-cyan-100 font-mono focus:ring-2 focus:ring-neon-blue/50 outline-none"
                        placeholder="Enter new name"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateTeamName(team.id)}
                        className="px-3 py-1 bg-neon-green text-dark-900 font-cyber font-bold hover:bg-neon-green/80"
                      >
                        SAVE
                      </button>
                      <button
                        onClick={() => {
                          setEditingTeam(null);
                          setNewTeamName('');
                        }}
                        className="px-3 py-1 bg-dark-700 text-cyan-400 font-cyber hover:bg-dark-600"
                      >
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-neon-blue" />
                      <div>
                        <p className="font-cyber text-cyan-100 font-bold">{team.name}</p>
                        <p className="text-xs text-cyan-500 font-mono">
                          {group?.name} • SCORE: {team.score} • MISSIONS: {team.levelsCompleted}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {editingTeam !== team.id && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingTeam(team.id);
                        setNewTeamName(team.name);
                      }}
                      className="p-2 text-neon-blue hover:bg-neon-blue/10 border border-transparent hover:border-neon-blue/30 transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {teams.length === 0 && (
            <div className="text-center py-12 bg-dark-800/20 border border-dashed border-cyan-900/30">
              <Users className="h-12 w-12 text-cyan-900 mx-auto mb-3" />
              <p className="text-cyan-600 font-mono">NO TEAMS CREATED YET</p>
              <p className="text-cyan-800 text-sm mt-1">Generate teams to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
