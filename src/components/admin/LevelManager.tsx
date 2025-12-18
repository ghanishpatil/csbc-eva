import { useState } from 'react';
import { firestoreAPI } from '@/utils/firestore';
import { useAppStore } from '@/store/appStore';
import { Target, Plus, Edit2, Trash2, X, Shield, Zap, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { CreateLevelForm, HintType } from '@/types';

export const LevelManager: React.FC = () => {
  const { levels } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateLevelForm>({
    title: '',
    description: '',
    basePoints: 500,
    difficulty: 'medium',
    hintType: 'points',
    hintsAvailable: 3,
    pointDeduction: 50,
    timePenalty: 5,
    flagFormat: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      basePoints: 500,
      difficulty: 'medium',
      hintType: 'points',
      hintsAvailable: 3,
      pointDeduction: 50,
      timePenalty: 5,
      flagFormat: '',
    });
    setShowForm(false);
    setEditingLevel(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingLevel) {
        await firestoreAPI.updateLevel(editingLevel, formData);
        toast.success('[ MISSION UPDATED ]');
      } else {
        const nextNumber = levels.length + 1;
        await firestoreAPI.createLevel({
          ...formData,
          number: nextNumber,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        toast.success('[ MISSION CREATED ]');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving level:', error);
      toast.error('[ OPERATION FAILED ]');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (level: any) => {
    setFormData({
      title: level.title,
      description: level.description,
      basePoints: level.basePoints,
      difficulty: level.difficulty,
      hintType: level.hintType,
      hintsAvailable: level.hintsAvailable,
      pointDeduction: level.pointDeduction || 50,
      timePenalty: level.timePenalty || 5,
      flagFormat: level.flagFormat || '',
    });
    setEditingLevel(level.id);
    setShowForm(true);
  };

  const handleDelete = async (levelId: string) => {
    if (!confirm('[ CONFIRM DELETE OPERATION ]')) return;

    try {
      await firestoreAPI.deleteLevel(levelId);
      toast.success('[ MISSION DELETED ]');
    } catch (error) {
      console.error('Error deleting level:', error);
      toast.error('[ DELETE FAILED ]');
    }
  };

  const handleToggleActive = async (levelId: string, isActive: boolean) => {
    try {
      await firestoreAPI.updateLevel(levelId, { isActive: !isActive });
      toast.success(`[ MISSION ${!isActive ? 'ACTIVATED' : 'DEACTIVATED'} ]`);
    } catch (error) {
      console.error('Error toggling level:', error);
      toast.error('[ OPERATION FAILED ]');
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const badges = {
      easy: { text: 'RECON', color: 'text-neon-green', bg: 'bg-neon-green/20', border: 'border-neon-green/50' },
      medium: { text: 'TACTICAL', color: 'text-neon-yellow', bg: 'bg-neon-yellow/20', border: 'border-neon-yellow/50' },
      hard: { text: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' },
    };
    return badges[difficulty as keyof typeof badges] || badges.medium;
  };

  return (
    <div className="terminal-window p-6 border border-neon-green/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6 text-neon-green" />
          <h2 className="text-2xl font-cyber font-bold text-neon-green">MISSION MANAGEMENT</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-neon-green to-neon-blue text-dark-900 px-4 py-2 font-cyber font-bold hover:shadow-lg hover:shadow-neon-green/50 flex items-center space-x-2 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>ADD MISSION</span>
        </button>
      </div>

      {/* Level Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="terminal-window border-2 border-neon-green/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-neon-green/20">
                <h3 className="text-xl font-cyber font-bold text-neon-green">
                  {editingLevel ? '[ EDIT MISSION ]' : '[ CREATE NEW MISSION ]'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-cyan-400 hover:text-red-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-cyber text-cyan-300 mb-2">
                    MISSION TITLE
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-dark-900 border border-neon-green/30 text-cyan-100 font-mono focus:border-neon-green focus:ring-2 focus:ring-neon-green/50 outline-none"
                    placeholder="Enter mission title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-cyber text-cyan-300 mb-2">
                    BRIEFING
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full px-4 py-2 bg-dark-900 border border-neon-green/30 text-cyan-100 font-mono focus:border-neon-green focus:ring-2 focus:ring-neon-green/50 outline-none resize-none"
                    placeholder="Enter mission description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-cyber text-cyan-300 mb-2">
                      BASE POINTS
                    </label>
                    <input
                      type="number"
                      value={formData.basePoints}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          basePoints: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                      className="w-full px-4 py-2 bg-dark-900 border border-neon-green/30 text-cyan-100 font-mono focus:border-neon-green focus:ring-2 focus:ring-neon-green/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-cyber text-cyan-300 mb-2">
                      THREAT LEVEL
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          difficulty: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-2 bg-dark-900 border border-neon-green/30 text-cyan-100 font-mono focus:border-neon-green focus:ring-2 focus:ring-neon-green/50 outline-none"
                    >
                      <option value="easy">RECON</option>
                      <option value="medium">TACTICAL</option>
                      <option value="hard">CRITICAL</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-cyber text-cyan-300 mb-2">
                      INTEL TYPE
                    </label>
                    <select
                      value={formData.hintType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hintType: e.target.value as HintType,
                        })
                      }
                      className="w-full px-4 py-2 bg-dark-900 border border-neon-green/30 text-cyan-100 font-mono focus:border-neon-green focus:ring-2 focus:ring-neon-green/50 outline-none"
                    >
                      <option value="points">POINTS-BASED</option>
                      <option value="time">TIME-BASED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-cyber text-cyan-300 mb-2">
                      INTEL AVAILABLE
                    </label>
                    <input
                      type="number"
                      value={formData.hintsAvailable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hintsAvailable: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                      className="w-full px-4 py-2 bg-dark-900 border border-neon-green/30 text-cyan-100 font-mono focus:border-neon-green focus:ring-2 focus:ring-neon-green/50 outline-none"
                    />
                  </div>
                </div>

                {formData.hintType === 'points' && (
                  <div>
                    <label className="block text-sm font-cyber text-cyan-300 mb-2">
                      POINT PENALTY PER INTEL
                    </label>
                    <input
                      type="number"
                      value={formData.pointDeduction}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointDeduction: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 bg-dark-900 border border-neon-green/30 text-cyan-100 font-mono focus:border-neon-green focus:ring-2 focus:ring-neon-green/50 outline-none"
                    />
                  </div>
                )}

                {formData.hintType === 'time' && (
                  <div>
                    <label className="block text-sm font-cyber text-cyan-300 mb-2">
                      TIME PENALTY PER INTEL (MINUTES)
                    </label>
                    <input
                      type="number"
                      value={formData.timePenalty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          timePenalty: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 bg-dark-900 border border-neon-green/30 text-cyan-100 font-mono focus:border-neon-green focus:ring-2 focus:ring-neon-green/50 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-cyber text-cyan-300 mb-2">
                    FLAG FORMAT (OPTIONAL - REGEX)
                  </label>
                  <input
                    type="text"
                    value={formData.flagFormat}
                    onChange={(e) =>
                      setFormData({ ...formData, flagFormat: e.target.value })
                    }
                    placeholder="e.g., ^FLAG\{.*\}$"
                    className="w-full px-4 py-2 bg-dark-900 border border-neon-green/30 text-cyan-100 font-mono focus:border-neon-green focus:ring-2 focus:ring-neon-green/50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="py-3 bg-dark-800 border border-dark-600 text-cyan-400 font-cyber hover:bg-dark-700 transition-all"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3 bg-gradient-to-r from-neon-green to-neon-blue text-dark-900 font-cyber font-bold hover:shadow-lg hover:shadow-neon-green/50 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'SAVING...' : editingLevel ? 'UPDATE' : 'CREATE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Levels List */}
      <div className="space-y-3">
        {levels.map((level) => {
          const badge = getDifficultyBadge(level.difficulty);
          return (
            <div
              key={level.id}
              className={`p-4 bg-dark-800/30 border transition-all ${
                level.isActive ? 'border-neon-green/30 hover:border-neon-green/50' : 'border-dark-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 border-2 border-neon-green text-neon-green font-cyber font-bold">
                      {level.number}
                    </div>
                    <span className={`px-3 py-1 text-xs font-cyber font-bold border ${badge.border} ${badge.bg} ${badge.color}`}>
                      {badge.text}
                    </span>
                    <span className="px-3 py-1 text-xs font-cyber font-bold bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/50">
                      {level.basePoints} PTS
                    </span>
                    {!level.isActive && (
                      <span className="px-3 py-1 text-xs font-cyber font-bold bg-red-500/20 text-red-400 border border-red-500/50">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-cyber font-bold text-cyan-100 mb-2">
                    {level.title}
                  </h3>
                  <p className="text-sm text-cyan-400 font-mono mb-3">{level.description}</p>
                  <div className="flex items-center space-x-4 text-xs font-mono text-cyan-600">
                    <span>INTEL: {level.hintsAvailable} ({level.hintType})</span>
                    {level.hintType === 'points' && (
                      <span>DEDUCTION: -{level.pointDeduction} pts/hint</span>
                    )}
                    {level.hintType === 'time' && (
                      <span>PENALTY: +{level.timePenalty} min/hint</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(level.id, level.isActive)}
                    className={`px-3 py-1 text-sm font-cyber border transition-all ${
                      level.isActive
                        ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                        : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                    }`}
                  >
                    {level.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                  </button>
                  <button
                    onClick={() => handleEdit(level)}
                    className="p-2 text-neon-blue hover:bg-neon-blue/10 border border-transparent hover:border-neon-blue/30 transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(level.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {levels.length === 0 && (
          <div className="text-center py-12 bg-dark-800/20 border border-dashed border-cyan-900/30">
            <Target className="h-12 w-12 text-cyan-900 mx-auto mb-3" />
            <p className="text-cyan-600 font-mono">NO MISSIONS CREATED YET</p>
            <p className="text-cyan-800 text-sm mt-1">Click "ADD MISSION" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
