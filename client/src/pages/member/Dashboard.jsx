import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { eventsAPI, donationsAPI, membersAPI } from '../../services/api'

const Dashboard = () => {
  const { user } = useAuth()

  const { data: eventsData } = useQuery({
    queryKey: ['myRegistrations'],
    queryFn: () => eventsAPI.getMyRegistrations(),
  })

  const { data: donationsData } = useQuery({
    queryKey: ['myDonations'],
    queryFn: () => donationsAPI.getMyDonations({ limit: 5 }),
  })

  const { data: profileData } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => membersAPI.getProfile(),
  })

  const registrations = eventsData?.data?.registrations || []
  const donations = donationsData?.data?.donations || []
  const totalGiven = donationsData?.data?.totalGiven || 0
  const profile = profileData?.data?.profile

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
      <p className="text-gray-600 mb-8">Here's what's happening with your account</p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {registrations.filter(r => new Date(r.event.startDate) > new Date()).length}
          </p>
          <Link to="/events" className="mt-2 text-blue-600 text-sm">View Events &rarr;</Link>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Given</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">${Number(totalGiven).toLocaleString()}</p>
          <Link to="/member/giving" className="mt-2 text-blue-600 text-sm">View History &rarr;</Link>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Ministries</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{profile?.ministries?.length || 0}</p>
          <Link to="/ministries" className="mt-2 text-blue-600 text-sm">Join Ministry &rarr;</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Registrations</h2>
          {registrations.length > 0 ? (
            <div className="space-y-4">
              {registrations.slice(0, 5).map((reg) => (
                <div key={reg.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{reg.event.title}</p>
                    <p className="text-sm text-gray-500">{new Date(reg.event.startDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {reg.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No registrations yet</p>
          )}
        </div>

        {/* Recent Giving */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Giving</h2>
            <Link to="/member/giving" className="text-blue-600 text-sm">View All</Link>
          </div>
          {donations.length > 0 ? (
            <div className="space-y-4">
              {donations.map((d) => (
                <div key={d.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">${Number(d.amount).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{d.category?.name}</p>
                  </div>
                  <p className="text-sm text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No donations yet</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/give" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Give Online</Link>
          <Link to="/member/profile" className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Update Profile</Link>
          <Link to="/member/prayer" className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Submit Prayer Request</Link>
          <Link to="/sermons" className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Watch Sermons</Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
