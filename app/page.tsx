import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Leaf, 
  Camera, 
  Brain, 
  Calendar, 
  Droplets, 
  Target,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', user.id)
      .single()
    
    if (profile?.onboarded) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-800">NutriMind AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">
              <Sparkles className="h-4 w-4" />
              AI-Powered Nutrition Tracking
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Eat Smarter with{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Insights
            </h1>
            <p className="mb-10 text-pretty text-lg text-muted-foreground sm:text-xl">
              Scan your meals, get instant nutrition analysis, and receive personalized recommendations. 
              NutriMind AI makes healthy eating effortless.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="gap-2 bg-emerald-600 px-8 hover:bg-emerald-700">
                <Link href="/auth/sign-up">
                  Start Free Today
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="#features">
                  See How It Works
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute -top-40 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 blur-3xl" />
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Everything You Need</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Powerful AI features designed to simplify your nutrition journey
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Camera,
                title: 'AI Meal Scanner',
                description: 'Snap a photo of your food and get instant calorie and macro breakdown with health scores',
                color: 'bg-blue-500',
              },
              {
                icon: Brain,
                title: 'Smart Recommendations',
                description: 'Get personalized meal suggestions based on your goals, preferences, and eating patterns',
                color: 'bg-purple-500',
              },
              {
                icon: Calendar,
                title: 'Weekly Meal Planner',
                description: 'Auto-generated meal plans tailored to your diet type and nutritional targets',
                color: 'bg-orange-500',
              },
              {
                icon: Droplets,
                title: 'Water Tracker',
                description: 'Stay hydrated with reminders and track your daily water intake goals',
                color: 'bg-cyan-500',
              },
              {
                icon: Target,
                title: 'Habit Streaks',
                description: 'Build healthy habits with streak tracking and achievement badges',
                color: 'bg-emerald-500',
              },
              {
                icon: Sparkles,
                title: 'AI Chat Assistant',
                description: 'Ask nutrition questions and get instant, science-backed answers',
                color: 'bg-pink-500',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border bg-card p-6 transition-all hover:border-emerald-200 hover:shadow-lg"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to Transform Your Eating Habits?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of users who have improved their nutrition with NutriMind AI
          </p>
          <Button asChild size="lg" className="gap-2 bg-emerald-600 px-8 hover:bg-emerald-700">
            <Link href="/auth/sign-up">
              Get Started for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-emerald-800">NutriMind AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Made with care for your health
          </p>
        </div>
      </footer>
    </div>
  )
}
