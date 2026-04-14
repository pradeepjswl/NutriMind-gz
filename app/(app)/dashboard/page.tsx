import { createClient } from '@/lib/supabase/server'
import { CalorieRing } from '@/components/dashboard/calorie-ring'
import { MacroBars } from '@/components/dashboard/macro-bars'
import { WaterTracker } from '@/components/dashboard/water-tracker'
import { StreakCard } from '@/components/dashboard/streak-card'
import { MealList } from '@/components/dashboard/meal-list'
import { QuickAddMeal } from '@/components/dashboard/quick-add-meal'
import { RecommendationCards } from '@/components/dashboard/recommendation-cards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Leaf } from 'lucide-react'
import Link from 'next/link'
import type { Profile, MealLog, WaterLog, UserStats, DailySummary } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const today = new Date().toISOString().split('T')[0]
  const startOfDay = `${today}T00:00:00`
  const endOfDay = `${today}T23:59:59`

  // Fetch all data in parallel
  const [profileRes, mealsRes, waterRes, statsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', startOfDay)
      .lte('logged_at', endOfDay)
      .order('logged_at', { ascending: false }),
    supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single(),
    supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
  ])

  const profile = profileRes.data as Profile
  const meals = (mealsRes.data || []) as MealLog[]
  const waterLog = waterRes.data as WaterLog | null
  const stats = (statsRes.data || {
    user_id: user.id,
    log_streak: 0,
    water_streak: 0,
    protein_streak: 0,
    longest_log_streak: 0,
    longest_water_streak: 0,
    total_meals: 0,
    scans_used: 0,
    plans_generated: 0,
    chat_messages: 0,
    earned_badges: [],
    last_log_date: null,
    last_water_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }) as UserStats

  // Calculate daily totals
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
  const totalProtein = meals.reduce((sum, m) => sum + Number(m.protein), 0)
  const totalCarbs = meals.reduce((sum, m) => sum + Number(m.carbs), 0)
  const totalFat = meals.reduce((sum, m) => sum + Number(m.fat), 0)
  const totalFiber = meals.reduce((sum, m) => sum + Number(m.fiber), 0)

  const summary: DailySummary = {
    date: today,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalFiber,
    waterGlasses: waterLog?.glasses || 0,
    meals,
  }

  const greeting = getGreeting()

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {profile.name?.split(' ')[0] || 'there'}!</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <Leaf className="h-6 w-6 text-emerald-600" />
        </div>
      </div>

      {/* Calorie Ring */}
      <Card className="mb-6 border-none bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <CalorieRing
              consumed={totalCalories}
              goal={profile.calorie_goal || 2000}
            />
          </div>
        </CardContent>
      </Card>

      {/* Macro Bars */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Macros</CardTitle>
        </CardHeader>
        <CardContent>
          <MacroBars
            protein={{ current: Math.round(totalProtein), goal: profile.protein_goal || 100 }}
            carbs={{ current: Math.round(totalCarbs), goal: profile.carb_goal || 250 }}
            fat={{ current: Math.round(totalFat), goal: profile.fat_goal || 65 }}
            fiber={{ current: Math.round(totalFiber), goal: profile.fiber_goal || 25 }}
          />
        </CardContent>
      </Card>

      {/* Water Tracker & Streaks */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <WaterTracker
          userId={user.id}
          initialGlasses={waterLog?.glasses || 0}
          goal={profile.water_goal || 8}
          date={today}
        />
        <StreakCard stats={stats} />
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <RecommendationCards profile={profile} summary={summary} />
      </div>

      {/* Today's Meals */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">{"Today's Meals"}</CardTitle>
          <div className="flex gap-2">
            <QuickAddMeal userId={user.id} />
            <Button asChild size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/scan">
                <Camera className="h-4 w-4" />
                Scan
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MealList meals={meals} />
        </CardContent>
      </Card>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
