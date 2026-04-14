'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { MealPlan, Recipe, WeeklyPlanData, GroceryItem } from '@/lib/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const

// Ingredient category mapping
const CATEGORY_MAP: Record<string, string> = {
  // Proteins
  chicken: 'Proteins',
  beef: 'Proteins',
  turkey: 'Proteins',
  salmon: 'Proteins',
  tuna: 'Proteins',
  tofu: 'Proteins',
  eggs: 'Proteins',
  'egg whites': 'Proteins',
  'greek yogurt': 'Dairy',
  yogurt: 'Dairy',
  cheese: 'Dairy',
  feta: 'Dairy',
  milk: 'Dairy',
  'cottage cheese': 'Dairy',
  // Produce
  spinach: 'Produce',
  broccoli: 'Produce',
  asparagus: 'Produce',
  'bell pepper': 'Produce',
  tomato: 'Produce',
  cucumber: 'Produce',
  lettuce: 'Produce',
  avocado: 'Produce',
  banana: 'Produce',
  berries: 'Produce',
  apple: 'Produce',
  carrot: 'Produce',
  onion: 'Produce',
  lemon: 'Produce',
  lime: 'Produce',
  cilantro: 'Produce',
  // Grains
  oats: 'Grains',
  rice: 'Grains',
  quinoa: 'Grains',
  bread: 'Grains',
  tortilla: 'Grains',
  granola: 'Grains',
  // Pantry
  'olive oil': 'Pantry',
  'soy sauce': 'Pantry',
  honey: 'Pantry',
  'nut butter': 'Pantry',
  'almond butter': 'Pantry',
  nuts: 'Pantry',
  almonds: 'Pantry',
  'chia seeds': 'Pantry',
  chickpeas: 'Pantry',
  lentils: 'Pantry',
  'coconut milk': 'Pantry',
  'curry paste': 'Pantry',
  hummus: 'Pantry',
}

interface GroceryListProps {
  mealPlan: MealPlan
}

export function GroceryList({ mealPlan }: GroceryListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const groceryItems = useMemo(() => {
    const planData = mealPlan.plan_data as WeeklyPlanData
    const ingredientCounts: Record<string, number> = {}

    // Collect all ingredients from all meals
    for (const day of DAYS) {
      const dayPlan = planData[day]
      if (!dayPlan) continue

      for (const mealType of MEALS) {
        const recipe = dayPlan[mealType] as Recipe | null
        if (recipe?.ingredients) {
          recipe.ingredients.forEach((ing) => {
            // Normalize ingredient name
            const normalized = ing.toLowerCase().trim()
            ingredientCounts[normalized] = (ingredientCounts[normalized] || 0) + 1
          })
        }
      }
    }

    // Convert to grocery items with categories
    const items: GroceryItem[] = Object.entries(ingredientCounts).map(([name, count]) => {
      // Find category
      let category = 'Other'
      for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
        if (name.includes(keyword)) {
          category = cat
          break
        }
      }

      return {
        name,
        quantity: count > 1 ? `x${count}` : '',
        category,
        checked: false,
      }
    })

    // Sort by category, then by name
    return items.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.name.localeCompare(b.name)
    })
  }, [mealPlan])

  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {}
    groceryItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }, [groceryItems])

  const toggleItem = (itemName: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemName)) {
        next.delete(itemName)
      } else {
        next.add(itemName)
      }
      return next
    })
  }

  const checkedCount = checkedItems.size
  const totalCount = groceryItems.length

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {checkedCount}/{totalCount}
              </div>
              <div className="text-sm text-muted-foreground">items checked</div>
            </div>
            <div className="h-16 w-16">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/20"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${(checkedCount / totalCount) * 100}, 100`}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-500"
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped lists */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {items.map((item) => {
                const isChecked = checkedItems.has(item.name)
                return (
                  <li
                    key={item.name}
                    className="flex items-center gap-3"
                    onClick={() => toggleItem(item.name)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleItem(item.name)}
                    />
                    <span
                      className={cn(
                        'flex-1 capitalize transition-all',
                        isChecked && 'text-muted-foreground line-through'
                      )}
                    >
                      {item.name}
                    </span>
                    {item.quantity && (
                      <span className="text-sm text-muted-foreground">{item.quantity}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
