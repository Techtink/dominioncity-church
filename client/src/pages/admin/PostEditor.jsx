import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postsAPI, uploadsAPI } from '../../services/api'

const PostEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    categoryId: '',
    status: 'DRAFT',
  })
  const [error, setError] = useState('')

  const { data: postData, isLoading: postLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsAPI.getById(id),
    enabled: isEditing,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => postsAPI.getCategories(),
  })

  const categories = categoriesData?.data?.categories || []

  useEffect(() => {
    if (postData?.data?.post) {
      const post = postData.data.post
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        featuredImage: post.featuredImage || '',
        categoryId: post.categoryId || '',
        status: post.status,
      })
    }
  }, [postData])

  const saveMutation = useMutation({
    mutationFn: (data) => isEditing ? postsAPI.update(id, data) : postsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPosts'])
      navigate('/admin/posts')
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Failed to save post')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    saveMutation.mutate(formData)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const response = await uploadsAPI.uploadSingle(file)
      setFormData({ ...formData, featuredImage: response.data.file.url })
    } catch (err) {
      setError('Failed to upload image')
    }
  }

  if (isEditing && postLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Post' : 'New Post'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter post title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={15}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Write your content here... (HTML supported)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Brief summary of the post"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Publish</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/posts')}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Category</h3>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Featured Image</h3>
              {formData.featuredImage ? (
                <div className="relative">
                  <img
                    src={formData.featuredImage}
                    alt="Featured"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, featuredImage: '' })}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Click to upload</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default PostEditor
