import type { ReactNode } from 'react'
import AuthGate from '@/components/auth/AuthGate'

export default function SalesRepLayout({ children }: { children: ReactNode }) {
  return <AuthGate requiredRole="SALES_REP">{children}</AuthGate>
}

