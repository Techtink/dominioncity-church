import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { postsAPI, sermonsAPI, eventsAPI, donationsAPI, membersAPI } from '../../services/api'

const Dashboard = () => {
  const { data: postsData } = useQuery({
    queryKey: ['adminPosts'],
    queryFn: () => postsAPI.getAdminList({ limit: 5 }),
  })

  const { data: eventsData } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => eventsAPI.getUpcoming(),
  })

  const stats = [
    { name: 'Total Posts', value: postsData?.data?.pagination?.total || 0, href: '/admin/posts' },
    { name: 'Upcoming Events', value: eventsData?.data?.events?.length || 0, href: '/admin/events' },
    { name: 'Sermons', value: '—', href: '/admin/sermons' },
    { name: 'Members', value: '—', href: '/admin/members' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/posts/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
          <Link
            to="/admin/sermons/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Sermon
          </Link>
          <Link
            to="/admin/events/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Event
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Posts */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            <Link to="/admin/posts" className="text-blue-600 hover:text-blue-700 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {postsData?.data?.posts?.slice(0, 5).map((post) => (
              <div key={post.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{post.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()} • {post.status}
                  </p>
                </div>
                <Link
                  to={`/admin/posts/${post.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Edit
                </Link>
              </div>
            )) || <p className="text-gray-500">No posts yet</p>}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link to="/admin/events" className="text-blue-600 hover:text-blue-700 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {eventsData?.data?.events?.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.startDate).toLocaleDateString()} • {event.location}
                  </p>
                </div>
                <Link
                  to={`/admin/events/${event.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Edit
                </Link>
              </div>
            )) || <p className="text-gray-500">No upcoming events</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
