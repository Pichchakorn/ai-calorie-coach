// utils/progress.ts
import { GoalProgress, UserProfileCore, WeightLog } from '@/types/progress';

function weeksBetween(fromISO: string, toISO: string) {
  const ms = new Date(toISO).getTime() - new Date(fromISO).getTime();
  return Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
}

export function computeGoalProgress(
  profile: UserProfileCore,
  logs: WeightLog[],
  todayISO = new Date().toISOString().slice(0, 10)
): GoalProgress | null {
  const timeframe = profile.timeframe ?? 0;
  const targetWeight =
    profile.goal === 'maintain'
      ? profile.weight
      : profile.targetWeight ?? profile.weight;

  if (timeframe <= 0) return null;

  // หาจุดเริ่มต้น = log แรกสุด ถ้าไม่มีใช้ profile.weight
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const startWeight = sorted[0]?.weight ?? profile.weight;
  const startDate = sorted[0]?.date ?? todayISO;

  // น้ำหนักปัจจุบัน = log ล่าสุด ถ้าไม่มีใช้ startWeight
  const currentWeight = sorted.length > 0 ? sorted[sorted.length - 1].weight : startWeight;

  const totalChange = Math.abs(targetWeight - startWeight); // ต้องเปลี่ยนทั้งหมด
  const delta = startWeight - currentWeight;                 // ลดลงเป็นบวก / เพิ่มเป็นลบ

  // เดินทางมาแล้วกี่กิโล "ในทิศที่ถูกต้อง"
  const progressKg =
    profile.goal === 'gain' ? -delta : delta; // gain = น้ำหนักเพิ่ม → -delta

  const progressPercentage =
    totalChange === 0 ? 100 : Math.min(100, Math.max(0, (progressKg / totalChange) * 100));

  return {
    weeksPassed: weeksBetween(startDate, todayISO),
    timeframe,
    totalChange,
    progressKg: Math.max(0, progressKg),
    progressPercentage,
    currentWeight,
    startWeight,
    targetWeight,
  };
}
