'use client'

import { cn } from '@/lib/utils'
import { Lightbulb, TrendingUp, AlertCircle, Sparkles } from 'lucide-react'
import type { Profile, DailySummary } from '@/lib/types'

interface RecommendationCardsProps {
  profile: Profile
  summary: DailySummary
  className?: string
}

interface Recommendation {
  type: 'tip' | 'warning' | 'motivation' | 'insight'
  title: string
  message: string
  icon: typeof Lightbulb
  color: string
  bgColor: string
}

export function RecommendationCards({ profile, summary, className }: RecommendationCardsProps) {
  const recommendations = generateRecommendations(profile, summary)

  if (recommendations.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="flex items-center gap-2 font-semibold">
        <Sparkles className="h-5 w-5 text-amber-500" />
        Smart Insights
      </h3>
      <div className="space-y-2">
        {recommendations.slice(0, 3).map((rec, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-3 rounded-xl p-4',
              rec.bgColor
            )}
          >
            <div className={cn('rounded-lg p-2', rec.color.replace('text-', 'bg-').replace('500', '100'))}>
              <rec.icon className={cn('h-5 w-5', rec.color)} />
            </div>
            <div>
              <p className="font-medium text-foreground">{rec.title}</p>
              <p className="text-sm text-muted-foreground">{rec.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function generateRecommendations(profile: Profile, summary: DailySummary): Recommendation[] {
  const recommendations: Recommendation[] = []
  const calorieGoal = profile.calorie_goal || 2000
  const proteinGoal = profile.protein_goal || 100
  const waterGoal = profile.water_goal || 8

  // Calorie insights
  const caloriePercent = (summary.totalCalories / calorieGoal) * 100
  if (caloriePercent < 50 && new Date().getHours() > 14) {
    recommendations.push({
      type: 'warning',
      title: 'Low calorie intake',
      message: `You&apos;ve only consumed ${Math.round(caloriePercent)}% of your daily goal. Consider having a nutritious meal.`,
      icon: AlertCircle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    })
  }

  // Protein insights
  const proteinPercent = (summary.totalProtein / proteinGoal) * 100
  if (proteinPercent < 30 && new Date().getHours() > 12) {
    recommendations.push({
      type: 'tip',
      title: 'Boost your protein',
      message: 'Try adding eggs, chicken, or legumes to your next meal to meet your protein goal.',
      icon: Lightbulb,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    })
  }

  // Water insights
  if (summary.waterGlasses < waterGoal / 2 && new Date().getHours() > 12) {
    recommendations.push({
      type: 'tip',
      title: 'Stay hydrated',
      message: `You&apos;ve had ${summary.waterGlasses} glasses. Aim for ${waterGoal - summary.waterGlasses} more today!`,
      icon: Lightbulb,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
    })
  }

  // Motivational insights
  if (summary.meals.length >= 3) {
    recommendations.push({
      type: 'motivation',
      title: 'Great job logging!',
      message: 'Consistent tracking helps you stay on top of your goals. Keep it up!',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    })
  }

  // Goal-specific tips
  if (profile.goal === 'weight_loss' && caloriePercent > 90) {
    recommendations.push({
      type: 'insight',
      title: 'Near your limit',
      message: 'Consider light, low-calorie options for any remaining meals today.',
      icon: Sparkles,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    })
  }

  if (profile.goal === 'muscle_gain' && proteinPercent < 50 && new Date().getHours() > 16) {
    recommendations.push({
      type: 'tip',
      title: 'Protein opportunity',
      message: 'A protein shake or Greek yogurt could help you hit your muscle-building goals.',
      icon: Lightbulb,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    })
  }

  // Default tip if no specific recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'motivation',
      title: 'You are on track!',
      message: 'Keep making healthy choices. Every meal counts towards your goals.',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    })
  }

  return recommendations
}
