'use client'

import { cn } from '@/lib/utils'
import type { MealLog } from '@/lib/types'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface MealListProps {
  meals: MealLog[]
  className?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  scanned: 'Scanned',
  manual: 'Manual',
}

export function MealList({ meals, className }: MealListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deleteMeal = async (id: string) => {
    setDeletingId(id)
    await supabase.from('meal_logs').delete().eq('id', id)
    router.refresh()
    setDeletingId(null)
  }

  // Group meals by category
  const groupedMeals = meals.reduce((acc, meal) => {
    const category = meal.category || 'manual'
    if (!acc[category]) acc[category] = []
    acc[category].push(meal)
    return acc
  }, {} as Record<string, MealLog[]>)

  if (meals.length === 0) {
    return (
      <div className={cn('rounded-2xl bg-muted/50 p-8 text-center', className)}>
        <p className="text-muted-foreground">No meals logged today</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the camera icon to scan your first meal
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(groupedMeals).map(([category, categoryMeals]) => (
        <div key={category}>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            {CATEGORY_LABELS[category] || category}
          </h4>
          <div className="space-y-2">
            {categoryMeals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between rounded-xl bg-card p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meal.emoji}</span>
                  <div>
                    <p className="font-medium">{meal.name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{meal.calories} kcal</span>
                      <span>P: {meal.protein}g</span>
                      <span>C: {meal.carbs}g</span>
                      <span>F: {meal.fat}g</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {meal.health_score && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-bold',
                        meal.health_score === 'A' && 'bg-emerald-100 text-emerald-700',
                        meal.health_score === 'B' && 'bg-green-100 text-green-700',
                        meal.health_score === 'C' && 'bg-yellow-100 text-yellow-700',
                        meal.health_score === 'D' && 'bg-orange-100 text-orange-700',
                        meal.health_score === 'F' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {meal.health_score}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMeal(meal.id)}
                    disabled={deletingId === meal.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
