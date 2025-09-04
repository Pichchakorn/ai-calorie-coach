// src/services/weights.ts
import type { WeightLog } from '@/types/progress';
import { getWeightLogsLS, addWeighInLS } from './weights.local';

// lazy-load firestore module (ถ้ามีการ config Firebase แล้ว)
let fsLoaded = false;
let fsOk = false;
let getWeightLogsFS: ((uid: string) => Promise<WeightLog[]>) | null = null;
let addWeighInFS: ((uid: string, log: WeightLog) => Promise<void>) | null = null;

async function ensureFS() {
  if (fsLoaded) return fsOk;
  fsLoaded = true;
  try {
    const mod = await import('./weights.firestore');
    getWeightLogsFS = mod.getWeightLogs;
    addWeighInFS = mod.addWeighIn;
    fsOk = true;
  } catch {
    fsOk = false;
  }
  return fsOk;
}

export async function getWeightLogs(uid?: string): Promise<WeightLog[]> {
  const id = uid || 'guest';
  if (await ensureFS()) {
    try {
      return await (getWeightLogsFS as any)(id);
    } catch {
      // ตกมาใช้ LocalStorage
      return getWeightLogsLS(id);
    }
  }
  return getWeightLogsLS(id);
}

export async function addWeighIn(uid: string, log: WeightLog): Promise<void> {
  const id = uid || 'guest';
  if (await ensureFS()) {
    try {
      await (addWeighInFS as any)(id, log);
      return;
    } catch {
      // ตกมาใช้ LocalStorage
    }
  }
  addWeighInLS(id, log);
}
