// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import OpenAI from 'openai';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// --- Request logger ---
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// --- OpenAI client (เป็น null ได้ ถ้าไม่มีคีย์) ---
const openai: OpenAI | null = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ---------- Schemas ----------
const MealItemSchema = z.object({
  name: z.string(),
  portion: z.string(),
  calories: z.coerce.number(),
  protein: z.coerce.number(),
  carbs: z.coerce.number(),
  fat: z.coerce.number(),
});
const MealPlanSchema = z.object({
  breakfast: z.array(MealItemSchema),
  lunch: z.array(MealItemSchema),
  dinner: z.array(MealItemSchema),
  snacks: z.array(MealItemSchema).default([]),
  totalCalories: z.coerce.number(),
});
type MealItem = z.infer<typeof MealItemSchema>;
type MealPlanOut = z.infer<typeof MealPlanSchema>;

const ProfileSchema = z.object({
  gender: z.enum(['male', 'female']),
  age: z.coerce.number().int().min(10).max(120),
  height: z.coerce.number().min(80).max(250),
  weight: z.coerce.number().min(20).max(400),
  goal: z.enum(['lose', 'maintain', 'gain']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']),
});
const RequestSchema = z.object({
  prompt: z.string().optional(),
  targetCalories: z.coerce.number().min(800).max(6000).optional(),
  cuisine: z.enum(['thai', 'any']).optional(),
  profile: ProfileSchema.optional(),
});

// ---------- Utils ----------
function scaleItem(item: MealItem, factor: number): MealItem {
  const f = Math.max(0, factor);
  return {
    ...item,
    calories: Math.round(item.calories * f),
    protein: Number((item.protein * f).toFixed(1)),
    carbs: Number((item.carbs * f).toFixed(1)),
    fat: Number((item.fat * f).toFixed(1)),
  };
}
function reduceArrayCalories(arr: MealItem[], cut: number): number {
  for (let i = arr.length - 1; i >= 0 && cut > 1; i--) {
    const it = arr[i];
    if (it.calories <= 0) continue;
    const reducible = Math.min(it.calories, cut);
    const factor = (it.calories - reducible) / it.calories;
    arr[i] = scaleItem(it, factor);
    cut -= reducible;
  }
  return Math.max(0, cut);
}
function clampPlanToTarget(plan: MealPlanOut, target: number): MealPlanOut {
  const sum = [...plan.breakfast, ...plan.lunch, ...plan.dinner, ...plan.snacks]
    .reduce((s, x) => s + (Number(x.calories) || 0), 0);
  if (sum <= target) return { ...plan, totalCalories: sum };

  let remainCut = sum - target;
  remainCut = reduceArrayCalories(plan.snacks, remainCut);
  remainCut = reduceArrayCalories(plan.dinner, remainCut);
  remainCut = reduceArrayCalories(plan.lunch, remainCut);
  remainCut = reduceArrayCalories(plan.breakfast, remainCut);

  const newTotal = [...plan.breakfast, ...plan.lunch, ...plan.dinner, ...plan.snacks]
    .reduce((s, x) => s + (Number(x.calories) || 0), 0);
  return { ...plan, totalCalories: newTotal };
}
function withTimeout<T>(p: Promise<T>, ms = 20000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}

// แผนสตับสำหรับทดสอบ/กรณี AI ล้มเหลว
function samplePlan(): MealPlanOut {
  return {
    breakfast: [
      { name: 'ไข่ต้ม', portion: '2 ฟอง', calories: 140, protein: 12, carbs: 1, fat: 9 },
      { name: 'ข้าวกล้อง', portion: '1 ถ้วย', calories: 220, protein: 5, carbs: 45, fat: 2 },
    ],
    lunch: [
      { name: 'ข้าวผัดไก่ (เล็ก)', portion: '1 จาน', calories: 450, protein: 20, carbs: 60, fat: 12 },
    ],
    dinner: [
      { name: 'แกงจืดเต้าหู้หมูสับ', portion: '1 ถ้วย', calories: 180, protein: 15, carbs: 6, fat: 8 },
    ],
    snacks: [
      { name: 'กล้วยหอม', portion: '1 ผล', calories: 100, protein: 1, carbs: 27, fat: 0 },
    ],
    totalCalories: 1090,
  };
}

// ---------- Health ----------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ai-server', model: openai ? 'gpt-4o-mini' : 'stub' });
});

