// Database types for NutriMind AI

export interface Profile {
  id: string
  name: string | null
  age: number | null
  weight: number | null
  height: number | null
  gender: 'male' | 'female' | 'other' | null
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain' | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  diet_type: 'vegetarian' | 'vegan' | 'non_veg' | 'keto' | 'balanced' | 'high_protein' | null
  allergies: string[]
  calorie_goal: number | null
  protein_goal: number | null
  carb_goal: number | null
  fat_goal: number | null
  fiber_goal: number
  water_goal: number
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface MealLog {
  id: string
  user_id: string
  name: string
  emoji: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'scanned' | 'manual'
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  health_score: 'A' | 'B' | 'C' | 'D' | 'F' | null
  image_url: string | null
  logged_at: string
  created_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  glasses: number
  created_at: string
  updated_at: string
}

export interface UserStats {
  user_id: string
  log_streak: number
  water_streak: number
  protein_streak: number
  longest_log_streak: number
  longest_water_streak: number
  total_meals: number
  scans_used: number
  plans_generated: number
  chat_messages: number
  earned_badges: string[]
  last_log_date: string | null
  last_water_date: string | null
  created_at: string
  updated_at: string
}

export interface MealPlan {
  id: string
  user_id: string
  week_start_date: string
  plan_data: WeeklyPlanData
  created_at: string
}

export interface WeeklyPlanData {
  [day: string]: {
    breakfast: Recipe | null
    lunch: Recipe | null
    dinner: Recipe | null
    snack: Recipe | null
  }
}

export interface Recipe {
  id: string
  name: string
  emoji: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  tags: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  prep_time: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: string[]
  steps: string[]
  diet_types: string[]
  created_at: string
}

// Onboarding form data
export interface OnboardingData {
  name: string
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  weight: number | null
  height: number | null
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain' | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  diet_type: 'vegetarian' | 'vegan' | 'non_veg' | 'keto' | 'balanced' | 'high_protein' | null
  allergies: string[]
}

// Nutrition calculation results
export interface NutritionGoals {
  bmr: number
  tdee: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

// AI meal analysis result
export interface MealAnalysis {
  name: string
  emoji: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  health_score: 'A' | 'B' | 'C' | 'D' | 'F'
  ingredients: string[]
  suggestions: string[]
}

// Badge definitions
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: UserStats) => boolean
}

// Grocery list item
export interface GroceryItem {
  name: string
  quantity: string
  category: string
  checked: boolean
}

// Daily summary
export interface DailySummary {
  date: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber: number
  waterGlasses: number
  meals: MealLog[]
}
