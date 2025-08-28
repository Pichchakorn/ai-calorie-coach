// src/services/ai.ts
import { calculateTDEE, calculateTargetCalories, generateMealPlan } from '../utils/calculations';
import type { UserProfile, MealPlan } from '../types';

/** payload ให้ยืดหยุ่น (สอดคล้องกับ server/src/index.ts) */
export type Payload = {
  profile?: Pick<UserProfile, 'gender' | 'age' | 'height' | 'weight' | 'goal' | 'activityLevel'>;
  targetCalories?: number;
  cuisine?: 'thai' | 'any';
  prompt?: string;
};

type MealPlanLike = {
  breakfast?: any[];
  lunch?: any[];
  dinner?: any[];
  snacks?: any[];
  totalCalories?: number;
};

function isMealPlanLike(x: any): x is MealPlanLike {
  return x && typeof x === 'object'
    && Array.isArray(x.breakfast)
    && Array.isArray(x.lunch)
    && Array.isArray(x.dinner)
    && Array.isArray(x.snacks)
    && (typeof x.totalCalories === 'number' || typeof x.totalCalories === 'string');
}

// BMR แบบ Mifflin–St Jeor (คำนวณภายในไฟล์)
function calcBMR(profile: Pick<UserProfile, 'gender' | 'age' | 'height' | 'weight'>) {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  return profile.gender === 'male' ? base + 5 : base - 161;
}

/** fetch พร้อม timeout กันแขวน */
async function fetchJSON(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 20000, ...rest } = init;
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: ac.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function generateMealPlanAI(input: Payload): Promise<MealPlan> {
  const { profile, cuisine = 'thai', prompt } = input;

  // ---- เตรียม targetCalories ---
  let targetCalories = input.targetCalories;
  if (!targetCalories && profile) {
    const bmr = calcBMR(profile);
    const tdee = calculateTDEE(bmr, profile.activityLevel);
    targetCalories = Math.round(
      calculateTargetCalories(profile as UserProfile, tdee).targetCalories
    );
  }

  // ---------- 1) พยายามเรียก backend ก่อน ----------
  try {
    const res = await fetchJSON('/api/meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // NOTE: server ต้องการ targetCalories ถ้าไม่มี prompt
      body: JSON.stringify({
        prompt,
        profile,
        targetCalories,
        cuisine,
      }),
      timeoutMs: 20000,
    });

    if (!res.ok) {
      // อ่าน error จาก server เพื่อดีบัก
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        msg = (j && (j.message || j.error)) || msg;
      } catch {
        msg = (await res.text().catch(() => '')) || msg;
      }
      throw new Error(msg);
    }

    const data = await res.json();

    // กันรูปแบบหลุด/field หาย (และเติม date ให้ตรง type ของฝั่ง UI)
    const safe: MealPlanLike = isMealPlanLike(data)
      ? data
      : { breakfast: [], lunch: [], dinner: [], snacks: [], totalCalories: 0 };

    const mealPlan: MealPlan = {
      breakfast: Array.isArray(safe.breakfast) ? safe.breakfast : [],
      lunch: Array.isArray(safe.lunch) ? safe.lunch : [],
      dinner: Array.isArray(safe.dinner) ? safe.dinner : [],
      snacks: Array.isArray(safe.snacks) ? safe.snacks : [],
      totalCalories: Number(safe.totalCalories ?? 0),
      date: new Date().toISOString().slice(0, 10),
    };

    return mealPlan;
  } catch (err) {
    // ถ้าเรียก AI ไม่สำเร็จให้ fallback
    console.warn('AI endpoint failed, fallback to local generator:', err);
  }

  // ---------- 2) Fallback: สร้างแผนแบบโลคัล ----------
  // ไม่มี profile เลย → คืนโครงสร้างว่าง กัน UI พัง
  if (!profile) {
    return {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
      totalCalories: 0,
      date: new Date().toISOString().slice(0, 10),
    };
  }

  // ยังไม่มี targetCalories → คำนวณอีกรอบ
  if (!targetCalories) {
    const bmr = calcBMR(profile);
    const tdee = calculateTDEE(bmr, profile.activityLevel);
    targetCalories = Math.round(
      calculateTargetCalories(profile as UserProfile, tdee).targetCalories
    );
  }

  const local = generateMealPlan(targetCalories, profile.goal);
  return { ...local, date: new Date().toISOString().slice(0, 10) };
}
