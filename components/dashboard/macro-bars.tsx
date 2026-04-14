'use client'

import { cn } from '@/lib/utils'

interface MacroBarsProps {
  protein: { current: number; goal: number }
  carbs: { current: number; goal: number }
  fat: { current: number; goal: number }
  fiber: { current: number; goal: number }
  className?: string
}

export function MacroBars({ protein, carbs, fat, fiber, className }: MacroBarsProps) {
  const macros = [
    { label: 'Protein', ...protein, color: 'bg-blue-500', bgColor: 'bg-blue-100' },
    { label: 'Carbs', ...carbs, color: 'bg-orange-500', bgColor: 'bg-orange-100' },
    { label: 'Fat', ...fat, color: 'bg-purple-500', bgColor: 'bg-purple-100' },
    { label: 'Fiber', ...fiber, color: 'bg-emerald-500', bgColor: 'bg-emerald-100' },
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {macros.map((macro) => {
        const percentage = Math.min((macro.current / macro.goal) * 100, 100)
        return (
          <div key={macro.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{macro.label}</span>
              <span className="text-muted-foreground">
                {macro.current}g / {macro.goal}g
              </span>
            </div>
            <div className={cn('h-3 overflow-hidden rounded-full', macro.bgColor)}>
              <div
                className={cn('h-full rounded-full transition-all duration-500', macro.color)}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
