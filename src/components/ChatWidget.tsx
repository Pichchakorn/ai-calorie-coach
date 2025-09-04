import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatWidget() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'สวัสดี! ถามอะไรก็ได้เกี่ยวกับโภชนาการ/แผนอาหาร 😊' },
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!text.trim()) return;
    const newMsgs = [...messages, { role: 'user', content: text.trim() } as Msg];
    setMessages(newMsgs);
    setText('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'ตอบสั้น กระชับ สุภาพ ภาษาไทย' },
            ...newMsgs,
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const reply = (data?.reply ?? '').toString();
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      toast.error(e?.message || 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <Card className="border-muted">
      <CardHeader>
        <CardTitle>โค้ชโภชนาการ (แชต)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64 overflow-y-auto rounded border p-3 bg-muted/30 text-sm">
          {messages.map((m, i) => (
            <div key={i} className={`mb-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block rounded px-3 py-2 ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="opacity-70 text-xs">กำลังพิมพ์…</div>}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="พิมพ์คำถาม…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
          />
          <Button onClick={send} disabled={loading}>
            ส่ง
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
