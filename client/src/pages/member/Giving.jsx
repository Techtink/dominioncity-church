import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { donationsAPI } from '../../services/api'

const Giving = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['myDonations'],
    queryFn: () => donationsAPI.getMyDonations({ limit: 50 }),
  })

  const donations = data?.data?.donations || []
  const totalGiven = data?.data?.totalGiven || 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Giving History</h1>
        <Link to="/give" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Give Now
        </Link>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <p className="text-sm font-medium text-gray-500">Total Given</p>
        <p className="mt-2 text-4xl font-bold text-gray-900">${Number(totalGiven).toLocaleString()}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : donations.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {donations.map((d) => (
                <tr key={d.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${Number(d.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{d.category?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${d.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No donations yet</p>
            <Link to="/give" className="text-blue-600 hover:text-blue-700">Make your first gift &rarr;</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Giving
