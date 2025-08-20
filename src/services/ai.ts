// services/ai.ts
import type { UserProfile } from '../types';
import { generateMealPlan } from '../utils/calculations';
export type AIRequest = {
  profile: {
    gender: 'male'|'female';
    age: number;
    height: number;
    weight: number;
    goal: 'lose'|'maintain'|'gain';
    activityLevel: 'sedentary'|'light'|'moderate'|'active'|'very-active';
  };
  targetCalories: number;
  cuisine?: 'thai'|'any';
};

export async function generateMealPlanAI(req: AIRequest) {
  const prompt = `
คุณเป็นนักโภชนาการ ช่วยจัด "อาหารไทย" 3 มื้อ + ของว่าง ให้รวม ~${req.targetCalories} kcal
เงื่อนไข:
- เป้าหมาย: ${req.profile.goal}
- ให้ผลลัพธ์เป็น JSON เท่านั้น รูปแบบ:
{
  "breakfast": [{"name":"","portion":"","calories":0,"protein":0,"carbs":0,"fat":0}],
  "lunch": [...],
  "dinner": [...],
  "snacks": [...],
  "totalCalories": 0
}
- หลีกเลี่ยงเมนูทอดบ่อย ๆ, คุมแคลให้ใกล้เป้า, โปรตีนเพียงพอ
- ใช้หน่วยกรัม/ถ้วย/ช้อนโต๊ะ และตัวเลข kcal ชัดเจน
`;
  // เรียก API ของคุณฝั่ง server (เช่น /api/meal) แทนเรียกตรงจาก client
  const res = await fetch('/api/meal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error('AI generate failed');
  const data = await res.json();
  return data; // ให้มี shape ตรงกับ MealPlan ที่ใช้ในแอป
}
