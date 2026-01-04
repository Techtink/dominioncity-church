import { useQuery } from '@tanstack/react-query'
import { membersAPI } from '../../services/api'

const Members = () => {
  const { data, isLoading } = useQuery({ queryKey: ['adminMembers'], queryFn: () => membersAPI.getAdminList({ limit: 50 }) })
  const members = data?.data?.members || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Members</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : members.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ministries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-6 py-4"><div className="flex items-center"><div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div><span className="text-sm font-medium text-gray-900">{m.name}</span></div></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.memberProfile?.ministries?.map(min => min.name).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">No members yet</div>
        )}
      </div>
    </div>
  )
}

export default Members
