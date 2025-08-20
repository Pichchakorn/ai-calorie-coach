import { UserProfile, CalorieCalculation, MealPlan, FoodItem } from '../types';

// Activity level multipliers
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Little/no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Heavy exercise 6-7 days/week
  'very-active': 1.9   // Very heavy exercise, twice per day
};

export function calculateBMR(profile: UserProfile): number {
  // Mifflin-St Jeor Equation
  if (profile.gender === 'male') {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }
}

export function calculateTDEE(bmr: number, activityLevel: UserProfile['activityLevel']): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateTargetCalories(profile: UserProfile, tdee: number): CalorieCalculation {
  const bmr = calculateBMR(profile);
  let targetCalories = tdee;
  let deficitOrSurplus = 0;

  if (profile.goal === 'lose' && profile.targetWeight && profile.timeframe) {
    // คำนวณ deficit ตามเป้าหมายที่ผู้ใช้ตั้ง
    const weightToLose = profile.weight - profile.targetWeight;
    const weeksToGoal = profile.timeframe;
    const totalCalorieDeficit = weightToLose * 7700; // 1 kg = 7700 kcal
    const dailyDeficit = totalCalorieDeficit / (weeksToGoal * 7);
    
    // จำกัด deficit ไม่เกิน 1000 kcal/day เพื่อความปลอดภัย
    deficitOrSurplus = -Math.min(dailyDeficit, 1000);
    targetCalories = Math.max(tdee + deficitOrSurplus, bmr * 1.2); // ไม่ให้ต่ำกว่า BMR*1.2
    
  } else if (profile.goal === 'gain' && profile.targetWeight && profile.timeframe) {
    // คำนวณ surplus ตามเป้าหมายที่ผู้ใช้ตั้ง
    const weightToGain = profile.targetWeight - profile.weight;
    const weeksToGoal = profile.timeframe;
    const totalCalorieSurplus = weightToGain * 7700; // 1 kg = 7700 kcal
    const dailySurplus = totalCalorieSurplus / (weeksToGoal * 7);
    
    // จำกัด surplus ไม่เกิน 1000 kcal/day เพื่อความปลอดภัย
    deficitOrSurplus = Math.min(dailySurplus, 1000);
    targetCalories = tdee + deficitOrSurplus;
    
  } else if (profile.goal === 'lose') {
    // ค่าเริ่มต้น: ลด 0.5 kg/week
    deficitOrSurplus = -500;
    targetCalories = Math.max(tdee - 500, bmr * 1.2);
    
  } else if (profile.goal === 'gain') {
    // ค่าเริ่มต้น: เพิ่ม 0.5 kg/week
    deficitOrSurplus = 500;
    targetCalories = tdee + 500;
  }

  // Macro breakdown (40% carbs, 30% protein, 30% fat)
  const proteinCalories = targetCalories * 0.3;
  const carbCalories = targetCalories * 0.4;
  const fatCalories = targetCalories * 0.3;

  return {
    bmr,
    tdee,
    targetCalories,
    deficitOrSurplus,
    macroBreakdown: {
      protein: Math.round(proteinCalories / 4), // 4 kcal per gram
      carbs: Math.round(carbCalories / 4),
      fat: Math.round(fatCalories / 9) // 9 kcal per gram
    }
  };
}

// คำนวณระยะเวลาที่คาดการณ์ว่าจะถึงเป้าหมาย
export function calculateTimeToGoal(profile: UserProfile, dailyDeficitOrSurplus: number): number {
  if (!profile.targetWeight || profile.goal === 'maintain') return 0;
  
  const weightDifference = Math.abs(profile.weight - profile.targetWeight);
  const dailyWeightChange = Math.abs(dailyDeficitOrSurplus) / 7700; // 1 kg = 7700 kcal
  
  if (dailyWeightChange === 0) return 0;
  
  return Math.ceil(weightDifference / (dailyWeightChange * 7)); // weeks
}

// คำนวณการเปลี่ยนแปลงน้ำหนักต่อสัปดาห์
export function calculateWeeklyWeightChange(dailyDeficitOrSurplus: number): number {
  return (dailyDeficitOrSurplus * 7) / 7700; // kg per week
}

// Mock Thai food database
const THAI_FOODS: { [key: string]: FoodItem[] } = {
  breakfast: [
    { name: 'ข้าวต้มหมู', calories: 280, protein: 15, carbs: 35, fat: 8, portion: '1 ชาม' },
    { name: 'โจ๊กหมู', calories: 220, protein: 12, carbs: 30, fat: 6, portion: '1 ชาม' },
    { name: 'ข้าวผัดไก่ (เล็ก)', calories: 320, protein: 18, carbs: 45, fat: 8, portion: '1 จาน' },
    { name: 'ไข่เจียว + ข้าวสวย', calories: 290, protein: 14, carbs: 35, fat: 10, portion: '1 จาน' },
    { name: 'ข้าวเหนียวหมูปิ้ง', calories: 380, protein: 20, carbs: 40, fat: 15, portion: '1 ห่อ' },
    { name: 'ซาลาปาหมูแดง', calories: 250, protein: 10, carbs: 38, fat: 6, portion: '2 ลูก' },
    { name: 'ขนมปังปิ้งเนยน้ำผึ้ง', calories: 180, protein: 4, carbs: 28, fat: 6, portion: '2 แผ่น' },
    { name: 'กล้วยหอมทอด', calories: 160, protein: 2, carbs: 35, fat: 4, portion: '3 ลูก' }
  ],
  lunch: [
    { name: 'ข้าวผัดกะเพรา (ไก่)', calories: 420, protein: 25, carbs: 48, fat: 15, portion: '1 จาน' },
    { name: 'ข้าวแกงเขียวหวาน', calories: 380, protein: 18, carbs: 42, fat: 18, portion: '1 จาน' },
    { name: 'ลาบหมู + ข้าวเหนียว', calories: 450, protein: 28, carbs: 35, fat: 20, portion: '1 จาน' },
    { name: 'ผัดไทยกุ้ง', calories: 390, protein: 20, carbs: 52, fat: 12, portion: '1 จาน' },
    { name: 'ต้มยำกุ้ง + ข้าวสวย', calories: 320, protein: 22, carbs: 38, fat: 8, portion: '1 ชุด' },
    { name: 'ข้าวซอยไก่', calories: 480, protein: 24, carbs: 55, fat: 18, portion: '1 ชาม' },
    { name: 'แกงส้มปลากะพง', calories: 280, protein: 28, carbs: 15, fat: 12, portion: '1 จาน' },
    { name: 'ข้าวผัดน้ำพริกลงเรือ', calories: 350, protein: 15, carbs: 48, fat: 12, portion: '1 จาน' }
  ],
  dinner: [
    { name: 'ส้มตำไทย + ไก่ย่าง', calories: 350, protein: 28, carbs: 25, fat: 12, portion: '1 จาน' },
    { name: 'แกงส้มปลา + ข้าวสวย', calories: 280, protein: 20, carbs: 32, fat: 8, portion: '1 จาน' },
    { name: 'ปลาเผาเกลือ + ผักต้ม', calories: 320, protein: 35, carbs: 15, fat: 10, portion: '1 จาน' },
    { name: 'ยำวุ้นเส้น', calories: 180, protein: 8, carbs: 25, fat: 5, portion: '1 จาน' },
    { name: 'แกงจืดมะระยัดไส้', calories: 150, protein: 12, carbs: 10, fat: 6, portion: '1 ชาม' },
    { name: 'ผัดผักรวม + ข้าวสวย', calories: 220, protein: 8, carbs: 35, fat: 6, portion: '1 จาน' },
    { name: 'ลาบปลาดุก', calories: 200, protein: 20, carbs: 8, fat: 10, portion: '1 จาน' },
    { name: 'แกงเลียงผักรวม', calories: 120, protein: 6, carbs: 18, fat: 3, portion: '1 ชาม' }
  ],
  snacks: [
    { name: 'ผลไม้รวม', calories: 80, protein: 1, carbs: 20, fat: 0, portion: '1 ถ้วย' },
    { name: 'นมเปรี้ยว', calories: 120, protein: 8, carbs: 15, fat: 3, portion: '1 กล่อง' },
    { name: 'ถั่วลิสง', calories: 160, protein: 7, carbs: 6, fat: 14, portion: '30 กรัม' },
    { name: 'ขนมจีบ', calories: 140, protein: 6, carbs: 18, fat: 5, portion: '3 ลูก' },
    { name: 'เต้าหู้ทอด', calories: 100, protein: 8, carbs: 3, fat: 6, portion: '2 ชิ้น' },
    { name: 'กล้วยหอม', calories: 90, protein: 1, carbs: 23, fat: 0, portion: '1 ลูก' },
    { name: 'ไข่ต้มสุก', calories: 70, protein: 6, carbs: 1, fat: 5, portion: '1 ฟอง' }
  ]
};

