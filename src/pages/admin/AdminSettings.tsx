import { useState, useEffect } from 'react';
import { resetCompetition, checkBackendHealth } from '../../api/adminApi';
import { AlertTriangle, RefreshCw, Database, Activity, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      setBackendStatus('checking');
      await checkBackendHealth();
      setBackendStatus('online');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const handleResetCompetition = async () => {
    if (confirmationCode !== 'RESET_COMPETITION_NOW') {
      toast.error('Invalid confirmation code');
      return;
    }

    if (!confirm('⚠️ This will DELETE ALL data! Are you absolutely sure?')) {
      return;
    }

    setResetting(true);

    try {
      const result = await resetCompetition(confirmationCode);

      if (result.success) {
        toast.success('Competition reset successfully');
        setShowResetModal(false);
        setConfirmationCode('');
      }
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset competition');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 font-display mb-2">
          SYSTEM SETTINGS
        </h1>
        <p className="text-gray-400">Event management and system controls</p>
      </div>

      {/* Backend Status */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center">
              <Activity className="h-6 w-6 mr-2 text-red-500" />
              Backend Status
            </h2>
            <p className="text-gray-400 text-sm">Secure backend connection status</p>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`h-4 w-4 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-green-500 animate-pulse'
                  : backendStatus === 'offline'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-white font-semibold capitalize">{backendStatus}</span>
            <button
              onClick={checkBackend}
              className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {backendStatus === 'offline' && (
          <div className="mt-4 p-4 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-400 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Backend is offline. Flag validation and scoring will not work!
            </p>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Database className="h-6 w-6 mr-2 text-blue-500" />
          System Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Platform Version</p>
            <p className="text-white font-bold">Mission Exploit 2.0</p>
          </div>

          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Backend API</p>
            <p className="text-white font-bold text-sm">
              {import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}
            </p>
          </div>

          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Firebase Project</p>
            <p className="text-white font-bold text-sm">
              {import.meta.env.VITE_FIREBASE_PROJECT_ID}
            </p>
          </div>

          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Environment</p>
            <p className="text-white font-bold">{import.meta.env.MODE}</p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Shield className="h-6 w-6 mr-2 text-green-500" />
          Security Configuration
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
            <div>
              <p className="text-white font-semibold">Secure Flag Validation</p>
              <p className="text-gray-400 text-sm">Flags validated on backend only</p>
            </div>
            <div className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm">
              Enabled
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
            <div>
              <p className="text-white font-semibold">Rate Limiting</p>
              <p className="text-gray-400 text-sm">5 submissions per minute per team</p>
            </div>
            <div className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm">
              Enabled
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
            <div>
              <p className="text-white font-semibold">Admin Authentication</p>
              <p className="text-gray-400 text-sm">X-Admin-Key header required</p>
            </div>
            <div className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm">
              Active
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-slate-800 border-2 border-red-500 rounded-xl p-6">
        <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Danger Zone
        </h2>

        <div className="bg-red-900 bg-opacity-20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm mb-2">
            ⚠️ The following actions are <strong>IRREVERSIBLE</strong>
          </p>
          <p className="text-gray-400 text-sm">
            These operations will permanently delete data and cannot be undone.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-red-500">
            <div>
              <p className="text-white font-semibold">Reset Competition</p>
              <p className="text-gray-400 text-sm">Delete all submissions, hints, and reset scores</p>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              Reset Event
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border-2 border-red-500 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-400">Reset Competition</h2>
                <p className="text-gray-400 text-sm">This action cannot be undone!</p>
              </div>
            </div>

            <div className="bg-red-900 bg-opacity-20 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm mb-2">This will permanently delete:</p>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>All submissions</li>
                <li>All hint usage</li>
                <li>All team scores (reset to 0)</li>
                <li>Entire leaderboard</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 mb-2">
                Type <code className="text-red-400 bg-slate-900 px-2 py-1 rounded">
                  RESET_COMPETITION_NOW
                </code> to confirm
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full bg-slate-900 border border-red-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter confirmation code"
                disabled={resetting}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleResetCompetition}
                disabled={resetting || confirmationCode !== 'RESET_COMPETITION_NOW'}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetting ? 'Resetting...' : 'Reset Competition'}
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmationCode('');
                }}
                disabled={resetting}
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

export default AdminSettings;

