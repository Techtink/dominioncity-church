import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersAPI } from '../../services/api'

const Prayer = () => {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', content: '', isAnonymous: false, isPublic: false })

  const { data, isLoading } = useQuery({
    queryKey: ['myPrayerRequests'],
    queryFn: () => membersAPI.getPrayerRequests(),
  })

  const submitMutation = useMutation({
    mutationFn: (data) => membersAPI.submitPrayerRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPrayerRequests'])
      setShowForm(false)
      setFormData({ title: '', content: '', isAnonymous: false, isPublic: false })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => membersAPI.deletePrayerRequest(id),
    onSuccess: () => queryClient.invalidateQueries(['myPrayerRequests'])
  })

  const requests = data?.data?.requests || []

  const handleSubmit = (e) => {
    e.preventDefault()
    submitMutation.mutate(formData)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prayer Requests</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'New Request'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="Brief title for your request"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prayer Request</label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="Share what you'd like prayer for..."
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 mr-2"
              />
              <span className="text-sm text-gray-700">Submit anonymously</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 mr-2"
              />
              <span className="text-sm text-gray-700">Share with community</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {requests.map((req) => (
              <div key={req.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{req.title}</h3>
                    <p className="mt-1 text-gray-600">{req.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      {req.isAnonymous && <span className="px-2 py-0.5 bg-gray-100 rounded">Anonymous</span>}
                      {req.isPublic && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Public</span>}
                      <span className={`px-2 py-0.5 rounded ${req.status === 'ANSWERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => confirm('Delete this request?') && deleteMutation.mutate(req.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No prayer requests yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Prayer
