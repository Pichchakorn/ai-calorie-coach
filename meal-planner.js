// Meal Planning System (Refactored)
class MealPlanner {
  constructor() {
    this.foods = window.THAI_FOODS;
    this.calculator = window.calorieCalculator;
    this.utils = window.MealPlanUtils;
  }

  // สร้างแผนอาหารตามแคลอรี่เป้าหมาย
  generateMealPlan(targetCalories, goal = 'maintain') {
    try {
      // คำนวณการแจกแจงแคลอรี่ในแต่ละมื้อ
      const distribution = this.calculator.calculateMealDistribution(targetCalories);
      
      // สร้างเมนูสำหรับแต่ละมื้อ
      const mealPlan = {
        date: window.formatThaiDate(new Date()),
        targetCalories,
        goal,
        breakfast: this.selectMealsForCalories('breakfast', distribution.breakfast, goal),
        lunch: this.selectMealsForCalories('lunch', distribution.lunch, goal),
        dinner: this.selectMealsForCalories('dinner', distribution.dinner, goal),
        snacks: this.selectMealsForCalories('snacks', distribution.snacks, goal),
        distribution
      };

      // คำนวณแคลอรี่รวม
      mealPlan.totalCalories = window.calculateTotalCalories(mealPlan);
      
      // เพิ่มคำแนะนำและข้อมูลเพิ่มเติม
      mealPlan.tips = window.generateMealTips(goal);
      mealPlan.nutritionNotes = window.getNutritionNotes(goal);
      mealPlan.aiResponse = window.getAIMealResponse();

      return mealPlan;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw new Error('ไม่สามารถสร้างแผนอาหารได้ กรุณาลองใหม่');
    }
  }

  // เลือกเมนูอาหารให้ได้แคลอรี่ตามต้องการ
  selectMealsForCalories(mealType, targetCalories, goal) {
    const availableFoods = this.foods[mealType] || [];
    if (availableFoods.length === 0) {
      return [];
    }

    const selectedMeals = [];
    let remainingCalories = targetCalories;
    const usedIndexes = new Set();

    // เลือกอาหารหลักก่อน (70-80% ของแคลอรี่)
    const mainCalories = Math.round(remainingCalories * 0.75);
    const mainMeal = this.selectSingleMeal(availableFoods, mainCalories, goal, usedIndexes);
    
    if (mainMeal) {
      selectedMeals.push(mainMeal);
      remainingCalories -= mainMeal.calories;
      usedIndexes.add(availableFoods.indexOf(mainMeal));
    }

    // เลือกอาหารเสริมถ้าเหลือแคลอรี่
    while (remainingCalories > 50 && selectedMeals.length < 3) {
      const supplementMeal = this.selectSingleMeal(
        availableFoods, 
        remainingCalories, 
        goal, 
        usedIndexes,
        true // เป็นอาหารเสริม
      );
      
      if (!supplementMeal) break;
      
      selectedMeals.push(supplementMeal);
      remainingCalories -= supplementMeal.calories;
      usedIndexes.add(availableFoods.indexOf(supplementMeal));
    }

    return selectedMeals;
  }

  // เลือกอาหารชิ้นเดียว
  selectSingleMeal(foods, targetCalories, goal, usedIndexes = new Set(), isSupplement = false) {
    // กรองอาหารที่ยังไม่ได้ใช้
    const availableFoods = foods.filter((food, index) => !usedIndexes.has(index));
    
    if (availableFoods.length === 0) return null;

    // กรองอาหารตามเป้าหมาย
    let suitableFoods = this.filterFoodsByGoal(availableFoods, goal);
    
    // ถ้าเป็นอาหารเสริม ให้เลือกอาหารที่มีแคลอรี่น้อยกว่า
    if (isSupplement) {
      suitableFoods = suitableFoods.filter(food => food.calories <= targetCalories);
    }

    if (suitableFoods.length === 0) {
      suitableFoods = availableFoods.filter(food => food.calories <= targetCalories * 1.2);
    }

    if (suitableFoods.length === 0) return null;

    // เลือกอาหารที่มีแคลอรี่ใกล้เคียงกับเป้าหมาย
    const topChoices = window.MealPlanUtils.findClosestCalorieFoods(suitableFoods, targetCalories, 3);
    const selectedMeal = topChoices[Math.floor(Math.random() * topChoices.length)];

    return {
      ...selectedMeal,
      id: window.generateMealId()
    };
  }

  // กรองอาหารตามเป้าหมาย
  filterFoodsByGoal(foods, goal) {
    return foods.filter(food => window.MealPlanUtils.isFoodSuitableForGoal(food, goal));
  }

  // สุ่มเมนูใหม่สำหรับมื้อใดมื้อหนึ่ง
  regenerateMealType(mealPlan, mealType) {
    if (!mealPlan.distribution || !mealPlan.distribution[mealType]) {
      throw new Error('ไม่พบข้อมูลการแจกแจงแคลอรี่');
    }

    const targetCalories = mealPlan.distribution[mealType];
    const newMeals = this.selectMealsForCalories(mealType, targetCalories, mealPlan.goal);
    
    return {
      ...mealPlan,
      [mealType]: newMeals,
      totalCalories: window.calculateTotalCalories({
        ...mealPlan,
        [mealType]: newMeals
      })
    };
  }

  // สุ่มเมนูทั้งหมดใหม่
  regenerateAllMeals(mealPlan) {
    return this.generateMealPlan(mealPlan.targetCalories, mealPlan.goal);
  }

  // วิเคราะห์แผนอาหาร
  analyzeMealPlan(mealPlan) {
    const summary = window.MealPlanUtils.generatePlanSummary(mealPlan, mealPlan.targetCalories);
    const balance = window.MealPlanUtils.checkNutritionalBalance(mealPlan);
    
    return {
      summary,
      balance,
      recommendations: this.generateRecommendations(mealPlan, summary, balance)
    };
  }

  // สร้างคำแนะนำ
  generateRecommendations(mealPlan, summary, balance) {
    const recommendations = [];
    
    // แนะนำตามแคลอรี่
    if (summary.difference > 10) {
      recommendations.push('แคลอรี่เกินเป้าหมาย ควรลดปริมาณอาหารหรือเลือกอาหารที่มีแคลอรี่ต่ำกว่า');
    } else if (summary.difference < -10) {
      recommendations.push('แคลอรี่ต่ำกว่าเป้าหมาย ควรเพิ่มปริมาณอาหารหรือเลือกอาหารที่มีแคลอรี่สูงกว่า');
    }

    // แนะนำตามโภชนาการ
    if (balance.protein < 2) {
      recommendations.push('ควรเพิ่มโปรตีนในแผนอาหาร เช่น เนื้อ ปลา ไข่ เต้าหู้');
    }
    
    if (balance.vegetables < 2) {
      recommendations.push('ควรเพิ่มผักในแผนอาหารเพื่อให้ได้ไฟเบอร์และวิตามิน');
    }

    return recommendations;
  }

  // บันทึกแผนอาหาร
  saveMealPlan(mealPlan, userId) {
    try {
      const savedPlans = this.getSavedPlans(userId);
      const planWithId = {
        ...mealPlan,
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date().toISOString()
      };
      
      savedPlans.unshift(planWithId);
      
      // เก็บแค่ 10 แผนล่าสุด
      if (savedPlans.length > 10) {
        savedPlans.splice(10);
      }
      
      localStorage.setItem(`mealPlans_${userId}`, JSON.stringify(savedPlans));
      return planWithId;
    } catch (error) {
      console.error('Error saving meal plan:', error);
      throw new Error('ไม่สามารถบันทึกแผนอาหารได้');
    }
  }

  // ดึงแผนอาหารที่บันทึกไว้
  getSavedPlans(userId) {
    try {
      const saved = localStorage.getItem(`mealPlans_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved plans:', error);
      return [];
    }
  }

  // ลบแผนอาหาร
  deleteMealPlan(planId, userId) {
    try {
      const savedPlans = this.getSavedPlans(userId);
      const filteredPlans = savedPlans.filter(plan => plan.id !== planId);
      localStorage.setItem(`mealPlans_${userId}`, JSON.stringify(filteredPlans));
      return true;
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      return false;
    }
  }
}

// สร้าง instance และ export
window.mealPlanner = new MealPlanner();

console.log('🍽️ Meal planner system loaded');