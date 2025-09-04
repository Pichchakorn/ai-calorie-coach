// src/utils/calculations.ts
import type { UserProfile, CalorieCalculation, MealPlan, FoodItem } from '../types';

/* -------------------- Activity multipliers -------------------- */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  'very-active': 1.9,
} as const;

/* -------------------- Core formulas -------------------- */
// Mifflin–St Jeor
export function calculateBMR(profile: UserProfile): number {
  return profile.gender === 'male'
    ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
    : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
}

export function calculateTDEE(bmr: number, activityLevel: UserProfile['activityLevel']): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateTargetCalories(profile: UserProfile, tdee: number): CalorieCalculation {
  const bmr = calculateBMR(profile);
  let targetCalories = tdee;
  let deficitOrSurplus = 0;

  if (profile.goal === 'lose') {
    if (profile.targetWeight && profile.timeframe) {
      const weeklyLoss = (profile.weight - profile.targetWeight) / profile.timeframe;
      const dailyDeficit = (weeklyLoss * 7700) / 7;
      deficitOrSurplus = -Math.min(dailyDeficit, 1000);
      targetCalories = Math.max(tdee + deficitOrSurplus, bmr * 1.2);
    } else {
      deficitOrSurplus = -500;
      targetCalories = Math.max(tdee - 500, bmr * 1.2);
    }
  } else if (profile.goal === 'gain') {
    if (profile.targetWeight && profile.timeframe) {
      const weeklyGain = (profile.targetWeight - profile.weight) / profile.timeframe;
      const dailySurplus = (weeklyGain * 7700) / 7;
      deficitOrSurplus = Math.min(dailySurplus, 1000);
      targetCalories = tdee + deficitOrSurplus;
    } else {
      deficitOrSurplus = 500;
      targetCalories = tdee + 500;
    }
  } else {
    targetCalories = tdee;
  }

  // Macro split: Carb 45%, Protein 30%, Fat 25%
  const proteinCalories = targetCalories * 0.3;
  const carbCalories = targetCalories * 0.45;
  const fatCalories = targetCalories * 0.25;

  return {
    bmr,
    tdee,
    targetCalories,
    deficitOrSurplus,
    macroBreakdown: {
      protein: Math.round(proteinCalories / 4),
      carbs: Math.round(carbCalories / 4),
      fat: Math.round(fatCalories / 9),
    },
  };
}

export function calculateTimeToGoal(profile: UserProfile, dailyDeficitOrSurplus: number): number {
  if (!profile.targetWeight || profile.goal === 'maintain') return 0;
  const kgDiff = Math.abs(profile.weight - profile.targetWeight);
  const dailyKg = Math.abs(dailyDeficitOrSurplus) / 7700;
  if (!dailyKg) return 0;
  return Math.ceil(kgDiff / (dailyKg * 7));
}

export function calculateWeeklyWeightChange(dailyDeficitOrSurplus: number): number {
  return (dailyDeficitOrSurplus * 7) / 7700; // kg/week
}

/* -------------------- Helpers used by UI -------------------- */
export function formatCalories(cal: number): string {
  return new Intl.NumberFormat('th-TH').format(Math.round(cal));
}

export function formatWeight(kg: number): string {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(kg);
}

export function getGoalText(goal: UserProfile['goal']): string {
  switch (goal) {
    case 'lose': return 'ลดน้ำหนัก';
    case 'gain': return 'เพิ่มน้ำหนัก';
    case 'maintain': return 'รักษาน้ำหนัก';
  }
}

export function getActivityText(level: UserProfile['activityLevel']): string {
  switch (level) {
    case 'sedentary': return 'ไม่ค่อยออกกำลังกาย';
    case 'light': return 'ออกกำลังกายเบา ๆ 1–3 วัน/สัปดาห์';
    case 'moderate': return 'ออกกำลังกายปานกลาง 3–5 วัน/สัปดาห์';
    case 'active': return 'ออกกำลังกายหนัก 6–7 วัน/สัปดาห์';
    case 'very-active': return 'ออกกำลังกายหนักมาก วันละ 2 ครั้ง';
  }
}

