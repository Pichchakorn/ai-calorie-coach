// components/WeighInForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { addWeighInLS /* or addWeighInLS */ } from '@/services/weights.local';
import type { WeightLog } from '@/types/progress';

export default function WeighInForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [weight, setWeight] = useState<number | ''>('');
  const today = new Date().toISOString().slice(0, 10);

  async function submit() {
    if (!weight) return;
    const log: WeightLog = { date: today, weight: Number(weight) };
    await addWeighInLS(userId, log);
    setWeight('');
    onDone();
  }

  return (
    <div className="flex gap-2">
      <input
        className="border rounded px-3 py-2 w-28"
        type="number"
        step="0.1"
        placeholder="กก."
        value={weight}
        onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
      />
      <Button onClick={submit}>บันทึกน้ำหนัก</Button>
    </div>
  );
}
