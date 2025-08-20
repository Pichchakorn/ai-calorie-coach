import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RegisterData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, UserPlus, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    await register(formData);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, oklch(0.98 0.04 330 / 0.3), oklch(0.98 0.04 230 / 0.2))'
      }}
    >
      <Card 
        className="w-full max-w-md"
        style={{
          background: 'linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.98 0.04 330 / 0.4) 30%, oklch(0.98 0.04 230 / 0.3) 70%, oklch(1 0 0) 100%)',
          border: '1px solid oklch(0.9 0.08 280 / 0.3)',
          boxShadow: '0 8px 32px 0 oklch(0.75 0.18 330 / 0.15), 0 4px 16px 0 oklch(0.6 0.2 230 / 0.1), 0 0 0 1px oklch(0.7 0.15 280 / 0.1)'
        }}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div 
              className="p-3 rounded-full"
              style={{ background: 'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.6 0.2 230))' }}
            >
              <Calculator className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <UserPlus className="h-5 w-5 text-sunset" />
            <span className="text-sunset">ลงทะเบียน</span>
          </CardTitle>
          <CardDescription>
            สร้างบัญชี <span className="text-ocean font-medium">AI Calorie Coach</span> ใหม่
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-deep-blue font-medium">ชื่อ-นามสกุล</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ชื่อ นามสกุล"
                className="border-sunset/30 focus:border-sunset focus:ring-sunset/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-deep-blue font-medium">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="border-ocean/30 focus:border-ocean focus:ring-ocean/20"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-deep-blue font-medium">รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  className="border-lavender/30 focus:border-lavender focus:ring-lavender/20 pr-10"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-lavender"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-deep-blue font-medium">ยืนยันรหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="ยืนยันรหัสผ่าน"
                  className="border-sky/30 focus:border-sky focus:ring-sky/20 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-sky"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full text-white"
              disabled={isLoading}
              style={{
                background: isLoading 
                  ? 'oklch(0.8 0.02 240)' 
                  : 'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.6 0.2 230), oklch(0.7 0.15 280))'
              }}
            >
              {isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">มีบัญชีแล้ว? </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-ocean hover:text-ocean/80"
                onClick={onSwitchToLogin}
              >
                เข้าสู่ระบบ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}