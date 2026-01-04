import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI } from '../../services/api'

const Events = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['events'], queryFn: () => eventsAPI.getAll({ limit: 50 }) })
  const deleteMutation = useMutation({ mutationFn: (id) => eventsAPI.delete(id), onSuccess: () => queryClient.invalidateQueries(['events']) })
  const events = data?.data?.events || []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Link to="/admin/events/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">New Event</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : events.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrations</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{event.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(event.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{event.location || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{event._count?.registrations || 0}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link to={`/admin/events/${event.id}`} className="text-blue-600 hover:text-blue-900 mr-4">Edit</Link>
                    <button onClick={() => confirm('Delete?') && deleteMutation.mutate(event.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">No events yet</div>
        )}
      </div>
    </div>
  )
}

export default Events
