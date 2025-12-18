import { useState } from 'react';
import { Settings, AlertTriangle, RefreshCw, Download, Upload, Trash2, Database, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const SystemControls: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState('');

  const handleResetSubmissions = async () => {
    if (confirmReset !== 'RESET') {
      toast.error('[ TYPE "RESET" TO CONFIRM ]');
      return;
    }

    setLoading(true);
    try {
      const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
      const hintsSnapshot = await getDocs(collection(db, 'hints'));

      // Delete all submissions
      for (const document of submissionsSnapshot.docs) {
        await deleteDoc(doc(db, 'submissions', document.id));
      }

      // Delete all hints
      for (const document of hintsSnapshot.docs) {
        await deleteDoc(doc(db, 'hints', document.id));
      }

      // Reset team scores
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      const { updateDoc } = await import('firebase/firestore');
      
      for (const teamDoc of teamsSnapshot.docs) {
        await updateDoc(doc(db, 'teams', teamDoc.id), {
          score: 0,
          levelsCompleted: 0,
          timePenalty: 0,
        });
      }

      // Clear leaderboard
      const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
      for (const document of leaderboardSnapshot.docs) {
        await deleteDoc(doc(db, 'leaderboard', document.id));
      }

      toast.success('[ COMPETITION RESET SUCCESSFUL ]');
      setConfirmReset('');
    } catch (error) {
      console.error('Error resetting:', error);
      toast.error('[ RESET FAILED ]');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const [teams, levels, submissions, leaderboard] = await Promise.all([
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'levels')),
        getDocs(collection(db, 'submissions')),
        getDocs(collection(db, 'leaderboard')),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        teams: teams.docs.map(d => d.data()),
        levels: levels.docs.map(d => d.data()),
        submissions: submissions.docs.map(d => d.data()),
        leaderboard: leaderboard.docs.map(d => d.data()),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mission-exploit-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('[ DATA EXPORTED SUCCESSFULLY ]');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('[ EXPORT FAILED ]');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-window p-6 border-2 border-red-500/50">
        <div className="flex items-center space-x-3 mb-2">
          <AlertTriangle className="h-6 w-6 text-red-500 animate-pulse" />
          <h2 className="text-2xl font-cyber font-bold text-red-500">DANGER ZONE</h2>
        </div>
        <p className="text-cyan-400 font-mono text-sm">
          Critical system operations. Use with caution.
        </p>
      </div>

      {/* System Operations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Data */}
        <div className="terminal-window p-6 border border-neon-blue/30">
          <div className="flex items-center space-x-2 mb-4">
            <Download className="h-5 w-5 text-neon-blue" />
            <h3 className="font-cyber text-neon-blue text-lg">EXPORT DATA</h3>
          </div>
          <p className="text-cyan-400 font-mono text-sm mb-4">
            Download a complete backup of all competition data including teams, missions, and submissions.
          </p>
          <button
            onClick={handleExportData}
            disabled={loading}
            className="w-full py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-cyber font-bold hover:bg-neon-blue/30 disabled:opacity-50 transition-all"
          >
            {loading ? 'EXPORTING...' : 'EXPORT DATABASE'}
          </button>
        </div>

        {/* Database Info */}
        <div className="terminal-window p-6 border border-neon-green/30">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-5 w-5 text-neon-green" />
            <h3 className="font-cyber text-neon-green text-lg">DATABASE INFO</h3>
          </div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between text-cyan-400">
              <span>Project ID:</span>
              <span className="text-cyan-100">csbc-eva</span>
            </div>
            <div className="flex justify-between text-cyan-400">
              <span>Region:</span>
              <span className="text-cyan-100">us-central</span>
            </div>
            <div className="flex justify-between text-cyan-400">
              <span>Status:</span>
              <span className="text-neon-green">OPERATIONAL</span>
            </div>
            <div className="flex justify-between text-cyan-400">
              <span>Encryption:</span>
              <span className="text-neon-green">256-BIT AES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Competition */}
      <div className="terminal-window p-6 border-2 border-red-500/50 bg-red-500/5">
        <div className="flex items-center space-x-2 mb-4">
          <Trash2 className="h-5 w-5 text-red-500" />
          <h3 className="font-cyber text-red-500 text-lg">RESET COMPETITION</h3>
        </div>
        <div className="bg-red-900/20 border border-red-500/30 p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-mono text-red-400">
              <p className="font-bold mb-2">WARNING: DESTRUCTIVE OPERATION</p>
              <ul className="space-y-1 text-xs">
                <li>• Deletes all submissions</li>
                <li>• Deletes all hint usage</li>
                <li>• Resets all team scores to 0</li>
                <li>• Clears the leaderboard</li>
                <li>• This action CANNOT be undone</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-cyber text-red-400 mb-2">
              TYPE "RESET" TO CONFIRM
            </label>
            <input
              type="text"
              value={confirmReset}
              onChange={(e) => setConfirmReset(e.target.value)}
              placeholder="Type RESET to confirm..."
              className="w-full px-4 py-2 bg-dark-900 border border-red-500/30 text-red-400 font-mono focus:border-red-500 focus:ring-2 focus:ring-red-500/50 outline-none placeholder-red-900"
            />
          </div>
          <button
            onClick={handleResetSubmissions}
            disabled={loading || confirmReset !== 'RESET'}
            className="w-full py-3 bg-red-500/20 border-2 border-red-500 text-red-500 font-cyber font-bold hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'RESETTING...' : 'RESET COMPETITION'}
          </button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="terminal-window p-6 border border-neon-purple/30">
        <div className="flex items-center space-x-2 mb-4">
          <Lock className="h-5 w-5 text-neon-purple" />
          <h3 className="font-cyber text-neon-purple text-lg">SECURITY SETTINGS</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-dark-800/50 border border-cyan-900/30">
            <div className="text-sm font-cyber text-cyan-300 mb-2">FIRESTORE RULES</div>
            <div className="text-xs text-cyan-500 font-mono mb-3">
              Security rules are deployed and active
            </div>
            <a
              href="https://console.firebase.google.com/project/csbc-eva/firestore/rules"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-neon-purple/20 border border-neon-purple/50 text-neon-purple text-xs font-cyber hover:bg-neon-purple/30 transition-all"
            >
              VIEW IN CONSOLE
            </a>
          </div>
          <div className="p-4 bg-dark-800/50 border border-cyan-900/30">
            <div className="text-sm font-cyber text-cyan-300 mb-2">AUTHENTICATION</div>
            <div className="text-xs text-cyan-500 font-mono mb-3">
              Email/Password auth enabled
            </div>
            <a
              href="https://console.firebase.google.com/project/csbc-eva/authentication/users"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-neon-purple/20 border border-neon-purple/50 text-neon-purple text-xs font-cyber hover:bg-neon-purple/30 transition-all"
            >
              VIEW IN CONSOLE
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

