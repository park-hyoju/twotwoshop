import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage'
import { PRIVACY_POLICY } from '../../content/legalDocuments'

export function PrivacyPage() {
  return <LegalDocumentPage document={PRIVACY_POLICY} />
}
