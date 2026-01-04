import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../../services/api'
import PageHero from '../../components/UI/PageHero'

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')
  const past = searchParams.get('past') === 'true'

  const { data, isLoading } = useQuery({
    queryKey: ['events', page, past],
    queryFn: () => eventsAPI.getAll({ page, limit: 12, past: String(past) }),
  })

  const events = data?.data?.events || []
  const pagination = data?.data?.pagination || { page: 1, pages: 1 }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <PageHero
        pageSlug="events"
        title="Events"
        subtitle="Join us for worship, fellowship, and community"
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setSearchParams({})}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                !past ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setSearchParams({ past: 'true' })}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                past ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Past Events
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : events.length > 0 ? (
            <>
              <div className="space-y-6">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="md:flex">
                      {/* Date Badge */}
                      <div className="md:w-32 bg-blue-600 text-white flex flex-col items-center justify-center p-6">
                        <span className="text-sm font-medium uppercase">
                          {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-4xl font-bold">
                          {new Date(event.startDate).getDate()}
                        </span>
                        <span className="text-sm">
                          {new Date(event.startDate).getFullYear()}
                        </span>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              <Link to={`/events/${event.slug}`} className="hover:text-blue-600">
                                {event.title}
                              </Link>
                            </h3>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-600 text-sm">
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatTime(event.startDate)}
                                {event.endDate && ` - ${formatTime(event.endDate)}`}
                              </span>
                              {event.location && (
                                <span className="flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {event.location}
                                </span>
                              )}
                              {event.isRecurring && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Recurring
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="mt-3 text-gray-600 line-clamp-2">{event.description}</p>
                            )}
                          </div>
                          <Link
                            to={`/events/${event.slug}`}
                            className="shrink-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                          >
                            Learn More
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  <button
                    onClick={() => setSearchParams({ page: String(page - 1), ...(past && { past: 'true' }) })}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setSearchParams({ page: String(page + 1), ...(past && { past: 'true' }) })}
                    disabled={page >= pagination.pages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {past ? 'No past events found.' : 'No upcoming events at this time.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Events
