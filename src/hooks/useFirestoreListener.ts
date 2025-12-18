import { useEffect } from 'react';
import { firestoreListeners } from '@/utils/firestore';
import { useAppStore } from '@/store/appStore';

export const useFirestoreListeners = () => {
  const { 
    setLeaderboard, 
    setTeams, 
    setLevels, 
    setEventConfig, 
    setGroups,
    setSubmissions,
    setAnnouncements,
  } = useAppStore();

  useEffect(() => {
    // Subscribe to leaderboard
    const unsubscribeLeaderboard = firestoreListeners.subscribeToLeaderboard(
      (leaderboard) => {
        // Add rank to each entry
        const rankedLeaderboard = leaderboard.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
        setLeaderboard(rankedLeaderboard);
      }
    );

    // Subscribe to teams
    const unsubscribeTeams = firestoreListeners.subscribeToTeams(setTeams);

    // Subscribe to levels
    const unsubscribeLevels = firestoreListeners.subscribeToLevels(setLevels);

    // Subscribe to event config
    const unsubscribeConfig = firestoreListeners.subscribeToEventConfig(setEventConfig);

    // Subscribe to groups
    const unsubscribeGroups = firestoreListeners.subscribeToGroups(setGroups);

    // Subscribe to submissions (recent 100)
    const unsubscribeSubmissions = firestoreListeners.subscribeToSubmissions(setSubmissions);

    // Subscribe to announcements
    const unsubscribeAnnouncements = firestoreListeners.subscribeToAnnouncements(setAnnouncements);

    // Cleanup
    return () => {
      unsubscribeLeaderboard();
      unsubscribeTeams();
      unsubscribeLevels();
      unsubscribeConfig();
      unsubscribeGroups();
      unsubscribeSubmissions();
      unsubscribeAnnouncements();
    };
  }, [setLeaderboard, setTeams, setLevels, setEventConfig, setGroups, setSubmissions, setAnnouncements]);
};

