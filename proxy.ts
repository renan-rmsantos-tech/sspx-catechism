import { NextResponse, type NextRequest } from 'next/server'
import { getProxyUser } from '@/lib/supabase/middleware'
import { getUnauthenticatedRedirect, getRoleRedirect, isPublicPath } from '@/lib/auth/routing'
import { isValidRole } from '@/lib/supabase/types'

async function fetchRole(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  console.log('[proxy] fetchRole', { userId, hasUrl: !!url, hasKey: !!key, keyPrefix: key?.slice(0, 10) })

  if (!url || !key) return null

  const res = await fetch(
    `${url}/rest/v1/profiles?id=eq.${userId}&select=role`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  )

  const body = await res.text()
  console.log('[proxy] fetchRole response', { status: res.status, body })

  if (!res.ok) return null
  const rows = JSON.parse(body)
  return rows?.[0]?.role ?? null
}

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

  const role = await fetchRole(user.id)

  if (!role || !isValidRole(role)) {
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
