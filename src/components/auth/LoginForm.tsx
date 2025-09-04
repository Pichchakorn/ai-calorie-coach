import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LoginData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, LogIn, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setField =
    (k: keyof LoginData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((p) => ({ ...p, [k]: e.target.value }));

  const mapFirebaseError = (code?: string) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      case 'auth/invalid-email':
        return 'รูปแบบอีเมลไม่ถูกต้อง';
      case 'auth/too-many-requests':
        return 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่';
      case 'auth/network-request-failed':
        return 'เครือข่ายมีปัญหา กรุณาลองใหม่';
      default:
        return 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isLoading) return;

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      toast.error('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
      // สำเร็จแล้ว toast ถูกยิงจาก AuthContext อยู่แล้ว
    } catch (err: any) {
      const msg = mapFirebaseError(err?.code);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // เติมข้อมูลทดลองแบบตั้งใจ (ถ้าใช้ emulator หรืออยากให้ผู้ใช้ลองกรอก)
  const handleDemoFill = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'demo123',
    });
    toast.info('กรอกข้อมูลทดลองให้แล้ว กด “เข้าสู่ระบบ” เพื่อดำเนินการ');
  };

  const disabled = isLoading || submitting;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          'linear-gradient(135deg, oklch(0.98 0.04 230 / 0.3), oklch(0.98 0.04 330 / 0.2))',
      }}
    >
      <Card
        className="w-full max-w-md"
        style={{
          background:
            'linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.98 0.04 230 / 0.4) 30%, oklch(0.98 0.04 330 / 0.3) 70%, oklch(1 0 0) 100%)',
          border: '1px solid oklch(0.9 0.08 280 / 0.3)',
          boxShadow:
            '0 8px 32px 0 oklch(0.6 0.2 230 / 0.15), 0 4px 16px 0 oklch(0.75 0.18 330 / 0.1), 0 0 0 1px oklch(0.7 0.15 280 / 0.1)',
        }}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div
              className="p-3 rounded-full"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))',
              }}
            >
              <Calculator className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <LogIn className="h-5 w-5 text-ocean" />
            <span className="text-ocean">เข้าสู่ระบบ</span>
          </CardTitle>
          <CardDescription>
            เข้าสู่ระบบ <span className="text-sunset font-medium">AI Calorie Coach</span>{' '}
            เพื่อจัดการแผนอาหารของคุณ
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-deep-blue font-medium">
                อีเมล
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={setField('email')}
                placeholder="your@email.com"
                className="border-ocean/30 focus:border-ocean focus:ring-ocean/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-deep-blue font-medium">
                รหัสผ่าน
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={setField('password')}
                  placeholder="รหัสผ่าน"
                  className="border-sunset/30 focus:border-sunset focus:ring-sunset/20 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-sunset"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-white"
              disabled={disabled}
              style={{
                background: disabled
                  ? 'oklch(0.8 0.02 240)'
                  : 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330), oklch(0.7 0.15 280))',
              }}
            >
              {disabled ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">หรือ</span>
              </div>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">ยังไม่มีบัญชี? </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sunset hover:text-sunset/80"
                onClick={onSwitchToRegister}
              >
                ลงทะเบียน
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
