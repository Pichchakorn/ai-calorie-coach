// services/firebase.ts
import { auth, db } from '../firebase/config';

export default {
  auth: {
    login: async (email: string, password: string) => {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    },
    register: async (email: string, password: string) => {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      return userCredential.user;
    },
    logout: async () => {
      await auth.signOut();
    },
    getCurrentUser: async () => auth.currentUser,
    updateUser: async (data: any) => {
      const user = auth.currentUser;
      if (user) {
        await user.updateProfile(data);
        return user;
      }
      throw new Error('No user logged in');
    },
    onAuthStateChanged: (cb: (user: any) => void) => auth.onAuthStateChanged(cb)
  },
  dailyPlans: {
    createDailyPlan: async () => {/* เขียนตามโปรเจกต์คุณ */},
    getUserDailyPlans: async () => {/* เขียนตามโปรเจกต์คุณ */},
    getDailyPlan: async () => {/* เขียนตามโปรเจกต์คุณ */},
    updateDailyPlan: async () => {/* เขียนตามโปรเจกต์คุณ */},
    deleteDailyPlan: async () => {/* เขียนตามโปรเจกต์คุณ */},
    onUserDailyPlansChange: () => () => {}
  },
  userPreferences: {
    saveUserPreferences: async () => {/* เขียนตามโปรเจกต์คุณ */},
    getUserPreferences: async () => ({})
  },
  healthStats: {
    recordDailyStats: async () => {/* เขียนตามโปรเจกต์คุณ */},
    getHealthStats: async () => []
  }
};
