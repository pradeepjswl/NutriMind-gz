import { createClient } from '@/lib/supabase/server'
import type { Recipe, Profile, WeeklyPlanData } from '@/lib/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    const p = profile as Profile

    // Get recipes that match user's diet type
    const { data: recipes } = await supabase
      .from('recipes')
      .select('*')

    if (!recipes || recipes.length === 0) {
      return Response.json({ error: 'No recipes available' }, { status: 404 })
    }

    // Filter recipes by diet type
    const filteredRecipes = (recipes as Recipe[]).filter((recipe) => {
      // If user has a diet preference, filter recipes that include that diet
      if (p.diet_type) {
        return recipe.diet_types.includes(p.diet_type)
      }
      return true
    })

    // Categorize recipes
    const breakfastRecipes = filteredRecipes.filter((r) => r.category === 'breakfast')
    const lunchRecipes = filteredRecipes.filter((r) => r.category === 'lunch')
    const dinnerRecipes = filteredRecipes.filter((r) => r.category === 'dinner')
    const snackRecipes = filteredRecipes.filter((r) => r.category === 'snack')

    // Generate meal plan
    const planData: WeeklyPlanData = {}
    const dailyCalorieTarget = p.calorie_goal || 2000

    for (const day of DAYS) {
      // Simple selection algorithm - try to meet calorie goals
      const breakfast = selectBestMeal(breakfastRecipes, dailyCalorieTarget * 0.25)
      const lunch = selectBestMeal(lunchRecipes, dailyCalorieTarget * 0.35)
      const dinner = selectBestMeal(dinnerRecipes, dailyCalorieTarget * 0.30)
      const snack = selectBestMeal(snackRecipes, dailyCalorieTarget * 0.10)

      planData[day] = {
        breakfast,
        lunch,
        dinner,
        snack,
      }
    }

    // Calculate week start date (next Monday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() + daysUntilMonday)
    const weekStartDate = weekStart.toISOString().split('T')[0]

    // Save meal plan
    const { data: mealPlan, error: dbError } = await supabase
      .from('meal_plans')
      .upsert({
        user_id: user.id,
        week_start_date: weekStartDate,
        plan_data: planData,
      }, {
        onConflict: 'user_id,week_start_date',
      })
      .select()
      .single()

    if (dbError) {
      // If upsert fails, just insert
      const { data: newPlan, error: insertError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          week_start_date: weekStartDate,
          plan_data: planData,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Database error:', insertError)
        return Response.json({ error: 'Failed to save meal plan' }, { status: 500 })
      }

      return Response.json({
        mealPlan: newPlan,
        weekStartDate,
      })
    }

    return Response.json({
      mealPlan,
      weekStartDate,
    })
  } catch (error) {
    console.error('Generate meal plan error:', error)
    return Response.json({ error: 'Failed to generate meal plan' }, { status: 500 })
  }
}

function selectBestMeal(recipes: Recipe[], targetCalories: number): Recipe | null {
  if (recipes.length === 0) return null

  // Sort by how close to target calories
  const sorted = [...recipes].sort((a, b) => {
    const diffA = Math.abs(a.calories - targetCalories)
    const diffB = Math.abs(b.calories - targetCalories)
    return diffA - diffB
  })

  // Add some randomness - pick from top 3
  const top = sorted.slice(0, Math.min(3, sorted.length))
  return top[Math.floor(Math.random() * top.length)]
}
