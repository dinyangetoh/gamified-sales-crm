'use client'

import { useEffect, useState } from 'react'
import { decodeJwtPayload, type JwtPayload } from '@/lib/api/jwt'
import { getAccessToken } from '@/lib/api/tokenStorage'

export default function useSession() {
  const [session, setSession] = useState<JwtPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setSession(null)
      setLoading(false)
      return
    }
    const payload = decodeJwtPayload(token)
    setSession(payload)
    setLoading(false)
  }, [])

  return { session, loading }
}

