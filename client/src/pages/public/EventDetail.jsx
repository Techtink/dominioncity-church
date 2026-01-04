import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const EventDetail = () => {
  const { slug } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [showRegForm, setShowRegForm] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestCount, setGuestCount] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => eventsAPI.getBySlug(slug),
  })

  const registerMutation = useMutation({
    mutationFn: (data) => eventsAPI.register(event.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['event', slug])
      setShowRegForm(false)
      alert('Registration successful!')
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Registration failed')
    },
  })

  const event = data?.data?.event

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-gray-900">Event Not Found</h1>
        <p className="mt-2 text-gray-600">The event you're looking for doesn't exist.</p>
        <Link to="/events" className="mt-4 text-blue-600 hover:text-blue-700">
          &larr; Back to Events
        </Link>
      </div>
    )
  }

  const handleRegister = (e) => {
    e.preventDefault()
    registerMutation.mutate({
      guestName: user ? undefined : guestName,
      guestEmail: user ? undefined : guestEmail,
      guestCount,
    })
  }

  const isPast = new Date(event.startDate) < new Date()

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link to="/events" className="text-blue-600 hover:text-blue-700 mb-8 inline-block">
          &larr; Back to Events
        </Link>

        {/* Event Image */}
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-64 md:h-96 object-cover rounded-xl mb-8"
          />
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>

            {event.description && (
              <div className="mt-6 prose max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              <div className="space-y-4">
                {/* Date & Time */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Date & Time</h3>
                  <p className="text-gray-600">
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-600">
                    {new Date(event.startDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {event.endDate && ` - ${new Date(event.endDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}`}
                  </p>
                </div>

                {/* Location */}
                {event.location && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                )}

                {/* Registration */}
                {event.registrationRequired && !isPast && (
                  <div className="pt-4 border-t">
                    {event.maxAttendees && (
                      <p className="text-sm text-gray-500 mb-4">
                        {event._count?.registrations || 0} / {event.maxAttendees} spots filled
                      </p>
                    )}

                    {showRegForm ? (
                      <form onSubmit={handleRegister} className="space-y-4">
                        {!user && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Name</label>
                              <input
                                type="text"
                                required
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Email</label>
                              <input
                                type="email"
                                required
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                              />
                            </div>
                          </>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={guestCount}
                            onChange={(e) => setGuestCount(parseInt(e.target.value))}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {registerMutation.isPending ? 'Registering...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRegForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowRegForm(true)}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Register Now
                      </button>
                    )}
                  </div>
                )}

                {isPast && (
                  <p className="text-gray-500 text-center py-4">This event has ended</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail
