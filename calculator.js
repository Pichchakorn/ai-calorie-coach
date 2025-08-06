// Calorie Calculator System
class CalorieCalculator {
  constructor() {
    this.activityLevels = window.ACTIVITY_LEVELS;
    this.goals = window.GOALS;
  }

  // คำนวณ BMR โดยใช้สูตร Mifflin-St Jeor
  calculateBMR(profile) {
    const { age, gender, height, weight } = profile;
    
    if (!age || !gender || !height || !weight) {
      throw new Error('ข้อมูลไม่ครบถ้วนสำหรับการคำนวณ BMR');
    }

    let bmr;
    if (gender === 'male') {
      // BMR สำหรับผู้ชาย = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) - (5 × อายุ) + 5
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      // BMR สำหรับผู้หญิง = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) - (5 × อายุ) - 161
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    return Math.round(bmr);
  }

  // คำนวณ TDEE (Total Daily Energy Expenditure)
  calculateTDEE(bmr, activityLevel) {
    const activity = this.activityLevels[activityLevel];
    if (!activity) {
      throw new Error('ระดับกิจกรรมไม่ถูกต้อง');
    }

    const tdee = bmr * activity.multiplier;
    return Math.round(tdee);
  }

  // คำนวณแคลอรี่เป้าหมาย
  calculateTargetCalories(profile) {
    try {
      const bmr = this.calculateBMR(profile);
      const tdee = this.calculateTDEE(bmr, profile.activityLevel);
      
      const goal = this.goals[profile.goal];
      if (!goal) {
        throw new Error('เป้าหมายไม่ถูกต้อง');
      }

      const targetCalories = tdee + goal.adjustment;
      
      // คำนวณระยะเวลาที่ต้องใช้ (ถ้ามีน้ำหนักเป้าหมาย)
      let timeframe = null;
      let weeklyWeightChange = 0;
      
      if (profile.targetWeight && profile.targetWeight !== profile.weight) {
        const weightDifference = profile.targetWeight - profile.weight;
        // 1 กก. = 7700 แคลอรี่โดยประมาณ
        const caloriesPerKg = 7700;
        const dailyCalorieDeficit = Math.abs(goal.adjustment);
        
        if (dailyCalorieDeficit > 0) {
          // คำนวณการเปลี่ยนแปลงน้ำหนักต่อสัปดาห์
          weeklyWeightChange = (dailyCalorieDeficit * 7) / caloriesPerKg;
          if (profile.goal === 'lose') weeklyWeightChange = -weeklyWeightChange;
          
          // คำนวณระยะเวลาที่ต้องใช้ (สัปดาห์)
          timeframe = Math.abs(weightDifference / weeklyWeightChange);
        }
      }

      return {
        bmr,
        tdee,
        targetCalories: Math.max(targetCalories, 1200), // ไม่ต่ำกว่า 1200 แคลอรี่
        goal: goal,
        timeframe: timeframe ? Math.ceil(timeframe) : null,
        weeklyWeightChange: Math.round(weeklyWeightChange * 100) / 100,
        formula: this.getFormulaExplanation(profile, bmr, tdee, goal)
      };
    } catch (error) {
      console.error('Calculation error:', error);
      throw error;
    }
  }

  // สร้างคำอธิบายสูตรการคำนวณ
  getFormulaExplanation(profile, bmr, tdee, goal) {
    const { age, gender, height, weight, activityLevel } = profile;
    const activity = this.activityLevels[activityLevel];
    
    return {
      bmr: {
        formula: gender === 'male' 
          ? `(10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) + 5`
          : `(10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) - 161`,
        result: `${bmr} แคลอรี่/วัน`,
        explanation: `อัตราการเผาผลาญพื้นฐานสำหรับ${gender === 'male' ? 'ผู้ชาย' : 'ผู้หญิง'} อายุ ${age} ปี`
      },
      tdee: {
        formula: `${bmr} × ${activity.multiplier}`,
        result: `${tdee} แคลอรี่/วัน`,
        explanation: `รวมกิจกรรมประจำวัน: ${activity.label}`
      },
      target: {
        formula: `${tdee} ${goal.adjustment >= 0 ? '+' : ''} ${goal.adjustment}`,
        result: `${tdee + goal.adjustment} แคลอรี่/วัน`,
        explanation: goal.description
      }
    };
  }

  // คำนวณการแจกแจงแคลอรี่ในแต่ละมื้อ
  calculateMealDistribution(targetCalories) {
    return {
      breakfast: Math.round(targetCalories * 0.25), // 25%
      lunch: Math.round(targetCalories * 0.35),     // 35%
      dinner: Math.round(targetCalories * 0.30),    // 30%
      snacks: Math.round(targetCalories * 0.10)     // 10%
    };
  }

  // คำนวณ BMI
  calculateBMI(height, weight) {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10;
  }

  // ประเมิน BMI
  getBMICategory(bmi) {
    if (bmi < 18.5) return { category: 'น้ำหนักต่ำกว่าเกณฑ์', color: 'warning' };
    if (bmi < 25) return { category: 'น้ำหนักปกติ', color: 'success' };
    if (bmi < 30) return { category: 'น้ำหนักเกิน', color: 'warning' };
    return { category: 'อ้วน', color: 'error' };
  }

  // สร้างคำแนะนำจาก AI
  generateAIRecommendation(profile, calculation) {
    const recommendations = window.AI_RECOMMENDATIONS[profile.goal] || [];
    const baseRecommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
    
    const bmi = this.calculateBMI(profile.height, profile.weight);
    const bmiCategory = this.getBMICategory(bmi);
    
    let customRecommendation = baseRecommendation;
    
    // เพิ่มคำแนะนำเฉพาะตาม BMI
    if (bmiCategory.category === 'น้ำหนักต่ำกว่าเกณฑ์') {
      customRecommendation += " เนื่องจาก BMI ของคุณต่ำกว่าเกณฑ์ แนะนำให้เพิ่มปริมาณอาหารและโปรตีน";
    } else if (bmiCategory.category === 'อ้วน') {
      customRecommendation += " เนื่องจาก BMI ของคุณสูง แนะนำให้ควบคุมการรับประทานและเพิ่มการออกกำลังกาย";
    }
    
    // เพิ่มคำแนะนำตามอายุ
    if (profile.age >= 50) {
      customRecommendation += " สำหรับวัยของคุณ ควรเน้นการรับประทานแคลเซียมและวิตามิน D";
    } else if (profile.age <= 25) {
      customRecommendation += " ในวัยของคุณ การสร้างนิสัยการกินที่ดีจะเป็นประโยชน์ระยะยาว";
    }

    return {
      main: customRecommendation,
      bmi: `BMI ของคุณคือ ${bmi} (${bmiCategory.category})`,
      timeframe: calculation.timeframe 
        ? `หากทำตามแผนอย่างสม่ำเสมอ คาดว่าจะบรรลุเป้าหมายภายใน ${calculation.timeframe} สัปดาห์`
        : "ควรติดตามผลลัพธ์และปรับแผนตามความเหมาะสม"
    };
  }

  // ตรวจสอบความถูกต้องของข้อมูล
  validateProfile(profile) {
    const errors = [];
    
    if (!profile.age || profile.age < 15 || profile.age > 100) {
      errors.push('อายุต้องอยู่ระหว่าง 15-100 ปี');
    }
    
    if (!profile.gender || !['male', 'female'].includes(profile.gender)) {
      errors.push('กรุณาเลือกเพศ');
    }
    
    if (!profile.height || profile.height < 100 || profile.height > 250) {
      errors.push('ส่วนสูงต้องอยู่ระหว่าง 100-250 ซม.');
    }
    
    if (!profile.weight || profile.weight < 30 || profile.weight > 300) {
      errors.push('น้ำหนักต้องอยู่ระหว่าง 30-300 กก.');
    }
    
    if (!profile.activityLevel || !this.activityLevels[profile.activityLevel]) {
      errors.push('กรุณาเลือกระดับกิจกรรม');
    }
    
    if (!profile.goal || !this.goals[profile.goal]) {
      errors.push('กรุณาเลือกเป้าหมาย');
    }

    if (profile.targetWeight && profile.targetWeight < 30 || profile.targetWeight > 300) {
      errors.push('น้ำหนักเป้าหมายต้องอยู่ระหว่าง 30-300 กก.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// สร้าง instance และ export
window.calorieCalculator = new CalorieCalculator();

// Export functions สำหรับใช้งานสะดวก
window.calculatorService = {
  calculateBMR: (profile) => window.calorieCalculator.calculateBMR(profile),
  calculateTDEE: (bmr, activityLevel) => window.calorieCalculator.calculateTDEE(bmr, activityLevel),
  calculateTargetCalories: (profile) => window.calorieCalculator.calculateTargetCalories(profile),
  calculateMealDistribution: (targetCalories) => window.calorieCalculator.calculateMealDistribution(targetCalories),
  calculateBMI: (height, weight) => window.calorieCalculator.calculateBMI(height, weight),
  getBMICategory: (bmi) => window.calorieCalculator.getBMICategory(bmi),
  generateAIRecommendation: (profile, calculation) => window.calorieCalculator.generateAIRecommendation(profile, calculation),
  validateProfile: (profile) => window.calorieCalculator.validateProfile(profile)
};

console.log('🧮 Calculator system initialized');