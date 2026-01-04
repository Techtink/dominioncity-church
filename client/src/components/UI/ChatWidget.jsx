import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { chatAPI } from '../../services/api'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState('intro') // intro, form, chat
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '' })
  const [sessionId, setSessionId] = useState(null)
  const [visitorId, setVisitorId] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Generate or retrieve visitor ID
  useEffect(() => {
    let storedVisitorId = localStorage.getItem('chat_visitor_id')
    if (!storedVisitorId) {
      storedVisitorId = 'visitor_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('chat_visitor_id', storedVisitorId)
    }
    setVisitorId(storedVisitorId)

    // Check for existing session
    const storedSessionId = localStorage.getItem('chat_session_id')
    if (storedSessionId) {
      setSessionId(storedSessionId)
      setStep('chat')
      loadMessages(storedSessionId, storedVisitorId)
    }
  }, [])

  // Connect to Socket.io
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      if (sessionId) {
        socketRef.current.emit('join-chat', sessionId)
      }
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
    })

    socketRef.current.on('new-message', (message) => {
      if (!message.isFromVisitor) {
        setMessages(prev => [...prev, message])
        if (!isOpen) {
          setUnreadCount(prev => prev + 1)
        }
      }
    })

    socketRef.current.on('user-typing', ({ isTyping: typing, isVisitor }) => {
      if (!isVisitor) {
        setIsTyping(typing)
      }
    })

    socketRef.current.on('session-status-changed', ({ status }) => {
      if (status === 'CLOSED') {
        setMessages(prev => [...prev, {
          id: 'system-closed',
          content: 'This chat session has been closed. Thank you for contacting us!',
          isFromVisitor: false,
          isSystem: true,
          createdAt: new Date().toISOString()
        }])
      }
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [sessionId, isOpen])

  // Join chat room when session is created
  useEffect(() => {
    if (sessionId && socketRef.current?.connected) {
      socketRef.current.emit('join-chat', sessionId)
    }
  }, [sessionId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear unread count when opening
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  const loadMessages = async (sid, vid) => {
    try {
      const response = await chatAPI.getMessages(sid, vid)
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
      // Session might be invalid, clear it
      if (error.response?.status === 403 || error.response?.status === 404) {
        localStorage.removeItem('chat_session_id')
        setSessionId(null)
        setStep('intro')
      }
    }
  }

  const startChat = async (e) => {
    e.preventDefault()
    try {
      const response = await chatAPI.createSession({
        visitorName: visitorInfo.name,
        visitorEmail: visitorInfo.email,
        visitorId
      })
      const newSessionId = response.data.session.id
      setSessionId(newSessionId)
      localStorage.setItem('chat_session_id', newSessionId)
      setStep('chat')

      // Add welcome message
      setMessages([{
        id: 'welcome',
        content: `Hello ${visitorInfo.name}! Welcome to our church. How can we help you today?`,
        isFromVisitor: false,
        isSystem: true,
        createdAt: new Date().toISOString()
      }])

      // Join socket room
      socketRef.current?.emit('join-chat', newSessionId)
    } catch (error) {
      console.error('Failed to start chat:', error)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !sessionId) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Optimistically add message
    const tempMessage = {
      id: 'temp-' + Date.now(),
      content: messageContent,
      isFromVisitor: true,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMessage])

    try {
      const response = await chatAPI.sendMessage(sessionId, {
        content: messageContent,
        visitorId
      })

      // Replace temp message with real one
      setMessages(prev => prev.map(m =>
        m.id === tempMessage.id ? response.data.message : m
      ))

      // Emit to socket
      socketRef.current?.emit('send-message', {
        sessionId,
        message: response.data.message
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
    }
  }

  const handleTyping = () => {
    socketRef.current?.emit('typing', {
      sessionId,
      isTyping: true,
      isVisitor: true
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', {
        sessionId,
        isTyping: false,
        isVisitor: true
      })
    }, 1000)
  }

  const endChat = async () => {
    if (!sessionId) return

    try {
      await chatAPI.closeSession(sessionId, visitorId)
      socketRef.current?.emit('session-status', { sessionId, status: 'CLOSED' })
      localStorage.removeItem('chat_session_id')
      setSessionId(null)
      setMessages([])
      setStep('intro')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to close session:', error)
    }
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window - Full screen on mobile, floating on desktop */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-4 md:right-6 w-full sm:w-80 md:w-96 h-full sm:h-[480px] bg-white sm:rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 sm:py-3 flex items-center justify-between safe-area-top">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="sm:hidden p-1 -ml-1 mr-2 hover:bg-white/20 rounded"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="font-medium">Live Chat</span>
            </div>
            <div className="flex items-center gap-3">
              {step === 'chat' && (
                <button onClick={endChat} className="text-sm opacity-80 hover:opacity-100">
                  End Chat
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="hidden sm:block p-1 hover:bg-white/20 rounded"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {step === 'intro' && (
              <div className="p-6 flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome!</h3>
                <p className="text-gray-600 mb-6">Have questions? We're here to help. Start a conversation with us.</p>
                <button
                  onClick={() => setStep('form')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Chat
                </button>
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={startChat} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={visitorInfo.name}
                    onChange={(e) => setVisitorInfo({ ...visitorInfo, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={visitorInfo.email}
                    onChange={(e) => setVisitorInfo({ ...visitorInfo, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('intro')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Start Chat
                  </button>
                </div>
              </form>
            )}

            {step === 'chat' && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromVisitor ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg ${
                          message.isSystem
                            ? 'bg-gray-100 text-gray-600 text-sm'
                            : message.isFromVisitor
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.isFromVisitor ? 'text-blue-200' : 'text-gray-500'}`}>
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 px-3 py-2 rounded-lg">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ChatWidget
