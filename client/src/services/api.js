import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.patch('/auth/password', data),
}

// Posts API
export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getBySlug: (slug) => api.get(`/posts/slug/${slug}`),
  getAdminList: (params) => api.get('/posts/admin', { params }),
  getById: (id) => api.get(`/posts/admin/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.patch(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  getCategories: () => api.get('/posts/categories'),
  createCategory: (data) => api.post('/posts/categories', data),
  deleteCategory: (id) => api.delete(`/posts/categories/${id}`),
}

// Sermons API
export const sermonsAPI = {
  getAll: (params) => api.get('/sermons', { params }),
  getBySlug: (slug) => api.get(`/sermons/slug/${slug}`),
  getLatest: () => api.get('/sermons/latest'),
  getSpeakers: () => api.get('/sermons/speakers'),
  create: (data) => api.post('/sermons', data),
  update: (id, data) => api.patch(`/sermons/${id}`, data),
  delete: (id) => api.delete(`/sermons/${id}`),
  getSeries: () => api.get('/sermons/series'),
  getSeriesBySlug: (slug) => api.get(`/sermons/series/${slug}`),
  createSeries: (data) => api.post('/sermons/series', data),
  updateSeries: (id, data) => api.patch(`/sermons/series/${id}`, data),
  deleteSeries: (id) => api.delete(`/sermons/series/${id}`),
}

// Events API
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getBySlug: (slug) => api.get(`/events/slug/${slug}`),
  getUpcoming: () => api.get('/events/upcoming'),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.patch(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  register: (id, data) => api.post(`/events/${id}/register`, data),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`),
  getMyRegistrations: () => api.get('/events/my-registrations'),
  cancelRegistration: (id) => api.delete(`/events/registrations/${id}`),
}

// Donations API
export const donationsAPI = {
  getCategories: () => api.get('/donations/categories'),
  createPaymentIntent: (data) => api.post('/donations/create-payment-intent', data),
  getMyDonations: (params) => api.get('/donations/my-donations', { params }),
  getAdminList: (params) => api.get('/donations/admin', { params }),
  getReports: (params) => api.get('/donations/admin/reports', { params }),
  createCategory: (data) => api.post('/donations/categories', data),
  updateCategory: (id, data) => api.patch(`/donations/categories/${id}`, data),
}

// Members API
export const membersAPI = {
  getProfile: () => api.get('/members/profile'),
  updateProfile: (data) => api.patch('/members/profile', data),
  getMinistries: () => api.get('/members/ministries'),
  getMinistryBySlug: (slug) => api.get(`/members/ministries/${slug}`),
  joinMinistry: (id) => api.post(`/members/ministries/${id}/join`),
  leaveMinistry: (id) => api.delete(`/members/ministries/${id}/leave`),
  createMinistry: (data) => api.post('/members/ministries', data),
  updateMinistry: (id, data) => api.patch(`/members/ministries/${id}`, data),
  deleteMinistry: (id) => api.delete(`/members/ministries/${id}`),
  getPrayerRequests: (params) => api.get('/members/prayer-requests', { params }),
  submitPrayerRequest: (data) => api.post('/members/prayer-requests', data),
  updatePrayerRequest: (id, data) => api.patch(`/members/prayer-requests/${id}`, data),
  deletePrayerRequest: (id) => api.delete(`/members/prayer-requests/${id}`),
  getAdminList: (params) => api.get('/members/admin', { params }),
}

