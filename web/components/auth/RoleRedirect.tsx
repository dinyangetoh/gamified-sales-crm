'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { decodeJwtPayload } from '@/lib/api/jwt'
import { clearAccessToken, getAccessToken } from '@/lib/api/tokenStorage'
import type { JwtRole } from '@/lib/api/jwt'

function roleToPath(role: JwtRole): string {
  if (role === 'MANAGER') return '/admin/dashboard'
  return '/dashboard'
}

export default function RoleRedirect() {
  const router = useRouter()

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      router.replace('/login')
      return
    }

    const payload = decodeJwtPayload(token)
    if (!payload) {
      clearAccessToken()
      router.replace('/login')
      return
    }

    router.replace(roleToPath(payload.role))
  }, [router])

  // This page never renders after navigation; keep a minimal fallback.
  return <div style={{ padding: 24 }}>Redirecting…</div>
}

