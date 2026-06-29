export type ConsultationStatus = 'available' | 'away' | 'busy' | 'closed'

export interface ConsultationStatusSettings {
  status: ConsultationStatus
  updatedAt: string
}
