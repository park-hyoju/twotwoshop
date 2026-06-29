import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { DEFAULT_CONSULTATION_STATUS, isConsultationStatus } from '../lib/consultationStatusDisplay'
import type { ConsultationStatus, ConsultationStatusSettings } from '../types/consultationStatus'

export class ConsultationStatusRepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConsultationStatusRepositoryError'
  }
}

function mapRow(row: { status: string; updated_at: string }): ConsultationStatusSettings {
  if (!isConsultationStatus(row.status)) {
    throw new ConsultationStatusRepositoryError('상담 상태 형식이 올바르지 않습니다.')
  }

  return {
    status: row.status,
    updatedAt: row.updated_at,
  }
}

export async function fetchConsultationStatus(): Promise<ConsultationStatusSettings> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      status: DEFAULT_CONSULTATION_STATUS,
      updatedAt: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('consultation_status_settings')
    .select('status, updated_at')
    .eq('id', 'default')
    .maybeSingle()

  if (error) {
    throw new ConsultationStatusRepositoryError('상담 상태를 불러오지 못했습니다.')
  }

  if (!data) {
    return {
      status: DEFAULT_CONSULTATION_STATUS,
      updatedAt: new Date().toISOString(),
    }
  }

  return mapRow(data)
}

export async function updateConsultationStatus(
  status: ConsultationStatus,
): Promise<ConsultationStatusSettings> {
  if (!isSupabaseConfigured || !supabase) {
    throw new ConsultationStatusRepositoryError('Supabase가 설정되지 않았습니다.')
  }

  const { data, error } = await supabase
    .from('consultation_status_settings')
    .update({ status })
    .eq('id', 'default')
    .select('status, updated_at')
    .single()

  if (error || !data) {
    throw new ConsultationStatusRepositoryError('상담 상태를 저장하지 못했습니다.')
  }

  return mapRow(data)
}
