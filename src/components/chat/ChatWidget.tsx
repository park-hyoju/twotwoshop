import { useState } from 'react'
import { ChatButton } from './ChatButton'
import { ChatWindow } from './ChatWindow'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      <ChatButton isOpen={isOpen} onClick={() => setIsOpen((prev) => !prev)} />
    </div>
  )
}
