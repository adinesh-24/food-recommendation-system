import { useState, useEffect } from 'react';
import { signInWithPopup, signOut as firebaseSignOut, User, onAuthStateChanged } from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Check email verification
          const verified = await checkEmailVerification(user);
          setIsEmailVerified(verified);

          // Get or create user profile
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            profile = await createUserProfile(user.uid, user.email!, user.displayName || undefined);
          }
          setUserProfile(profile);
        } catch (err) {
          console.error('Error loading user data:', err);
          setError(err instanceof Error ? err.message : 'Error loading user data');
        }
      } else {
        setUserProfile(null);
        setIsEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setIsEmailVerified(result.user.emailVerified);

      // Get or create user profile for Google sign-in
      let profile = await getUserProfile(result.user.uid);
      if (!profile) {
        profile = await createUserProfile(
          result.user.uid,
          result.user.email!,
          result.user.displayName || undefined
        );
      }
      setUserProfile(profile);

      return result.user;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
      throw err;
    } finally {
      setLoading(false);
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