import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public paths that don't require authentication
  const publicPaths = ['/auth', '/']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith('/auth/')
  )

  // If user is not logged in and trying to access protected routes
  if (!user && !isPublicPath && request.nextUrl.pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access auth pages, redirect to app
  if (user && request.nextUrl.pathname.startsWith('/auth/')) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    if (profile?.onboarded) {
      url.pathname = '/app/dashboard'
    } else {
      url.pathname = '/app/onboarding'
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
