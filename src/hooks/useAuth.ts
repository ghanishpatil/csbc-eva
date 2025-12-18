import { useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { firestoreAPI } from '@/utils/firestore';

export const useAuth = () => {
  const { user, loading, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('Auth state changed - fetching user data for:', firebaseUser.uid);
          const userData = await firestoreAPI.getUser(firebaseUser.uid);
          if (userData) {
            console.log('User data loaded:', userData);
            setUser(userData);
          } else {
            console.error('User document not found in Firestore');
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        console.log('No user logged in');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      logout();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signOut,
    isAdmin: user?.role === 'admin',
    isCaptain: user?.role === 'captain',
    isPlayer: user?.role === 'player',
  };
};

