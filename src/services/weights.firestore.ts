// src/services/weights.firestore.ts
import { db } from './firebase';
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { WeightLog } from '@/types/progress';

const COLLECTION = 'weightLogs';

/** ดึง logs ทั้งหมดของผู้ใช้ เรียงใหม่ -> เก่า */
export async function getWeightLogs(uid: string): Promise<WeightLog[]> {
  const col = collection(db, COLLECTION);
  const q = query(col, where('uid', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  const data: WeightLog[] = [];
  snap.forEach(doc => {
    const d = doc.data() as any;
    data.push({
      date: d.date ?? (d.createdAt?.toDate?.()?.toISOString().slice(0,10) ?? new Date().toISOString().slice(0,10)),
      weight: Number(d.weight) || 0,
    });
  });
  return data;
}

/** บันทึกชั่งน้ำหนัก 1 record */
export async function addWeighIn(uid: string, log: WeightLog): Promise<void> {
  const col = collection(db, COLLECTION);
  await addDoc(col, {
    uid,
    weight: Number(log.weight),
    date: log.date,           // 'YYYY-MM-DD'
    createdAt: serverTimestamp(),
  });
}
