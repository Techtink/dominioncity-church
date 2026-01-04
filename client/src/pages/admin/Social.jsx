import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { socialAPI } from '../../services/api'

const Social = () => {
  const [activeTab, setActiveTab] = useState('accounts')
  const [editingPost, setEditingPost] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  // Check for OAuth callback messages
  useEffect(() => {
    if (searchParams.get('success') === 'connected') {
      setSuccess('Social account connected successfully!')
      setTimeout(() => setSuccess(''), 5000)
    }
    if (searchParams.get('error')) {
      setError(`Connection failed: ${searchParams.get('error')}`)
      setTimeout(() => setError(''), 5000)
    }
  }, [searchParams])

  // Fetch accounts
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: () => socialAPI.getAccounts(),
  })

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => socialAPI.getPosts({ limit: 50 }),
    enabled: activeTab === 'posts',
  })

  // Fetch calendar data
  const { data: calendarData } = useQuery({
    queryKey: ['socialCalendar', selectedMonth.getFullYear(), selectedMonth.getMonth() + 1],
    queryFn: () => socialAPI.getCalendar({
      year: selectedMonth.getFullYear(),
      month: selectedMonth.getMonth() + 1,
    }),
    enabled: activeTab === 'calendar',
  })

  const accounts = accountsData?.data?.accounts || []
  const posts = postsData?.data?.posts || []
  const calendarPosts = calendarData?.data?.posts || []

  // Mutations
  const disconnectMutation = useMutation({
    mutationFn: (id) => socialAPI.disconnectAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialAccounts'])
      setSuccess('Account disconnected')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const createPostMutation = useMutation({
    mutationFn: (data) => socialAPI.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts'])
      queryClient.invalidateQueries(['socialCalendar'])
      setEditingPost(null)
      setSuccess('Post created!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => socialAPI.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts'])
      queryClient.invalidateQueries(['socialCalendar'])
      setEditingPost(null)
      setSuccess('Post updated!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: (id) => socialAPI.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts'])
      queryClient.invalidateQueries(['socialCalendar'])
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id) => socialAPI.publishPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts'])
      queryClient.invalidateQueries(['socialCalendar'])
      setSuccess('Post published!')
      setTimeout(() => setSuccess(''), 3000)
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Failed to publish')
      setTimeout(() => setError(''), 5000)
    },
  })

  const handleConnect = async (platform) => {
    try {
      const response = await socialAPI.getConnectUrl(platform)
      if (response.data?.data?.authUrl) {
        window.location.href = response.data.data.authUrl
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to get auth URL')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handlePostSubmit = (e) => {
    e.preventDefault()
    if (editingPost?.id) {
      updatePostMutation.mutate({ id: editingPost.id, data: editingPost })
    } else {
      createPostMutation.mutate(editingPost)
    }
  }

  const getPlatformIcon = (platform) => {
    const icons = {
      FACEBOOK: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      INSTAGRAM: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      TWITTER: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      TIKTOK: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    }
    return icons[platform] || null
  }

  const getPlatformColor = (platform) => {
    const colors = {
      FACEBOOK: 'text-blue-600 bg-blue-50',
      INSTAGRAM: 'text-pink-600 bg-pink-50',
      TWITTER: 'text-gray-900 bg-gray-100',
      TIKTOK: 'text-gray-900 bg-gray-100',
    }
    return colors[platform] || 'text-gray-600 bg-gray-50'
  }

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      PUBLISHING: 'bg-yellow-100 text-yellow-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.DRAFT}`}>
        {status}
      </span>
    )
  }

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Add empty slots for days before first of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getPostsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return calendarPosts.filter((p) => {
      const postDate = p.scheduledAt || p.publishedAt
      return postDate && postDate.split('T')[0] === dateStr
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Social Media</h1>
        {activeTab === 'posts' && accounts.length > 0 && (
          <button
            onClick={() => setEditingPost({
              accountId: accounts[0]?.id || '',
              content: '',
              mediaUrls: [],
              mediaType: null,
              scheduledAt: null,
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Post
          </button>
        )}
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['accounts', 'posts', 'calendar'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h2>
            {accountsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : accounts.length > 0 ? (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getPlatformColor(account.platform)}`}>
                        {getPlatformIcon(account.platform)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{account.accountName}</p>
                        <p className="text-sm text-gray-500">{account.platform}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Disconnect this account?')) {
                          disconnectMutation.mutate(account.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No accounts connected yet.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect New Account</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'TIKTOK'].map((platform) => {
                const isConnected = accounts.some((a) => a.platform === platform)
                return (
                  <button
                    key={platform}
                    onClick={() => !isConnected && handleConnect(platform.toLowerCase())}
                    disabled={isConnected}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                      isConnected
                        ? 'border-green-200 bg-green-50 cursor-default'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className={getPlatformColor(platform)}>
                      {getPlatformIcon(platform)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{platform}</span>
                    {isConnected && (
                      <span className="text-xs text-green-600">Connected</span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Configure API keys in Settings &gt; Social before connecting.
            </p>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          {/* Post Editor Modal */}
          {editingPost && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handlePostSubmit} className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">
                    {editingPost.id ? 'Edit Post' : 'New Social Post'}
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
                    <select
                      required
                      value={editingPost.accountId}
                      onChange={(e) => setEditingPost({ ...editingPost, accountId: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    >
                      <option value="">Select account...</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.platform} - {a.accountName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                    <textarea
                      required
                      rows={4}
                      value={editingPost.content}
                      onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                      placeholder="What would you like to share?"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {editingPost.content?.length || 0} characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Media URL (optional)</label>
                    <input
                      type="url"
                      value={editingPost.mediaUrls?.[0] || ''}
                      onChange={(e) => setEditingPost({
                        ...editingPost,
                        mediaUrls: e.target.value ? [e.target.value] : [],
                      })}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    />
                  </div>

                  {editingPost.mediaUrls?.[0] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                      <select
                        value={editingPost.mediaType || 'image'}
                        onChange={(e) => setEditingPost({ ...editingPost, mediaType: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (optional)</label>
                    <input
                      type="datetime-local"
                      value={editingPost.scheduledAt ? new Date(editingPost.scheduledAt).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditingPost({
                        ...editingPost,
                        scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingPost(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createPostMutation.isPending || updatePostMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editingPost.scheduledAt ? 'Schedule' : 'Save as Draft'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Posts List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : posts.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Post</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 truncate max-w-xs">{post.content}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${getPlatformColor(post.account?.platform)}`}>
                            {getPlatformIcon(post.account?.platform)}
                          </span>
                          <span className="text-sm text-gray-500">{post.account?.accountName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {post.scheduledAt
                          ? new Date(post.scheduledAt).toLocaleString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {post.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => setEditingPost(post)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => publishMutation.mutate(post.id)}
                                disabled={publishMutation.isPending}
                                className="text-green-600 hover:text-green-700 text-sm"
                              >
                                Publish
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this post?')) {
                                    deletePostMutation.mutate(post.id)
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {post.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => setEditingPost(post)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this post?')) {
                                    deletePostMutation.mutate(post.id)
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {post.status === 'PUBLISHED' && (
                            <span className="text-sm text-gray-400">
                              Published {new Date(post.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                          {post.status === 'FAILED' && (
                            <span className="text-sm text-red-500" title={post.errorMessage}>
                              Failed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {accounts.length > 0
                    ? 'No posts yet. Create your first post!'
                    : 'Connect a social account first to create posts.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedMonth(new Date())}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
              >
                Today
              </button>
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-gray-50 px-2 py-3 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
            {getDaysInMonth(selectedMonth).map((date, i) => {
              const dayPosts = getPostsForDate(date)
              const isToday = date && date.toDateString() === new Date().toDateString()
              return (
                <div
                  key={i}
                  className={`bg-white min-h-[100px] p-2 ${
                    !date ? 'bg-gray-50' : ''
                  } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                >
                  {date && (
                    <>
                      <p className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </p>
                      <div className="mt-1 space-y-1">
                        {dayPosts.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${
                              post.status === 'PUBLISHED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                            title={post.content}
                          >
                            {post.account?.platform}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <p className="text-xs text-gray-400">+{dayPosts.length - 3} more</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Social
