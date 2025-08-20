// src/services/index.ts
import { auth, db } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
  updateEmail as fbUpdateEmail,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FbUser,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  limit as qLimit,
  Timestamp,
} from 'firebase/firestore';

import type { User, RegisterData, LoginData, UserProfile, DailyPlan } from '../types';

// ------------- helpers -------------
function tsToISO(ts?: Timestamp | null): string | undefined {
  if (!ts) return undefined;
  return ts.toDate().toISOString();
}

function nowISO() {
  return new Date().toISOString();
}

function fbUserBasic(u: FbUser) {
  return {
    uid: u.uid,
    email: u.email ?? undefined,
    displayName: u.displayName ?? undefined,
    photoURL: u.photoURL ?? undefined,
  };
}

async function ensureUserDocument(u: FbUser): Promise<User> {
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const base: User = {
      id: u.uid,
      name: u.displayName ?? 'ผู้ใช้ใหม่',
      email: u.email ?? '',
      // photoURL: u.photoURL ?? undefined,
      profile: undefined, // ผู้ใช้ยังไม่ตั้งค่า
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    await setDoc(ref, {
      ...base,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return base;
  }

  const data = snap.data() as any;
  const mapped: User = {
    id: u.uid,
    name: data.name ?? u.displayName ?? 'ผู้ใช้',
    email: data.email ?? u.email ?? '',
    // photoURL: data.photoURL ?? u.photoURL ?? undefined,
    profile: data.profile as UserProfile | undefined,
    createdAt: tsToISO(data.createdAt) ?? nowISO(),
    updatedAt: tsToISO(data.updatedAt) ?? nowISO(),
  };
  return mapped;
}

async function getCurrentUserInternal(): Promise<User | null> {
  const u = auth.currentUser;
  if (!u) return null;
  return ensureUserDocument(u);
}

// ------------- Auth Service -------------
export const authService = {
  // data: { email, password }
  async login(data: LoginData): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
    return ensureUserDocument(cred.user);
  },

  // data: { name, email, password, confirmPassword? }
  async register(data: RegisterData): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    if (data.name) {
      await fbUpdateProfile(cred.user, { displayName: data.name });
    }
    // สร้างเอกสาร users
    const ref = doc(db, 'users', cred.user.uid);
    await setDoc(ref, {
      id: cred.user.uid,
      name: data.name ?? 'ผู้ใช้ใหม่',
      email: data.email,
      photoURL: cred.user.photoURL ?? null,
      profile: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ensureUserDocument(cred.user);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getCurrentUser(): Promise<User | null> {
    return getCurrentUserInternal();
  },

  async updateUser(updates: Partial<Pick<User, 'name' | 'profile' | 'email'>>): Promise<void> {
    const u = auth.currentUser;
    if (!u) throw new Error('No user logged in');

    // อัปเดต Firebase Auth
    if (updates.name && updates.name !== u.displayName) {
      await fbUpdateProfile(u, { displayName: updates.name });
    }
    if (updates.email && updates.email !== u.email) {
      await fbUpdateEmail(u, updates.email);
    }

    // อัปเดต Firestore
    const ref = doc(db, 'users', u.uid);
    const payload: any = {
      updatedAt: serverTimestamp(),
    };
    if (typeof updates.name !== 'undefined') payload.name = updates.name;
    if (typeof updates.email !== 'undefined') payload.email = updates.email;
    if (typeof updates.profile !== 'undefined') payload.profile = updates.profile;

    await setDoc(ref, payload, { merge: true });
  },

  // for AuthContext listener
  onAuthStateChanged(cb: (u: unknown) => void) {
    return fbOnAuthStateChanged(auth, cb);
  },
};

// ------------- Daily Plans Service -------------
/**
 * โครงสร้าง Firestore:
 *  - daily_plans (collection)
 *    - doc: { id, user_id, date, profile, calorieCalc, mealPlan, generatedAt, createdAt, updatedAt }
 */
export const dailyPlansService = {
  async getUserDailyPlans(userId: string, limitN = 5): Promise<DailyPlan[]> {
    const col = collection(db, 'daily_plans');
    const q = query(col, where('user_id', '==', userId), orderBy('date', 'desc'), qLimit(limitN));
    const snap = await getDocs(q);

    const plans: DailyPlan[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      plans.push({
        profile: data.profile,
        calorieCalc: data.calorieCalc,
        mealPlan: data.mealPlan,
        generatedAt: tsToISO(data.generatedAt) ?? tsToISO(data.createdAt) ?? nowISO(),
      });
    });
    return plans;
  },

  async createDailyPlan(params: {
    userId: string;
    date: string; // 'YYYY-MM-DD'
    plan: DailyPlan;
    gptPrompt?: string;
    gptResponseId?: string;
  }) {
    const col = collection(db, 'daily_plans');
    await addDoc(col, {
      user_id: params.userId,
      date: params.date,
      profile: params.plan.profile,
      calorieCalc: params.plan.calorieCalc,
      mealPlan: params.plan.mealPlan,
      generatedAt: serverTimestamp(),
      gpt_prompt: params.gptPrompt ?? null,
      gpt_response_id: params.gptResponseId ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
};

// ------------- meta for AuthContext (ไม่ให้ TS พัง) -------------
export const getServicesStatus = () => ({
  isDevelopment: import.meta.env.MODE !== 'production',
});

export const checkServicesHealth = async () => ({
  allServicesReady: !!auth && !!db,
});

// (optional) สำหรับโหมดเดโม่ - ไม่ต้องทำอะไรก็ได้
export const initializeDemoData = async () => {};
