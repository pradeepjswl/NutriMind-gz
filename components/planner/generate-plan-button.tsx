'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'

export function GeneratePlanButton() {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePlan = async () => {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate meal plan')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={generatePlan}
        disabled={generating}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Plan
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
