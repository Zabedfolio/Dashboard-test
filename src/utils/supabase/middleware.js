import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

function hasAdminEmail(user) {
  const email = user?.email?.toLowerCase()
  const configured = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@example.com').toLowerCase()
  return email === 'admin@example.com' || email === configured
}

function isMissingProfilesTableError(error) {
  return error?.code === 'PGRST205' || error?.message?.includes('public.profiles')
}

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { data: { user } } = await supabase.auth.getUser()

  // Here we can enforce route protection.
  // We'll define protected routes and redirect unauthorized users to /login
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith('/dashboard');
  const isAuthRoute =
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password');

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access login/register, redirect to dashboard or home
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-based protection will be handled either here or in individual layouts/pages
  if (path.startsWith('/dashboard/admin') && user) {
    // Need to fetch user role
    const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    if (isMissingProfilesTableError(error) && hasAdminEmail(user)) {
      return supabaseResponse
    }
    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (path.startsWith('/dashboard/moderator') && user) {
    const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    if (isMissingProfilesTableError(error) && hasAdminEmail(user)) {
      return supabaseResponse
    }
    if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
