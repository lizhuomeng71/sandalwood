'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { registerForEventAction } from '@/actions/registration'

interface RegistrationData {
  event_id: string
  event_title: string
  selected_components: Array<{
    component_id: string
    quantity: number
    price: number | null
    name: string
  }>
  notes?: string
  total_amount: number
  user_email: string
  user_name: string | null
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')

  useEffect(() => {
    // Load registration data from sessionStorage
    const data = sessionStorage.getItem('pendingRegistration')
    if (data) {
      const parsed = JSON.parse(data)
      setRegistrationData(parsed)
      setCardName(parsed.user_name || '')
    } else {
      // No registration data, redirect back to registration
      router.push(`/community/events/${eventId}/register`)
    }
  }, [eventId, router])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    try {
      if (!registrationData) {
        throw new Error('No registration data found')
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Complete the registration
      const result = await registerForEventAction({
        event_id: registrationData.event_id,
        selected_components: registrationData.selected_components.map(comp => ({
          component_id: comp.component_id,
          quantity: comp.quantity,
          price: comp.price,
        })),
        notes: registrationData.notes,
      })

      if (result?.serverError) {
        setError(result.serverError)
        setIsProcessing(false)
        return
      }

      // Clear sessionStorage
      sessionStorage.removeItem('pendingRegistration')

      // Redirect to success page
      router.push(`/community/events/${eventId}?registered=true`)
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  if (!registrationData) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href={`/community/events/${eventId}/register`}
          className="text-sm text-violet-500 hover:text-violet-600 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Registration
        </Link>
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
          Complete Payment
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {registrationData.event_title}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handlePayment}>
            {/* Payment Method Selection */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                    className="form-radio"
                  />
                  <div className="ml-3 flex items-center">
                    <svg className="w-8 h-6 mr-2" viewBox="0 0 32 24" fill="none">
                      <rect width="32" height="24" rx="4" fill="#E5E7EB"/>
                      <rect x="2" y="6" width="28" height="4" fill="#9CA3AF"/>
                    </svg>
                    <span className="font-medium text-gray-800 dark:text-gray-100">Credit / Debit Card</span>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                  paymentMethod === 'paypal'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'paypal')}
                    className="form-radio"
                  />
                  <div className="ml-3 flex items-center">
                    <svg className="w-8 h-6 mr-2" viewBox="0 0 32 24">
                      <text x="0" y="16" fill="#003087" fontSize="12" fontWeight="bold">PayPal</text>
                    </svg>
                    <span className="font-medium text-gray-800 dark:text-gray-100">PayPal</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Card Details */}
            {paymentMethod === 'card' && (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Card Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                      className="form-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="form-input w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        required
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PayPal Info */}
            {paymentMethod === 'paypal' && (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  PayPal Payment
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You will be redirected to PayPal to complete your payment securely.
                </p>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> This is a demo. PayPal integration will be added in production.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Order Summary
            </h3>

            <div className="space-y-3 mb-6">
              {registrationData.selected_components.map((comp) => {
                const subtotal = (comp.price || 0) * comp.quantity
                return (
                  <div key={comp.component_id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        {comp.name}
                      </div>
                      {comp.quantity > 1 && (
                        <div className="text-xs text-gray-500">
                          ${(comp.price || 0).toFixed(2)} × {comp.quantity}
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-gray-800 dark:text-gray-100">
                      ${subtotal.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  ${registrationData.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Processing Fee</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  $0.00
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100">Total</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${registrationData.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={isProcessing}
              className="btn bg-violet-500 hover:bg-violet-600 text-white w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2 fill-current inline" viewBox="0 0 16 16">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14a6 6 0 110-12 6 6 0 010 12z" opacity="0.4" />
                    <path d="M14 8a6 6 0 01-6 6V8h6z" />
                  </svg>
                  Processing Payment...
                </>
              ) : (
                <>Pay ${registrationData.total_amount.toFixed(2)}</>
              )}
            </button>

            <div className="mt-6 space-y-2 text-xs text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure payment processing</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Your data is encrypted</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Instant confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
