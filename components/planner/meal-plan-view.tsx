'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Clock, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealPlan, Recipe, WeeklyPlanData } from '@/lib/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const

interface MealPlanViewProps {
  mealPlan: MealPlan
}

export function MealPlanView({ mealPlan }: MealPlanViewProps) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const planData = mealPlan.plan_data as WeeklyPlanData

  const currentDayPlan = planData[DAYS[selectedDay]] || {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  }

  // Calculate daily totals
  const dailyTotals = MEALS.reduce(
    (acc, meal) => {
      const recipe = currentDayPlan[meal]
      if (recipe) {
        acc.calories += recipe.calories
        acc.protein += Number(recipe.protein)
        acc.carbs += Number(recipe.carbs)
        acc.fat += Number(recipe.fat)
      }
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div className="flex items-center justify-between rounded-xl bg-muted/50 p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedDay((d) => Math.max(0, d - 1))}
          disabled={selectedDay === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-semibold">{DAYS[selectedDay]}</div>
          <div className="text-xs text-muted-foreground">
            {dailyTotals.calories} kcal | P: {Math.round(dailyTotals.protein)}g | C: {Math.round(dailyTotals.carbs)}g | F: {Math.round(dailyTotals.fat)}g
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedDay((d) => Math.min(6, d + 1))}
          disabled={selectedDay === 6}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day dots */}
      <div className="flex justify-center gap-2">
        {DAYS.map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              i === selectedDay ? 'bg-emerald-600' : 'bg-muted-foreground/30'
            )}
          />
        ))}
      </div>

      {/* Meals for the day */}
      <div className="space-y-3">
        {MEALS.map((mealType) => {
          const recipe = currentDayPlan[mealType]
          return (
            <Card
              key={mealType}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                !recipe && 'opacity-50'
              )}
              onClick={() => recipe && setSelectedRecipe(recipe)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
                  {recipe?.emoji || '🍽️'}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    {mealType}
                  </div>
                  <div className="font-medium">
                    {recipe?.name || 'No meal planned'}
                  </div>
                  {recipe && (
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{recipe.calories} kcal</span>
                      <span>P: {recipe.protein}g</span>
                      <span>C: {recipe.carbs}g</span>
                    </div>
                  )}
                </div>
                {recipe && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {recipe.prep_time}m
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recipe detail dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedRecipe.emoji}</span>
                  {selectedRecipe.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Nutrition summary */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <div className="font-bold text-emerald-700">{selectedRecipe.calories}</div>
                    <div className="text-xs text-muted-foreground">kcal</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2">
                    <div className="font-bold text-blue-600">{selectedRecipe.protein}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-2">
                    <div className="font-bold text-orange-600">{selectedRecipe.carbs}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-2">
                    <div className="font-bold text-purple-600">{selectedRecipe.fat}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedRecipe.prep_time} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Utensils className="h-4 w-4" />
                    {selectedRecipe.difficulty}
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="mb-2 font-semibold">Ingredients</h4>
                  <ul className="space-y-1">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div>
                  <h4 className="mb-2 font-semibold">Instructions</h4>
                  <ol className="space-y-2">
                    {selectedRecipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
