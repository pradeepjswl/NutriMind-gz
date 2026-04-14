import { createClient } from '@/lib/supabase/server'

// Open Food Facts API for barcode lookup
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v0/product'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const barcode = searchParams.get('barcode')

    if (!barcode) {
      return Response.json({ error: 'No barcode provided' }, { status: 400 })
    }

    // Fetch from Open Food Facts
    const response = await fetch(`${OPEN_FOOD_FACTS_API}/${barcode}.json`)
    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = data.product
    const nutriments = product.nutriments || {}

    // Extract nutrition info per serving or per 100g
    const servingSize = product.serving_quantity || 100
    const isPerServing = !!product.serving_quantity

    const nutrition = {
      name: product.product_name || 'Unknown Product',
      brand: product.brands || null,
      serving_size: servingSize,
      serving_unit: product.serving_quantity_unit || 'g',
      calories: Math.round(
        isPerServing
          ? nutriments['energy-kcal_serving'] || nutriments['energy-kcal_100g'] || 0
          : nutriments['energy-kcal_100g'] || 0
      ),
      protein: Math.round(
        (isPerServing
          ? nutriments.proteins_serving || nutriments.proteins_100g || 0
          : nutriments.proteins_100g || 0) * 10
      ) / 10,
      carbs: Math.round(
        (isPerServing
          ? nutriments.carbohydrates_serving || nutriments.carbohydrates_100g || 0
          : nutriments.carbohydrates_100g || 0) * 10
      ) / 10,
      fat: Math.round(
        (isPerServing
          ? nutriments.fat_serving || nutriments.fat_100g || 0
          : nutriments.fat_100g || 0) * 10
      ) / 10,
      fiber: Math.round(
        (isPerServing
          ? nutriments.fiber_serving || nutriments.fiber_100g || 0
          : nutriments.fiber_100g || 0) * 10
      ) / 10,
      sugar: Math.round(
        (isPerServing
          ? nutriments.sugars_serving || nutriments.sugars_100g || 0
          : nutriments.sugars_100g || 0) * 10
      ) / 10,
      sodium: Math.round(
        (isPerServing
          ? nutriments.sodium_serving || nutriments.sodium_100g || 0
          : nutriments.sodium_100g || 0) * 1000
      ), // Convert to mg
      nutriscore_grade: product.nutriscore_grade?.toUpperCase() || null,
      image_url: product.image_url || null,
      ingredients_text: product.ingredients_text || null,
    }

    // Map Nutri-Score to our health score
    const healthScore = mapNutriScoreToHealthScore(nutrition.nutriscore_grade)

    return Response.json({
      product: {
        ...nutrition,
        health_score: healthScore,
        emoji: '📦',
      },
    })
  } catch (error) {
    console.error('Barcode lookup error:', error)
    return Response.json({ error: 'Failed to lookup barcode' }, { status: 500 })
  }
}

function mapNutriScoreToHealthScore(nutriScore: string | null): 'A' | 'B' | 'C' | 'D' | 'F' {
  switch (nutriScore) {
    case 'A':
      return 'A'
    case 'B':
      return 'B'
    case 'C':
      return 'C'
    case 'D':
      return 'D'
    case 'E':
      return 'F'
    default:
      return 'C' // Default to moderate if unknown
  }
}
