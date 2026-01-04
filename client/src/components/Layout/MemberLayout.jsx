import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const MemberLayout = () => {
  const { user, logout, isAdmin, isEditor } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/member' },
    { name: 'My Profile', href: '/member/profile' },
    { name: 'Giving History', href: '/member/giving' },
    { name: 'Prayer Requests', href: '/member/prayer' },
  ]

  const isActive = (href) => location.pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Church
            </Link>

            <div className="flex items-center gap-6">
              <nav className="hidden md:flex gap-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium ${
                      isActive(item.href)
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-4 border-l pl-6">
                {(isAdmin || isEditor) && (
                  <Link
                    to="/admin"
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Admin
                  </Link>
                )}
                <span className="text-sm text-gray-600">
                  {user?.name}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <div className="flex overflow-x-auto px-4 py-2 gap-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium whitespace-nowrap px-3 py-2 rounded-full ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default MemberLayout
