import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from '@/components/profile/logout-button'
import { ProfileForm } from '@/components/profile/profile-form'
import { Leaf, Settings, Target, Utensils, Activity } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as Profile

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <Leaf className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{p.name || 'User'}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* Stats Overview */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-100 p-2">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{p.calorie_goal || 0}</p>
              <p className="text-xs text-muted-foreground">Daily Calories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{p.protein_goal || 0}g</p>
              <p className="text-xs text-muted-foreground">Protein Goal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-5 w-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={p} userId={user.id} />
        </CardContent>
      </Card>

      {/* Diet & Goals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="h-5 w-5" />
            Diet Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Diet Type</span>
            <span className="font-medium capitalize">{p.diet_type?.replace('_', ' ') || 'Not set'}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Goal</span>
            <span className="font-medium capitalize">{p.goal?.replace('_', ' ') || 'Not set'}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Activity Level</span>
            <span className="font-medium capitalize">{p.activity_level?.replace('_', ' ') || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Allergies</span>
            <span className="font-medium">
              {p.allergies?.length > 0 ? p.allergies.join(', ') : 'None'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