export function generateMealPlan(targetCalories: number, goal: UserProfile['goal']): MealPlan {
  const today = new Date().toLocaleDateString('th-TH');
  
  // Distribute calories: Breakfast 25%, Lunch 35%, Dinner 30%, Snacks 10%
  const breakfastTarget = targetCalories * 0.25;
  const lunchTarget = targetCalories * 0.35;
  const dinnerTarget = targetCalories * 0.30;
  const snackTarget = targetCalories * 0.10;

  const getRandomFood = (category: string, target: number): FoodItem[] => {
    const foods = THAI_FOODS[category];
    const selected: FoodItem[] = [];
    let currentCalories = 0;
    let attempts = 0;
    
    while (currentCalories < target * 0.8 && attempts < 10) {
      const randomFood = foods[Math.floor(Math.random() * foods.length)];
      if (!selected.find(f => f.name === randomFood.name)) {
        selected.push(randomFood);
        currentCalories += randomFood.calories;
      }
      attempts++;
    }
    
    return selected.length > 0 ? selected : [foods[0]];
  };

  const breakfast = getRandomFood('breakfast', breakfastTarget);
  const lunch = getRandomFood('lunch', lunchTarget);
  const dinner = getRandomFood('dinner', dinnerTarget);
  const snacks = getRandomFood('snacks', snackTarget);

  const totalCalories = [
    ...breakfast,
    ...lunch,
    ...dinner,
    ...snacks
  ].reduce((sum, food) => sum + food.calories, 0);

  return {
    breakfast,
    lunch,
    dinner,
    snacks,
    totalCalories,
    date: today
  };
}

export function formatCalories(calories: number): string {
  return new Intl.NumberFormat('th-TH').format(Math.round(calories));
}

export function formatWeight(weight: number): string {
  return new Intl.NumberFormat('th-TH', { 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  }).format(weight);
}

export function getGoalText(goal: UserProfile['goal']): string {
  switch (goal) {
    case 'lose': return 'ลดน้ำหนัก';
    case 'gain': return 'เพิ่มน้ำหนัก';
    case 'maintain': return 'รักษาน้ำหนัก';
  }
}

export function getActivityText(level: UserProfile['activityLevel']): string {
  switch (level) {
    case 'sedentary': return 'ไม่ค่อยออกกำลังกาย';
    case 'light': return 'ออกกำลังกายเบา ๆ 1-3 วัน/สัปดาห์';
    case 'moderate': return 'ออกกำลังกายปานกลาง 3-5 วัน/สัปดาห์';
    case 'active': return 'ออกกำลังกายหนัก 6-7 วัน/สัปดาห์';
    case 'very-active': return 'ออกกำลังกายหนักมาก วันละ 2 ครั้ง';
  }
}

// ตรวจสอบความเป็นไปได้ของเป้าหมาย
export function validateGoal(profile: UserProfile): { isValid: boolean; message?: string } {
  if (!profile.targetWeight || !profile.timeframe) {
    return { isValid: true }; // ไม่มีเป้าหมายเฉพาะ ใช้ค่าเริ่มต้น
  }

  const weightDifference = Math.abs(profile.weight - profile.targetWeight);
  const weeksToGoal = profile.timeframe;
  const weeklyChange = weightDifference / weeksToGoal;

  if (weeklyChange > 1) {
    return {
      isValid: false,
      message: `การเปลี่ยนแปลงน้ำหนัก ${formatWeight(weeklyChange)} กก./สัปดาห์ อาจไม่ปลอดภัย (แนะนำไม่เกิน 1 กก./สัปดาห์)`
    };
  }

  if (profile.goal === 'lose' && profile.targetWeight >= profile.weight) {
    return {
      isValid: false,
      message: 'น้ำหนักเป้าหมายต้องน้อยกว่าน้ำหนักปัจจุบัน'
    };
  }

  if (profile.goal === 'gain' && profile.targetWeight <= profile.weight) {
    return {
      isValid: false,
      message: 'น้ำหนักเป้าหมายต้องมากกว่าน้ำหนักปัจจุบัน'
    };
  }

  return { isValid: true };
}