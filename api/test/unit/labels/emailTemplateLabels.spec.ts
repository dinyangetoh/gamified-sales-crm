import { getEmailTemplateDisplayName } from '../../../src/common/labels/emailTemplateLabels'

describe('emailTemplateLabels', () => {
  it('maps known template IDs to Title Case display names', () => {
    expect(getEmailTemplateDisplayName('BADGE_UNLOCK')).toBe('Badge Unlock')
    expect(getEmailTemplateDisplayName('WEEKLY_MGR_DIGEST')).toBe('Weekly Manager Digest')
  })
})
