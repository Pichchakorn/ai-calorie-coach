import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, DailyPlan } from '../types';
import {
  formatCalories,
  formatWeight,
  getGoalText,
  getActivityText,
  calculateTargetCalories,
  calculateTDEE,
} from '../utils/calculations';
import {
  Calculator,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Utensils,
  Activity as ActivityIcon,
  Calendar,
  Plus,
  Settings,
  BarChart3,
  Clock,
  Zap,
  Heart,
  Info,
  Sparkles,
} from 'lucide-react';

interface DashboardProps {
  onCreatePlan: () => void;
  onNavigateToSettings: () => void;
  recentPlans?: DailyPlan[];
}

export function Dashboard({ onCreatePlan, onNavigateToSettings, recentPlans = [] }: DashboardProps) {
  const { user } = useAuth();
  const [quickPlanLoading, setQuickPlanLoading] = useState(false);

  // --- BMR (Mifflin–St Jeor) ---
  const calcBMR = (p: UserProfile) => {
    const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
    return p.gender === 'male' ? base + 5 : base - 161;
  };

  const handleQuickPlan = async () => {
    if (!user?.profile) return;
    setQuickPlanLoading(true);
    try {
      // เดิมจำลองดีเลย์ไว้ เผื่อค่อยเปลี่ยนเป็น call service จริง
      await new Promise((r) => setTimeout(r, 800));
      onCreatePlan();
    } finally {
      setQuickPlanLoading(false);
    }
  };

  const getGoalIcon = (goal: UserProfile['goal']) => {
    switch (goal) {
      case 'lose':
        return <TrendingDown className="h-4 w-4 text-rose" />;
      case 'gain':
        return <TrendingUp className="h-4 w-4 text-ocean" />;
      default:
        return <Minus className="h-4 w-4 text-deep-blue" />;
    }
  };

  const goalProgress = useMemo(() => {
    const p = user?.profile;
    if (!p?.targetWeight || !p?.timeframe) return null;
    const totalChange = Math.abs(p.targetWeight - p.weight);
    const weeksPassed = 2; // TODO: คำนวณจริงจาก start date ถ้ามี
    const progressPercentage = Math.min((weeksPassed / p.timeframe) * 100, 100);
    return { totalChange, weeksPassed, timeframe: p.timeframe, progressPercentage };
  }, [user?.profile]);

  const healthStats = useMemo(() => {
    const p = user?.profile;
    if (!p) return null;
    // ต้องมีอายุ/น้ำหนัก/ส่วนสูงครบจึงคำนวณได้
    if (!(p.age && p.weight && p.height && p.activityLevel)) return null;

    const bmr = calcBMR(p);
    const tdee = calculateTDEE(bmr, p.activityLevel);
    return calculateTargetCalories(p, tdee);
  }, [user?.profile]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="flex items-center justify-center gap-3">
          <BarChart3 className="h-8 w-8 text-ocean" />
          แดชบอร์ด
        </h1>
        <p className="text-lg text-muted-foreground">
          ยินดีต้อนรับ, <span className="text-ocean font-medium">{user?.name}</span>! ติดตามความคืบหน้าและจัดการแผนอาหารของคุณ
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="text-white border-0"
          style={{
            background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))',
            boxShadow: '0 4px 14px 0 oklch(0.6 0.2 230 / 0.2), 0 0 0 1px oklch(0.6 0.2 230 / 0.1)',
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  แผนอาหารใหม่
                </h4>
                <p className="text-sm opacity-90">สร้างแผนอาหารวันนี้</p>
              </div>
              <Button
                onClick={handleQuickPlan}
                disabled={!user?.profile || quickPlanLoading}
                className="shrink-0 bg-white/20 hover:bg-white/30 border-white/30"
                variant="outline"
              >
                {quickPlanLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white border-0"
          style={{
            background: 'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.7 0.15 320))',
            boxShadow: '0 4px 14px 0 oklch(0.75 0.18 330 / 0.2), 0 0 0 1px oklch(0.75 0.18 330 / 0.1)',
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  ตั้งค่าโปรไฟล์
                </h4>
                <p className="text-sm opacity-90">อัปเดตข้อมูลส่วนตัว</p>
              </div>
              <Button variant="outline" onClick={onNavigateToSettings} className="bg-white/20 hover:bg-white/30 border-white/30">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white border-0"
          style={{
            background: 'linear-gradient(135deg, oklch(0.7 0.15 280), oklch(0.65 0.18 300))',
            boxShadow: '0 4px 14px 0 oklch(0.7 0.15 280 / 0.2), 0 0 0 1px oklch(0.7 0.15 280 / 0.1)',
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  คำนวณใหม่
                </h4>
                <p className="text-sm opacity-90">ปรับแผนตามเป้าหมายใหม่</p>
              </div>
              <Button variant="outline" onClick={onCreatePlan} className="bg-white/20 hover:bg-white/30 border-white/30">
                <Calculator className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Overview */}
          {user?.profile && (
            <Card
              style={{
                background:
                  'linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.98 0.04 230 / 0.4) 30%, oklch(0.98 0.04 330 / 0.3) 70%, oklch(1 0 0) 100%)',
                border: '1px solid oklch(0.9 0.08 280 / 0.3)',
                boxShadow:
                  '0 8px 32px 0 oklch(0.6 0.2 230 / 0.15), 0 4px 16px 0 oklch(0.75 0.18 330 / 0.1), 0 0 0 1px oklch(0.7 0.15 280 / 0.1)',
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-ocean" />
                  โปรไฟล์สุขภาพ
                </CardTitle>
                <CardDescription>ข้อมูลปัจจุบันและเป้าหมายของคุณ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div
                    className="text-center p-4 text-white rounded-xl"
                    style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))' }}
                  >
                    <div className="text-xl">{formatWeight(user.profile.weight)}</div>
                    <div className="text-sm opacity-90">น้ำหนักปัจจุบัน</div>
                  </div>
                  <div
                    className="text-center p-4 text-white rounded-xl"
                    style={{ background: 'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.7 0.15 320))' }}
                  >
                    <div className="text-xl">{user.profile.height}</div>
                    <div className="text-sm opacity-90">ส่วนสูง (ซม.)</div>
                  </div>
                  <div
                    className="text-center p-4 text-white rounded-xl"
                    style={{ background: 'linear-gradient(135deg, oklch(0.7 0.15 280), oklch(0.65 0.18 300))' }}
                  >
                    <div className="text-xl">{user.profile.age}</div>
                    <div className="text-sm opacity-90">อายุ (ปี)</div>
                  </div>
                  <div
                    className="text-center p-4 text-white rounded-xl"
                    style={{ background: 'linear-gradient(135deg, oklch(0.75 0.12 210), oklch(0.7 0.16 240))' }}
                  >
                    <div className="text-xl">{user.profile.gender === 'male' ? 'ชาย' : 'หญิง'}</div>
                    <div className="text-sm opacity-90">เพศ</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">เป้าหมาย:</span>
                    <Badge variant="outline" className="flex items-center gap-1 text-ocean border-ocean bg-ocean/10">
                      {getGoalIcon(user.profile.goal)}
                      {getGoalText(user.profile.goal)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">การออกกำลังกาย:</span>
                    <Badge className="bg-sunset text-white">
                      <ActivityIcon className="h-3 w-3 mr-1" />
                      {getActivityText(user.profile.activityLevel)}
                    </Badge>
                  </div>
                  {user.profile.targetWeight && user.profile.timeframe && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">น้ำหนักเป้าหมาย:</span>
                      <span className="font-medium text-ocean">{formatWeight(user.profile.targetWeight)} กก.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goal Progress */}
          {goalProgress && (
            <Card style={{ boxShadow: '0 4px 14px 0 oklch(0.75 0.18 330 / 0.2), 0 0 0 1px oklch(0.75 0.18 330 / 0.1)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-sunset" />
                  ความคืบหน้าเป้าหมาย
                </CardTitle>
                <CardDescription>การติดตามเป้าหมายน้ำหนักของคุณ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>ความคืบหน้า:</span>
                  <span className="text-sunset font-medium">
                    {goalProgress.weeksPassed} / {goalProgress.timeframe} สัปดาห์
                  </span>
                </div>
                <div className="relative">
                  <Progress value={goalProgress.progressPercentage} className="h-4" />
                  <div
                    className="absolute inset-0 opacity-80 rounded-full"
                    style={{
                      background:
                        'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330), oklch(0.7 0.15 280))',
                      width: `${goalProgress.progressPercentage}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-muted/50 rounded-xl border border-muted">
                    <div className="text-lg text-sunset">{formatWeight(goalProgress.totalChange)}</div>
                    <div className="text-sm text-muted-foreground">เป้าหมายทั้งหมด</div>
                  </div>
                  <div
                    className="p-4 text-white rounded-xl"
                    style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))' }}
                  >
                    <div className="text-lg">{Math.round(goalProgress.progressPercentage)}%</div>
                    <div className="text-sm opacity-90">เสร็จสิ้น</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-deep-blue" />
                กิจกรรมล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPlans.length > 0 ? (
                <div className="space-y-3">
                  {recentPlans.slice(0, 3).map((plan, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-muted"
                    >
                      <div>
                        <div className="font-medium">แผนอาหาร {plan.mealPlan.date}</div>
                        <div className="text-sm text-deep-blue">{plan.mealPlan.totalCalories} แคลอรี่</div>
                      </div>
                      <Badge variant="outline" className="text-ocean border-ocean bg-ocean/10">
                        {getGoalText(plan.profile.goal)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div
                    className="text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))' }}
                  >
                    <Calendar className="h-8 w-8" />
                  </div>
                  <p className="text-lg">ยังไม่มีแผนอาหารที่สร้าง</p>
                  <p className="text-sm">เริ่มสร้างแผนแรกของคุณกันเลย!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Health Stats */}
          {healthStats && (
            <Card style={{ boxShadow: '0 4px 14px 0 oklch(0.6 0.2 230 / 0.2), 0 0 0 1px oklch(0.6 0.2 230 / 0.1)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-sunset" />
                  สถิติสุขภาพ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-deep-blue/10 rounded-lg border border-deep-blue/20">
                    <span className="text-sm">BMR:</span>
                    <span className="font-medium text-deep-blue">{formatCalories(healthStats.bmr)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-sunset/10 rounded-lg border border-sunset/20">
                    <span className="text-sm">TDEE:</span>
                    <span className="font-medium text-sunset">{formatCalories(healthStats.tdee)}</span>
                  </div>
                  <div
                    className="flex justify-between p-3 text-white rounded-lg"
                    style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))' }}
                  >
                    <span className="text-sm">เป้าหมายรายวัน:</span>
                    <span className="font-medium">{formatCalories(healthStats.targetCalories)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h5 className="mb-3 text-sm font-medium">สัดส่วนสารอาหาร</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm p-2 bg-lavender/10 rounded border border-lavender/20">
                      <span className="text-lavender">โปรตีน</span>
                      <span className="text-lavender font-medium">{healthStats.macroBreakdown.protein}g</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-sky/10 rounded border border-sky/20">
                      <span className="text-sky">คาร์โบไฮเดรต</span>
                      <span className="text-sky font-medium">{healthStats.macroBreakdown.carbs}g</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-rose/10 rounded border border-rose/20">
                      <span className="text-rose">ไขมัน</span>
                      <span className="text-rose font-medium">{healthStats.macroBreakdown.fat}g</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Tips */}
          <Card style={{ boxShadow: '0 4px 14px 0 oklch(0.7 0.15 280 / 0.2), 0 0 0 1px oklch(0.7 0.15 280 / 0.1)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose" />
                เคล็ดลับสุขภาพ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-info/20 bg-info/10">
                <Info className="h-4 w-4 text-info" />
                <AlertDescription className="text-info">
                  ดื่มน้ำให้เพียงพอ อย่างน้อย 8-10 แก้วต่อวัน
                </AlertDescription>
              </Alert>

              <div
                className="p-4 text-white rounded-xl"
                style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))' }}
              >
                <h5 className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  วันนี้แนะนำ
                </h5>
                <ul className="text-sm space-y-2 opacity-90">
                  <li>• เดิน 30 นาทีหลังอาหาร</li>
                  <li>• กินผักผลไม้ 5 หลากสี</li>
                  <li>• นอนให้เพียงพอ 7-8 ชั่วโมง</li>
                  <li>• หลีกเลี่ยงอาหารทอด</li>
                </ul>
              </div>

              <div
                className="p-4 text-white rounded-xl"
                style={{ background: 'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.7 0.15 320))' }}
              >
                <p className="text-sm">
                  <strong>สุขภาพดีเริ่มต้นจากการกินที่ถูกต้อง!</strong>
                  <br />
                  ติดตามแผนอาหารสม่ำเสมอเพื่อผลลัพธ์ที่ดีที่สุด
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Setup */}
          {!user?.profile && (
            <Card className="border-warning/20 bg-warning/10">
              <CardHeader>
                <CardTitle className="text-warning">เริ่มต้นใช้งาน</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-warning-foreground mb-4">กรุณาตั้งค่าโปรไฟล์ของคุณเพื่อเริ่มสร้างแผนอาหาร</p>
                <Button
                  onClick={onNavigateToSettings}
                  className="w-full text-white border-0"
                  style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))' }}
                >
                  ตั้งค่าโปรไฟล์
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
