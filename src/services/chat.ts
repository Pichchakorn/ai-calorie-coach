// src/services/chat.ts
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatResponse = { reply: string };

// fetch พร้อม timeout กันแฮงก์
async function fetchJSON(
  input: RequestInfo | URL,
  init: (RequestInit & { timeoutMs?: number }) = {}
) {
  const { timeoutMs = 20000, ...rest } = init;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: ac.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendChat(
  messages: ChatMessage[],
  opts?: { timeoutMs?: number }
): Promise<string> {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }

  const res = await fetchJSON('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    timeoutMs: opts?.timeoutMs ?? 20000,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = (j && (j.message || j.error)) || msg;
    } catch {
      msg = (await res.text().catch(() => '')) || msg;
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as Partial<ChatResponse>;
  return typeof data.reply === 'string' ? data.reply : '';
}

// helper ยิง prompt เดี่ยว ๆ
export async function ask(prompt: string): Promise<string> {
  return sendChat([
    { role: 'system', content: 'คุณคือผู้ช่วยโภชนาการ พูดไทย สุภาพ กระชับ' },
    { role: 'user', content: prompt },
  ]);
}
