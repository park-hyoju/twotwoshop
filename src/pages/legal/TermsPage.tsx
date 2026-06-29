import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage'
import { TERMS_OF_SERVICE } from '../../content/legalDocuments'

export function TermsPage() {
  return <LegalDocumentPage document={TERMS_OF_SERVICE} />
}
