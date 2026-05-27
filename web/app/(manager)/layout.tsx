import type { ReactNode } from 'react'
import AuthGate from '@/components/auth/AuthGate'

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return <AuthGate requiredRole="MANAGER">{children}</AuthGate>
}

