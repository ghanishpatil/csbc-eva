import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Megaphone, Plus, Trash2, AlertCircle, Info, CheckCircle, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  createdBy: string;
  isActive: boolean;
}

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const announcementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Announcement[];
      setAnnouncements(announcementsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    try {
      const { createAnnouncement } = await import('../../api/adminApi');
      await createAnnouncement({
        ...newAnnouncement,
        createdAt: Date.now(),
      });

      toast.success('Announcement created successfully');
      setShowCreateModal(false);
      setNewAnnouncement({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;

    try {
      const { deleteAnnouncement } = await import('../../api/adminApi');
      await deleteAnnouncement(id);
      toast.success('Announcement deleted');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const { updateAnnouncement } = await import('../../api/adminApi');
      await updateAnnouncement(announcement.id, {
        isActive: !announcement.isActive,
      });
      toast.success(announcement.isActive ? 'Announcement hidden' : 'Announcement shown');
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'danger':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'info':
        return 'from-blue-500 to-blue-600 border-blue-500';
      case 'warning':
        return 'from-yellow-500 to-yellow-600 border-yellow-500';
      case 'success':
        return 'from-green-500 to-green-600 border-green-500';
      case 'danger':
        return 'from-red-500 to-red-600 border-red-500';
      default:
        return 'from-gray-500 to-gray-600 border-gray-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900 text-red-300 border-red-500';
      case 'medium':
        return 'bg-yellow-900 text-yellow-300 border-yellow-500';
      case 'low':
        return 'bg-green-900 text-green-300 border-green-500';
      default:
        return 'bg-gray-900 text-gray-300 border-gray-500';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 font-display mb-2">
          ANNOUNCEMENTS
        </h1>
        <p className="text-gray-400">Broadcast messages to all participants</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">
              {announcements.length} Total • {announcements.filter((a) => a.isActive).length} Active
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Create Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Megaphone className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-4">No announcements yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
          >
            Create First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-slate-800 border-l-4 ${
                announcement.isActive ? 'border-green-500' : 'border-gray-600'
              } rounded-xl p-6 hover:bg-slate-750 transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${getTypeStyles(announcement.type)}`}>
                    {getTypeIcon(announcement.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityBadge(
                          announcement.priority
                        )}`}
                      >
                        {announcement.priority.toUpperCase()} PRIORITY
                      </span>
                      {!announcement.isActive && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-900 text-gray-300 border-gray-500">
                          HIDDEN
                        </span>
                      )}
                    </div>

                    <p className="text-gray-300 mb-3">{announcement.message}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Created: {new Date(announcement.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>By: {announcement.createdBy}</span>
                      <span>•</span>
                      <span className="capitalize">{announcement.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(announcement)}
                    className={`px-4 py-2 ${
                      announcement.isActive
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-lg transition-all text-sm`}
                  >
                    {announcement.isActive ? 'Hide' : 'Show'}
                  </button>

                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create Announcement</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Important Update"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Message *</label>
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-32"
                  placeholder="Enter your announcement message..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Type</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Yellow)</option>
                    <option value="success">Success (Green)</option>
                    <option value="danger">Danger (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  💡 This announcement will be visible to all participants on the platform.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreate}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
              >
                Create Announcement
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewAnnouncement({
                    title: '',
                    message: '',
                    type: 'info',
                    priority: 'medium',
                  });
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

export default AdminAnnouncements;