// Uploads API
export const uploadsAPI = {
  uploadSingle: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadMultiple: (files) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return api.post('/uploads/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (filename, type) => api.delete(`/uploads/${filename}`, { params: { type } }),
  list: (type) => api.get(`/uploads/list/${type}`),
}

// Chat API
export const chatAPI = {
  // Visitor endpoints
  createSession: (data) => api.post('/chat/session', data),
  sendMessage: (sessionId, data) => api.post(`/chat/session/${sessionId}/message`, data),
  getMessages: (sessionId, visitorId) => api.get(`/chat/session/${sessionId}/messages`, { params: { visitorId } }),
  closeSession: (sessionId, visitorId) => api.patch(`/chat/session/${sessionId}/close`, { visitorId }),

  // Admin endpoints
  getSessions: (params) => api.get('/chat/admin/sessions', { params }),
  getSession: (sessionId) => api.get(`/chat/admin/sessions/${sessionId}`),
  sendAdminMessage: (sessionId, data) => api.post(`/chat/admin/sessions/${sessionId}/message`, data),
  assignSession: (sessionId, assigneeId) => api.patch(`/chat/admin/sessions/${sessionId}/assign`, { assigneeId }),
  closeAdminSession: (sessionId) => api.patch(`/chat/admin/sessions/${sessionId}/close`),
  getUnreadCount: () => api.get('/chat/admin/unread-count'),
}

// Settings API
export const settingsAPI = {
  // Public
  getPublic: () => api.get('/settings/public'),
  getSlides: () => api.get('/settings/slides'),
  getBackgrounds: () => api.get('/settings/backgrounds'),
  getBackground: (pageSlug) => api.get(`/settings/backgrounds/${pageSlug}`),

  // Admin
  getAll: () => api.get('/settings'),
  update: (settings) => api.put('/settings', { settings }),
  updateSingle: (key, value) => api.patch(`/settings/${key}`, { value }),

  // Slides Admin
  getSlidesAdmin: () => api.get('/settings/slides/admin'),
  createSlide: (data) => api.post('/settings/slides', data),
  updateSlide: (id, data) => api.patch(`/settings/slides/${id}`, data),
  deleteSlide: (id) => api.delete(`/settings/slides/${id}`),
  reorderSlides: (slideIds) => api.put('/settings/slides/reorder', { slideIds }),

  // Backgrounds Admin
  updateBackground: (pageSlug, data) => api.put(`/settings/backgrounds/${pageSlug}`, data),

  // Test
  testEmail: (email) => api.post('/settings/test-email', { email }),
  testSms: (phone) => api.post('/settings/test-sms', { phone }),
}

// SMS API
export const smsAPI = {
  getCampaigns: (params) => api.get('/sms/campaigns', { params }),
  getCampaign: (id) => api.get(`/sms/campaigns/${id}`),
  createCampaign: (data) => api.post('/sms/campaigns', data),
  updateCampaign: (id, data) => api.patch(`/sms/campaigns/${id}`, data),
  deleteCampaign: (id) => api.delete(`/sms/campaigns/${id}`),
  sendCampaign: (id, data) => api.post(`/sms/campaigns/${id}/send`, data),
  cancelCampaign: (id) => api.post(`/sms/campaigns/${id}/cancel`),
  getRecipientPreview: (params) => api.get('/sms/recipients/preview', { params }),
  getCampaignStatus: (id) => api.get(`/sms/campaigns/${id}/status`),
  getMinistries: () => api.get('/sms/ministries'),
  getEvents: () => api.get('/sms/events'),
}

// Social Media API
export const socialAPI = {
  // Accounts
  getAccounts: () => api.get('/social/accounts'),
  getConnectUrl: (platform) => api.get(`/social/accounts/${platform}/connect`),
  disconnectAccount: (id) => api.delete(`/social/accounts/${id}`),

  // Posts
  getPosts: (params) => api.get('/social/posts', { params }),
  getPost: (id) => api.get(`/social/posts/${id}`),
  createPost: (data) => api.post('/social/posts', data),
  updatePost: (id, data) => api.patch(`/social/posts/${id}`, data),
  deletePost: (id) => api.delete(`/social/posts/${id}`),
  schedulePost: (id, data) => api.post(`/social/posts/${id}/schedule`, data),
  publishPost: (id) => api.post(`/social/posts/${id}/publish`),

  // Calendar
  getCalendar: (params) => api.get('/social/calendar', { params }),
}

// Content API
export const contentAPI = {
  // Service Times
  getServiceTimes: () => api.get('/content/service-times'),
  getServiceTimesAdmin: () => api.get('/content/service-times/admin'),
  createServiceTime: (data) => api.post('/content/service-times', data),
  updateServiceTime: (id, data) => api.patch(`/content/service-times/${id}`, data),
  deleteServiceTime: (id) => api.delete(`/content/service-times/${id}`),

  // About Content
  getAboutContent: () => api.get('/content/about'),
  getAboutSection: (section) => api.get(`/content/about/${section}`),
  updateAboutSection: (section, data) => api.put(`/content/about/${section}`, data),

  // Core Values
  getCoreValues: () => api.get('/content/core-values'),
  getCoreValuesAdmin: () => api.get('/content/core-values/admin'),
  createCoreValue: (data) => api.post('/content/core-values', data),
  updateCoreValue: (id, data) => api.patch(`/content/core-values/${id}`, data),
  deleteCoreValue: (id) => api.delete(`/content/core-values/${id}`),

  // Leadership
  getLeadership: () => api.get('/content/leadership'),
  getLeadershipAdmin: () => api.get('/content/leadership/admin'),
  createLeader: (data) => api.post('/content/leadership', data),
  updateLeader: (id, data) => api.patch(`/content/leadership/${id}`, data),
  deleteLeader: (id) => api.delete(`/content/leadership/${id}`),
}
