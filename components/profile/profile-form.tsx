'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateBMR, calculateTDEE, calculateMacroTargets, calculateCalorieTarget } from '@/lib/utils/nutrition'
import type { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Loader2 } from 'lucide-react'

interface ProfileFormProps {
  profile: Profile
  userId: string
}

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: profile.name || '',
    age: profile.age || '',
    weight: profile.weight || '',
    height: profile.height || '',
    water_goal: profile.water_goal || 8,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Recalculate goals if body stats changed
      const weight = parseFloat(String(formData.weight)) || profile.weight
      const height = parseFloat(String(formData.height)) || profile.height
      const age = parseInt(String(formData.age)) || profile.age

      let updates: Partial<Profile> = {
        name: formData.name,
        age: age || undefined,
        weight: weight || undefined,
        height: height || undefined,
        water_goal: formData.water_goal,
      }

      // Recalculate nutrition goals if body stats or activity level changed
      if (weight && height && age && profile.gender && profile.activity_level && profile.goal && profile.diet_type) {
        const bmr = calculateBMR(weight, height, age, profile.gender)
        const tdee = calculateTDEE(bmr, profile.activity_level)
        const calorieTarget = calculateCalorieTarget(tdee, profile.goal)
        const macros = calculateMacroTargets(calorieTarget, profile.goal, profile.diet_type)
        
        updates = {
          ...updates,
          calorie_goal: calorieTarget,
          protein_goal: macros.protein,
          carb_goal: macros.carbs,
          fat_goal: macros.fat,
          fiber_goal: macros.fiber,
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field>
            <FieldLabel htmlFor="age">Age</FieldLabel>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="height">Height (cm)</FieldLabel>
            <Input
              id="height"
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="water_goal">Daily Water Goal (glasses)</FieldLabel>
          <Input
            id="water_goal"
            type="number"
            min={1}
            max={20}
            value={formData.water_goal}
            onChange={(e) => setFormData({ ...formData, water_goal: parseInt(e.target.value) || 8 })}
          />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}
