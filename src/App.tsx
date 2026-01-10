import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreListeners } from '@/hooks/useFirestoreListener';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import AdminLayout from '@/components/admin/AdminLayout';

// Pages
import { Login } from '@/pages/Login';
import { LandingPage } from '@/pages/LandingPage';
import { Home } from '@/pages/Home';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminTeams from '@/pages/admin/AdminTeams';
import AdminGroups from '@/pages/admin/AdminGroups';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminLevels from '@/pages/admin/AdminLevels';
import AdminSubmissions from '@/pages/admin/AdminSubmissions';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminAnnouncements from '@/pages/admin/AdminAnnouncements';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminEventControl from '@/pages/admin/AdminEventControl';
import AdminManualSubmissions from '@/pages/admin/AdminManualSubmissions';
import { Dashboard as CaptainDashboard } from '@/captain/pages/Dashboard';
import { TeamsPerformance } from '@/captain/pages/TeamsPerformance';
import { TeamDetailPage } from '@/captain/pages/TeamDetail';
import { GroupLeaderboard } from '@/captain/pages/GroupLeaderboard';
import { SubmissionLogs } from '@/captain/pages/SubmissionLogs';
import { FlagReviews } from '@/captain/pages/FlagReviews';
import { Dashboard as ParticipantDashboard } from '@/participant/pages/Dashboard';
import { CheckIn } from '@/participant/pages/CheckIn';
import { ActiveMission } from '@/participant/pages/ActiveMission';
import { Movement } from '@/participant/pages/Movement';
import { TeamManagement } from '@/participant/pages/TeamManagement';
import { Announcements } from '@/captain/pages/Announcements';
import { ImpersonatePage } from '@/pages/ImpersonatePage';

function App() {
  const { loading } = useAuth();
  
  // Initialize real-time listeners
  useFirestoreListeners();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 grid-bg">
        <div className="text-center terminal-window p-12">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-neon-blue/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-neon-blue font-cyber font-bold text-xl">INITIALIZING SYSTEM...</p>
          <p className="text-cyan-400 font-mono text-sm mt-2">// Loading Mission Exploit 2.0</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <OfflineIndicator />
        <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000, // FIXED: Increased default duration
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000, // Success messages: 3s
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000, // FIXED: Error messages: 5s (longer for important errors)
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity, // Loading toasts stay until dismissed
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/impersonate" element={<ImpersonatePage />} />
        
        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Participant Portal Routes */}
        <Route
          path="/participant/dashboard"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <ParticipantDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/participant/check-in"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <CheckIn />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/participant/mission"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <ActiveMission />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/participant/movement"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <Movement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participant/team"
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <TeamManagement />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/event"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminEventControl />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/teams"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminTeams />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/groups"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminGroups />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/levels"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminLevels />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/submissions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminSubmissions />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminAnalytics />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminAnnouncements />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/leaderboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <LeaderboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/manual-submissions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminManualSubmissions />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/captain/dashboard"
          element={
            <ProtectedRoute allowedRoles={['captain']}>
              <CaptainDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/captain/teams"
          element={
            <ProtectedRoute allowedRoles={['captain']}>
              <TeamsPerformance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/captain/team/:teamId"
          element={
            <ProtectedRoute allowedRoles={['captain']}>
              <TeamDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/captain/leaderboard"
          element={
            <ProtectedRoute allowedRoles={['captain']}>
              <GroupLeaderboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/captain/logs"
          element={
            <ProtectedRoute allowedRoles={['captain']}>
              <SubmissionLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/captain/announcements"
          element={
            <ProtectedRoute allowedRoles={['captain']}>
              <Announcements />
            </ProtectedRoute>
          }
        />

        <Route
          path="/captain/flag-reviews"
          element={
            <ProtectedRoute allowedRoles={['captain']}>
              <FlagReviews />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
    </ErrorBoundary>
  );
}

export default App;

