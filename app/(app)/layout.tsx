import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { InstallPrompt } from '@/components/pwa/install-prompt'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <ServiceWorkerRegister />
      <main className="flex-1">{children}</main>
      <MobileNav />
      <InstallPrompt />
    </div>
  )
}
