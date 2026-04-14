import { createClient } from '@/lib/supabase/server'
import { MealPlanView } from '@/components/planner/meal-plan-view'
import { GeneratePlanButton } from '@/components/planner/generate-plan-button'
import { GroceryList } from '@/components/planner/grocery-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, ShoppingCart } from 'lucide-react'
import type { MealPlan, Recipe } from '@/lib/types'

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get the most recent meal plan
  const { data: mealPlan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get all recipes for displaying details
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')

  const recipesMap = new Map<string, Recipe>()
  if (recipes) {
    recipes.forEach((r) => recipesMap.set(r.id, r as Recipe))
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meal Planner</h1>
          <p className="text-sm text-muted-foreground">
            Plan your meals for the week
          </p>
        </div>
        <GeneratePlanButton />
      </div>

      <Tabs defaultValue="plan">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plan" className="gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Plan
          </TabsTrigger>
          <TabsTrigger value="grocery" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Grocery List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="mt-4">
          {mealPlan ? (
            <MealPlanView mealPlan={mealPlan as MealPlan} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No meal plan yet</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Generate a personalized meal plan based on your goals and preferences
                </p>
                <GeneratePlanButton />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="grocery" className="mt-4">
          {mealPlan ? (
            <GroceryList mealPlan={mealPlan as MealPlan} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No grocery list</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Generate a meal plan first to see your grocery list
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
