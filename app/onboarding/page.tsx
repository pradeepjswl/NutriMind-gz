import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Check if already onboarded
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded, name')
    .eq('id', user.id)
    .single()

  if (profile?.onboarded) {
    redirect('/dashboard')
  }

  return (
    <OnboardingWizard 
      userId={user.id} 
      initialName={profile?.name || user.user_metadata?.name || ''} 
    />
  )
}
