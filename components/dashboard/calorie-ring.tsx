'use client'

import { cn } from '@/lib/utils'

interface CalorieRingProps {
  consumed: number
  goal: number
  className?: string
}

export function CalorieRing({ consumed, goal, className }: CalorieRingProps) {
  const percentage = Math.min((consumed / goal) * 100, 100)
  const remaining = Math.max(goal - consumed, 0)
  const strokeDasharray = 2 * Math.PI * 90 // circumference
  const strokeDashoffset = strokeDasharray * (1 - percentage / 100)
  
  // Color based on progress
  const getColor = () => {
    if (percentage > 100) return '#ef4444' // red - over
    if (percentage > 90) return '#f59e0b' // amber - close
    return '#10b981' // emerald - good
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg className="h-48 w-48 -rotate-90 transform" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-bold text-foreground">{consumed}</span>
        <span className="text-sm text-muted-foreground">of {goal} kcal</span>
        <div className="mt-2 rounded-full bg-emerald-100 px-3 py-1">
          <span className="text-sm font-medium text-emerald-700">
            {remaining > 0 ? `${remaining} left` : 'Goal reached!'}
          </span>
        </div>
      </div>
    </div>
  )
}
