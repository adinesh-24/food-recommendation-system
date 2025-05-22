import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  User, 
  onAuthStateChanged,
  signInWithRedirect, 
  getRedirectResult 
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { checkEmailVerification, getUserProfile, createUserProfile } from '@/services/userService';
import { UserProfile } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          const user = result.user;
          setUser(user);
          if (user) {
            try {
              const verified = await checkEmailVerification(user);
              setIsEmailVerified(verified);
              let profile = await getUserProfile(user.uid);
              if (!profile) {
                profile = await createUserProfile(user.uid, user.email!, user.displayName || undefined);
              }
              setUserProfile(profile);
            } catch (err) {
              console.error('Error processing redirect user data:', err);
              setError(err instanceof Error ? err.message : 'Error processing redirect user data');
            }
          }
        }
      })
      .catch((error) => {
        console.error('Error from getRedirectResult:', error);
        setError(error.message || 'Error during redirect sign-in.');
      })
      .finally(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            if (!userProfile) { 
              try {
                const verified = await checkEmailVerification(currentUser);
                setIsEmailVerified(verified);
                let profile = await getUserProfile(currentUser.uid);
                if (!profile) {
                  profile = await createUserProfile(currentUser.uid, currentUser.email!, currentUser.displayName || undefined);
                }
                setUserProfile(profile);
              } catch (err) {
                console.error('Error loading user data in onAuthStateChanged:', err);
                setError(err instanceof Error ? err.message : 'Error loading user data');
              }
            }
          } else {
            setUserProfile(null);
            setIsEmailVerified(false);
          }
          setLoading(false); 
        });
        return () => unsubscribe();
      });

  }, [userProfile]); 

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in initiation');
    } finally {
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setIsEmailVerified(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    userProfile,
    loading,
    error,
    isEmailVerified,
    signInWithGoogle,
    signOut
  };
}; 