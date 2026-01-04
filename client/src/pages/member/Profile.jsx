import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { membersAPI } from '../../services/api'

const Profile = () => {
  const { user, updateProfile: updateAuthProfile } = useAuth()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', city: '', state: '', zipCode: '', country: '', birthday: '', bio: ''
  })
  const [success, setSuccess] = useState(false)

  const { data: profileData } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => membersAPI.getProfile(),
  })

  useEffect(() => {
    if (profileData?.data?.profile) {
      const p = profileData.data.profile
      setFormData({
        name: p.user?.name || '', phone: p.phone || '', address: p.address || '',
        city: p.city || '', state: p.state || '', zipCode: p.zipCode || '',
        country: p.country || '', birthday: p.birthday?.split('T')[0] || '', bio: p.bio || ''
      })
    }
  }, [profileData])

  const mutation = useMutation({
    mutationFn: (data) => membersAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myProfile'])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      if (formData.name !== user?.name) {
        updateAuthProfile({ name: formData.name })
      }
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={user?.email} disabled className="w-full rounded-lg border border-gray-200 px-4 py-2 bg-gray-50 text-gray-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
            <input type="date" value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input type="text" value={formData.zipCode} onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea rows={4} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
            className="w-full rounded-lg border border-gray-300 px-4 py-2" placeholder="Tell us about yourself..." />
        </div>

        <button type="submit" disabled={mutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

export default Profile
