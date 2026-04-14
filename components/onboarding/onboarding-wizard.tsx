'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateBMR, calculateTDEE, calculateMacros } from '@/lib/utils/nutrition'
import type { OnboardingData, NutritionGoals } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  Scale, 
  Target, 
  Utensils, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Leaf
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Body Stats', icon: Scale },
  { id: 3, title: 'Goals', icon: Target },
  { id: 4, title: 'Diet', icon: Utensils },
  { id: 5, title: 'Review', icon: CheckCircle2 },
]

const GOALS = [
  { value: 'weight_loss', label: 'Lose Weight', description: 'Reduce body fat while maintaining muscle' },
  { value: 'maintenance', label: 'Maintain Weight', description: 'Keep your current weight stable' },
  { value: 'muscle_gain', label: 'Build Muscle', description: 'Gain lean muscle mass' },
]

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Extra Active', description: 'Very hard exercise, physical job' },
]

const DIET_TYPES = [
  { value: 'balanced', label: 'Balanced', description: 'All food groups' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'No meat, fish ok' },
  { value: 'vegan', label: 'Vegan', description: 'Plant-based only' },
  { value: 'non_veg', label: 'Non-Vegetarian', description: 'Includes all meats' },
  { value: 'keto', label: 'Keto', description: 'Low carb, high fat' },
  { value: 'high_protein', label: 'High Protein', description: 'Protein-focused' },
]

const COMMON_ALLERGIES = [
  'Dairy', 'Eggs', 'Peanuts', 'Tree Nuts', 'Soy', 'Wheat', 'Fish', 'Shellfish'
]

interface OnboardingWizardProps {
  userId: string
  initialName?: string
}

