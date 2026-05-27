'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { decodeJwtPayload } from '@/lib/api/jwt'
import { clearAccessToken, getAccessToken } from '@/lib/api/tokenStorage'
import type { JwtRole } from '@/lib/api/jwt'

export default function AuthGate({
  requiredRole,
  children,
}: {
  requiredRole: JwtRole
  children: React.ReactNode
}) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  const redirectPath = useMemo(() => {
    return requiredRole === 'MANAGER' ? '/admin/dashboard' : '/dashboard'
  }, [requiredRole])

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

    if (payload.role !== requiredRole) {
      router.replace(redirectPath)
      return
    }

    setReady(true)
  }, [redirectPath, ready, requiredRole, router])

  if (!ready) return <div style={{ padding: 24 }}>Loading…</div>
  return <>{children}</>
}

