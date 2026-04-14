'use client'

import { cn } from '@/lib/utils'
import { Flame, Droplets, Dumbbell, Trophy } from 'lucide-react'
import type { UserStats } from '@/lib/types'

interface StreakCardProps {
  stats: UserStats
  className?: string
}

export function StreakCard({ stats, className }: StreakCardProps) {
  const streaks = [
    {
      label: 'Log Streak',
      value: stats.log_streak,
      best: stats.longest_log_streak,
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Water',
      value: stats.water_streak,
      best: stats.longest_water_streak,
      icon: Droplets,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-100',
    },
    {
      label: 'Protein',
      value: stats.protein_streak,
      best: stats.protein_streak,
      icon: Dumbbell,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4', className)}>
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-600" />
        <span className="font-semibold text-amber-800">Streaks</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {streaks.map((streak) => (
          <div
            key={streak.label}
            className="flex flex-col items-center rounded-xl bg-white/80 p-3"
          >
            <div className={cn('mb-2 rounded-full p-2', streak.bgColor)}>
              <streak.icon className={cn('h-5 w-5', streak.color, streak.value > 0 && 'animate-flame')} />
            </div>
            <span className="text-2xl font-bold text-foreground">{streak.value}</span>
            <span className="text-xs text-muted-foreground">{streak.label}</span>
            {streak.best > 0 && (
              <span className="mt-1 text-[10px] text-amber-600">
                Best: {streak.best}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Badges preview */}
      {stats.earned_badges.length > 0 && (
        <div className="mt-4 border-t border-amber-200 pt-3">
          <div className="flex flex-wrap gap-1">
            {stats.earned_badges.slice(0, 5).map((badge, i) => (
              <span
                key={i}
                className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800"
              >
                {badge}
              </span>
            ))}
            {stats.earned_badges.length > 5 && (
              <span className="text-xs text-amber-600">
                +{stats.earned_badges.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
