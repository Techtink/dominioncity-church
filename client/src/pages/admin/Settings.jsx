import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI, uploadsAPI } from '../../services/api'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({})
  const [slides, setSlides] = useState([])
  const [editingSlide, setEditingSlide] = useState(null)
  const [backgrounds, setBackgrounds] = useState([])
  const [editingBackground, setEditingBackground] = useState(null)
  const [success, setSuccess] = useState('')
  const queryClient = useQueryClient()

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => settingsAPI.getAll(),
  })

  // Fetch slides
  const { data: slidesData } = useQuery({
    queryKey: ['adminSlides'],
    queryFn: () => settingsAPI.getSlidesAdmin(),
  })

  // Fetch backgrounds
  const { data: backgroundsData } = useQuery({
    queryKey: ['pageBackgrounds'],
    queryFn: () => settingsAPI.getBackgrounds(),
  })

  useEffect(() => {
    if (settingsData?.data?.settings) {
      const flatSettings = {}
      Object.values(settingsData.data.settings).flat().forEach(s => {
        flatSettings[s.key] = s.value
      })
      setSettings(flatSettings)
    }
  }, [settingsData])

  useEffect(() => {
    if (slidesData?.data?.slides) {
      setSlides(slidesData.data.slides)
    }
  }, [slidesData])

  useEffect(() => {
    if (backgroundsData?.data?.backgrounds) {
      setBackgrounds(backgroundsData.data.backgrounds)
    }
  }, [backgroundsData])

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (data) => settingsAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSettings'])
      queryClient.invalidateQueries(['publicSettings'])
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  // Slide mutations
  const createSlideMutation = useMutation({
    mutationFn: (data) => settingsAPI.createSlide(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSlides'])
      queryClient.invalidateQueries(['heroSlides'])
      setEditingSlide(null)
      setSuccess('Slide created!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const updateSlideMutation = useMutation({
    mutationFn: ({ id, data }) => settingsAPI.updateSlide(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSlides'])
      queryClient.invalidateQueries(['heroSlides'])
      setEditingSlide(null)
      setSuccess('Slide updated!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const deleteSlideMutation = useMutation({
    mutationFn: (id) => settingsAPI.deleteSlide(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSlides'])
      queryClient.invalidateQueries(['heroSlides'])
    },
  })

  // Background mutation
  const updateBackgroundMutation = useMutation({
    mutationFn: ({ pageSlug, data }) => settingsAPI.updateBackground(pageSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pageBackgrounds'])
      setEditingBackground(null)
      setSuccess('Background updated!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const handleSave = () => {
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
    }))
    saveMutation.mutate(settingsArray)
  }

  const handleSlideSubmit = (e) => {
    e.preventDefault()
    if (editingSlide?.id) {
      updateSlideMutation.mutate({ id: editingSlide.id, data: editingSlide })
    } else {
      createSlideMutation.mutate(editingSlide)
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'slides', name: 'Hero Slides', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'backgrounds', name: 'Page Backgrounds', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'email', name: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'sms', name: 'SMS', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'payment', name: 'Payment', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'social', name: 'Social', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { id: 'notifications', name: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  ]

  const renderInput = (key, label, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={settings[key] || ''}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  )

  const renderSelect = (key, label, options) => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={settings[key] || ''}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        {activeTab !== 'slides' && activeTab !== 'backgrounds' && (
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
            {renderInput('site_name', 'Site Name', 'text', 'Faith Community Church')}
            {renderInput('site_tagline', 'Tagline', 'text', 'Embrace Faith, Inspire Hope')}
            {renderInput('site_logo', 'Logo URL', 'url', 'https://...')}
            {renderInput('contact_email', 'Contact Email', 'email', 'info@church.com')}
            {renderInput('contact_phone', 'Contact Phone', 'tel', '(123) 456-7890')}
            {renderInput('contact_address', 'Address', 'text', '123 Church Street, City, State')}
          </div>
        )}

        {activeTab === 'slides' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Hero Slides</h2>
              <button
                onClick={() => setEditingSlide({ title: '', subtitle: '', description: '', imageUrl: '', buttonText: '', buttonLink: '', buttonText2: '', buttonLink2: '', animation: 'fade', isActive: true })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Slide
              </button>
            </div>

            {/* Slide Editor Modal */}
            {editingSlide && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleSlideSubmit} className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">{editingSlide.id ? 'Edit Slide' : 'Add Slide'}</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={editingSlide.title}
                        onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={editingSlide.subtitle || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={editingSlide.description || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL *</label>
                      <input
                        type="url"
                        required
                        value={editingSlide.imageUrl}
                        onChange={(e) => setEditingSlide({ ...editingSlide, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button 1 Text</label>
                        <input
                          type="text"
                          value={editingSlide.buttonText || ''}
                          onChange={(e) => setEditingSlide({ ...editingSlide, buttonText: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button 1 Link</label>
                        <input
                          type="text"
                          value={editingSlide.buttonLink || ''}
                          onChange={(e) => setEditingSlide({ ...editingSlide, buttonLink: e.target.value })}
                          placeholder="/events"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button 2 Text</label>
                        <input
                          type="text"
                          value={editingSlide.buttonText2 || ''}
                          onChange={(e) => setEditingSlide({ ...editingSlide, buttonText2: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button 2 Link</label>
                        <input
                          type="text"
                          value={editingSlide.buttonLink2 || ''}
                          onChange={(e) => setEditingSlide({ ...editingSlide, buttonLink2: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Animation</label>
                        <select
                          value={editingSlide.animation}
                          onChange={(e) => setEditingSlide({ ...editingSlide, animation: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        >
                          <option value="fade">Fade</option>
                          <option value="slide">Slide</option>
                          <option value="zoom">Zoom</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingSlide.isActive}
                            onChange={(e) => setEditingSlide({ ...editingSlide, isActive: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingSlide(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createSlideMutation.isPending || updateSlideMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {editingSlide.id ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Slides List */}
            <div className="space-y-4">
              {slides.length > 0 ? (
                slides.map((slide) => (
                  <div key={slide.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div
                      className="w-32 h-20 bg-cover bg-center rounded"
                      style={{ backgroundImage: `url(${slide.imageUrl})` }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{slide.title}</h4>
                      <p className="text-sm text-gray-500">{slide.subtitle}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${slide.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {slide.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingSlide(slide)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this slide?')) {
                            deleteSlideMutation.mutate(slide.id)
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No slides yet. Add your first slide!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'backgrounds' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Page Backgrounds</h2>
            <p className="text-sm text-gray-600 mb-6">
              Customize the hero section background for each page. You can use solid colors, gradients, or images.
            </p>

            {/* Background Editor Modal */}
            {editingBackground && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold capitalize">{editingBackground.pageSlug} Page Background</h3>

                    {/* Background Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Type</label>
                      <div className="flex gap-2">
                        {['SOLID', 'GRADIENT', 'IMAGE'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setEditingBackground({ ...editingBackground, backgroundType: type })}
                            className={`px-4 py-2 rounded-lg font-medium ${
                              editingBackground.backgroundType === type
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Solid Color */}
                    {editingBackground.backgroundType === 'SOLID' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={editingBackground.solidColor || '#1f2937'}
                            onChange={(e) => setEditingBackground({ ...editingBackground, solidColor: e.target.value })}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingBackground.solidColor || '#1f2937'}
                            onChange={(e) => setEditingBackground({ ...editingBackground, solidColor: e.target.value })}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                            placeholder="#1f2937"
                          />
                        </div>
                      </div>
                    )}

                    {/* Gradient */}
                    {editingBackground.backgroundType === 'GRADIENT' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Color</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={editingBackground.gradientFrom || '#1f2937'}
                                onChange={(e) => setEditingBackground({ ...editingBackground, gradientFrom: e.target.value })}
                                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={editingBackground.gradientFrom || '#1f2937'}
                                onChange={(e) => setEditingBackground({ ...editingBackground, gradientFrom: e.target.value })}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Color</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={editingBackground.gradientTo || '#374151'}
                                onChange={(e) => setEditingBackground({ ...editingBackground, gradientTo: e.target.value })}
                                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={editingBackground.gradientTo || '#374151'}
                                onChange={(e) => setEditingBackground({ ...editingBackground, gradientTo: e.target.value })}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gradient Angle: {editingBackground.gradientAngle || 180}°
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={editingBackground.gradientAngle || 180}
                            onChange={(e) => setEditingBackground({ ...editingBackground, gradientAngle: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}

                    {/* Image */}
                    {editingBackground.backgroundType === 'IMAGE' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                          <input
                            type="url"
                            value={editingBackground.imageUrl || ''}
                            onChange={(e) => setEditingBackground({ ...editingBackground, imageUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Color</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={editingBackground.overlayColor || '#000000'}
                                onChange={(e) => setEditingBackground({ ...editingBackground, overlayColor: e.target.value })}
                                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={editingBackground.overlayColor || '#000000'}
                                onChange={(e) => setEditingBackground({ ...editingBackground, overlayColor: e.target.value })}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Overlay Opacity: {editingBackground.overlayOpacity || 50}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={editingBackground.overlayOpacity || 50}
                              onChange={(e) => setEditingBackground({ ...editingBackground, overlayOpacity: parseInt(e.target.value) })}
                              className="w-full mt-2"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Title & Subtitle Colors */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Text Colors</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title Color</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={editingBackground.titleColor || '#ffffff'}
                              onChange={(e) => setEditingBackground({ ...editingBackground, titleColor: e.target.value })}
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editingBackground.titleColor || '#ffffff'}
                              onChange={(e) => setEditingBackground({ ...editingBackground, titleColor: e.target.value })}
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle Color</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={editingBackground.subtitleColor || '#d1d5db'}
                              onChange={(e) => setEditingBackground({ ...editingBackground, subtitleColor: e.target.value })}
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editingBackground.subtitleColor || '#d1d5db'}
                              onChange={(e) => setEditingBackground({ ...editingBackground, subtitleColor: e.target.value })}
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
                      <div
                        className="h-32 rounded-lg flex items-center justify-center relative overflow-hidden"
                        style={{
                          ...(editingBackground.backgroundType === 'SOLID' && {
                            backgroundColor: editingBackground.solidColor || '#1f2937'
                          }),
                          ...(editingBackground.backgroundType === 'GRADIENT' && {
                            background: `linear-gradient(${editingBackground.gradientAngle || 180}deg, ${editingBackground.gradientFrom || '#1f2937'}, ${editingBackground.gradientTo || '#374151'})`
                          }),
                          ...(editingBackground.backgroundType === 'IMAGE' && {
                            backgroundImage: `url(${editingBackground.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          })
                        }}
                      >
                        {editingBackground.backgroundType === 'IMAGE' && (
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundColor: editingBackground.overlayColor || '#000000',
                              opacity: (editingBackground.overlayOpacity || 50) / 100
                            }}
                          />
                        )}
                        <div className="relative text-center">
                          <h5 className="text-xl font-bold" style={{ color: editingBackground.titleColor || '#ffffff' }}>
                            Page Title
                          </h5>
                          <p className="text-sm" style={{ color: editingBackground.subtitleColor || '#d1d5db' }}>
                            Page subtitle text goes here
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setEditingBackground(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBackgroundMutation.mutate({ pageSlug: editingBackground.pageSlug, data: editingBackground })}
                        disabled={updateBackgroundMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updateBackgroundMutation.isPending ? 'Saving...' : 'Save Background'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backgrounds List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {backgrounds.map((bg) => (
                <div key={bg.pageSlug} className="bg-gray-50 rounded-xl overflow-hidden">
                  {/* Preview */}
                  <div
                    className="h-24 relative flex items-center justify-center"
                    style={{
                      ...(bg.backgroundType === 'SOLID' && {
                        backgroundColor: bg.solidColor || '#1f2937'
                      }),
                      ...(bg.backgroundType === 'GRADIENT' && {
                        background: `linear-gradient(${bg.gradientAngle || 180}deg, ${bg.gradientFrom || '#1f2937'}, ${bg.gradientTo || '#374151'})`
                      }),
                      ...(bg.backgroundType === 'IMAGE' && {
                        backgroundImage: `url(${bg.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      })
                    }}
                  >
                    {bg.backgroundType === 'IMAGE' && (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor: bg.overlayColor || '#000000',
                          opacity: (bg.overlayOpacity || 50) / 100
                        }}
                      />
                    )}
                    <span
                      className="relative text-sm font-medium capitalize"
                      style={{ color: bg.titleColor || '#ffffff' }}
                    >
                      {bg.pageSlug}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">{bg.pageSlug}</h4>
                        <p className="text-sm text-gray-500">
                          {bg.backgroundType === 'SOLID' && `Solid: ${bg.solidColor || '#1f2937'}`}
                          {bg.backgroundType === 'GRADIENT' && 'Gradient'}
                          {bg.backgroundType === 'IMAGE' && 'Image'}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingBackground(bg)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h2>
            {renderSelect('email_provider', 'Email Provider', [
              { value: 'smtp', label: 'SMTP' },
              { value: 'sendgrid', label: 'SendGrid' },
              { value: 'mailgun', label: 'Mailgun' },
            ])}

            {settings.email_provider === 'smtp' && (
              <>
                {renderInput('smtp_host', 'SMTP Host', 'text', 'smtp.gmail.com')}
                {renderInput('smtp_port', 'SMTP Port', 'text', '587')}
                {renderInput('smtp_user', 'SMTP Username', 'text')}
                {renderInput('smtp_password', 'SMTP Password', 'password')}
              </>
            )}

            {settings.email_provider === 'sendgrid' && (
              renderInput('sendgrid_api_key', 'SendGrid API Key', 'password')
            )}

            {settings.email_provider === 'mailgun' && (
              <>
                {renderInput('mailgun_api_key', 'Mailgun API Key', 'password')}
                {renderInput('mailgun_domain', 'Mailgun Domain', 'text')}
              </>
            )}

            {renderInput('smtp_from_email', 'From Email', 'email', 'noreply@church.com')}
            {renderInput('smtp_from_name', 'From Name', 'text', 'Faith Community Church')}
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SMS Configuration</h2>
            {renderSelect('sms_provider', 'SMS Provider', [
              { value: 'twilio', label: 'Twilio' },
              { value: 'africas_talking', label: "Africa's Talking" },
              { value: 'termii', label: 'Termii' },
            ])}

            {settings.sms_provider === 'twilio' && (
              <>
                {renderInput('twilio_account_sid', 'Account SID', 'text')}
                {renderInput('twilio_auth_token', 'Auth Token', 'password')}
                {renderInput('twilio_phone_number', 'Phone Number', 'tel', '+1234567890')}
              </>
            )}

            {settings.sms_provider === 'africas_talking' && (
              <>
                {renderInput('africas_talking_username', 'Username', 'text')}
                {renderInput('africas_talking_api_key', 'API Key', 'password')}
              </>
            )}

            {settings.sms_provider === 'termii' && (
              <>
                {renderInput('termii_api_key', 'API Key', 'password')}
                {renderInput('termii_sender_id', 'Sender ID', 'text')}
              </>
            )}
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Configuration</h2>
            {renderSelect('payment_provider', 'Payment Provider', [
              { value: 'stripe', label: 'Stripe' },
              { value: 'paystack', label: 'Paystack' },
              { value: 'flutterwave', label: 'Flutterwave' },
            ])}
            {renderInput('payment_currency', 'Currency', 'text', 'USD')}

            {settings.payment_provider === 'stripe' && (
              <>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">Get your Stripe keys from the <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a></p>
                </div>
                {renderInput('stripe_publishable_key', 'Publishable Key', 'text', 'pk_...')}
                {renderInput('stripe_secret_key', 'Secret Key', 'password', 'sk_...')}
                {renderInput('stripe_webhook_secret', 'Webhook Secret', 'password', 'whsec_...')}
              </>
            )}

            {settings.payment_provider === 'paystack' && (
              <>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">Get your Paystack keys from the <a href="https://dashboard.paystack.com/#/settings/developers" target="_blank" rel="noopener noreferrer" className="underline">Paystack Dashboard</a></p>
                </div>
                {renderInput('paystack_public_key', 'Public Key', 'text', 'pk_...')}
                {renderInput('paystack_secret_key', 'Secret Key', 'password', 'sk_...')}
              </>
            )}

            {settings.payment_provider === 'flutterwave' && (
              <>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800">Get your Flutterwave keys from the <a href="https://dashboard.flutterwave.com/dashboard/settings/apis" target="_blank" rel="noopener noreferrer" className="underline">Flutterwave Dashboard</a></p>
                </div>
                {renderInput('flutterwave_public_key', 'Public Key', 'text', 'FLWPUBK_...')}
                {renderInput('flutterwave_secret_key', 'Secret Key', 'password', 'FLWSECK_...')}
                {renderInput('flutterwave_encryption_key', 'Encryption Key', 'password')}
              </>
            )}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h2>
            {renderInput('facebook_url', 'Facebook URL', 'url', 'https://facebook.com/...')}
            {renderInput('instagram_url', 'Instagram URL', 'url', 'https://instagram.com/...')}
            {renderInput('youtube_url', 'YouTube URL', 'url', 'https://youtube.com/...')}
            {renderInput('twitter_url', 'Twitter/X URL', 'url', 'https://x.com/...')}
            {renderInput('tiktok_url', 'TikTok URL', 'url', 'https://tiktok.com/...')}

            <div className="border-t pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media API Credentials</h2>
              <p className="text-sm text-gray-600 mb-4">
                Configure API credentials to enable social media posting from the Social Media admin page.
              </p>

              {/* Meta (Facebook/Instagram) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium text-blue-900 mb-3">Meta (Facebook & Instagram)</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Get your credentials from the <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline">Meta Developer Portal</a>
                </p>
                <div className="space-y-4">
                  {renderInput('meta_app_id', 'App ID', 'text', 'Your Meta App ID')}
                  {renderInput('meta_app_secret', 'App Secret', 'password', 'Your Meta App Secret')}
                </div>
              </div>

              {/* Twitter */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Twitter / X</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get your credentials from the <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Twitter Developer Portal</a>
                </p>
                <div className="space-y-4">
                  {renderInput('twitter_api_key', 'API Key (Client ID)', 'text', 'Your Twitter API Key')}
                  {renderInput('twitter_api_secret', 'API Secret', 'password', 'Your Twitter API Secret')}
                  {renderInput('twitter_bearer_token', 'Bearer Token', 'password', 'Your Twitter Bearer Token')}
                </div>
              </div>

              {/* TikTok */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-900 mb-3">TikTok</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get your credentials from the <a href="https://developers.tiktok.com/" target="_blank" rel="noopener noreferrer" className="underline">TikTok Developer Portal</a>
                </p>
                <div className="space-y-4">
                  {renderInput('tiktok_client_key', 'Client Key', 'text', 'Your TikTok Client Key')}
                  {renderInput('tiktok_client_secret', 'Client Secret', 'password', 'Your TikTok Client Secret')}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat Notifications</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure notifications when visitors start a chat on your website. You'll receive alerts via email and/or SMS.
            </p>

            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.chat_notification_enabled === 'true' || settings.chat_notification_enabled === true}
                  onChange={(e) => setSettings({ ...settings, chat_notification_enabled: e.target.checked ? 'true' : 'false' })}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Chat Notifications</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-8">When enabled, you'll receive notifications for new chat sessions</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Email Notifications</h3>
              {renderInput('chat_notification_emails', 'Notification Emails', 'text', 'admin@church.com, pastor@church.com')}
              <p className="text-xs text-gray-500 mt-1">Comma-separated list of email addresses to receive chat notifications</p>
            </div>

            {renderInput('chat_email_subject', 'Email Subject', 'text', 'New Chat Message from Website Visitor')}

            <div className="border-t pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">SMS Notifications</h3>
              {renderInput('chat_notification_phones', 'Notification Phone Numbers', 'text', '+1234567890, +0987654321')}
              <p className="text-xs text-gray-500 mt-1">Comma-separated list of phone numbers to receive SMS notifications (requires SMS provider setup)</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Important</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Make sure you have configured your Email and SMS providers in their respective tabs for notifications to work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings
