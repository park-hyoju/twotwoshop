export const CHAT_WIDGET_OPEN_EVENT = 'twotwoshop:chat-open'

export function openChatWidget(): void {
  window.dispatchEvent(new CustomEvent(CHAT_WIDGET_OPEN_EVENT))
}
