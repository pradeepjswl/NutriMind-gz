// BMR Calculation using Mifflin-St Jeor Equation
export function calculateBMR(
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  // Mifflin-St Jeor Equation
  const baseBMR = 10 * weight + 6.25 * height - 5 * age
  
  if (gender === 'male') {
    return Math.round(baseBMR + 5)
  } else if (gender === 'female') {
    return Math.round(baseBMR - 161)
  } else {
    // For 'other', use average of male and female
    return Math.round(baseBMR - 78)
  }
}

// Activity multipliers for TDEE
export const activityMultipliers = {
  sedentary: 1.2,      // Little or no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Hard exercise 6-7 days/week
  very_active: 1.9,    // Very hard exercise, physical job
} as const

export type ActivityLevel = keyof typeof activityMultipliers

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * activityMultipliers[activityLevel])
}

// Goal adjustments
export const goalAdjustments = {
  weight_loss: -500,     // 500 calorie deficit
  maintenance: 0,        // No adjustment
  muscle_gain: 300,      // 300 calorie surplus
} as const

export type Goal = keyof typeof goalAdjustments

// Calculate daily calorie target based on goal
export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  return Math.max(1200, tdee + goalAdjustments[goal]) // Minimum 1200 calories
}

// Macro ratios based on goal and diet type
export type DietType = 'vegetarian' | 'vegan' | 'non_veg' | 'keto' | 'balanced' | 'high_protein'

export interface MacroTargets {
  protein: number // grams
  carbs: number   // grams
  fat: number     // grams
  fiber: number   // grams
}

export function calculateMacroTargets(
  calorieTarget: number,
  goal: Goal,
  dietType: DietType
): MacroTargets {
  let proteinRatio: number
  let carbRatio: number
  let fatRatio: number

  // Set macro ratios based on diet type and goal
  if (dietType === 'keto') {
    proteinRatio = 0.25
    carbRatio = 0.05
    fatRatio = 0.70
  } else if (dietType === 'high_protein' || goal === 'muscle_gain') {
    proteinRatio = 0.35
    carbRatio = 0.40
    fatRatio = 0.25
  } else if (goal === 'weight_loss') {
    proteinRatio = 0.30
    carbRatio = 0.40
    fatRatio = 0.30
  } else {
    // Balanced / maintenance
    proteinRatio = 0.25
    carbRatio = 0.50
    fatRatio = 0.25
  }

  // Calculate grams (protein/carbs = 4 cal/g, fat = 9 cal/g)
  const protein = Math.round((calorieTarget * proteinRatio) / 4)
  const carbs = Math.round((calorieTarget * carbRatio) / 4)
  const fat = Math.round((calorieTarget * fatRatio) / 9)
  const fiber = goal === 'weight_loss' ? 30 : 25 // Higher fiber for weight loss

  return { protein, carbs, fat, fiber }
}

// Calculate all targets from user profile
export function calculateAllTargets(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: ActivityLevel,
  goal: Goal,
  dietType: DietType
) {
  const bmr = calculateBMR(weight, height, age, gender)
  const tdee = calculateTDEE(bmr, activityLevel)
  const calorieTarget = calculateCalorieTarget(tdee, goal)
  const macros = calculateMacroTargets(calorieTarget, goal, dietType)

  return {
    bmr,
    tdee,
    calorieTarget,
    ...macros,
    waterGoal: 8, // Default 8 glasses
  }
}

// Health score calculation for meals
export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export function calculateHealthScore(
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number
): HealthGrade {
  let score = 0

  // Protein score (higher is better, max 30 points)
  const proteinRatio = protein / (calories / 100 || 1)
  if (proteinRatio >= 4) score += 30
  else if (proteinRatio >= 3) score += 25
  else if (proteinRatio >= 2) score += 20
  else if (proteinRatio >= 1) score += 10

  // Fiber score (higher is better, max 20 points)
  const fiberRatio = fiber / (calories / 100 || 1)
  if (fiberRatio >= 1) score += 20
  else if (fiberRatio >= 0.5) score += 15
  else if (fiberRatio >= 0.25) score += 10

  // Fat ratio (moderate is better, max 25 points)
  const fatCalories = fat * 9
  const fatPercent = (fatCalories / calories) * 100
  if (fatPercent <= 30 && fatPercent >= 20) score += 25
  else if (fatPercent <= 35 && fatPercent >= 15) score += 20
  else if (fatPercent <= 40) score += 10

  // Calorie density (lower is generally better for health, max 25 points)
  // Assuming per-serving basis
  if (calories <= 300) score += 25
  else if (calories <= 500) score += 20
  else if (calories <= 700) score += 15
  else if (calories <= 900) score += 10

  // Convert score to grade
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'F'
}

// Get health grade color
export function getHealthGradeColor(grade: HealthGrade): string {
  const colors = {
    A: 'text-emerald-500',
    B: 'text-green-500',
    C: 'text-yellow-500',
    D: 'text-orange-500',
    F: 'text-red-500',
  }
  return colors[grade]
}

export function getHealthGradeBgColor(grade: HealthGrade): string {
  const colors = {
    A: 'bg-emerald-500',
    B: 'bg-green-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    F: 'bg-red-500',
  }
  return colors[grade]
}
