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
  DocumentData,
} from 'firebase/firestore';

import type {
  User,
  RegisterData,
  LoginData,
  UserProfile,
  DailyPlan,
} from '../types';

// ------------- helpers -------------
function tsToISO(value: unknown): string | undefined {
  // เผื่อกรณียังเป็น FieldValue (จาก serverTimestamp ยังไม่ resolve)
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return undefined;
}
function nowISO() {
  return new Date().toISOString();
}
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// map FbUser + Firestore 'users' doc → User
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
      profile: undefined,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    await setDoc(ref, {
      ...base,
      // ให้ Firestore จัดการเวลา
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return base;
  }

  const data = snap.data() as DocumentData;
  const mapped: User = {
    id: u.uid,
    name: data.name ?? u.displayName ?? 'ผู้ใช้',
    email: data.email ?? u.email ?? '',
    profile: (data.profile as UserProfile | null) ?? undefined,
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
  async login(data: LoginData): Promise<User> {
    try {
      const email = normalizeEmail(data.email);
      const cred = await signInWithEmailAndPassword(auth, email, data.password);
      return ensureUserDocument(cred.user);
    } catch (err: any) {
      // สำคัญ: ถ้าเห็น auth/invalid-credential = อีเมล/รหัสไม่ถูก หรือ user ยังไม่มี
      console.error('🔴 Firebase login failed:', err?.code, err);
      throw err;
    }
  },

  async register(data: RegisterData): Promise<User> {
    const email = normalizeEmail(data.email);
    // สร้างผู้ใช้
    const cred = await createUserWithEmailAndPassword(auth, email, data.password);

    // set displayName
    if (data.name) {
      await fbUpdateProfile(cred.user, { displayName: data.name });
    }

    // สร้างเอกสาร users/{uid}
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

    // คืนค่าเป็นรูปแบบ User
    return ensureUserDocument(cred.user);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getCurrentUser(): Promise<User | null> {
    return getCurrentUserInternal();
  },

  async updateUser(
    updates: Partial<Pick<User, 'name' | 'profile' | 'email'>>,
  ): Promise<void> {
    const u = auth.currentUser;
    if (!u) throw new Error('No user logged in');

    // Auth profile
    if (typeof updates.name !== 'undefined' && updates.name !== u.displayName) {
      await fbUpdateProfile(u, { displayName: updates.name ?? '' });
    }
    if (
      typeof updates.email !== 'undefined' &&
      updates.email &&
      normalizeEmail(updates.email) !== u.email
    ) {
      try {
        await fbUpdateEmail(u, normalizeEmail(updates.email));
      } catch (e: any) {
        // บ่อยสุด: auth/requires-recent-login
        console.error('updateEmail failed:', e?.code, e);
        throw e;
      }
    }

    // Firestore doc
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
  onAuthStateChanged(cb: (u: unknown) => void) {
    return fbOnAuthStateChanged(auth, cb);
  },
};

// ------------- Daily Plans Service -------------
/**
 * Firestore:
 *  - daily_plans
 *    - { user_id, date(YYYY-MM-DD), profile, calorieCalc, mealPlan, generatedAt, createdAt, updatedAt }
 *
 * NOTE: ถ้า query ตาม user_id + orderBy date ต้องสร้าง composite index ใน Firestore Console
 */
export const dailyPlansService = {
  async getUserDailyPlans(userId: string, limitN = 5): Promise<DailyPlan[]> {
    const col = collection(db, 'daily_plans');
    const q = query(
      col,
      where('user_id', '==', userId),
      orderBy('date', 'desc'),
      qLimit(limitN),
    );
    const snap = await getDocs(q);

    const plans: DailyPlan[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      plans.push({
        profile: data.profile as UserProfile,
        calorieCalc: data.calorieCalc,
        mealPlan: data.mealPlan,
        generatedAt:
          tsToISO(data.generatedAt) ??
          tsToISO(data.createdAt) ??
          nowISO(),
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

// ------------- meta (ใช้โดย AuthContext) -------------
export const getServicesStatus = () => ({
  isDevelopment: import.meta.env.MODE !== 'production',
});

export const checkServicesHealth = async () => ({
  allServicesReady: !!auth && !!db,
});

// (optional) demo
export const initializeDemoData = async () => {};
