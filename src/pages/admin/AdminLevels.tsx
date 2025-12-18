import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { setFlag, createLevel, updateLevel, deleteLevel } from '../../api/adminApi';
import { Target, Edit2, Trash2, Plus, CheckCircle, XCircle, Clock, Users, Activity, Lightbulb, Trophy, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { CyberCard } from '@/components/ui/CyberCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NeonButton } from '@/components/ui/NeonButton';
import { Hint } from '@/types';

interface Level {
  id: string; // Level ID
  groupId: string; // CRITICAL: Each mission belongs to a specific group
  number: number; // CRITICAL: Sequential level order per group
  title: string;
  description: string;
  basePoints: number;
  hintType: 'points' | 'time';
  pointDeduction?: number;
  timePenalty?: number;
  hintsAvailable: number;
  hints?: Hint[];
  isActive: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category?: string;
  challengeUrl?: string;
  timeLimit?: number; // in minutes
  solves?: number;
  attempts?: number;
  flagFormat?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  qrCodeId?: string; // QR code ID for physical check-in
  locationClue?: string; // Next location clue after completing this level
}

interface Group {
  id: string;
  name: string;
}

const AdminLevels = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  const [newLevel, setNewLevel] = useState<Partial<Level>>({
    groupId: '',
    number: 1,
    title: '',
    description: '',
    basePoints: 500,
    hintType: 'points',
    pointDeduction: 50,
    timePenalty: 0,
    hintsAvailable: 3,
    hints: [],
    isActive: true,
    difficulty: 'medium',
    category: 'Web',
    challengeUrl: '',
    timeLimit: 30,
    flagFormat: 'CSBC{...}',
    qrCodeId: '',
    locationClue: '',
    solves: 0,
    attempts: 0,
  });
  const [hints, setHints] = useState<Hint[]>([]);
  const [correctFlag, setCorrectFlag] = useState<string>(''); // Flag input (will be sent to backend for hashing)

  useEffect(() => {
    // Load groups
    const unsubGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.id,
      })) as Group[];
      setGroups(groupsData);
    });

    const unsubscribe = onSnapshot(collection(db, 'levels'), async (snapshot) => {
      const levelsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const levelData = { id: doc.id, ...doc.data() } as Level;
          
          // Get solve/attempt stats
          const submissionsQuery = query(
            collection(db, 'submissions'),
            where('levelId', '==', doc.id)
          );
          const submissionsSnap = await getDocs(submissionsQuery);
          const submissions = submissionsSnap.docs.map(d => d.data());
          
          const correctSubmissions = submissions.filter(s => s.status === 'correct');
          const totalAttempts = submissions.length;
          
          return {
            ...levelData,
            solves: correctSubmissions.length,
            attempts: totalAttempts,
          };
        })
      );
      const sortedLevels = levelsData.sort((a, b) => {
        // Sort by groupId first, then by level number
        if (a.groupId && b.groupId && a.groupId !== b.groupId) {
          return a.groupId.localeCompare(b.groupId);
        }
        if (a.number && b.number) {
          return a.number - b.number;
        }
        return a.title.localeCompare(b.title);
      });
      setLevels(sortedLevels);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubGroups();
    };
  }, []);

  // Initialize hints when modal opens
  useEffect(() => {
    if (showCreateModal) {
      const hintsCount = newLevel.hintsAvailable || 3;
      setHints(Array.from({ length: hintsCount }, (_, i) => ({ number: i + 1, content: '' })));
      setCorrectFlag(''); // Reset flag when opening create modal
    } else if (showEditModal && selectedLevel) {
      const hintsCount = selectedLevel.hintsAvailable || 3;
      const existingHints = selectedLevel.hints || [];
      const newHints: Hint[] = [];
      for (let i = 1; i <= hintsCount; i++) {
        newHints.push(
          existingHints.find(h => h.number === i) || { number: i, content: '' }
        );
      }
      setHints(newHints);
      setCorrectFlag(''); // Reset flag when opening edit modal (don't show existing flag for security)
    }
  }, [showCreateModal, showEditModal, selectedLevel?.id]);

  // Handle hints available change - adjust hints array dynamically
  useEffect(() => {
    if (!showCreateModal && !showEditModal) return;
    
    const hintsCount = showCreateModal ? (newLevel.hintsAvailable || 0) : (selectedLevel?.hintsAvailable || 0);
    
    if (hintsCount <= 0) {
      setHints([]);
      return;
    }

    // Adjust hints array to match hintsAvailable
    setHints(prevHints => {
      const newHints: Hint[] = [];
      for (let i = 1; i <= hintsCount; i++) {
        const existingHint = prevHints.find(h => h.number === i);
        newHints.push(existingHint || { number: i, content: '' });
      }
      return newHints;
    });
  }, [newLevel.hintsAvailable, selectedLevel?.hintsAvailable, showCreateModal, showEditModal]);

  const handleCreateLevel = async () => {
    if (!newLevel.groupId?.trim()) {
      toast.error('Group selection is required');
      return;
    }

    if (!newLevel.number || newLevel.number < 1) {
      toast.error('Level number is required and must be at least 1');
      return;
    }

    if (!newLevel.qrCodeId?.trim()) {
      toast.error('QR Code ID is required for physical check-in');
      return;
    }

    if (!correctFlag.trim()) {
      toast.error('Correct flag is required');
      return;
    }

    // Validate flag format - must start with CSBC{ and end with }
    const flagValue = correctFlag.trim();
    if (!flagValue.startsWith('CSBC{') || !flagValue.endsWith('}')) {
      toast.error('Invalid flag format. Expected: CSBC{...}');
      return;
    }
    // Check that there's content between the braces
    const flagContent = flagValue.slice(5, -1);
    if (flagContent.length === 0) {
      toast.error('Flag cannot be empty. Expected: CSBC{your_flag}');
      return;
    }

    // Get group name for auto-generated title
    const groupName = groups.find(g => g.id === newLevel.groupId)?.name || 'Unknown';

    try {
      // Create level via backend API
      const response = await createLevel({
        ...newLevel,
        title: `${groupName} - Level ${newLevel.number}`, // Auto-generate title
        hints: hints.filter(h => h.content.trim() !== ''),
        solves: 0,
        attempts: 0,
        isActive: true,
      });

      if (!response.success) {
        toast.error(response.error || 'Failed to create level');
        return;
      }

      // Send flag to backend for secure hashing and storage
      try {
        await setFlag(response.levelId, correctFlag.trim());
        toast.success('Level created and flag stored securely');
      } catch (flagError: any) {
        console.error('Error setting flag:', flagError);
        toast.error('Level created but flag storage failed. Please set flag manually.');
      }

      setShowCreateModal(false);
      setNewLevel({
        groupId: '',
        number: 1,
        title: '',
        description: '',
        basePoints: 500,
        hintType: 'points',
        pointDeduction: 50,
        timePenalty: 0,
        hintsAvailable: 3,
        hints: [],
        isActive: true,
        qrCodeId: '',
        locationClue: '',
        timeLimit: 30,
        solves: 0,
        attempts: 0,
      });
      setHints([]);
      setCorrectFlag('');
    } catch (error) {
      console.error('Error creating level:', error);
      toast.error('Failed to create level');
    }
  };

  const handleUpdateLevel = async () => {
    if (!selectedLevel) return;

    try {
      // Update level via backend API
      await updateLevel(selectedLevel.id, {
        title: selectedLevel.title,
        description: selectedLevel.description,
        basePoints: selectedLevel.basePoints,
        hintType: selectedLevel.hintType,
        pointDeduction: selectedLevel.pointDeduction,
        timePenalty: selectedLevel.timePenalty,
        hintsAvailable: selectedLevel.hintsAvailable,
        hints: hints.filter(h => h.content.trim() !== ''),
        isActive: selectedLevel.isActive,
        category: selectedLevel.category,
        challengeUrl: selectedLevel.challengeUrl,
        timeLimit: selectedLevel.timeLimit,
        flagFormat: selectedLevel.flagFormat,
        fileUrl: selectedLevel.fileUrl,
        fileName: selectedLevel.fileName,
        fileSize: selectedLevel.fileSize,
        groupId: selectedLevel.groupId,
        number: selectedLevel.number,
        qrCodeId: selectedLevel.qrCodeId,
        locationClue: selectedLevel.locationClue,
      });

      // Update flag if provided
      if (correctFlag.trim()) {
        const flagValue = correctFlag.trim();
        if (!flagValue.startsWith('CSBC{') || !flagValue.endsWith('}')) {
          toast.error('Invalid flag format. Expected: CSBC{...}');
          return;
        }
        const flagContent = flagValue.slice(5, -1);
        if (flagContent.length === 0) {
          toast.error('Flag cannot be empty. Expected: CSBC{your_flag}');
          return;
        }

        try {
          await setFlag(selectedLevel.id, correctFlag.trim());
          toast.success('Level and flag updated successfully');
        } catch (flagError: any) {
          console.error('Error updating flag:', flagError);
          toast.error('Level updated but flag update failed');
        }
      } else {
        toast.success('Level updated successfully');
      }

      setShowEditModal(false);
      setSelectedLevel(null);
      setHints([]);
      setCorrectFlag('');
    } catch (error) {
      console.error('Error updating level:', error);
      toast.error('Failed to update level');
    }
  };

  const handleToggleActive = async (level: Level) => {
    try {
      await updateLevel(level.id, {
        isActive: !level.isActive,
      });

      toast.success(
        `Level ${!level.isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error toggling level:', error);
      toast.error('Failed to toggle level status');
    }
  };

  const handleDeleteLevel = async (levelId: string, levelTitle: string) => {
    if (!confirm(`Are you sure you want to delete level "${levelTitle}"? This action cannot be undone!`)) return;

    try {
      await deleteLevel(levelId);
      toast.success('Level deleted successfully');
    } catch (error) {
      console.error('Error deleting level:', error);
      toast.error('Failed to delete level');
    }
  };

  const filteredLevels = levels.filter((level) => {
    const matchesSearch =
      level.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      level.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      level.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && level.isActive) ||
      (filterActive === 'inactive' && !level.isActive);
    const matchesCategory =
      filterCategory === 'all' || level.category === filterCategory;
    return matchesSearch && matchesActive && matchesCategory;
  });

  const categories = Array.from(new Set(levels.map(l => l.category).filter(Boolean))) as string[];
  const difficultyColors = {
    easy: 'text-cyber-neon-green',
    medium: 'text-cyber-neon-yellow',
    hard: 'text-cyber-neon-red',
    expert: 'text-cyber-neon-red',
  };

  const categoryColors: Record<string, string> = {
    Web: 'bg-cyber-neon-blue/20 border-cyber-neon-blue/30 text-cyber-neon-blue',
    Crypto: 'bg-cyber-neon-purple/20 border-cyber-neon-purple/30 text-cyber-neon-purple',
    Forensics: 'bg-cyber-neon-green/20 border-cyber-neon-green/30 text-cyber-neon-green',
    Pwn: 'bg-cyber-neon-red/20 border-cyber-neon-red/30 text-cyber-neon-red',
    Reverse: 'bg-cyber-neon-yellow/20 border-cyber-neon-yellow/30 text-cyber-neon-yellow',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title="Mission Management"
        subtitle="Configure CTF challenges, scoring, and hint systems"
        status={{ label: 'ACTIVE', value: `${levels.filter(l => l.isActive).length}/${levels.length}`, color: 'green' }}
      />

      {/* Controls */}
      <CyberCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search missions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue placeholder:text-cyber-text-secondary"
            />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
            >
              <option value="all">All Levels</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          <NeonButton
            color="red"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Create Mission
          </NeonButton>
        </div>
      </CyberCard>

      {/* Levels Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-neon-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLevels.map((level) => (
            <CyberCard key={level.id} className={`${level.isActive ? 'border-cyber-neon-green/50' : 'border-cyber-border'}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`h-12 w-12 rounded-xl bg-cyber-neon-blue/20 flex items-center justify-center border border-cyber-neon-blue/30`}>
                    <Target className={`h-6 w-6 ${difficultyColors[level.difficulty]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-cyber-text-primary font-bold text-lg truncate">{level.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {level.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[level.category] || 'bg-cyber-bg-darker border-cyber-border text-cyber-text-secondary'}`}>
                          {level.category}
                        </span>
                      )}
                      <span className={`text-xs capitalize ${difficultyColors[level.difficulty]}`}>
                        {level.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                {level.isActive ? (
                  <CheckCircle className="h-6 w-6 text-cyber-neon-green flex-shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-cyber-text-secondary flex-shrink-0" />
                )}
              </div>

              {/* Description */}
              <p className="text-cyber-text-secondary text-sm mb-4 line-clamp-2">
                {level.description || 'No description'}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-cyber-bg-darker rounded-lg p-3 border border-cyber-border">
                  <div className="flex items-center gap-1 text-cyber-text-secondary text-xs mb-1">
                    <Trophy className="h-3 w-3" />
                    <span>Points</span>
                  </div>
                  <p className="text-cyber-text-primary font-bold">{level.basePoints}</p>
                </div>
                <div className="bg-cyber-bg-darker rounded-lg p-3 border border-cyber-border">
                  <div className="flex items-center gap-1 text-cyber-text-secondary text-xs mb-1">
                    <Clock className="h-3 w-3" />
                    <span>Time Limit</span>
                  </div>
                  <p className="text-cyber-text-primary font-bold">{level.timeLimit || '∞'} min</p>
                </div>
                <div className="bg-cyber-bg-darker rounded-lg p-3 border border-cyber-border">
                  <div className="flex items-center gap-1 text-cyber-text-secondary text-xs mb-1">
                    <Users className="h-3 w-3" />
                    <span>Solves</span>
                  </div>
                  <p className="text-cyber-text-primary font-bold">{level.solves || 0}</p>
                </div>
                <div className="bg-cyber-bg-darker rounded-lg p-3 border border-cyber-border">
                  <div className="flex items-center gap-1 text-cyber-text-secondary text-xs mb-1">
                    <Activity className="h-3 w-3" />
                    <span>Attempts</span>
                  </div>
                  <p className="text-cyber-text-primary font-bold">{level.attempts || 0}</p>
                </div>
              </div>

              {/* Challenge URL */}
              {level.challengeUrl && (
                <div className="mb-4 p-2 bg-cyber-bg-darker rounded-lg border border-cyber-border">
                  <div className="flex items-center gap-2 text-xs text-cyber-text-secondary">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{level.challengeUrl}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(level)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                    level.isActive
                      ? 'bg-cyber-neon-yellow/20 border border-cyber-neon-yellow/30 text-cyber-neon-yellow hover:bg-cyber-neon-yellow/30'
                      : 'bg-cyber-neon-green/20 border border-cyber-neon-green/30 text-cyber-neon-green hover:bg-cyber-neon-green/30'
                  }`}
                >
                  {level.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    setSelectedLevel(level);
                    setShowEditModal(true);
                  }}
                  className="p-2 bg-cyber-neon-blue/20 border border-cyber-neon-blue/30 text-cyber-neon-blue rounded-lg hover:bg-cyber-neon-blue/30 transition-all"
                  title="Edit Level"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteLevel(level.id, level.title)}
                  className="p-2 bg-cyber-neon-red/20 border border-cyber-neon-red/30 text-cyber-neon-red rounded-lg hover:bg-cyber-neon-red/30 transition-all"
                  title="Delete Level"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CyberCard>
          ))}
        </div>
      )}

      {/* Create/Edit Level Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <CyberCard className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-cyber font-bold text-cyber-text-primary">
                {showCreateModal ? 'Create New Mission' : 'Edit Mission'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedLevel(null);
                }}
                className="text-cyber-text-secondary hover:text-cyber-text-primary"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Group Selection - CRITICAL for group-scoped missions */}
                <div>
                  <label className="block text-cyber-text-secondary mb-2">Group * (Mission belongs to)</label>
                  <select
                    value={showCreateModal ? newLevel.groupId : selectedLevel?.groupId}
                    onChange={(e) =>
                      showCreateModal
                        ? setNewLevel({ ...newLevel, groupId: e.target.value })
                        : setSelectedLevel({ ...selectedLevel!, groupId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                    required
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>

                {/* Level Number - CRITICAL for sequential progression */}
                <div>
                  <label className="block text-cyber-text-secondary mb-2">Level Number * (Sequential order)</label>
                  <input
                    type="number"
                    min="1"
                    value={showCreateModal ? newLevel.number : selectedLevel?.number}
                    onChange={(e) =>
                      showCreateModal
                        ? setNewLevel({ ...newLevel, number: parseInt(e.target.value) || 1 })
                        : setSelectedLevel({ ...selectedLevel!, number: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                    placeholder="1"
                    required
                  />
                </div>

                {/* QR Code ID - CRITICAL for physical check-in */}
                <div className="md:col-span-2">
                  <label className="block text-cyber-text-secondary mb-2">QR Code ID * (Physical location proof)</label>
                  <input
                    type="text"
                    value={showCreateModal ? newLevel.qrCodeId : selectedLevel?.qrCodeId}
                    onChange={(e) =>
                      showCreateModal
                        ? setNewLevel({ ...newLevel, qrCodeId: e.target.value })
                        : setSelectedLevel({ ...selectedLevel!, qrCodeId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue placeholder:text-cyber-text-secondary font-mono"
                    placeholder="e.g., QR_G1_L1, QR_G1_L2"
                    required
                  />
                  <p className="text-cyber-text-secondary text-xs mt-1">Each QR code must be unique. This ID will be scanned at the physical location.</p>
                </div>

                {/* Location Clue - Revealed after completing this level */}
                <div className="md:col-span-2">
                  <label className="block text-cyber-text-secondary mb-2">Next Location Clue (Revealed after solving)</label>
                  <textarea
                    value={showCreateModal ? newLevel.locationClue : selectedLevel?.locationClue}
                    onChange={(e) =>
                      showCreateModal
                        ? setNewLevel({ ...newLevel, locationClue: e.target.value })
                        : setSelectedLevel({ ...selectedLevel!, locationClue: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue h-20 placeholder:text-cyber-text-secondary"
                    placeholder="Clue/riddle for the next physical location"
                  />
                  <p className="text-cyber-text-secondary text-xs mt-1">This clue guides teams to the next level's physical location after they complete this one.</p>
                </div>

                <div>
                  <label className="block text-cyber-text-secondary mb-2">Base Points</label>
                  <input
                    type="number"
                    value={showCreateModal ? newLevel.basePoints : selectedLevel?.basePoints}
                    onChange={(e) =>
                      showCreateModal
                        ? setNewLevel({ ...newLevel, basePoints: parseInt(e.target.value) })
                        : setSelectedLevel({
                            ...selectedLevel!,
                            basePoints: parseInt(e.target.value),
                          })
                    }
                    className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                  />
                </div>

                <div>
                  <label className="block text-cyber-text-secondary mb-2">Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={showCreateModal ? newLevel.timeLimit : selectedLevel?.timeLimit}
                    onChange={(e) =>
                      showCreateModal
                        ? setNewLevel({ ...newLevel, timeLimit: parseInt(e.target.value) || undefined })
                        : setSelectedLevel({
                            ...selectedLevel!,
                            timeLimit: parseInt(e.target.value) || undefined,
                          })
                    }
                    className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                    placeholder="Optional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-cyber-text-secondary mb-2">
                    Correct Flag <span className="text-cyber-neon-red">*</span>
                    <span className="text-xs text-cyber-text-tertiary ml-2">(Will be hashed and stored securely)</span>
                  </label>
                  <input
                    type="text"
                    value={correctFlag}
                    onChange={(e) => setCorrectFlag(e.target.value)}
                    className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-neon-red/50 rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-red placeholder:text-cyber-text-secondary font-mono"
                    placeholder="CSBC{your_flag_here}"
                    required
                  />
                  <p className="text-xs text-cyber-text-tertiary mt-1">
                    ⚠️ Flag will be sent to backend for secure hashing. Never stored in plaintext.
                  </p>
                </div>

                {/* Hint System */}
                <div>
                  <label className="block text-cyber-text-secondary mb-2">Hints Available</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={showCreateModal ? newLevel.hintsAvailable : selectedLevel?.hintsAvailable}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      if (showCreateModal) {
                        setNewLevel({ ...newLevel, hintsAvailable: count });
                      } else {
                        setSelectedLevel({
                          ...selectedLevel!,
                          hintsAvailable: count,
                        });
                      }
                    }}
                    className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                  />
                </div>

                <div>
                  <label className="block text-cyber-text-secondary mb-2">Hint Type</label>
                  <select
                    value={showCreateModal ? newLevel.hintType : selectedLevel?.hintType}
                    onChange={(e) =>
                      showCreateModal
                        ? setNewLevel({ ...newLevel, hintType: e.target.value as 'points' | 'time' })
                        : setSelectedLevel({
                            ...selectedLevel!,
                            hintType: e.target.value as 'points' | 'time',
                          })
                    }
                    className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                  >
                    <option value="points">Points Deduction</option>
                    <option value="time">Time Penalty</option>
                  </select>
                </div>

                {(showCreateModal ? newLevel.hintType : selectedLevel?.hintType) === 'points' && (
                  <div>
                    <label className="block text-cyber-text-secondary mb-2">Point Deduction per Hint</label>
                    <input
                      type="number"
                      value={showCreateModal ? newLevel.pointDeduction : selectedLevel?.pointDeduction}
                      onChange={(e) =>
                        showCreateModal
                          ? setNewLevel({ ...newLevel, pointDeduction: parseInt(e.target.value) })
                          : setSelectedLevel({
                              ...selectedLevel!,
                              pointDeduction: parseInt(e.target.value),
                            })
                      }
                      className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                    />
                  </div>
                )}

                {(showCreateModal ? newLevel.hintType : selectedLevel?.hintType) === 'time' && (
                  <div>
                    <label className="block text-cyber-text-secondary mb-2">Time Penalty per Hint (min)</label>
                    <input
                      type="number"
                      value={showCreateModal ? newLevel.timePenalty : selectedLevel?.timePenalty}
                      onChange={(e) =>
                        showCreateModal
                          ? setNewLevel({ ...newLevel, timePenalty: parseInt(e.target.value) })
                          : setSelectedLevel({
                              ...selectedLevel!,
                              timePenalty: parseInt(e.target.value),
                            })
                      }
                      className="w-full px-4 py-2 bg-cyber-bg-darker border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Hints Section */}
              {((showCreateModal ? newLevel.hintsAvailable : selectedLevel?.hintsAvailable) || 0) > 0 && (
                <div className="mt-6">
                  <SectionTitle icon={Lightbulb} title="Hints" subtitle={`Enter hint content for each hint (${hints.length} hints)`} />
                  <div className="space-y-3">
                    {hints.map((hint, index) => (
                      <div key={hint.number} className="bg-cyber-bg-darker border border-cyber-border rounded-lg p-4">
                        <label className="block text-cyber-text-secondary mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-cyber-neon-yellow" />
                          <span>Hint #{hint.number}</span>
                        </label>
                        <textarea
                          value={hint.content}
                          onChange={(e) => {
                            const newHints = [...hints];
                            newHints[index] = { ...hint, content: e.target.value };
                            setHints(newHints);
                          }}
                          className="w-full px-4 py-2 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue placeholder:text-cyber-text-secondary h-20"
                          placeholder={`Enter hint #${hint.number} content...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="flex gap-3 mt-6">
              <NeonButton
                color="red"
                onClick={showCreateModal ? handleCreateLevel : handleUpdateLevel}
                className="flex-1"
              >
                {showCreateModal ? 'Create Mission' : 'Update Mission'}
              </NeonButton>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedLevel(null);
                }}
                className="flex-1 px-4 py-2 bg-cyber-bg-darker border border-cyber-border text-cyber-text-primary rounded-lg hover:bg-cyber-bg-card transition-all"
              >
                Cancel
              </button>
            </div>
          </CyberCard>
        </div>
      )}
    </div>
  );
};

export default AdminLevels;
