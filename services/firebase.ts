import { auth, db } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updateEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default {
  auth: {
    login: async (email: string, password: string) => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    },

    register: async (email: string, password: string) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    },

    logout: async () => {
      await signOut(auth);
    },

    getCurrentUser: async () => auth.currentUser,

    updateUser: async (updates: { name?: string; profile?: any; email?: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // ✅ อัปเดต Firebase Auth
      try {
        if (updates.name || updates.profile?.photoURL) {
          await updateProfile(user, {
            displayName: updates.name ?? user.displayName,
            photoURL: updates.profile?.photoURL ?? user.photoURL ?? null
          });
        }

        if (updates.email && updates.email !== user.email) {
          await updateEmail(user, updates.email);
        }
      } catch (err) {
        console.error('❌ Failed to update Firebase Auth:', err);
        throw err;
      }

      // ✅ อัปเดต Firestore
      try {
        const ref = doc(db, 'users', user.uid);
        await setDoc(
          ref,
          {
            name: updates.name,
            profile: updates.profile,
            email: updates.email,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (err) {
        console.error('❌ Failed to update Firestore:', err);
        throw err;
      }

      return user;
    },

    onAuthStateChanged: (cb: (user: any) => void) => onAuthStateChanged(auth, cb)
  },

  dailyPlans: {
    createDailyPlan: async () => {},
    getUserDailyPlans: async () => {},
    getDailyPlan: async () => {},
    updateDailyPlan: async () => {},
    deleteDailyPlan: async () => {},
    onUserDailyPlansChange: () => () => {}
  },

  userPreferences: {
    saveUserPreferences: async () => {},
    getUserPreferences: async () => ({})
  },

  healthStats: {
    recordDailyStats: async () => {},
    getHealthStats: async () => []
  }
};
