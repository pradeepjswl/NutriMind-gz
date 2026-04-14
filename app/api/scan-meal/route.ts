import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const mealAnalysisSchema = z.object({
  name: z.string().describe('Name of the meal or food item'),
  emoji: z.string().describe('A single emoji that represents this food'),
  calories: z.number().describe('Estimated calories'),
  protein: z.number().describe('Estimated protein in grams'),
  carbs: z.number().describe('Estimated carbohydrates in grams'),
  fat: z.number().describe('Estimated fat in grams'),
  fiber: z.number().describe('Estimated fiber in grams'),
  health_score: z.enum(['A', 'B', 'C', 'D', 'F']).describe('Health score: A=very healthy, B=healthy, C=moderate, D=less healthy, F=unhealthy'),
  ingredients: z.array(z.string()).describe('List of likely ingredients'),
  suggestions: z.array(z.string()).describe('1-3 suggestions to make this meal healthier'),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { image, category } = await req.json()

    if (!image) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }

    // Call AI to analyze the meal
    const { output } = await generateText({
      model: 'openai/gpt-4o',
      output: Output.object({
        schema: mealAnalysisSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert AI. Analyze food images and provide accurate nutritional estimates.
Be realistic with calorie and macro estimates based on typical portion sizes.
Health scores:
- A: Very healthy (vegetables, lean proteins, whole grains)
- B: Healthy (balanced meals with good nutrients)
- C: Moderate (some processed foods or higher calories)
- D: Less healthy (high in processed foods, sugar, or fat)
- F: Unhealthy (fast food, highly processed, very high calories)`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this food image and provide detailed nutritional information. Estimate calories, macros (protein, carbs, fat, fiber), identify the meal, give it a health score, list likely ingredients, and provide suggestions to make it healthier.',
            },
            {
              type: 'image',
              image: image,
            },
          ],
        },
      ],
    })

    if (!output) {
      return Response.json({ error: 'Failed to analyze meal' }, { status: 500 })
    }

    // Save to database
    const { data: mealLog, error: dbError } = await supabase
      .from('meal_logs')
      .insert({
        user_id: user.id,
        name: output.name,
        emoji: output.emoji,
        category: category || 'scanned',
        calories: output.calories,
        protein: output.protein,
        carbs: output.carbs,
        fat: output.fat,
        fiber: output.fiber,
        health_score: output.health_score,
        image_url: null, // Could store the image in blob storage
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return Response.json({ error: 'Failed to save meal' }, { status: 500 })
    }

    // Update user stats
    await supabase.rpc('increment_scans_used', { user_id_param: user.id }).catch(() => {
      // Ignore if RPC doesn't exist, we'll handle this gracefully
    })

    return Response.json({
      analysis: output,
      mealLog,
    })
  } catch (error) {
    console.error('Scan meal error:', error)
    return Response.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
