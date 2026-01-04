import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { donationsAPI, settingsAPI } from '../../services/api'
import PageHero from '../../components/UI/PageHero'

const Give = () => {
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  const { data: categoriesData } = useQuery({
    queryKey: ['givingCategories'],
    queryFn: () => donationsAPI.getCategories(),
  })

  const { data: settingsData } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: () => settingsAPI.getPublic(),
    staleTime: 5 * 60 * 1000,
  })

  const categories = categoriesData?.data?.categories || []
  const settings = settingsData?.data?.settings || {}

  const presetAmounts = [25, 50, 100, 250, 500]

  const handleAmountClick = (value) => {
    setAmount(value)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value)
    setAmount('')
  }

  const selectedAmount = amount || customAmount

  const handleSubmit = async (e) => {
    e.preventDefault()
    // In production, this would integrate with Stripe
    alert('Stripe payment integration coming soon!')
  }

  return (
    <div>
      <PageHero
        pageSlug="give"
        title="Give Online"
        subtitle="Your generosity makes a difference. Thank you for partnering with us to further God's kingdom."
      />

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit}>
              {/* Amount Selection */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Select Amount
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                  {presetAmounts.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleAmountClick(String(value))}
                      className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                        amount === String(value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ${value}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Other amount"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-lg"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Designation
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`py-3 px-4 rounded-lg font-medium transition-colors text-left ${
                        categoryId === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymous Option */}
              <div className="mb-8">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                  <span className="ml-3 text-gray-700">Give anonymously</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!selectedAmount || !categoryId}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selectedAmount ? `Give $${selectedAmount}` : 'Select an amount'}
              </button>

              <p className="mt-4 text-center text-sm text-gray-500">
                Secure payment powered by Stripe
              </p>
            </form>
          </div>

          {/* Info Cards */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Other Ways to Give</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• In-person during Sunday services</li>
                <li>• Mail a check to our church office</li>
                <li>• Set up recurring giving online</li>
                {settings.contact_phone && <li>• Text "GIVE" to {settings.contact_phone}</li>}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Questions?</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about giving, please contact our finance office.
              </p>
              {(settings.contact_email || settings.contact_phone) && (
                <p className="text-gray-600">
                  {settings.contact_email && <>Email: {settings.contact_email}<br /></>}
                  {settings.contact_phone && <>Phone: {settings.contact_phone}</>}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Scripture Quote */}
      <section className="bg-gray-900 text-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-2xl font-light italic">
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
          </blockquote>
          <cite className="mt-4 block text-blue-300">— 2 Corinthians 9:7</cite>
        </div>
      </section>
    </div>
  )
}

export default Give
