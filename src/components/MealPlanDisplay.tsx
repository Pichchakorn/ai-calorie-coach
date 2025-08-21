// src/components/MealPlanDisplay.tsx
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MealPlan, FoodItem } from "../types";
import { formatCalories } from "../utils/calculations";
import { Coffee, Sun, Moon, Cookie, Shuffle, Utensils } from "lucide-react";

interface MealPlanDisplayProps {
  mealPlan: MealPlan;
  targetCalories: number;
  onGenerateNew: () => void;
}

function safeArray<T>(a?: T[]): T[] {
  return Array.isArray(a) ? a : [];
}

function sumBy<T>(arr: T[], selector: (x: T) => number): number {
  return arr.reduce((s, x) => s + (Number(selector(x)) || 0), 0);
}

function Section({
  title,
  tint,
  foods,
  icon,
  badgeColor,
}: {
  title: string;
  tint:
    | "ocean"
    | "sunset"
    | "lavender"
    | "sky"
    | "mixedOcean"
    | "mixedSunset"
    | "mixedLavender"
    | "mixedSky";
  foods: FoodItem[];
  icon: React.ReactNode;
  badgeColor:
    | "ocean"
    | "sunset"
    | "lavender"
    | "sky";
}) {
  const kcal = useMemo(() => sumBy(foods, (f) => f.calories || 0), [foods]);

  const cardShadowByTint: Record<string, string> = {
    mixedOcean: "0 4px 14px 0 oklch(0.6 0.2 230 / 0.2), 0 0 0 1px oklch(0.6 0.2 230 / 0.1)",
    mixedSunset: "0 4px 14px 0 oklch(0.75 0.18 330 / 0.2), 0 0 0 1px oklch(0.75 0.18 330 / 0.1)",
    mixedLavender: "0 4px 14px 0 oklch(0.7 0.15 280 / 0.2), 0 0 0 1px oklch(0.7 0.15 280 / 0.1)",
    mixedSky: "0 4px 14px 0 oklch(0.75 0.12 210 / 0.2), 0 0 0 1px oklch(0.75 0.12 210 / 0.1)",
    ocean: "",
    sunset: "",
    lavender: "",
    sky: "",
  };

  const badgeClassByTint: Record<typeof badgeColor, string> = {
    ocean: "text-ocean border-ocean bg-ocean/10",
    sunset: "text-sunset border-sunset bg-sunset/10",
    lavender: "text-lavender border-lavender bg-lavender/10",
    sky: "text-sky border-sky bg-sky/10",
  };

  return (
    <Card style={{ boxShadow: cardShadowByTint[tint] ?? "" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div
            className="p-2 rounded-lg text-white"
            style={{
              background:
                tint === "mixedOcean"
                  ? "linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))"
                  : tint === "mixedSunset"
                  ? "linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.7 0.15 320))"
                  : tint === "mixedLavender"
                  ? "linear-gradient(135deg, oklch(0.7 0.15 280), oklch(0.65 0.18 300))"
                  : "linear-gradient(135deg, oklch(0.75 0.12 210), oklch(0.7 0.16 240))",
            }}
          >
            {icon}
          </div>
          <span
            className={
              tint === "mixedOcean"
                ? "text-ocean"
                : tint === "mixedSunset"
                ? "text-sunset"
                : tint === "mixedLavender"
                ? "text-lavender"
                : "text-sky"
            }
          >
            {title}
          </span>
          <Badge variant="outline" className={badgeClassByTint[badgeColor]}>
            {formatCalories(kcal)} kcal
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {foods.length === 0 ? (
          <div className="text-sm text-muted-foreground">ไม่มีรายการอาหาร</div>
        ) : (
          <div className="space-y-3">
            {foods.map((food, i) => (
              <div
                key={`${food.name}-${i}`}
                className="flex justify-between items-start p-3 bg-muted/50 rounded-lg border border-muted"
              >
                <div className="flex-1">
                  <div className="mb-1 font-medium">{food.name}</div>
                  {food.portion ? (
                    <div className="text-sm text-muted-foreground">{food.portion}</div>
                  ) : null}
                  <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                    <span className="text-lavender">
                      โปรตีน {Number(food.protein || 0)}g
                    </span>
                    <span className="text-sky">คาร์บ {Number(food.carbs || 0)}g</span>
                    <span className="text-rose">ไขมัน {Number(food.fat || 0)}g</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-deep-blue">
                  {formatCalories(Number(food.calories || 0))} kcal
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MealPlanDisplay({
  mealPlan,
  targetCalories,
  onGenerateNew,
}: MealPlanDisplayProps) {
  // กัน null / undefined จาก backend
  const breakfast = useMemo(() => safeArray(mealPlan?.breakfast), [mealPlan]);
  const lunch = useMemo(() => safeArray(mealPlan?.lunch), [mealPlan]);
  const dinner = useMemo(() => safeArray(mealPlan?.dinner), [mealPlan]);
  const snacks = useMemo(() => safeArray(mealPlan?.snacks), [mealPlan]);

  const totalCalories = useMemo(
    () =>
      Number(mealPlan?.totalCalories) ||
      sumBy([...breakfast, ...lunch, ...dinner, ...snacks], (f) => f.calories || 0),
    [mealPlan?.totalCalories, breakfast, lunch, dinner, snacks]
  );

  const totals = useMemo(() => {
    const all = [...breakfast, ...lunch, ...dinner, ...snacks];
    return {
      protein: sumBy(all, (f) => f.protein || 0),
      carbs: sumBy(all, (f) => f.carbs || 0),
      fat: sumBy(all, (f) => f.fat || 0),
    };
  }, [breakfast, lunch, dinner, snacks]);

  const progress = useMemo(() => {
    const pct =
      targetCalories > 0 ? Math.min((totalCalories / targetCalories) * 100, 100) : 0;
    return {
      pct,
      isOver: targetCalories > 0 ? totalCalories > targetCalories : false,
      diff: targetCalories - totalCalories,
    };
  }, [targetCalories, totalCalories]);

  const headerBg =
    "linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.98 0.04 230 / 0.4) 30%, oklch(0.98 0.04 330 / 0.3) 70%, oklch(1 0 0) 100%)";

  return (
    <div className="space-y-6">
      {/* Header + Regenerate */}
      <Card
        style={{
          background: headerBg,
          border: "1px solid oklch(0.9 0.08 280 / 0.3)",
          boxShadow:
            "0 8px 32px 0 oklch(0.6 0.2 230 / 0.15), 0 4px 16px 0 oklch(0.75 0.18 330 / 0.1), 0 0 0 1px oklch(0.7 0.15 280 / 0.1)",
        }}
      >
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-ocean" />
              แผนอาหารวันนี้
            </CardTitle>
            <Button
              onClick={onGenerateNew}
              variant="outline"
              className="flex items-center gap-2 border-sunset text-sunset hover:bg-sunset/10"
            >
              <Shuffle className="h-4 w-4" />
              สุ่มเมนูใหม่
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="text-center p-6 rounded-xl"
            style={{
              background: progress.isOver
                ? "linear-gradient(135deg, oklch(0.95 0.05 320 / 0.3), oklch(0.92 0.08 330 / 0.2))"
                : "linear-gradient(135deg, oklch(0.95 0.05 230 / 0.3), oklch(0.92 0.08 210 / 0.2))",
              border: `1px solid ${
                progress.isOver
                  ? "oklch(0.65 0.2 320 / 0.3)"
                  : "oklch(0.6 0.2 230 / 0.3)"
              }`,
            }}
          >
            <div className="text-3xl mb-2 font-medium">
              <span className="text-deep-blue">{formatCalories(totalCalories)}</span>
              <span className="text-muted-foreground"> / </span>
              <span className="text-ocean">{formatCalories(targetCalories)}</span>
              <span className="text-sm text-muted-foreground ml-2">kcal</span>
            </div>

            <div
              className={`text-sm font-medium ${
                progress.isOver ? "text-rose" : "text-ocean"
              }`}
            >
              {progress.isOver
                ? `เกินเป้าหมาย ${formatCalories(Math.abs(progress.diff))} แคลอรี่`
                : `ต่ำกว่าเป้าหมาย ${formatCalories(Math.max(progress.diff, 0))} แคลอรี่`}
            </div>

            <div className="w-full bg-muted rounded-full h-3 mt-4">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${progress.pct}%`,
                  background: progress.isOver
                    ? "linear-gradient(135deg, oklch(0.65 0.2 320), oklch(0.7 0.15 320))"
                    : "linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="อาหารเช้า"
          tint="mixedOcean"
          foods={breakfast}
          icon={<Coffee className="h-4 w-4" />}
          badgeColor="ocean"
        />
        <Section
          title="อาหารกลางวัน"
          tint="mixedSunset"
          foods={lunch}
          icon={<Sun className="h-4 w-4" />}
          badgeColor="sunset"
        />
        <Section
          title="อาหารเย็น"
          tint="mixedLavender"
          foods={dinner}
          icon={<Moon className="h-4 w-4" />}
          badgeColor="lavender"
        />
        <Section
          title="ของว่าง"
          tint="mixedSky"
          foods={snacks}
          icon={<Cookie className="h-4 w-4" />}
          badgeColor="sky"
        />
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div
              className="p-2 rounded-lg text-white"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330), oklch(0.7 0.15 280))",
              }}
            >
              <Utensils className="h-4 w-4" />
            </div>
            สรุปสารอาหาร
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-lavender/10 rounded-xl border border-lavender/20">
              <div className="text-3xl mb-2 text-lavender font-medium">
                {Math.round(totals.protein)}g
              </div>
              <div className="text-sm text-lavender font-medium">โปรตีน</div>
            </div>
            <div className="text-center p-4 bg-sky/10 rounded-xl border border-sky/20">
              <div className="text-3xl mb-2 text-sky font-medium">
                {Math.round(totals.carbs)}g
              </div>
              <div className="text-sm text-sky font-medium">คาร์โบไฮเดรต</div>
            </div>
            <div className="text-center p-4 bg-rose/10 rounded-xl border border-rose/20">
              <div className="text-3xl mb-2 text-rose font-medium">
                {Math.round(totals.fat)}g
              </div>
              <div className="text-sm text-rose font-medium">ไขมัน</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MealPlanDisplay;
