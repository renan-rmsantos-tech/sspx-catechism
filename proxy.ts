import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getPublicEnv } from '@/lib/supabase/config'
import { getProxyUser } from '@/lib/supabase/middleware'
import { getUnauthenticatedRedirect, getRoleRedirect } from '@/lib/auth/routing'
import { isValidRole } from '@/lib/supabase/types'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, user } = await getProxyUser(request)

  if (!user) {
    const redirect = getUnauthenticatedRedirect(pathname)
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url))
    }
    return response
  }

  const { url, anonKey } = getPublicEnv()
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll() {},
    },
  })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role && isValidRole(profile.role) ? profile.role : null

  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const redirect = getRoleRedirect(pathname, role)
  if (redirect) {
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
