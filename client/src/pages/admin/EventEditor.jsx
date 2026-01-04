import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI } from '../../services/api'

const EventEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    title: '', description: '', location: '', startDate: '', endDate: '', registrationRequired: false, maxAttendees: ''
  })

  const { data: eventData } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getBySlug(id),
    enabled: isEditing,
  })

  useEffect(() => {
    if (eventData?.data?.event) {
      const e = eventData.data.event
      setFormData({
        title: e.title, description: e.description || '', location: e.location || '',
        startDate: e.startDate?.slice(0,16) || '', endDate: e.endDate?.slice(0,16) || '',
        registrationRequired: e.registrationRequired, maxAttendees: e.maxAttendees || ''
      })
    }
  }, [eventData])

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? eventsAPI.update(id, data) : eventsAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['events']); navigate('/admin/events') }
  })

  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(formData) }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit' : 'New'} Event</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
            <input type="datetime-local" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
            <input type="datetime-local" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center">
            <input type="checkbox" checked={formData.registrationRequired} onChange={(e) => setFormData({...formData, registrationRequired: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 mr-2" />
            <span className="text-sm text-gray-700">Registration Required</span>
          </label>
          {formData.registrationRequired && (
            <div>
              <input type="number" value={formData.maxAttendees} onChange={(e) => setFormData({...formData, maxAttendees: e.target.value})}
                className="w-24 rounded-lg border border-gray-300 px-3 py-1" placeholder="Max" />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin/events')} className="px-6 py-2 border border-gray-300 rounded-lg">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EventEditor
