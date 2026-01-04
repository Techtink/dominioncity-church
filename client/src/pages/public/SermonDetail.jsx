import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { sermonsAPI } from '../../services/api'

const SermonDetail = () => {
  const { slug } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['sermon', slug],
    queryFn: () => sermonsAPI.getBySlug(slug),
  })

  const sermon = data?.data?.sermon

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !sermon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-gray-900">Sermon Not Found</h1>
        <p className="mt-2 text-gray-600">The sermon you're looking for doesn't exist.</p>
        <Link to="/sermons" className="mt-4 text-blue-600 hover:text-blue-700">
          &larr; Back to Sermons
        </Link>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link to="/sermons" className="text-blue-600 hover:text-blue-700 mb-8 inline-block">
          &larr; Back to Sermons
        </Link>

        {/* Video/Audio Player */}
        <div className="aspect-video bg-gray-900 rounded-xl mb-8 flex items-center justify-center">
          {sermon.videoUrl ? (
            <video
              src={sermon.videoUrl}
              controls
              className="w-full h-full rounded-xl"
              poster={sermon.thumbnailUrl}
            />
          ) : sermon.audioUrl ? (
            <div className="text-center p-8">
              <svg className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <audio src={sermon.audioUrl} controls className="w-full max-w-md" />
            </div>
          ) : (
            <p className="text-gray-400">No media available</p>
          )}
        </div>

        {/* Sermon Info */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <header>
              {sermon.series && (
                <Link
                  to={`/sermons?series=${sermon.series.slug}`}
                  className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-4 hover:bg-blue-200"
                >
                  {sermon.series.name}
                </Link>
              )}
              <h1 className="text-3xl font-bold text-gray-900">{sermon.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-gray-600">
                <span>{sermon.speaker}</span>
                <span>•</span>
                <span>{new Date(sermon.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
                {sermon.duration && (
                  <>
                    <span>•</span>
                    <span>{Math.floor(sermon.duration / 60)} min</span>
                  </>
                )}
              </div>
            </header>

            {sermon.scripture && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500 mb-1">Scripture</p>
                <p className="text-gray-900">{sermon.scripture}</p>
              </div>
            )}

            {sermon.description && (
              <div className="mt-6 prose max-w-none">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Sermon</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{sermon.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Share This Sermon</h3>
              <div className="flex gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(sermon.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-blue-400 shadow-sm"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 shadow-sm"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
              </div>

              {(sermon.audioUrl || sermon.videoUrl) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Download</h3>
                  <div className="space-y-2">
                    {sermon.audioUrl && (
                      <a
                        href={sermon.audioUrl}
                        download
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Audio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SermonDetail
