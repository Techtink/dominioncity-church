import { useQuery } from '@tanstack/react-query'
import { settingsAPI } from '../../services/api'

const PageHero = ({ pageSlug, title, subtitle, children, className = '' }) => {
  const { data } = useQuery({
    queryKey: ['pageBackground', pageSlug],
    queryFn: () => settingsAPI.getBackground(pageSlug),
    staleTime: 5 * 60 * 1000,
  })

  const background = data?.data?.background

  // Generate background styles based on type
  const getBackgroundStyle = () => {
    if (!background) {
      return { backgroundColor: '#1f2937' } // Default gray-900
    }

    switch (background.backgroundType) {
      case 'GRADIENT':
        const angle = background.gradientAngle || 180
        return {
          background: `linear-gradient(${angle}deg, ${background.gradientFrom || '#1e3a8a'}, ${background.gradientTo || '#1d4ed8'})`,
        }
      case 'IMAGE':
        return {
          backgroundImage: `url(${background.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      case 'SOLID':
      default:
        return {
          backgroundColor: background.solidColor || '#1f2937',
        }
    }
  }

  // Generate overlay styles for image backgrounds
  const getOverlayStyle = () => {
    if (background?.backgroundType === 'IMAGE') {
      const opacity = (background.overlayOpacity || 50) / 100
      const color = background.overlayColor || '#000000'
      return {
        backgroundColor: color,
        opacity,
      }
    }
    return null
  }

  const titleColor = background?.titleColor || '#ffffff'
  const subtitleColor = background?.subtitleColor || '#d1d5db'

  return (
    <section
      className={`relative text-white pt-32 pb-20 ${className}`}
      style={getBackgroundStyle()}
    >
      {/* Overlay for image backgrounds */}
      {background?.backgroundType === 'IMAGE' && (
        <div className="absolute inset-0" style={getOverlayStyle()} />
      )}

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1
          className="text-4xl font-bold sm:text-5xl"
          style={{ color: titleColor }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-4 text-xl max-w-2xl mx-auto"
            style={{ color: subtitleColor }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}

export default PageHero
