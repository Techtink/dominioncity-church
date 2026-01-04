import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { membersAPI } from '../../services/api'
import PageHero from '../../components/UI/PageHero'

const Ministries = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => membersAPI.getMinistries(),
  })

  const ministries = data?.data?.ministries || []

  return (
    <div>
      <PageHero
        pageSlug="ministries"
        title="Ministries"
        subtitle="Discover opportunities to serve, grow, and connect with others"
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : ministries.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {ministries.map((ministry) => (
                <div key={ministry.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {ministry.imageUrl ? (
                    <img src={ministry.imageUrl} alt={ministry.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-6xl text-white/50">{ministry.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900">{ministry.name}</h3>
                    {ministry.description && (
                      <p className="mt-2 text-gray-600 line-clamp-2">{ministry.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {ministry._count?.members || 0} members
                      </div>
                      {ministry.meetingTime && (
                        <div className="text-sm text-gray-500">{ministry.meetingTime}</div>
                      )}
                    </div>
                    <Link
                      to={`/ministries/${ministry.slug}`}
                      className="mt-4 inline-block w-full text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No ministries found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Get Involved CTA */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Get Involved?</h2>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            We believe everyone has unique gifts to offer. Join a ministry today and make a difference in our community.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/register"
              className="inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-blue-50"
            >
              Sign Up
            </Link>
            <Link
              to="/contact"
              className="inline-block rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white hover:text-blue-600"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Ministries
