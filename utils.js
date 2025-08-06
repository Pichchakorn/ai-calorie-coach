// Utility Functions for Meal Planning
class MealPlanUtils {
  
  // คำนวณแคลอรี่รวมของแผนอาหาร
  static calculateTotalCalories(mealPlan) {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    return meals.reduce((total, mealType) => {
      return total + (mealPlan[mealType] || []).reduce((mealTotal, meal) => {
        return mealTotal + (meal.calories || 0);
      }, 0);
    }, 0);
  }

  // คำนวณจำนวนเมนูแต่ละมื้อ
  static calculateMealCounts(mealPlan) {
    return {
      breakfast: (mealPlan.breakfast || []).length,
      lunch: (mealPlan.lunch || []).length,
      dinner: (mealPlan.dinner || []).length,
      snacks: (mealPlan.snacks || []).length,
      total: (mealPlan.breakfast || []).length + 
             (mealPlan.lunch || []).length + 
             (mealPlan.dinner || []).length + 
             (mealPlan.snacks || []).length
    };
  }

  // คำนวณแคลอรี่แต่ละมื้อ
  static calculateMealCalories(meals) {
    return (meals || []).reduce((total, meal) => total + (meal.calories || 0), 0);
  }

  // สุ่มเรียงลำดับอาหาร
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // กรองอาหารตามแท็ก
  static filterFoodsByTags(foods, tags) {
    if (!tags || tags.length === 0) return foods;
    
    return foods.filter(food => 
      tags.some(tag => food.tags && food.tags.includes(tag))
    );
  }

  // หาอาหารที่ใกล้เคียงกับแคลอรี่เป้าหมาย
  static findClosestCalorieFoods(foods, targetCalories, count = 3) {
    return foods
      .sort((a, b) => {
        const diffA = Math.abs(a.calories - targetCalories);
        const diffB = Math.abs(b.calories - targetCalories);
        return diffA - diffB;
      })
      .slice(0, count);
  }

  // สร้าง ID สำหรับอาหาร
  static generateMealId() {
    return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // แปลงข้อมูลเป้าหมายเป็นข้อความ
  static getGoalText(goal) {
    const goalTexts = {
      lose: 'ลดน้ำหนัก',
      maintain: 'รักษาน้ำหนัก', 
      gain: 'เพิ่มน้ำหนัก',
      muscle: 'เพิ่มกล้ามเนื้อ'
    };
    return goalTexts[goal] || 'รักษาน้ำหนัก';
  }

  // สร้างข้อความวันที่ภาษาไทย
  static formatThaiDate(date = new Date()) {
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    
    return `${day} ${month} ${year}`;
  }

  // ตรวจสอบว่าอาหารเหมาะกับเป้าหมายหรือไม่
  static isFoodSuitableForGoal(food, goal) {
    const suitabilityRules = {
      lose: (food) => {
        return food.tags.includes('ผัก') || 
               food.tags.includes('ไฟเบอร์') || 
               food.tags.includes('โปรตีน') ||
               food.tags.includes('เบา') ||
               food.calories < 300;
      },
      gain: (food) => {
        return food.tags.includes('โปรตีน') || 
               food.tags.includes('คาร์โบไฮเดรต') ||
               food.calories >= 300;
      },
      muscle: (food) => {
        return food.tags.includes('โปรตีน') || 
               food.tags.includes('คาร์โบไฮเดรต');
      },
      maintain: () => true
    };

    const rule = suitabilityRules[goal] || suitabilityRules.maintain;
    return rule(food);
  }

  // คำนวณเปอร์เซ็นต์ความแตกต่างของแคลอรี่
  static calculateCalorieDifference(actual, target) {
    if (target === 0) return 0;
    return Math.round(((actual - target) / target) * 100);
  }

  // สร้างข้อความสรุปแผนอาหาร
  static generatePlanSummary(mealPlan, targetCalories) {
    const totalCalories = this.calculateTotalCalories(mealPlan);
    const counts = this.calculateMealCounts(mealPlan);
    const difference = this.calculateCalorieDifference(totalCalories, targetCalories);
    
    let status = 'ตรงเป้าหมาย';
    if (difference > 5) status = 'เกินเป้าหมาย';
    else if (difference < -5) status = 'ต่ำกว่าเป้าหมาย';

    return {
      totalCalories,
      targetCalories,
      difference,
      status,
      totalMeals: counts.total,
      breakdown: counts
    };
  }

  // ตรวจสอบความสมดุลของโภชนาการ
  static checkNutritionalBalance(mealPlan) {
    const allMeals = [
      ...(mealPlan.breakfast || []),
      ...(mealPlan.lunch || []),
      ...(mealPlan.dinner || []),
      ...(mealPlan.snacks || [])
    ];

    const tagCounts = {};
    allMeals.forEach(meal => {
      meal.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return {
      protein: tagCounts['โปรตีน'] || 0,
      carbs: tagCounts['คาร์โบไฮเดรต'] || 0,
      vegetables: tagCounts['ผัก'] || 0,
      fiber: tagCounts['ไฟเบอร์'] || 0,
      vitamins: tagCounts['วิตามิน'] || 0
    };
  }

  // จัดกลุ่มอาหารตามประเภท
  static categorizeFood(food) {
    const categories = [];
    
    if (food.tags.includes('โปรตีน')) categories.push('โปรตีน');
    if (food.tags.includes('คาร์โบไฮเดรต')) categories.push('คาร์โบไฮเดรต');
    if (food.tags.includes('ผัก')) categories.push('ผัก');
    if (food.tags.includes('ผลไม้')) categories.push('ผลไม้');
    if (food.tags.includes('ไขมันดี')) categories.push('ไขมันดี');
    
    return categories.length > 0 ? categories : ['อื่นๆ'];
  }

  // สร้างคำแนะนำเพิ่มเติม
  static generateAdditionalTips(profile, mealPlan) {
    const tips = [];
    const balance = this.checkNutritionalBalance(mealPlan);
    
    if (balance.protein < 3) {
      tips.push('ควรเพิ่มโปรตีนในแผนอาหารของคุณ');
    }
    
    if (balance.vegetables < 2) {
      tips.push('ควรเพิ่มผักให้มากขึ้นเพื่อให้ได้ไฟเบอร์และวิตามิน');
    }
    
    if (profile.age >= 50 && balance.protein < 4) {
      tips.push('ในวัยของคุณควรเน้นโปรตีนเพื่อรักษากล้ามเนื้อ');
    }
    
    if (profile.goal === 'lose' && balance.fiber < 2) {
      tips.push('เพิ่มอาหารที่มีไฟเบอร์จะช่วยให้อิ่มนานขึ้น');
    }
    
    return tips;
  }
}

// Export utility functions
window.MealPlanUtils = MealPlanUtils;

// Export individual functions for easier access
window.calculateTotalCalories = MealPlanUtils.calculateTotalCalories.bind(MealPlanUtils);
window.calculateMealCounts = MealPlanUtils.calculateMealCounts.bind(MealPlanUtils);
window.calculateMealCalories = MealPlanUtils.calculateMealCalories.bind(MealPlanUtils);
window.shuffleArray = MealPlanUtils.shuffleArray.bind(MealPlanUtils);
window.generateMealId = MealPlanUtils.generateMealId.bind(MealPlanUtils);
window.getGoalText = MealPlanUtils.getGoalText.bind(MealPlanUtils);
window.formatThaiDate = MealPlanUtils.formatThaiDate.bind(MealPlanUtils);

console.log('🔧 Meal plan utilities loaded');