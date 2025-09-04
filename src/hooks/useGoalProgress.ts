// hooks/useGoalProgress.ts
import { useEffect, useState, useCallback } from 'react';
import { computeGoalProgress } from '@/utils/progress';
import type { GoalProgress, UserProfileCore, WeightLog } from '@/types/progress';
import { getWeightLogs } from '@/services/weights'; // <- ตัวกลางเลือก FS/LS

export function useGoalProgress(userId?: string, profile?: UserProfileCore) {
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !profile) return;
    setLoading(true);
    try {
      const logs: WeightLog[] = await getWeightLogs(userId); // เลือก FS หรือ LS อัตโนมัติ
      const latest = logs?.[0]?.weight ?? profile.weight;     // ใหม่สุดก่อน
      setLatestWeight(latest);
      setGoalProgress(computeGoalProgress({ ...profile, weight: latest }, logs || []));
    } finally {
      setLoading(false);
    }
  }, [userId, profile?.weight, profile?.goal, profile?.targetWeight, profile?.timeframe]);

  useEffect(() => { void load(); }, [load]);

  return {
    goalProgress,
    latestWeight, // เอาไปโชว์ “น้ำหนักปัจจุบัน” ที่หน้า Dashboard ได้
    loading,
    refresh: load, // เรียกหลังบันทึกน้ำหนัก
  };
}
