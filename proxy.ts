import { NextResponse, type NextRequest } from 'next/server'
import { getProxyUser } from '@/lib/supabase/middleware'
import { getUnauthenticatedRedirect, getRoleRedirect, isPublicPath } from '@/lib/auth/routing'
import { isValidRole } from '@/lib/supabase/types'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, user, supabase } = await getProxyUser(request)

  if (!user) {
    const redirect = getUnauthenticatedRedirect(pathname)
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url))
    }
    return response
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role && isValidRole(profile.role) ? profile.role : null

  if (!role) {
    if (isPublicPath(pathname)) return response
    return NextResponse.redirect(new URL('/', request.url))
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
