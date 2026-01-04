import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { smsAPI } from '../../services/api'

const SMS = () => {
  const [activeTab, setActiveTab] = useState('campaigns')
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [success, setSuccess] = useState('')
  const queryClient = useQueryClient()

  // Fetch campaigns
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['smsCampaigns', statusFilter],
    queryFn: () => smsAPI.getCampaigns({ status: statusFilter }),
  })

  // Fetch ministries for targeting
  const { data: ministriesData } = useQuery({
    queryKey: ['smsMinistries'],
    queryFn: () => smsAPI.getMinistries(),
  })

  // Fetch events for targeting
  const { data: eventsData } = useQuery({
    queryKey: ['smsEvents'],
    queryFn: () => smsAPI.getEvents(),
  })

  // Preview recipients
  const { data: previewData, refetch: refetchPreview } = useQuery({
    queryKey: ['recipientPreview', editingCampaign?.targetType, editingCampaign?.targetId],
    queryFn: () => smsAPI.getRecipientPreview({
      targetType: editingCampaign?.targetType,
      targetId: editingCampaign?.targetId,
    }),
    enabled: !!editingCampaign?.targetType,
  })

  const campaigns = campaignsData?.data?.campaigns || []
  const ministries = ministriesData?.data?.ministries || []
  const events = eventsData?.data?.events || []
  const previewRecipients = previewData?.data?.recipients || []
  const previewTotal = previewData?.data?.totalCount || 0

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => smsAPI.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['smsCampaigns'])
      setEditingCampaign(null)
      setSuccess('Campaign created!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => smsAPI.updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['smsCampaigns'])
      setEditingCampaign(null)
      setSuccess('Campaign updated!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => smsAPI.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['smsCampaigns'])
    },
  })

  const sendMutation = useMutation({
    mutationFn: ({ id, scheduledAt }) => smsAPI.sendCampaign(id, { scheduledAt }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['smsCampaigns'])
      setSuccess(variables.scheduledAt ? 'Campaign scheduled!' : 'Campaign started!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => smsAPI.cancelCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['smsCampaigns'])
      setSuccess('Campaign cancelled')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingCampaign?.id) {
      updateMutation.mutate({ id: editingCampaign.id, data: editingCampaign })
    } else {
      createMutation.mutate(editingCampaign)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-500',
    }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.DRAFT}`}>
        {status}
      </span>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SMS Campaigns</h1>
        <button
          onClick={() => setEditingCampaign({
            name: '',
            message: '',
            targetType: 'ALL_MEMBERS',
            targetId: null,
            scheduledAt: null,
          })}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Campaign
        </button>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Campaign Editor Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">
                {editingCampaign.id ? 'Edit Campaign' : 'New SMS Campaign'}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={editingCampaign.name}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                  placeholder="e.g., Sunday Service Reminder"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={editingCampaign.message}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, message: e.target.value })}
                  placeholder="Your SMS message here..."
                  maxLength={480}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {editingCampaign.message?.length || 0}/480 characters
                  {editingCampaign.message?.length > 160 && (
                    <span className="text-yellow-600">
                      {' '}(will be sent as {Math.ceil((editingCampaign.message?.length || 0) / 160)} messages)
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience *</label>
                <select
                  value={editingCampaign.targetType}
                  onChange={(e) => {
                    setEditingCampaign({
                      ...editingCampaign,
                      targetType: e.target.value,
                      targetId: null,
                    })
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                >
                  <option value="ALL_MEMBERS">All Members with Phone Numbers</option>
                  <option value="MINISTRY">Ministry Members</option>
                  <option value="EVENT_REGISTRANTS">Event Registrants</option>
                </select>
              </div>

              {editingCampaign.targetType === 'MINISTRY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Ministry *</label>
                  <select
                    required
                    value={editingCampaign.targetId || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, targetId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    <option value="">Choose a ministry...</option>
                    {ministries.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editingCampaign.targetType === 'EVENT_REGISTRANTS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Event *</label>
                  <select
                    required
                    value={editingCampaign.targetId || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, targetId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    <option value="">Choose an event...</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title} ({new Date(e.startDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipient Preview */}
              {editingCampaign.targetType && previewTotal > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Recipients Preview ({previewTotal} total)
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {previewRecipients.slice(0, 10).map((r, i) => (
                      <p key={i} className="text-sm text-gray-600">
                        {r.name} - {r.phone}
                      </p>
                    ))}
                    {previewTotal > 10 && (
                      <p className="text-sm text-gray-400">
                        ... and {previewTotal - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={editingCampaign.scheduledAt ? new Date(editingCampaign.scheduledAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingCampaign({
                    ...editingCampaign,
                    scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to save as draft or send immediately
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingCampaign.id ? 'Update' : 'Save Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : campaigns.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{campaign.message}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {campaign.totalRecipients}
                  </td>
                  <td className="px-6 py-4">
                    {campaign.status === 'PROCESSING' || campaign.status === 'COMPLETED' ? (
                      <div className="w-32">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{campaign.sentCount} sent</span>
                          <span>{campaign.failedCount} failed</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${campaign.totalRecipients > 0
                                ? ((campaign.sentCount + campaign.failedCount) / campaign.totalRecipients) * 100
                                : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {campaign.scheduledAt
                      ? new Date(campaign.scheduledAt).toLocaleString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {campaign.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => setEditingCampaign(campaign)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => sendMutation.mutate({ id: campaign.id })}
                            disabled={sendMutation.isPending}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            Send Now
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this campaign?')) {
                                deleteMutation.mutate(campaign.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {campaign.status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => setEditingCampaign(campaign)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(campaign.id)}
                            disabled={cancelMutation.isPending}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {campaign.status === 'PROCESSING' && (
                        <button
                          onClick={() => cancelMutation.mutate(campaign.id)}
                          disabled={cancelMutation.isPending}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Stop
                        </button>
                      )}
                      {(campaign.status === 'COMPLETED' || campaign.status === 'FAILED') && (
                        <span className="text-sm text-gray-400">
                          {campaign.completedAt
                            ? `Completed ${new Date(campaign.completedAt).toLocaleDateString()}`
                            : '-'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first SMS campaign to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SMS
