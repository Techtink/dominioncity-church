import { useQuery } from '@tanstack/react-query'
import { contentAPI, settingsAPI } from '../../services/api'
import PageHero from '../../components/UI/PageHero'

const About = () => {
  const { data: aboutData } = useQuery({
    queryKey: ['aboutContent'],
    queryFn: () => contentAPI.getAboutContent(),
  })

  const { data: coreValuesData } = useQuery({
    queryKey: ['coreValues'],
    queryFn: () => contentAPI.getCoreValues(),
  })

  const { data: leadershipData } = useQuery({
    queryKey: ['leadership'],
    queryFn: () => contentAPI.getLeadership(),
  })

  const { data: settingsData } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: () => settingsAPI.getPublic(),
    staleTime: 5 * 60 * 1000,
  })

  const aboutContent = aboutData?.data?.aboutContent || []
  const coreValues = coreValuesData?.data?.coreValues || []
  const leadership = leadershipData?.data?.leadership || []
  const settings = settingsData?.data?.settings || {}

  const storyContent = aboutContent.find(c => c.section === 'story')
  const missionContent = aboutContent.find(c => c.section === 'mission')
  const visionContent = aboutContent.find(c => c.section === 'vision')

  return (
    <div>
      <PageHero
        pageSlug="about"
        title="About Our Church"
        subtitle="We are a community of believers committed to loving God and loving others."
      />

      {/* Our Story */}
      {storyContent ? (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{storyContent.title}</h2>
                <div className="mt-4 text-gray-600 leading-relaxed space-y-4">
                  {storyContent.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
              {storyContent.imageUrl ? (
                <img src={storyContent.imageUrl} alt={storyContent.title} className="aspect-video rounded-xl object-cover" />
              ) : (
                <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400">Church Image</span>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500">
              <p>About content coming soon. Configure in Admin Settings.</p>
            </div>
          </div>
        </section>
      )}

      {/* Mission & Vision */}
      {(missionContent || visionContent) && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              {missionContent && (
                <div className="bg-white p-8 rounded-xl shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900">{missionContent.title}</h3>
                  <p className="mt-4 text-gray-600 leading-relaxed">{missionContent.content}</p>
                </div>
              )}
              {visionContent && (
                <div className="bg-white p-8 rounded-xl shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900">{visionContent.title}</h3>
                  <p className="mt-4 text-gray-600 leading-relaxed">{visionContent.content}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Core Values */}
      {coreValues.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
            <div className={`grid gap-8 ${coreValues.length <= 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : coreValues.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
              {coreValues.map((value, index) => (
                <div key={value.id} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {value.icon ? (
                      <span className="text-2xl">{value.icon}</span>
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">{index + 1}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{value.title}</h3>
                  <p className="mt-2 text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Leadership */}
      {leadership.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Leadership</h2>
            <div className={`grid gap-8 ${leadership.length === 1 ? 'max-w-md mx-auto' : leadership.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {leadership.map((leader) => (
                <div key={leader.id} className="bg-white p-6 rounded-xl shadow-sm text-center">
                  {leader.imageUrl ? (
                    <img src={leader.imageUrl} alt={leader.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Photo</span>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{leader.name}</h3>
                  <p className="text-blue-600">{leader.role}</p>
                  {leader.bio && <p className="mt-2 text-gray-600 text-sm">{leader.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default About
