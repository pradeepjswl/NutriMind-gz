'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Droplets, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WaterTrackerProps {
  userId: string
  initialGlasses: number
  goal: number
  date: string
  className?: string
}

export function WaterTracker({ userId, initialGlasses, goal, date, className }: WaterTrackerProps) {
  const [glasses, setGlasses] = useState(initialGlasses)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const updateWater = async (newValue: number) => {
    const value = Math.max(0, Math.min(newValue, 16))
    setGlasses(value)

    startTransition(async () => {
      await supabase
        .from('water_logs')
        .upsert({
          user_id: userId,
          date,
          glasses: value,
        }, {
          onConflict: 'user_id,date'
        })
    })
  }

  const percentage = Math.min((glasses / goal) * 100, 100)

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-cyan-600" />
          <span className="font-semibold text-cyan-800">Water</span>
        </div>
        <span className="text-sm text-cyan-600">
          {glasses} / {goal} glasses
        </span>
      </div>

      {/* Water visualization */}
      <div className="mb-4 flex justify-center gap-1.5">
        {Array.from({ length: goal }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-8 w-4 rounded-full border-2 transition-all duration-300',
              i < glasses
                ? 'border-cyan-500 bg-cyan-500'
                : 'border-cyan-200 bg-white'
            )}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-cyan-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-cyan-200"
          onClick={() => updateWater(glasses - 1)}
          disabled={glasses === 0 || isPending}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-3xl font-bold text-cyan-700">{glasses}</span>
          <Droplets className="h-6 w-6 text-cyan-500" />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-cyan-200 bg-cyan-500 text-white hover:bg-cyan-600 hover:text-white"
          onClick={() => updateWater(glasses + 1)}
          disabled={glasses >= 16 || isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
