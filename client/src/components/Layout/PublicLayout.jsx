import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { settingsAPI } from '../../services/api'
import ChatWidget from '../UI/ChatWidget'

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  // Fetch public settings
  const { data: settingsData } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: () => settingsAPI.getPublic(),
    staleTime: 5 * 60 * 1000,
  })

  const settings = settingsData?.data?.settings || {}
  const siteName = settings.site_name || 'DominionCity'

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Sermons', href: '/sermons' },
    { name: 'Blog', href: '/blog' },
    { name: 'Events', href: '/events' },
    { name: 'Ministries', href: '/ministries' },
    { name: 'Give', href: '/give' },
  ]

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  const isHomePage = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-900/95 backdrop-blur-sm shadow-lg py-3'
            : 'bg-transparent py-4'
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 2v7H4v2h7v11h2V11h7V9h-7V2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                {siteName}
              </span>
            </Link>

            {/* Desktop Navigation - Pill Style */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
                      isActive(item.href)
                        ? 'bg-white text-slate-900'
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Connect Button */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={user.role === 'ADMIN' || user.role === 'EDITOR' ? '/admin' : '/member'}
                    className="text-sm text-gray-300 hover:text-white"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-300 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors group"
                >
                  Connect
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 text-white rounded-lg hover:bg-slate-800/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4">
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-white text-slate-900'
                        : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-3 mt-3 border-t border-slate-700 space-y-1">
                  {user ? (
                    <>
                      <Link
                        to={user.role === 'ADMIN' || user.role === 'EDITOR' ? '/admin' : '/member'}
                        className="block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:bg-slate-700/50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:bg-slate-700/50"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:bg-slate-700/50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-3 rounded-xl text-base font-medium bg-white text-slate-900 text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Connect
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* No spacer - all pages have hero sections that go under the header */}

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white safe-area-bottom">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12">
            {/* About */}
            <div className="col-span-1 md:col-span-2 text-center md:text-left">
              <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 2v7H4v2h7v11h2V11h7V9h-7V2z" />
                </svg>
                <span className="text-xl font-semibold">{siteName}</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md mx-auto md:mx-0">
                {settings.site_tagline || 'A community of believers dedicated to worshiping God, growing in faith, and serving others.'}
              </p>
              <div className="flex space-x-4 justify-center md:justify-start">
                {settings.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-slate-700 hover:text-white transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                )}
                {settings.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-slate-700 hover:text-white transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                    </svg>
                  </a>
                )}
                {settings.youtube_url && (
                  <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-slate-700 hover:text-white transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </a>
                )}
                {!settings.facebook_url && !settings.instagram_url && !settings.youtube_url && (
                  <>
                    <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-slate-700 hover:text-white transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                      </svg>
                    </a>
                    <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-slate-700 hover:text-white transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                      </svg>
                    </a>
                    <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-slate-700 hover:text-white transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                      </svg>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold mb-4 sm:mb-6">Quick Links</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/sermons" className="text-gray-400 hover:text-white transition-colors">Sermons</Link></li>
                <li><Link to="/events" className="text-gray-400 hover:text-white transition-colors">Events</Link></li>
                <li><Link to="/ministries" className="text-gray-400 hover:text-white transition-colors">Ministries</Link></li>
                <li><Link to="/give" className="text-gray-400 hover:text-white transition-colors">Give</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold mb-4 sm:mb-6">Contact</h4>
              <ul className="space-y-2 sm:space-y-3 text-gray-400">
                <li className="flex items-start justify-center md:justify-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{settings.contact_address || '123 Church Street, City, State 12345'}</span>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{settings.contact_phone || '(123) 456-7890'}</span>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{settings.contact_email || 'info@church.com'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-800 text-center text-gray-500 text-sm sm:text-base">
            <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Live Chat Widget */}
      <ChatWidget />
    </div>
  )
}

export default PublicLayout
