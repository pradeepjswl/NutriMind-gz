import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get user profile for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, goal, diet_type, calorie_goal, protein_goal, carb_goal, fat_goal, allergies')
    .eq('id', user.id)
    .single()

  // Get today's meals for context
  const today = new Date().toISOString().split('T')[0]
  const { data: todaysMeals } = await supabase
    .from('meal_logs')
    .select('name, calories, protein, carbs, fat')
    .eq('user_id', user.id)
    .gte('logged_at', `${today}T00:00:00`)
    .lte('logged_at', `${today}T23:59:59`)

  const totalCalories = todaysMeals?.reduce((sum, m) => sum + m.calories, 0) || 0
  const totalProtein = todaysMeals?.reduce((sum, m) => sum + Number(m.protein), 0) || 0

  const { messages }: { messages: UIMessage[] } = await req.json()

  const systemPrompt = `You are NutriMind AI, a friendly and knowledgeable nutrition assistant. You help users with:
- Answering nutrition and diet questions
- Providing healthy eating tips and meal suggestions
- Explaining nutritional concepts in simple terms
- Offering motivation and support for their health journey

User Profile:
- Name: ${profile?.name || 'User'}
- Goal: ${profile?.goal?.replace('_', ' ') || 'Not set'}
- Diet Type: ${profile?.diet_type?.replace('_', ' ') || 'Balanced'}
- Daily Calorie Goal: ${profile?.calorie_goal || 2000} kcal
- Daily Protein Goal: ${profile?.protein_goal || 100}g
- Allergies: ${profile?.allergies?.length ? profile.allergies.join(', ') : 'None'}

Today's Progress:
- Calories consumed: ${totalCalories} / ${profile?.calorie_goal || 2000} kcal
- Protein consumed: ${Math.round(totalProtein)}g / ${profile?.protein_goal || 100}g
- Meals logged: ${todaysMeals?.length || 0}

Guidelines:
- Be encouraging and supportive
- Give practical, actionable advice
- Keep responses concise but helpful
- If asked about specific medical conditions, recommend consulting a healthcare professional
- Use the user's data to personalize advice when relevant
- Suggest meals that fit their diet type and avoid their allergies`

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
