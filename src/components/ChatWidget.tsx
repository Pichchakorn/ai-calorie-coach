// src/components/ChatWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { sendChat, ChatMessage } from '../services/chat';

export default function ChatWidget() {
  // เก็บ history ไว้ทั้ง session
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content:
        'คุณเป็นนักโภชนาการที่สุภาพ ให้คำแนะนำเรื่องโภชนาการและแผนอาหาร ตอบสั้น กระชับ ภาษาไทย',
    },
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  async function onAsk() {
    const content = text.trim();
    if (!content || loading) return;

    // ต่อบทสนทนา
    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setText('');
    setLoading(true);

    try {
      // ส่ง history ทั้งหมดให้ backend
      const { reply } = await sendChat(next);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      toast.error(e?.message || 'ส่งข้อความไม่สำเร็จ');
      setMessages([
        ...next,
        { role: 'assistant', content: 'ขออภัย เกิดข้อผิดพลาดในการตอบคำถาม' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void onAsk();
    }
  }

  // Auto scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <Card className="border-muted">
      <CardHeader>
        <CardTitle>โค้ชโภชนาการ (แชต)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          ref={chatRef}
          className="h-64 overflow-y-auto rounded border p-3 bg-muted/30 text-sm"
        >
          {messages
            .filter((m) => m.role !== 'system')
            .map((m, i) => (
              <div
                key={i}
                className={`mb-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block rounded px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
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
            disabled={loading}
          />
          <Button onClick={onAsk} disabled={loading || !text.trim()}>
            {loading ? 'กำลังส่ง…' : 'ส่ง'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
