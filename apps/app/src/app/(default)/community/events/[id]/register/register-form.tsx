'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerForEventAction } from '@/actions/registration'

interface EventComponent {
  id: string
  name: string
  description: string | null
  price: number | null
  capacity: number | null
  current_registrations: number | null
  is_required: boolean
}

interface Event {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  capacity: number | null
  event_components: EventComponent[]
}

interface User {
  id: string
  email: string
  full_name: string | null
}

interface Props {
  event: Event
  user: User
}

// Add fake items if no components exist
const getFakeComponents = (): EventComponent[] => {
  if (event.event_components.length > 0) {
    return event.event_components
  }

  // Return fake items for testing
  return [
    {
      id: 'fake-1',
      name: 'Event Ticket',
      description: 'General admission to the event',
      price: 50.00,
      capacity: null,
      current_registrations: null,
      is_required: true,
    },
    {
      id: 'fake-2',
      name: 'Lunch Package',
      description: 'Includes lunch and refreshments',
      price: 25.00,
      capacity: null,
      current_registrations: null,
      is_required: false,
    },
    {
      id: 'fake-3',
      name: 'Workshop Materials',
      description: 'Printed materials and workbook',
      price: 15.00,
      capacity: null,
      current_registrations: null,
      is_required: false,
    },
    {
      id: 'fake-4',
      name: 'Networking Session',
      description: 'Access to exclusive networking event',
      price: 30.00,
      capacity: 50,
      current_registrations: 12,
      is_required: false,
    },
    {
      id: 'fake-5',
      name: 'Certificate of Completion',
      description: 'Official certificate for attending',
      price: 0,
      capacity: null,
      current_registrations: null,
      is_required: false,
    },
  ]
}

export default function RegisterForm({ event, user }: Props) {
  const router = useRouter()
  const components = getFakeComponents()

  const [selectedComponents, setSelectedComponents] = useState<Record<string, boolean>>(
    // Pre-select all required components
    components.reduce((acc, comp) => {
      if (comp.is_required) {
        acc[comp.id] = true
      }
      return acc
    }, {} as Record<string, boolean>)
  )
  const [quantities, setQuantities] = useState<Record<string, number>>(
    // Default quantity of 1 for all components
    components.reduce((acc, comp) => {
      acc[comp.id] = 1
      return acc
    }, {} as Record<string, number>)
  )
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleComponent = (componentId: string, isRequired: boolean) => {
    if (isRequired) return // Can't deselect required components
    setSelectedComponents(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }))
  }

  const updateQuantity = (componentId: string, quantity: number) => {
    if (quantity < 1) return
    setQuantities(prev => ({
      ...prev,
      [componentId]: quantity
    }))
  }

  const calculateTotal = () => {
    return components.reduce((total, comp) => {
      if (selectedComponents[comp.id]) {
        const price = comp.price || 0
        const quantity = quantities[comp.id] || 1
        return total + (price * quantity)
      }
      return total
    }, 0)
  }

  const getSelectedComponentsList = () => {
    return components
      .filter(comp => selectedComponents[comp.id])
      .map(comp => ({
        component_id: comp.id,
        quantity: quantities[comp.id] || 1,
        price: comp.price,
        name: comp.name,
      }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const selectedList = getSelectedComponentsList()
      const total = calculateTotal()

      // Store registration data in sessionStorage for payment page
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        event_id: event.id,
        event_title: event.title,
        selected_components: selectedList,
        notes: notes || undefined,
        total_amount: total,
        user_email: user.email,
        user_name: user.full_name,
      }))

      // Redirect to payment page
      router.push(`/community/events/${event.id}/payment`)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Failed to proceed to payment')
      setIsSubmitting(false)
    }
  }

  const isCapacityExceeded = (component: EventComponent) => {
    if (!component.capacity) return false
    const current = component.current_registrations || 0
    return current >= component.capacity
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href={`/community/events/${event.id}`}
          className="text-sm text-violet-500 hover:text-violet-600 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Event
        </Link>
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
          Register for Event
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main registration form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            {/* Event Details Card */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                {event.title}
              </h2>
              {event.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{event.description}</p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{formatDate(event.start_date)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Your Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>{' '}
                  <span className="text-gray-800 dark:text-gray-100">{user.full_name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="text-gray-800 dark:text-gray-100">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Component Selection */}
            {components.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Select Add-ons & Items
                </h3>
                <div className="space-y-4">
                  {components.map((component) => {
                    const isExceeded = isCapacityExceeded(component)
                    const isSelected = selectedComponents[component.id]
                    const canDeselect = !component.is_required

                    return (
                      <div
                        key={component.id}
                        className={`border rounded-lg p-4 ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10'
                            : 'border-gray-200 dark:border-gray-700'
                        } ${isExceeded ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleComponent(component.id, component.is_required)}
                              disabled={component.is_required || isExceeded}
                              className="form-checkbox mt-1 mr-3"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-800 dark:text-gray-100">
                                  {component.name}
                                </h4>
                                {component.is_required && (
                                  <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded">
                                    Required
                                  </span>
                                )}
                                {isExceeded && (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                                    Sold Out
                                  </span>
                                )}
                              </div>
                              {component.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {component.description}
                                </p>
                              )}
                              {component.capacity && (
                                <p className="text-xs text-gray-500">
                                  {component.current_registrations || 0} / {component.capacity} registered
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            {component.price !== null && (
                              <div className="font-semibold text-gray-800 dark:text-gray-100">
                                ${component.price.toFixed(2)}
                              </div>
                            )}
                            {component.price === null && (
                              <div className="text-sm text-gray-500">Free</div>
                            )}
                            {isSelected && !isExceeded && (
                              <div className="mt-2">
                                <label className="text-xs text-gray-500 block mb-1">Qty</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={quantities[component.id]}
                                  onChange={(e) => updateQuantity(component.id, parseInt(e.target.value) || 1)}
                                  className="form-input w-20 text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Additional Notes (Optional)
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea w-full"
                rows={4}
                placeholder="Any special requests or dietary restrictions..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Registration Summary
            </h3>

            <div className="space-y-3 mb-6">
              {components
                .filter(comp => selectedComponents[comp.id])
                .map((comp) => {
                  const quantity = quantities[comp.id] || 1
                  const price = comp.price || 0
                  const subtotal = price * quantity

                  return (
                    <div key={comp.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {comp.name}
                        </div>
                        {quantity > 1 && (
                          <div className="text-xs text-gray-500">
                            ${price.toFixed(2)} × {quantity}
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
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100">Total</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Info (Placeholder) */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Payment will be processed in the next step.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || getSelectedComponentsList().length === 0}
              className="btn bg-violet-500 hover:bg-violet-600 text-white w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2 fill-current inline" viewBox="0 0 16 16">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14a6 6 0 110-12 6 6 0 010 12z" opacity="0.4" />
                    <path d="M14 8a6 6 0 01-6 6V8h6z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>Proceed to Payment</>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By registering, you agree to the event terms and conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
