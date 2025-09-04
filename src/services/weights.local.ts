// services/weights.local.ts
import type { WeightLog } from '@/types/progress';

const KEY = (uid: string) => `weights_${uid || 'guest'}`;

function sortDesc(a: WeightLog, b: WeightLog) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export function getWeightLogsLS(uid: string): WeightLog[] {
  try {
    const raw = localStorage.getItem(KEY(uid));
    const list: WeightLog[] = raw ? JSON.parse(raw) : [];
    // เผื่อเคสที่เคยเก็บมั่วลำดับไว้: เรียงจากใหม่ → เก่า
    return list.sort(sortDesc);
  } catch {
    return [];
  }
}

export function addWeighInLS(uid: string, log: WeightLog) {
  const list = getWeightLogsLS(uid);

  // ถ้ามีบันทึกวันเดียวกัน ให้แทนที่ (กันซ้ำ)
  const dateKey = new Date(log.date).toISOString().slice(0, 10);
  const next = list
    .filter(x => new Date(x.date).toISOString().slice(0, 10) !== dateKey)
    .concat([{ ...log }])
    .sort(sortDesc);

  localStorage.setItem(KEY(uid), JSON.stringify(next));
}
