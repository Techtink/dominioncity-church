import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { postsAPI } from '../../services/api'
import PageHero from '../../components/UI/PageHero'

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')
  const category = searchParams.get('category') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page, category],
    queryFn: () => postsAPI.getAll({ page, limit: 9, category }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => postsAPI.getCategories(),
  })

  const posts = data?.data?.posts || []
  const pagination = data?.data?.pagination || { page: 1, pages: 1 }
  const categories = categoriesData?.data?.categories || []

  return (
    <div>
      <PageHero
        pageSlug="blog"
        title="Blog"
        subtitle="Stories, devotionals, and updates from our church family"
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSearchParams({})}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSearchParams({ category: cat.slug })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category === cat.slug ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {post.featuredImage ? (
                      <img src={post.featuredImage} alt={post.title} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                        {post.category && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">{post.category.name}</span>
                          </>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link to={`/blog/${post.slug}`} className="hover:text-blue-600">
                          {post.title}
                        </Link>
                      </h2>
                      {post.excerpt && (
                        <p className="text-gray-600 line-clamp-2 mb-4">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-600">{post.author?.name}</span>
                        </div>
                        <Link
                          to={`/blog/${post.slug}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Read More &rarr;
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  <button
                    onClick={() => setSearchParams({ page: String(page - 1), ...(category && { category }) })}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setSearchParams({ page: String(page + 1), ...(category && { category }) })}
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
              <p className="text-gray-600">No posts found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Blog
