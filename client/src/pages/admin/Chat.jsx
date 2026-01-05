import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { chatAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const Chat = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedSession, setSelectedSession] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [filter, setFilter] = useState('all') // all, active, waiting, closed
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Fetch sessions
  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['chatSessions', filter],
    queryFn: () => chatAPI.getSessions({ status: filter !== 'all' ? filter.toUpperCase() : undefined }),
    refetchInterval: 10000,
  })

  // Fetch selected session details
  const { data: sessionData, refetch: refetchSession } = useQuery({
    queryKey: ['chatSession', selectedSession],
    queryFn: () => chatAPI.getSession(selectedSession),
    enabled: !!selectedSession,
  })

  const sessions = sessionsData?.data?.sessions || []
  const currentSession = sessionData?.data?.session
  const messages = currentSession?.messages || []

  // Socket.io connection
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || ''
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-admin')
    })

    socketRef.current.on('new-message', (data) => {
      // Refresh sessions and current session
      queryClient.invalidateQueries(['chatSessions'])
      if (data.sessionId === selectedSession) {
        refetchSession()
      }
    })

    socketRef.current.on('session-updated', () => {
      queryClient.invalidateQueries(['chatSessions'])
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [selectedSession, queryClient, refetchSession])

  // Join selected session room
  useEffect(() => {
    if (selectedSession && socketRef.current?.connected) {
      socketRef.current.emit('join-chat', selectedSession)
    }
  }, [selectedSession])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content) => chatAPI.sendAdminMessage(selectedSession, { content }),
    onSuccess: (response) => {
      setNewMessage('')
      refetchSession()
      socketRef.current?.emit('send-message', {
        sessionId: selectedSession,
        message: response.data.message
      })
    },
  })

  // Close session mutation
  const closeSessionMutation = useMutation({
    mutationFn: () => chatAPI.closeAdminSession(selectedSession),
    onSuccess: () => {
      queryClient.invalidateQueries(['chatSessions'])
      refetchSession()
      socketRef.current?.emit('session-status', { sessionId: selectedSession, status: 'CLOSED' })
    },
  })

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    sendMessageMutation.mutate(newMessage.trim())
  }

  const handleTyping = () => {
    socketRef.current?.emit('typing', {
      sessionId: selectedSession,
      isTyping: true,
      isVisitor: false
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'WAITING': return 'bg-yellow-100 text-yellow-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString()
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Chat</h1>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All Chats</option>
            <option value="waiting">Waiting</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[calc(100%-4rem)] flex">
        {/* Sessions List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : sessions.length > 0 ? (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session.id)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedSession === session.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {session.visitorName || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {session.visitorEmail || 'No email'}
                      </p>
                      {session.messages?.[0] && (
                        <p className="text-sm text-gray-400 truncate mt-1">
                          {session.messages[0].content}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 flex flex-col items-end">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {formatTime(session.updatedAt)}
                      </span>
                      {session._count?.messages > 0 && (
                        <span className="mt-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                          {session._count.messages}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No conversations yet
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedSession && currentSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {currentSession.visitorName || 'Anonymous Visitor'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentSession.visitorEmail || 'No email provided'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(currentSession.status)}`}>
                    {currentSession.status}
                  </span>
                  {currentSession.status !== 'CLOSED' && (
                    <button
                      onClick={() => closeSessionMutation.mutate()}
                      disabled={closeSessionMutation.isPending}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Close Chat
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromVisitor ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg ${
                        message.isFromVisitor
                          ? 'bg-gray-200 text-gray-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${message.isFromVisitor ? 'text-gray-500' : 'text-blue-200'}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {!message.isFromVisitor && message.sender && (
                          <span className="ml-2">- {message.sender.name}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {currentSession.status !== 'CLOSED' ? (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-gray-500">
                  This chat session has been closed
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat
