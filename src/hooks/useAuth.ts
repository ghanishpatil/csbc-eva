import { useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { firestoreAPI } from '@/utils/firestore';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const { user, loading, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          if (import.meta.env.DEV) {
            console.log('Auth state changed - fetching user data for:', firebaseUser.uid);
          }
          const userData = await firestoreAPI.getUser(firebaseUser.uid);
          if (userData) {
            // SECURITY: Check if user is blocked - sign out immediately
            if (userData.isBlocked) {
              if (import.meta.env.DEV) {
                console.warn('Blocked user detected, signing out:', firebaseUser.uid);
              }
              await firebaseSignOut(auth);
              toast.error(
                '[ ACCOUNT BLOCKED ]\n\nYour account has been blocked by an administrator.\nPlease contact support for assistance.',
                {
                  duration: 6000,
                }
              );
              setUser(null);
              setLoading(false);
              return;
            }

            if (import.meta.env.DEV) {
              console.log('User data loaded:', userData);
            }
            setUser(userData);
          } else {
            if (import.meta.env.DEV) {
              console.error('User document not found in Firestore');
            }
            setUser(null);
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error fetching user data:', error);
          }
          setUser(null);
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('No user logged in');
        }
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

