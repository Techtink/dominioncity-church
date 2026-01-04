import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Layouts
import PublicLayout from './components/Layout/PublicLayout'
import AdminLayout from './components/Layout/AdminLayout'
import MemberLayout from './components/Layout/MemberLayout'

// Auth
import ProtectedRoute from './components/ProtectedRoute'

// Public Pages
const Home = lazy(() => import('./pages/public/Home'))
const About = lazy(() => import('./pages/public/About'))
const Contact = lazy(() => import('./pages/public/Contact'))
const Blog = lazy(() => import('./pages/public/Blog'))
const BlogPost = lazy(() => import('./pages/public/BlogPost'))
const Sermons = lazy(() => import('./pages/public/Sermons'))
const SermonDetail = lazy(() => import('./pages/public/SermonDetail'))
const Events = lazy(() => import('./pages/public/Events'))
const EventDetail = lazy(() => import('./pages/public/EventDetail'))
const Give = lazy(() => import('./pages/public/Give'))
const Ministries = lazy(() => import('./pages/public/Ministries'))
const Login = lazy(() => import('./pages/public/Login'))
const Register = lazy(() => import('./pages/public/Register'))

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminPosts = lazy(() => import('./pages/admin/Posts'))
const AdminPostEditor = lazy(() => import('./pages/admin/PostEditor'))
const AdminSermons = lazy(() => import('./pages/admin/Sermons'))
const AdminSermonEditor = lazy(() => import('./pages/admin/SermonEditor'))
const AdminEvents = lazy(() => import('./pages/admin/Events'))
const AdminEventEditor = lazy(() => import('./pages/admin/EventEditor'))
const AdminDonations = lazy(() => import('./pages/admin/Donations'))
const AdminMembers = lazy(() => import('./pages/admin/Members'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminChat = lazy(() => import('./pages/admin/Chat'))
const AdminSMS = lazy(() => import('./pages/admin/SMS'))
const AdminSocial = lazy(() => import('./pages/admin/Social'))

// Member Pages
const MemberDashboard = lazy(() => import('./pages/member/Dashboard'))
const MemberProfile = lazy(() => import('./pages/member/Profile'))
const MemberGiving = lazy(() => import('./pages/member/Giving'))
const MemberPrayer = lazy(() => import('./pages/member/Prayer'))

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/sermons" element={<Sermons />} />
          <Route path="/sermons/:slug" element={<SermonDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/give" element={<Give />} />
          <Route path="/ministries" element={<Ministries />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN', 'EDITOR']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="posts/new" element={<AdminPostEditor />} />
          <Route path="posts/:id" element={<AdminPostEditor />} />
          <Route path="sermons" element={<AdminSermons />} />
          <Route path="sermons/new" element={<AdminSermonEditor />} />
          <Route path="sermons/:id" element={<AdminSermonEditor />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/new" element={<AdminEventEditor />} />
          <Route path="events/:id" element={<AdminEventEditor />} />
          <Route path="donations" element={<AdminDonations />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="sms" element={<AdminSMS />} />
          <Route path="social" element={<AdminSocial />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Member Routes */}
        <Route
          path="/member"
          element={
            <ProtectedRoute>
              <MemberLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MemberDashboard />} />
          <Route path="profile" element={<MemberProfile />} />
          <Route path="giving" element={<MemberGiving />} />
          <Route path="prayer" element={<MemberPrayer />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900">404</h1>
              <p className="text-xl text-gray-600 mt-4">Page not found</p>
              <a href="/" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go Home
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Suspense>
  )
}

export default App
