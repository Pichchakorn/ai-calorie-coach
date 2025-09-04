// types/progress.ts
export type Goal = 'lose' | 'maintain' | 'gain';

export type UserProfileCore = {
  weight: number;        // น้ำหนักเริ่มต้น (กก.)
  targetWeight?: number; // น้ำหนักเป้าหมาย (กก.)  (จำเป็นสำหรับ lose/gain)
  timeframe?: number;    // เป้าหมายภายในกี่สัปดาห์
  goal: Goal;
};

export type WeightLog = { date: string; weight: number }; // date = 'YYYY-MM-DD'

export type GoalProgress = {
  weeksPassed: number;
  timeframe: number;
  totalChange: number;          // ต้องเปลี่ยนทั้งหมดกี่ กก. ถึงเป้า (ค่าสัมบูรณ์)
  progressKg: number;           // เดินทางมาแล้วกี่ กก. (ทิศถูกต้อง = บวก)
  progressPercentage: number;   // %
  currentWeight: number;
  startWeight: number;
  targetWeight: number;
};
