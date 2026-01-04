import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { postsAPI } from '../../services/api'

const BlogPost = () => {
  const { slug } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => postsAPI.getBySlug(slug),
  })

  const post = data?.data?.post

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-gray-900">Post Not Found</h1>
        <p className="mt-2 text-gray-600">The post you're looking for doesn't exist.</p>
        <Link to="/blog" className="mt-4 text-blue-600 hover:text-blue-700">
          &larr; Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <article>
      {/* Hero */}
      <section className="bg-gray-900 text-white pt-32 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="text-gray-300 hover:text-white mb-6 inline-flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
          {post.category && (
            <span className="inline-block bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              {post.category.name}
            </span>
          )}
          <h1 className="text-4xl font-bold">{post.title}</h1>
          <div className="mt-4 flex items-center text-gray-300">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-700 rounded-full mr-3"></div>
              <div>
                <p className="font-medium text-white">{post.author?.name}</p>
                <p className="text-sm">{new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Featured Image */}
          {post.featuredImage && (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-auto rounded-xl mb-8 -mt-20 relative z-10 shadow-xl"
            />
          )}

          {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-gray-600 font-medium mb-4">Share this post:</p>
          <div className="flex gap-4">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400"
            >
              <span className="sr-only">Share on Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600"
            >
              <span className="sr-only">Share on Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
          </div>
        </div>
        </div>
      </div>
    </article>
  )
}

export default BlogPost