export function validateGoal(profile: UserProfile): { isValid: boolean; message?: string } {
  if (!profile.targetWeight || !profile.timeframe) return { isValid: true };
  const weeklyChange = Math.abs(profile.weight - profile.targetWeight) / profile.timeframe;
  if (weeklyChange > 1) {
    return { isValid: false, message: `การเปลี่ยนแปลง ${weeklyChange.toFixed(1)} กก./สัปดาห์ อาจไม่ปลอดภัย (ควรไม่เกิน 1 กก./สัปดาห์)` };
  }
  if (profile.goal === 'lose' && profile.targetWeight >= profile.weight) {
    return { isValid: false, message: 'เป้าหมายลดน้ำหนักต้องน้อยกว่าน้ำหนักปัจจุบัน' };
  }
  if (profile.goal === 'gain' && profile.targetWeight <= profile.weight) {
    return { isValid: false, message: 'เป้าหมายเพิ่มน้ำหนักต้องมากกว่าน้ำหนักปัจจุบัน' };
  }
  return { isValid: true };
}

/* -------------------- Simple meal plan generator -------------------- */
/** ธนาคารเมนูแบบง่าย (พอให้ UI ทำงานได้) */
const THAI_FOODS: Record<'breakfast'|'lunch'|'dinner'|'snacks', FoodItem[]> = {
  breakfast: [
    { name: 'ข้าวต้มหมู', calories: 280, protein: 15, carbs: 35, fat: 8, portion: '1 ชาม' },
    { name: 'โจ๊กหมู', calories: 220, protein: 12, carbs: 30, fat: 6, portion: '1 ชาม' },
    { name: 'ข้าวผัดไก่ (เล็ก)', calories: 320, protein: 18, carbs: 45, fat: 8, portion: '1 จาน' },
    { name: 'ไข่เจียว + ข้าวสวย', calories: 290, protein: 14, carbs: 35, fat: 10, portion: '1 จาน' },
  ],
  lunch: [
    { name: 'กะเพราไก่ + ไข่ดาว', calories: 520, protein: 28, carbs: 55, fat: 20, portion: '1 จาน' },
    { name: 'ต้มยำกุ้ง + ข้าวสวย', calories: 360, protein: 24, carbs: 40, fat: 10, portion: '1 ชุด' },
    { name: 'ผัดไทยกุ้ง', calories: 400, protein: 20, carbs: 52, fat: 12, portion: '1 จาน' },
  ],
  dinner: [
    { name: 'ยำวุ้นเส้น', calories: 200, protein: 10, carbs: 28, fat: 5, portion: '1 จาน' },
    { name: 'ปลาเผา + ผักต้ม', calories: 320, protein: 35, carbs: 12, fat: 10, portion: '1 จาน' },
    { name: 'แกงจืดเต้าหู้หมูสับ', calories: 180, protein: 15, carbs: 6, fat: 8, portion: '1 ถ้วย' },
  ],
  snacks: [
    { name: 'กล้วยหอม', calories: 90, protein: 1, carbs: 23, fat: 0, portion: '1 ลูก' },
    { name: 'โยเกิร์ตธรรมชาติ', calories: 100, protein: 10, carbs: 12, fat: 4, portion: '1 ถ้วย' },
    { name: 'ถั่วลิสง', calories: 160, protein: 7, carbs: 6, fat: 14, portion: '30 กรัม' },
  ],
};

/** สุ่มเมนูง่าย ๆ ตามสัดส่วนแคลอรี่ (25/35/30/10) */
export function generateMealPlan(targetCalories: number, _goal: UserProfile['goal']): MealPlan {
  const day = new Date().toISOString().slice(0, 10);

  const targets = {
    breakfast: targetCalories * 0.25,
    lunch: targetCalories * 0.35,
    dinner: targetCalories * 0.30,
    snacks: targetCalories * 0.10,
  };

  function pick(category: keyof typeof THAI_FOODS, kcalTarget: number): FoodItem[] {
    const list = THAI_FOODS[category];
    const chosen: FoodItem[] = [];
    let kcal = 0, i = 0;

    while (kcal < kcalTarget * 0.85 && i < 10) {
      const item = list[Math.floor(Math.random() * list.length)];
      if (!chosen.find(x => x.name === item.name)) {
        chosen.push(item);
        kcal += item.calories;
      }
      i++;
    }
    // อย่างน้อยต้องมี 1 รายการ
    return chosen.length ? chosen : [list[0]];
  }

  const breakfast = pick('breakfast', targets.breakfast);
  const lunch = pick('lunch', targets.lunch);
  const dinner = pick('dinner', targets.dinner);
  const snacks = pick('snacks', targets.snacks);

  const totalCalories = [...breakfast, ...lunch, ...dinner, ...snacks]
    .reduce((s, it) => s + it.calories, 0);

  return { breakfast, lunch, dinner, snacks, totalCalories, date: day };
}