// ---------- Echo (debug) ----------
app.post('/api/echo', (req, res) => {
  console.log('[ECHO]', req.body);
  res.json({ ok: true, got: req.body });
});

// ---------- /api/meal ----------
app.post('/api/meal', async (req, res) => {
  try {
    const parsed = RequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid request body', issues: parsed.error.flatten() });
    }
    const { prompt, profile, targetCalories, cuisine } = parsed.data;

    // ต้องมี prompt หรือ (profile+targetCalories)
    if (!prompt && (!profile || !targetCalories)) {
      return res.status(400).json({
        error: 'missing params',
        message: 'ต้องส่ง prompt หรือส่ง profile + targetCalories มาอย่างน้อย',
      });
    }

    // ไม่มีคีย์ → ใช้สตับให้ทำงานต่อได้
    if (!openai) {
      const stub = samplePlan();
      const final = typeof targetCalories === 'number'
        ? clampPlanToTarget(stub, targetCalories)
        : stub;
      return res.json(final);
    }

    // มีคีย์ → ขอ AI
    const finalPrompt =
      prompt ?? [
        `คุณเป็นนักโภชนาการ ช่วยจัดเมนู "${cuisine || 'อาหารไทย'}" 3 มื้อ + ของว่าง สำหรับ 1 วัน`,
        `ให้รวมใกล้เคียง ${targetCalories} kcal และ **ห้ามเกิน** เป้าหมาย (<= ${targetCalories} kcal)`,
        `ถ้าจัดเต็มไม่ได้ ให้เหลือแคลอรี่บางส่วนไว้ได้ แต่ต้องไม่เกินเป้า`,
        `ข้อมูลผู้ใช้: เพศ ${profile!.gender}, อายุ ${profile!.age}, ส่วนสูง ${profile!.height} ซม., น้ำหนัก ${profile!.weight} กก., กิจกรรม ${profile!.activityLevel}`,
        `ข้อกำหนดผลลัพธ์:`,
        `- ตอบกลับเป็น JSON เท่านั้น (อย่าใส่ข้อความอื่น)`,
        `- โครงสร้าง JSON:`,
        `{"breakfast":[{"name":"","portion":"","calories":0,"protein":0,"carbs":0,"fat":0}],"lunch":[],"dinner":[],"snacks":[],"totalCalories":0}`,
        `- totalCalories ต้องเท่าผลรวม calories ของทุกรายการ`,
        `- ห้ามให้ totalCalories เกิน ${targetCalories}`,
        `- หลีกเลี่ยงของทอดซ้ำ ๆ, โปรตีนพอเหมาะ, ใช้หน่วยกรัม/ถ้วย/ช้อน`,
      ].join('\n');

    const completion = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'คุณเป็นนักโภชนาการที่เคร่งครัดเรื่องโครงสร้าง JSON และโภชนาการที่ปลอดภัย' },
          { role: 'user', content: finalPrompt },
        ],
        temperature: 0.6,
      }),
      20_000
    );

    const text = completion.choices[0]?.message?.content || '{}';
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      // AI ตอบ JSON พัง → fallback
      const stub = samplePlan();
      const final = typeof targetCalories === 'number'
        ? clampPlanToTarget(stub, targetCalories)
        : stub;
      return res.json(final);
    }

    const mealPlan = MealPlanSchema.parse(json);
    const final = typeof targetCalories === 'number'
      ? clampPlanToTarget(mealPlan, targetCalories)
      : mealPlan;

    return res.json(final);
  } catch (err: any) {
    console.error('AI /api/meal error:', err?.stack || err?.message || err);
    // fallback เสมอถ้ามีปัญหา เพื่อไม่ให้ฝั่งหน้าเว็บล่ม
    const stub = samplePlan();
    const tc = Number(req.body?.targetCalories);
    return res.json(Number.isFinite(tc) ? clampPlanToTarget(stub, tc) : stub);
  }
});

// ---------- 404 & Error handlers ----------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[ERR]', err?.stack || err);
  res.status(500).json({ error: 'Internal error' });
});

// ---------- start ----------
const PORT = Number(process.env.PORT || 8787);
console.log('OPENAI key loaded?', !!process.env.OPENAI_API_KEY);

app.listen(PORT, () => {
  console.log(`✅ AI server listening on http://localhost:${PORT}`);
});
