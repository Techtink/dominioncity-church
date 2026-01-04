import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { sermonsAPI, eventsAPI, postsAPI, contentAPI } from '../../services/api'
import HeroSlider from '../../components/UI/HeroSlider'

const Home = () => {
  const { data: sermonsData } = useQuery({
    queryKey: ['latestSermons'],
    queryFn: () => sermonsAPI.getLatest(),
  })

  const { data: eventsData } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => eventsAPI.getUpcoming(),
  })

  const { data: postsData } = useQuery({
    queryKey: ['latestPosts'],
    queryFn: () => postsAPI.getAll({ limit: 3 }),
  })

  const { data: serviceTimesData } = useQuery({
    queryKey: ['serviceTimes'],
    queryFn: () => contentAPI.getServiceTimes(),
  })

  const sermons = sermonsData?.data?.sermons || []
  const events = eventsData?.data?.events || []
  const posts = postsData?.data?.posts || []
  const serviceTimes = serviceTimesData?.data?.serviceTimes || []

  return (
    <div>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Service Times */}
      {serviceTimes.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Join Us This Week</h2>
              <p className="mt-4 text-lg text-gray-600">We'd love to see you at one of our services</p>
            </div>
            <div className={`grid gap-8 ${serviceTimes.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : serviceTimes.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
              {serviceTimes.map((service) => (
                <div key={service.id} className="text-center p-8 rounded-xl bg-gray-50">
                  <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                  <p className="mt-2 text-3xl font-bold text-blue-600">{service.time}</p>
                  {service.location && <p className="mt-2 text-gray-600">{service.location}</p>}
                  {service.description && <p className="mt-2 text-sm text-gray-500">{service.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Sermons */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Latest Sermons</h2>
            <Link to="/sermons" className="text-blue-600 hover:text-blue-700 font-medium">
              View All &rarr;
            </Link>
          </div>
          {sermons.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sermons.slice(0, 3).map((sermon) => (
                <div key={sermon.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                    {sermon.thumbnailUrl ? (
                      <img src={sermon.thumbnailUrl} alt={sermon.title} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-500">{new Date(sermon.date).toLocaleDateString()}</p>
                    <h3 className="mt-1 text-lg font-semibold text-gray-900">{sermon.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{sermon.speaker}</p>
                    <Link
                      to={`/sermons/${sermon.slug}`}
                      className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Watch Now &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No sermons available yet.</p>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <Link to="/events" className="text-blue-600 hover:text-blue-700 font-medium">
              View All &rarr;
            </Link>
          </div>
          {events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {events.slice(0, 4).map((event) => (
                <div key={event.id} className="flex bg-gray-50 rounded-xl overflow-hidden">
                  <div className="w-24 bg-blue-600 text-white flex flex-col items-center justify-center p-4">
                    <span className="text-sm font-medium">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-3xl font-bold">{new Date(event.startDate).getDate()}</span>
                  </div>
                  <div className="flex-1 p-6">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {event.location && ` • ${event.location}`}
                    </p>
                    <Link
                      to={`/events/${event.slug}`}
                      className="mt-3 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Learn More &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No upcoming events.</p>
          )}
        </div>
      </section>

      {/* Latest Blog Posts */}
      {posts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Latest Updates</h2>
              <Link to="/blog" className="text-blue-600 hover:text-blue-700 font-medium">
                View All &rarr;
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {post.featuredImage && (
                    <img src={post.featuredImage} alt={post.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <p className="text-sm text-gray-500">{new Date(post.publishedAt).toLocaleDateString()}</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">{post.title}</h3>
                    {post.excerpt && (
                      <p className="mt-2 text-gray-600 line-clamp-2">{post.excerpt}</p>
                    )}
                    <Link
                      to={`/blog/${post.slug}`}
                      className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Read More &rarr;
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Give CTA */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Partner With Us</h2>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Your generosity enables us to serve our community and share God's love. Every gift makes a difference.
          </p>
          <Link
            to="/give"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-blue-50"
          >
            Give Online
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
