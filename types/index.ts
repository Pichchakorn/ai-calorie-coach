export interface UserProfile {
  id?: string;
  gender: 'male' | 'female';
  age: number;
  weight: number; // kg
  height: number; // cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goal: 'lose' | 'maintain' | 'gain';
  targetWeight?: number;
  timeframe?: number; // weeks
}

export interface User {
  id: string;
  email: string;
  name: string;
  profile?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CalorieCalculation {
  bmr: number;
  tdee: number;
  targetCalories: number;
  deficitOrSurplus: number;
  macroBreakdown: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

export interface MealPlan {
  breakfast: FoodItem[];
  lunch: FoodItem[];
  dinner: FoodItem[];
  snacks: FoodItem[];
  totalCalories: number;
  date: string;
}

export interface DailyPlan {
  profile: UserProfile;
  calorieCalc: CalorieCalculation;
  mealPlan: MealPlan;
  generatedAt: string;
}