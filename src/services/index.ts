// src/services/index.ts
import { auth, db } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
  updateEmail as fbUpdateEmail,
  onAuthStateChanged as fbOnAuthStateChanged,
  type User as FbUser,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit as qLimit,
  Timestamp,
  type DocumentData,
  type FieldValue,
} from 'firebase/firestore';

import type {
  User,
  RegisterData,
  LoginData,
  UserProfile,
  DailyPlan,
  CalorieCalculation,
  MealPlan,
} from '../types';

/* ------------------------------ helpers ------------------------------ */

function tsToISO(value: unknown): string | undefined {
  // ถ้าเป็น Firestore Timestamp แปลงเป็น ISO
  if (value instanceof Timestamp) return value.toDate().toISOString();
  // ถ้าเป็น FieldValue (เช่น serverTimestamp ที่ยังไม่ resolve) → undefined
  return undefined;
}

function nowISO() {
  return new Date().toISOString();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUserFromDoc(u: FbUser, data?: DocumentData): User {
  return {
    id: u.uid,
    name: data?.name ?? u.displayName ?? 'ผู้ใช้',
    email: data?.email ?? u.email ?? '',
    profile: (data?.profile as UserProfile | null) ?? undefined,
    createdAt: tsToISO(data?.createdAt) ?? nowISO(),
    updatedAt: tsToISO(data?.updatedAt) ?? nowISO(),
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
      profile: undefined,
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

  return mapUserFromDoc(u, snap.data());
}

async function getCurrentUserInternal(): Promise<User | null> {
  const u = auth.currentUser;
  if (!u) return null;
  return ensureUserDocument(u);
}

/* ------------------------------ Auth Service ------------------------------ */

export const authService = {
  async login(data: LoginData): Promise<User> {
    try {
      const email = normalizeEmail(data.email);
      const cred = await signInWithEmailAndPassword(auth, email, data.password);
      return ensureUserDocument(cred.user);
    } catch (err: any) {
      // ส่วนมากจะเจอ auth/invalid-credential, auth/user-not-found, auth/wrong-password
      console.error('🔴 Firebase login failed:', err?.code, err);
      throw err;
    }
  },

  async register(data: RegisterData): Promise<User> {
    const email = normalizeEmail(data.email);
    const cred = await createUserWithEmailAndPassword(auth, email, data.password);

    if (data.name) {
      await fbUpdateProfile(cred.user, { displayName: data.name });
    }

    const ref = doc(db, 'users', cred.user.uid);
    await setDoc(ref, {
      id: cred.user.uid,
      name: data.name ?? 'ผู้ใช้ใหม่',
      email,
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

  async updateUser(
    updates: Partial<Pick<User, 'name' | 'profile' | 'email'>>
  ): Promise<void> {
    const u = auth.currentUser;
    if (!u) throw new Error('No user logged in');

    // อัปเดต Auth profile/displayName
    if (typeof updates.name !== 'undefined' && updates.name !== u.displayName) {
      await fbUpdateProfile(u, { displayName: updates.name ?? '' });
    }

    // อัปเดต Auth email (อาจเจอ auth/requires-recent-login)
    if (
      typeof updates.email !== 'undefined' &&
      updates.email &&
      normalizeEmail(updates.email) !== u.email
    ) {
      try {
        await fbUpdateEmail(u, normalizeEmail(updates.email));
      } catch (e: any) {
        console.error('updateEmail failed:', e?.code, e);
        // แนะนำให้ UI จัดการ re-auth (เช่น popup ให้ login ใหม่) แล้วลองอีกครั้ง
        throw e;
      }
    }

    // อัปเดต Firestore users/{uid}
    const ref = doc(db, 'users', u.uid);
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (typeof updates.name !== 'undefined') payload.name = updates.name;
    if (typeof updates.email !== 'undefined')
      payload.email = updates.email ? normalizeEmail(updates.email) : '';
    if (typeof updates.profile !== 'undefined')
      payload.profile = updates.profile ?? null;

    await setDoc(ref, payload, { merge: true });
  },

  // Listener สำหรับ AuthContext
  onAuthStateChanged(cb: (u: FbUser | null) => void) {
    // ส่ง FbUser | null กลับไปให้ context เป็นคน map เองถ้าต้องการ
    return fbOnAuthStateChanged(auth, cb);
  },
};

/* --------------------------- Daily Plans Service --------------------------- */
/**
 * Firestore:
 *  - daily_plans
 *     - { user_id, date(YYYY-MM-DD string), profile, calorieCalc, mealPlan, generatedAt, createdAt, updatedAt }
 *
 * ✅ แนะนำเก็บ date เป็น string รูปแบบ 'YYYY-MM-DD' เพื่อ query/order ได้เสถียร
 * ⚠️ ถ้าใช้ where('user_id','==',uid) + orderBy('date') อาจต้องสร้าง composite index ใน Firestore Console
 */

export const dailyPlansService = {
  async getUserDailyPlans(userId: string, limitN = 5): Promise<DailyPlan[]> {
    const colRef = collection(db, 'daily_plans');
    const qRef = query(
      colRef,
      where('user_id', '==', userId),
      orderBy('date', 'desc'),
      qLimit(limitN)
    );
    const snap = await getDocs(qRef);

    const plans: DailyPlan[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      plans.push({
        profile: data.profile as UserProfile,
        calorieCalc: data.calorieCalc as CalorieCalculation,
        mealPlan: data.mealPlan as MealPlan,
        generatedAt:
          tsToISO(data.generatedAt) ??
          tsToISO(data.createdAt) ??
          nowISO(),
      });
    });
    return plans;
  },

  async getDailyPlanByDate(userId: string, date: string): Promise<DailyPlan | null> {
    const colRef = collection(db, 'daily_plans');
    const qRef = query(colRef, where('user_id', '==', userId), where('date', '==', date));
    const snap = await getDocs(qRef);
    if (snap.empty) return null;

    const d = snap.docs[0];
    const data = d.data() as any;
    return {
      profile: data.profile as UserProfile,
      calorieCalc: data.calorieCalc as CalorieCalculation,
      mealPlan: data.mealPlan as MealPlan,
      generatedAt: tsToISO(data.generatedAt) ?? tsToISO(data.createdAt) ?? nowISO(),
    };
  },

  async createDailyPlan(params: {
    userId: string;
    date: string; // 'YYYY-MM-DD'
    plan: DailyPlan;
    gptPrompt?: string;
    gptResponseId?: string;
  }) {
    const colRef = collection(db, 'daily_plans');
    await addDoc(colRef, {
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

  async updateDailyPlan(params: {
    docId: string; // ไอดีของเอกสารใน daily_plans
    patch: Partial<{
      profile: UserProfile | null;
      calorieCalc: CalorieCalculation | null;
      mealPlan: MealPlan | null;
      date: string;
      gpt_prompt: string | null;
      gpt_response_id: string | null;
    }>;
  }) {
    const ref = doc(db, 'daily_plans', params.docId);
    await updateDoc(ref, {
      ...params.patch,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteDailyPlan(docId: string) {
    const ref = doc(db, 'daily_plans', docId);
    await deleteDoc(ref);
  },
};

/* ------------------------------- meta utils ------------------------------- */

export const getServicesStatus = () => ({
  isDevelopment: import.meta.env.MODE !== 'production',
});

export const checkServicesHealth = async () => ({
  allServicesReady: !!auth && !!db,
});

// (optional) demo
export const initializeDemoData = async () => {};