export function OnboardingWizard({ userId, initialName }: OnboardingWizardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [calculatedGoals, setCalculatedGoals] = useState<NutritionGoals | null>(null)
  
  const [formData, setFormData] = useState<OnboardingData>({
    name: initialName || '',
    age: null,
    gender: null,
    weight: null,
    height: null,
    goal: null,
    activity_level: null,
    diet_type: null,
    allergies: [],
  })

  const updateFormData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.age && formData.gender
      case 2:
        return formData.weight && formData.height
      case 3:
        return formData.goal && formData.activity_level
      case 4:
        return formData.diet_type
      case 5:
        return true
      default:
        return false
    }
  }

  const calculateGoals = () => {
    if (!formData.weight || !formData.height || !formData.age || !formData.gender || !formData.activity_level || !formData.goal) {
      return null
    }

    const bmr = calculateBMR(formData.weight, formData.height, formData.age, formData.gender)
    const tdee = calculateTDEE(bmr, formData.activity_level)
    const macros = calculateMacros(tdee, formData.goal)

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      ...macros
    }
  }

  const handleNext = () => {
    if (currentStep === 4) {
      const goals = calculateGoals()
      setCalculatedGoals(goals)
    }
    setCurrentStep(prev => Math.min(prev + 1, 5))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleComplete = async () => {
    if (!calculatedGoals) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          weight: formData.weight,
          height: formData.height,
          goal: formData.goal,
          activity_level: formData.activity_level,
          diet_type: formData.diet_type,
          allergies: formData.allergies,
          calorie_goal: calculatedGoals.calories,
          protein_goal: calculatedGoals.protein,
          carb_goal: calculatedGoals.carbs,
          fat_goal: calculatedGoals.fat,
          fiber_goal: calculatedGoals.fiber,
          onboarded: true,
        })
        .eq('id', userId)

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      {/* Progress Header */}
      <div className="mb-8 w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Leaf className="h-8 w-8 text-emerald-600" />
          <span className="text-2xl font-bold text-emerald-800">NutriMind AI</span>
        </div>
        <Progress value={(currentStep / 5) * 100} className="h-2" />
        <div className="mt-4 flex justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                'flex flex-col items-center gap-1',
                currentStep >= step.id ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  currentStep > step.id
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : currentStep === step.id
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-muted'
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span className="hidden text-xs font-medium sm:block">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="w-full max-w-2xl border-none shadow-xl">
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>{"Let's get to know you"}</CardTitle>
              <CardDescription>Tell us about yourself to personalize your experience</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-6">
                <Field>
                  <FieldLabel htmlFor="name">What should we call you?</FieldLabel>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Enter your name"
                    className="text-lg"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="age">How old are you?</FieldLabel>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => updateFormData('age', parseInt(e.target.value) || null)}
                    placeholder="Enter your age"
                    min={13}
                    max={120}
                  />
                </Field>
                <Field>
                  <FieldLabel>What is your biological sex?</FieldLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {(['male', 'female', 'other'] as const).map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => updateFormData('gender', gender)}
                        className={cn(
                          'rounded-lg border-2 p-4 text-center capitalize transition-colors',
                          formData.gender === gender
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-muted hover:border-emerald-300'
                        )}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Used for accurate BMR calculation
                  </p>
                </Field>
              </FieldGroup>
            </CardContent>
          </>
        )}

        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Your body stats</CardTitle>
              <CardDescription>We need this to calculate your daily calorie needs</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-6">
                <Field>
                  <FieldLabel htmlFor="weight">Current weight (kg)</FieldLabel>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => updateFormData('weight', parseFloat(e.target.value) || null)}
                    placeholder="e.g., 70"
                    min={30}
                    max={300}
                    step={0.1}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="height">Height (cm)</FieldLabel>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => updateFormData('height', parseFloat(e.target.value) || null)}
                    placeholder="e.g., 175"
                    min={100}
                    max={250}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </>
        )}

        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle>Your fitness goal</CardTitle>
              <CardDescription>{"What would you like to achieve?"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field>
                <FieldLabel>Select your goal</FieldLabel>
                <div className="grid gap-3">
                  {GOALS.map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => updateFormData('goal', goal.value as OnboardingData['goal'])}
                      className={cn(
                        'rounded-lg border-2 p-4 text-left transition-colors',
                        formData.goal === goal.value
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-muted hover:border-emerald-300'
                      )}
                    >
                      <div className="font-medium">{goal.label}</div>
                      <div className="text-sm text-muted-foreground">{goal.description}</div>
                    </button>
                  ))}
                </div>
              </Field>
              <Field>
                <FieldLabel>Activity level</FieldLabel>
                <div className="grid gap-2">
                  {ACTIVITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => updateFormData('activity_level', level.value as OnboardingData['activity_level'])}
                      className={cn(
                        'rounded-lg border-2 p-3 text-left transition-colors',
                        formData.activity_level === level.value
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-muted hover:border-emerald-300'
                      )}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-muted-foreground">{level.description}</div>
                    </button>
                  ))}
                </div>
              </Field>
            </CardContent>
          </>
        )}

        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle>Diet preferences</CardTitle>
              <CardDescription>Help us recommend the right meals for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field>
                <FieldLabel>Diet type</FieldLabel>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {DIET_TYPES.map((diet) => (
                    <button
                      key={diet.value}
                      type="button"
                      onClick={() => updateFormData('diet_type', diet.value as OnboardingData['diet_type'])}
                      className={cn(
                        'rounded-lg border-2 p-3 text-center transition-colors',
                        formData.diet_type === diet.value
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-muted hover:border-emerald-300'
                      )}
                    >
                      <div className="font-medium">{diet.label}</div>
                      <div className="text-xs text-muted-foreground">{diet.description}</div>
                    </button>
                  ))}
                </div>
              </Field>
              <Field>
                <FieldLabel>Any food allergies? (Optional)</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGIES.map((allergy) => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm transition-colors',
                        formData.allergies.includes(allergy)
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-muted hover:border-red-300'
                      )}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </Field>
            </CardContent>
          </>
        )}

        {currentStep === 5 && calculatedGoals && (
          <>
            <CardHeader>
              <CardTitle>Your personalized plan</CardTitle>
              <CardDescription>{"Based on your inputs, here's your daily nutrition target"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl bg-emerald-50 p-6">
                <div className="mb-4 text-center">
                  <div className="text-4xl font-bold text-emerald-700">{calculatedGoals.calories}</div>
                  <div className="text-sm text-emerald-600">Daily Calories</div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{calculatedGoals.protein}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <div className="text-2xl font-bold text-orange-600">{calculatedGoals.carbs}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{calculatedGoals.fat}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">BMR (Basal Metabolic Rate)</span>
                  <span className="font-medium">{calculatedGoals.bmr} kcal</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">TDEE (Total Daily Energy)</span>
                  <span className="font-medium">{calculatedGoals.tdee} kcal</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Daily Fiber Goal</span>
                  <span className="font-medium">{calculatedGoals.fiber}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Water Goal</span>
                  <span className="font-medium">8 glasses</span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium">Ready to start!</p>
                <p className="mt-1 text-blue-700">
                  You can always adjust these goals later in your profile settings.
                </p>
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between border-t p-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
