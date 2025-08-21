import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CalorieCalculation, UserProfile } from '../types';
import {
  formatCalories,
  formatWeight,
  getGoalText,
  getActivityText,
  calculateTimeToGoal,
  calculateWeeklyWeightChange,
} from '../utils/calculations';
import {
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Scale,
  Zap,
  Activity as ActivityIcon,
} from 'lucide-react';

interface CalorieResultProps {
  profile: UserProfile;
  calculation: CalorieCalculation;
}

export function CalorieResult({ profile, calculation }: CalorieResultProps) {
  const goalIcon = useMemo(() => {
    switch (profile.goal) {
      case 'lose':
        return <TrendingDown className="h-4 w-4" />;
      case 'gain':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  }, [profile.goal]);

  const goalBadgeClass = useMemo(() => {
    switch (profile.goal) {
      case 'lose':
        return 'text-rose border-rose bg-rose/10';
      case 'gain':
        return 'text-ocean border-ocean bg-ocean/10';
      default:
        return 'text-deep-blue border-deep-blue bg-deep-blue/10';
    }
  }, [profile.goal]);

  // กัน NaN/Infinity ถ้า calculation.deficitOrSurplus เป็น 0 หรือข้อมูลไม่ครบ
  const weeklyWeightChangeRaw = useMemo(
    () => calculateWeeklyWeightChange(calculation.deficitOrSurplus),
    [calculation.deficitOrSurplus],
  );
  const weeklyWeightChange = Number.isFinite(weeklyWeightChangeRaw)
    ? weeklyWeightChangeRaw
    : 0;

  const timeToGoalRaw = useMemo(() => {
    if (!profile.targetWeight) return 0;
    return calculateTimeToGoal(profile, calculation.deficitOrSurplus);
  }, [profile, calculation.deficitOrSurplus]);
  const timeToGoal = Number.isFinite(timeToGoalRaw) ? timeToGoalRaw : 0;

  const weightDiff =
    typeof profile.targetWeight === 'number'
      ? Math.abs(profile.weight - profile.targetWeight)
      : 0;

  return (
    <div className="space-y-6">
      {/* ข้อมูลส่วนตัว */}
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
            ข้อมูลของคุณ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div
              className="p-4 rounded-xl text-white"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))',
              }}
            >
              <div className="text-2xl">
                {profile.gender === 'male' ? 'ชาย' : 'หญิง'}
              </div>
              <div className="text-sm opacity-90">เพศ</div>
            </div>
            <div
              className="p-4 rounded-xl text-white"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.7 0.15 320))',
              }}
            >
              <div className="text-2xl">{profile.age}</div>
              <div className="text-sm opacity-90">ปี</div>
            </div>
            <div
              className="p-4 rounded-xl text-white"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.7 0.15 280), oklch(0.65 0.18 300))',
              }}
            >
              <div className="text-2xl">{formatWeight(profile.weight)}</div>
              <div className="text-sm opacity-90">กก.</div>
            </div>
            <div
              className="p-4 rounded-xl text-white"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.75 0.12 210), oklch(0.7 0.16 240))',
              }}
            >
              <div className="text-2xl">{profile.height}</div>
              <div className="text-sm opacity-90">ซม.</div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">การออกกำลังกาย:</span>
              <Badge
                variant="outline"
                className="text-sunset border-sunset bg-sunset/10"
              >
                <ActivityIcon className="h-3 w-3 mr-1" />
                {getActivityText(profile.activityLevel)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">เป้าหมาย:</span>
              <Badge className={goalBadgeClass}>
                {goalIcon}
                <span className="ml-1">{getGoalText(profile.goal)}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* เป้าหมายเฉพาะ */}
      {profile.targetWeight != null &&
        profile.timeframe &&
        profile.goal !== 'maintain' && (
          <Card
            style={{
              boxShadow:
                '0 4px 14px 0 oklch(0.75 0.18 330 / 0.2), 0 0 0 1px oklch(0.75 0.18 330 / 0.1)',
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-sunset" />
                เป้าหมายของคุณ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-muted/50 rounded-xl border border-muted">
                    <div className="text-2xl text-muted-foreground">
                      {formatWeight(profile.weight)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      น้ำหนักปัจจุบัน
                    </div>
                  </div>
                  <div
                    className="p-4 text-white rounded-xl"
                    style={{
                      background:
                        'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))',
                    }}
                  >
                    <div className="text-2xl">
                      {formatWeight(profile.targetWeight)}
                    </div>
                    <div className="text-sm opacity-90">น้ำหนักเป้าหมาย</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">การเปลี่ยนแปลง:</span>
                    <span className="font-medium text-ocean">
                      {formatWeight(weightDiff)} กก.
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ระยะเวลา:</span>
                    <span className="font-medium text-sunset">
                      {profile.timeframe} สัปดาห์
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ต่อสัปดาห์:</span>
                    <span
                      className={`font-medium ${
                        Math.abs(weeklyWeightChange) > 1
                          ? 'text-rose'
                          : 'text-ocean'
                      }`}
                    >
                      {formatWeight(Math.abs(weeklyWeightChange))} กก./สัปดาห์
                    </span>
                  </div>
                </div>

                {timeToGoal > 0 && timeToGoal !== profile.timeframe && (
                  <div className="p-4 bg-warning/10 text-warning-foreground rounded-xl border border-warning/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>
                        ตามแผนแคลอรี่ที่คำนวณ คาดว่าจะใช้เวลา {timeToGoal}{' '}
                        สัปดาห์
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* ผลการคำนวณแคลอรี่ */}
      <Card
        style={{
          boxShadow:
            '0 4px 14px 0 oklch(0.6 0.2 230 / 0.2), 0 0 0 1px oklch(0.6 0.2 230 / 0.1)',
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-sunset" />
            ความต้องการแคลอรี่รายวัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-muted/30 rounded-xl border border-muted">
              <div className="text-3xl mb-2 text-deep-blue">
                {formatCalories(calculation.bmr)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                BMR
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                พลังงานพื้นฐาน
              </div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-xl border border-muted">
              <div className="text-3xl mb-2 text-sunset">
                {formatCalories(calculation.tdee)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                TDEE
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                พลังงานรวม/วัน
              </div>
            </div>
            <div
              className="text-center p-6 text-white rounded-xl"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))',
              }}
            >
              <div className="text-3xl mb-2">
                {formatCalories(calculation.targetCalories)}
              </div>
              <div className="text-sm opacity-90 font-medium">เป้าหมาย</div>
              <div className="text-xs opacity-80 mt-1">แคลอรี่ที่ควรกิน</div>
            </div>
          </div>

          {calculation.deficitOrSurplus !== 0 && (
            <div
              className="mt-6 p-4 rounded-xl border"
              style={{
                backgroundColor:
                  calculation.deficitOrSurplus < 0
                    ? 'oklch(0.95 0.05 320 / 0.5)'
                    : 'oklch(0.95 0.05 230 / 0.5)',
                borderColor:
                  calculation.deficitOrSurplus < 0
                    ? 'oklch(0.65 0.2 320 / 0.3)'
                    : 'oklch(0.6 0.2 230 / 0.3)',
              }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {calculation.deficitOrSurplus < 0 ? (
                    <TrendingDown className="h-4 w-4 text-rose" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-ocean" />
                  )}
                  <span className="text-sm font-medium">
                    {calculation.deficitOrSurplus < 0 ? 'Deficit' : 'Surplus'}:{' '}
                    {formatCalories(Math.abs(calculation.deficitOrSurplus))}{' '}
                    แคลอรี่/วัน
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    คาดการณ์การเปลี่ยนแปลงน้ำหนัก:{' '}
                    {formatWeight(Math.abs(weeklyWeightChange))} กก./สัปดาห์
                  </div>
                  {profile.targetWeight && profile.timeframe && (
                    <div>
                      เป้าหมาย: {formatWeight(weightDiff)} กก. ใน{' '}
                      {profile.timeframe} สัปดาห์
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* สัดส่วนสารอาหาร */}
      <Card
        style={{
          boxShadow:
            '0 4px 14px 0 oklch(0.7 0.15 280 / 0.2), 0 0 0 1px oklch(0.7 0.15 280 / 0.1)',
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sunset" />
            สัดส่วนสารอาหาร (Macronutrients)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-3">
              <span className="font-medium text-lavender">โปรตีน</span>
              <span className="font-medium text-lavender">
                {calculation.macroBreakdown.protein} กรัม (30%)
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[30%] bg-lavender rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-3">
              <span className="font-medium text-sky">คาร์โบไฮเดรต</span>
              <span className="font-medium text-sky">
                {calculation.macroBreakdown.carbs} กรัม (40%)
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[40%] bg-sky rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-3">
              <span className="font-medium text-rose">ไขมัน</span>
              <span className="font-medium text-rose">
                {calculation.macroBreakdown.fat} กรัม (30%)
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[30%] bg-rose rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ถ้าอยาก import แบบ default ก็เปิดบรรทัดด้านล่างได้
// export default CalorieResult;
