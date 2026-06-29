const BASE_ADMIN_TITLE = '투투샵 관리자'
const ALERT_ADMIN_TITLE = `(새 문의) ${BASE_ADMIN_TITLE}`
const NOTIFICATION_MESSAGE = '새 문의가 도착했습니다.'

export function resetAdminTabAlertCount(): void {
  if (typeof document !== 'undefined') {
    document.title = BASE_ADMIN_TITLE
  }
}

export function setAdminTabAlertTitle(): void {
  if (typeof document !== 'undefined') {
    document.title = ALERT_ADMIN_TITLE
  }
}

export function requestAdminNotificationPermission(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }

  if (Notification.permission === 'default') {
    void Notification.requestPermission()
  }
}

export function showAdminBrowserNotification(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  try {
    new Notification(NOTIFICATION_MESSAGE)
  } catch {
    // Notification API may fail in unsupported contexts.
  }
}

export function getAdminInquiryNotificationMessage(): string {
  return NOTIFICATION_MESSAGE
}
