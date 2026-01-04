import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { settingsAPI } from '../../services/api'

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const { data } = useQuery({
    queryKey: ['heroSlides'],
    queryFn: () => settingsAPI.getSlides(),
  })

  const slides = data?.data?.slides || []

  // Default slides if none exist
  const defaultSlides = [
    {
      id: 'default-1',
      title: 'Embrace Faith, Inspire Hope,',
      subtitle: 'Live in Grace',
      description: 'Join our congregation, explore spiritual growth, and celebrate together.',
      imageUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1920&q=80',
      buttonText: 'Join Us Today',
      buttonLink: '/register',
      buttonText2: 'See Our Events',
      buttonLink2: '/events',
      animation: 'fade',
    },
    {
      id: 'default-2',
      title: 'Growing Together',
      subtitle: 'In Faith and Love',
      description: 'Be part of a community that nurtures your spiritual journey.',
      imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1920&q=80',
      buttonText: 'Our Ministries',
      buttonLink: '/ministries',
      buttonText2: 'Watch Sermons',
      buttonLink2: '/sermons',
      animation: 'slide',
    },
    {
      id: 'default-3',
      title: 'Worship With Us',
      subtitle: 'Every Sunday',
      description: 'Experience the joy of worship and fellowship in our services.',
      imageUrl: 'https://images.unsplash.com/photo-1519491050282-cf00c82424ad?auto=format&fit=crop&w=1920&q=80',
      buttonText: 'Service Times',
      buttonLink: '/about',
      buttonText2: 'Get Directions',
      buttonLink2: '/contact',
      animation: 'zoom',
    },
  ]

  const displaySlides = slides.length > 0 ? slides : defaultSlides

  const nextSlide = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentSlide((prev) => (prev + 1) % displaySlides.length)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isAnimating, displaySlides.length])

  const prevSlide = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentSlide((prev) => (prev - 1 + displaySlides.length) % displaySlides.length)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isAnimating, displaySlides.length])

  const goToSlide = (index) => {
    if (isAnimating || index === currentSlide) return
    setIsAnimating(true)
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 700)
  }

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(nextSlide, 6000)
    return () => clearInterval(interval)
  }, [nextSlide])

  const getAnimationClass = (index, animation) => {
    const isActive = index === currentSlide

    if (animation === 'slide') {
      return isActive
        ? 'translate-x-0 opacity-100'
        : index < currentSlide
          ? '-translate-x-full opacity-0'
          : 'translate-x-full opacity-0'
    }

    if (animation === 'zoom') {
      return isActive
        ? 'scale-100 opacity-100'
        : 'scale-110 opacity-0'
    }

    // Default: fade
    return isActive ? 'opacity-100' : 'opacity-0'
  }

  const getContentAnimation = (index) => {
    const isActive = index === currentSlide
    return isActive
      ? 'translate-y-0 opacity-100 delay-300'
      : 'translate-y-8 opacity-0'
  }

  if (displaySlides.length === 0) return null

  return (
    <div className="relative h-[500px] sm:h-[550px] md:h-[650px] lg:h-[700px] overflow-hidden">
      {/* Slides */}
      {displaySlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${getAnimationClass(index, slide.animation)}`}
        >
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className={`text-left text-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-500 ${getContentAnimation(index)}`}>
              <div className="max-w-2xl">
                {slide.subtitle && (
                  <h2 className="text-base md:text-lg font-light mb-1 tracking-wide text-gray-200">
                    {slide.subtitle}
                  </h2>
                )}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif italic mb-3 leading-snug">
                  {slide.title}
                </h1>
                {slide.description && (
                  <p className="text-base md:text-lg text-gray-300 mb-5">
                    {slide.description}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                {slide.buttonText && slide.buttonLink && (
                  <Link
                    to={slide.buttonLink}
                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors group"
                  >
                    {slide.buttonText}
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                )}
                {slide.buttonText2 && slide.buttonLink2 && (
                  <Link
                    to={slide.buttonLink2}
                    className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-full font-medium hover:bg-white/10 transition-colors group"
                  >
                    {slide.buttonText2}
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - hidden on small mobile, visible from sm up */}
      {displaySlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hidden sm:flex"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hidden sm:flex"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {displaySlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HeroSlider
