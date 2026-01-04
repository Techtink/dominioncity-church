import { useQuery } from '@tanstack/react-query'
import { donationsAPI } from '../../services/api'

const Donations = () => {
  const { data, isLoading } = useQuery({ queryKey: ['adminDonations'], queryFn: () => donationsAPI.getAdminList({ limit: 50 }) })
  const donations = data?.data?.donations || []
  const stats = data?.data?.stats || { totalAmount: 0, totalCount: 0 }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Donations</h1>
      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Donations</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">${Number(stats.totalAmount).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Number of Donations</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalCount}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : donations.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {donations.map((d) => (
                <tr key={d.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{d.isAnonymous ? 'Anonymous' : d.donorName || d.user?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${Number(d.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{d.category?.name}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${d.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{d.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">No donations yet</div>
        )}
      </div>
    </div>
  )
}

export default Donations
