'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import useSession from '@/lib/auth/useSession'
import { apiFetch } from '@/lib/api/client'
import EmailPreviewPage from '@/components/emails/EmailPreviewPage'
import { emailTemplateComponents, type EmailTemplateId } from '@/components/emails/emailTemplateRegistry'

type EmailTemplateRegistryItem = {
  templateId: string
  templateDisplayName: string
  role: 'rep' | 'manager'
  status: 'poc' | 'mvp'
  trigger: string
  defaultSubject: string
  resendTemplateId?: string
  resendLink?: string
}

type SendTestResponse = { accepted: boolean }

function isTemplateId(id: string): id is EmailTemplateId {
  return id in emailTemplateComponents
}

export default function ManagerEmailsPage() {
  const { session } = useSession()
  const actorId = session?.sub
  const searchParams = useSearchParams()

  const initialTemplateId = useMemo(() => {
    const v = searchParams.get('template')
    if (!v) return 'BADGE_UNLOCK' as EmailTemplateId
    return isTemplateId(v) ? v : ('BADGE_UNLOCK' as EmailTemplateId)
  }, [searchParams])

  const [items, setItems] = useState<EmailTemplateRegistryItem[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<EmailTemplateId>(initialTemplateId)

  const [toEmail, setToEmail] = useState('manager@demo.com')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setSelectedTemplateId(initialTemplateId)
  }, [initialTemplateId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setErr(null)
      try {
        const res = await apiFetch<EmailTemplateRegistryItem[]>('/manager/emails/templates')
        if (cancelled) return
        setItems(res)
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load templates')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSendTest(templateId: EmailTemplateId) {
    if (!actorId) return
    setSending(true)
    setMessage(null)
    try {
      const res = await apiFetch<SendTestResponse>(`/manager/emails/${templateId}/send-test`, {
        method: 'POST',
        body: { toEmail, userId: actorId },
      })
      setMessage(res.accepted ? 'Send accepted.' : 'Send rejected.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const typedItems = useMemo(() => {
    if (!items) return null
    return items
      .filter((t) => isTemplateId(t.templateId))
      .map((t) => ({ ...t, templateId: t.templateId as EmailTemplateId }))
  }, [items])

  return (
    <AppShell role="manager" active="emails" title="Email templates" sub="Preview every transactional email">
      {err && (
        <Card title="Could not load templates" subtitle={err}>
          The backend template registry endpoint is not available yet.
        </Card>
      )}

      {!err && !typedItems && <Card title="Loading…" subtitle="Fetching template registry"> </Card>}

      {typedItems && (
        <EmailPreviewPage
          templates={typedItems}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplateId={setSelectedTemplateId}
          toEmail={toEmail}
          onToEmailChange={setToEmail}
          onSendTest={onSendTest}
          sending={sending}
          message={message}
        />
      )}
    </AppShell>
  )
}


