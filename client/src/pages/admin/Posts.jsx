import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postsAPI } from '../../services/api'

const Posts = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const page = parseInt(searchParams.get('page') || '1')
  const status = searchParams.get('status') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['adminPosts', page, status],
    queryFn: () => postsAPI.getAdminList({ page, limit: 20, status }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => postsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPosts'])
    },
  })

  const posts = data?.data?.posts || []
  const pagination = data?.data?.pagination || { page: 1, pages: 1 }

  const handleDelete = (id, title) => {
    if (confirm(`Delete "${title}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        <Link
          to="/admin/posts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              !status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSearchParams({ status: 'DRAFT' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === 'DRAFT' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setSearchParams({ status: 'PUBLISHED' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === 'PUBLISHED' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Published
          </button>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : posts.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{post.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.author?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.category?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/admin/posts/${post.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts found</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <button
              onClick={() => setSearchParams({ page: String(page - 1), ...(status && { status }) })}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setSearchParams({ page: String(page + 1), ...(status && { status }) })}
              disabled={page >= pagination.pages}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Posts
