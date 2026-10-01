import { useEffect, useRef, useState } from 'react'

function ChatIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M4 12 20 4l-5 16-3.5-6.5L4 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const SUGGESTIONS = [
  'Summarize my fraud alerts',
  'Explain my latest flagged transaction',
  'How do I stay safe from UPI scams?',
]

const WELCOME =
  "Hi! I'm the SecurePayX assistant. I can explain your flagged transactions, answer questions about your checks, and share fraud safety tips."

// Cleans up markdown symbols so replies read nicely as plain text.
function formatText(text) {
  return text.replace(/\*\*/g, '').replace(/^\s*[*-]\s+/gm, '• ')
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  // Keep the newest message in view
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Focus the input when the panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Stop any reply in progress if the widget is removed
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const updateLastMessage = (content) => {
    setMessages((prev) => {
      const next = [...prev]
      next[next.length - 1] = { role: 'assistant', content }
      return next
    })
  }

  const sendMessage = async (text) => {
    const message = (text ?? input).trim()
    if (!message || sending) return

    const token = localStorage.getItem('token')
    if (!token) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: 'Please log in again to use the assistant.' },
      ])
      setInput('')
      return
    }

    const history = messages.map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])
    setInput('')
    setSending(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, history }),
        signal: controller.signal,
      })

      if (!res.ok) {
        if (res.status === 401) {
          updateLastMessage('Your session expired. Please log in again.')
        } else {
          let msg = 'Sorry, the assistant is unavailable right now.'
          try {
            const data = await res.json()
            if (data.message) msg = data.message
          } catch {
            // keep the default message
          }
          updateLastMessage(msg)
        }
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        updateLastMessage(reply)
      }

      if (!reply.trim()) updateLastMessage('Sorry, I could not come up with an answer. Please try again.')
    } catch (err) {
      if (err.name !== 'AbortError') {
        updateLastMessage('Could not reach the server. Check that the backend is running.')
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    abortRef.current?.abort()
    setMessages([])
    setSending(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-16 right-0 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white border border-line rounded-2xl shadow-2xl shadow-black/10 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-br from-green via-green-strong to-[#052E22] text-white">
            <div>
              <div className="font-serif text-base font-semibold">SecurePayX Assistant</div>
              <div className="text-[11px] text-emerald-100">AI assistant, not financial advice</div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-2 py-1 text-xs text-emerald-100 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-bg-subtle">
            <div className="max-w-[85%] px-3.5 py-2.5 text-sm text-ink bg-white border border-line rounded-2xl rounded-bl-md">
              {WELCOME}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-3 py-1.5 text-xs font-medium text-green bg-white border border-green/30 hover:bg-green hover:text-white rounded-full transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === 'user'
              const isLast = i === messages.length - 1
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words rounded-2xl ${
                      isUser
                        ? 'bg-green text-white rounded-br-md'
                        : 'bg-white text-ink border border-line rounded-bl-md'
                    }`}
                  >
                    {m.content ? (
                      isUser ? m.content : formatText(m.content)
                    ) : sending && isLast ? (
                      <span className="inline-flex gap-1 items-center text-ink-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-pulse-dot" />
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-line bg-white flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your transactions..."
              maxLength={1000}
              className="flex-1 resize-none max-h-24 px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-green focus:ring-1 focus:ring-green/30"
            />
            <button
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-green text-white hover:bg-green-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className="w-14 h-14 flex items-center justify-center rounded-full bg-green text-white shadow-lg shadow-green/30 hover:bg-green-strong hover:scale-105 transition-all duration-200"
      >
        {open ? <CloseIcon className="w-6 h-6" /> : <ChatIcon />}
      </button>
    </div>
  )
}