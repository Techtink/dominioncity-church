import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sermonsAPI } from '../../services/api'

const SermonEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    title: '', description: '', speaker: '', scripture: '', audioUrl: '', videoUrl: '', date: '', seriesId: ''
  })

  const { data: sermonData } = useQuery({
    queryKey: ['sermon', id],
    queryFn: () => sermonsAPI.getBySlug(id),
    enabled: isEditing,
  })

  const { data: seriesData } = useQuery({
    queryKey: ['series'],
    queryFn: () => sermonsAPI.getSeries(),
  })

  useEffect(() => {
    if (sermonData?.data?.sermon) {
      const s = sermonData.data.sermon
      setFormData({
        title: s.title, description: s.description || '', speaker: s.speaker,
        scripture: s.scripture || '', audioUrl: s.audioUrl || '', videoUrl: s.videoUrl || '',
        date: s.date?.split('T')[0] || '', seriesId: s.seriesId || ''
      })
    }
  }, [sermonData])

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? sermonsAPI.update(id, data) : sermonsAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['sermons']); navigate('/admin/sermons') }
  })

  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(formData) }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit' : 'New'} Sermon</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speaker</label>
            <input type="text" required value={formData.speaker} onChange={(e) => setFormData({...formData, speaker: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scripture</label>
          <input type="text" value={formData.scripture} onChange={(e) => setFormData({...formData, scripture: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" placeholder="e.g. John 3:16" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Series</label>
          <select value={formData.seriesId} onChange={(e) => setFormData({...formData, seriesId: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2">
            <option value="">None</option>
            {seriesData?.data?.series?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
          <input type="url" value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Audio URL</label>
          <input type="url" value={formData.audioUrl} onChange={(e) => setFormData({...formData, audioUrl: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin/sermons')} className="px-6 py-2 border border-gray-300 rounded-lg">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SermonEditor
