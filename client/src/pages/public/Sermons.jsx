import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { sermonsAPI } from '../../services/api'
import PageHero from '../../components/UI/PageHero'

const Sermons = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')
  const series = searchParams.get('series') || ''
  const speaker = searchParams.get('speaker') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['sermons', page, series, speaker],
    queryFn: () => sermonsAPI.getAll({ page, limit: 12, series, speaker }),
  })

  const { data: seriesData } = useQuery({
    queryKey: ['series'],
    queryFn: () => sermonsAPI.getSeries(),
  })

  const { data: speakersData } = useQuery({
    queryKey: ['speakers'],
    queryFn: () => sermonsAPI.getSpeakers(),
  })

  const sermons = data?.data?.sermons || []
  const pagination = data?.data?.pagination || { page: 1, pages: 1 }
  const seriesList = seriesData?.data?.series || []
  const speakers = speakersData?.data?.speakers || []

  return (
    <div>
      <PageHero
        pageSlug="sermons"
        title="Sermons"
        subtitle="Watch and listen to messages from our church"
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <select
              value={series}
              onChange={(e) => setSearchParams({ series: e.target.value, page: '1' })}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Series</option>
              {seriesList.map((s) => (
                <option key={s.id} value={s.slug}>{s.name}</option>
              ))}
            </select>

            <select
              value={speaker}
              onChange={(e) => setSearchParams({ speaker: e.target.value, page: '1' })}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Speakers</option>
              {speakers.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {(series || speaker) && (
              <button
                onClick={() => setSearchParams({})}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : sermons.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sermons.map((sermon) => (
                  <div key={sermon.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="aspect-video bg-gray-200 relative flex items-center justify-center">
                      {sermon.thumbnailUrl ? (
                        <img src={sermon.thumbnailUrl} alt={sermon.title} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {sermon.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                            <svg className="h-8 w-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span>{new Date(sermon.date).toLocaleDateString()}</span>
                        {sermon.series && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">{sermon.series.name}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{sermon.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{sermon.speaker}</p>
                      {sermon.scripture && (
                        <p className="text-gray-500 text-sm mb-4">{sermon.scripture}</p>
                      )}
                      <Link
                        to={`/sermons/${sermon.slug}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Watch Now &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  <button
                    onClick={() => setSearchParams({ page: String(page - 1) })}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setSearchParams({ page: String(page + 1) })}
                    disabled={page >= pagination.pages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No sermons found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Sermons
