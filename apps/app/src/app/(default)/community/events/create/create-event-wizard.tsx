'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { eventsAPI } from '@/lib/api/events'
import { createEventAction } from '@/actions/event'

interface EventComponent {
  id: string
  name: string
  description?: string
  price?: number | null
  capacity?: number | null
  is_required: boolean
  display_order: number
}

interface BudgetItem {
  id: string
  name: string
  type: 'lift' | 'accommodation' | 'food' | 'transport' | 'other'
  quantity: number
  unitCost: number
  paidBy: 'host' | 'pooled'
  refundable: boolean
}

interface JoinQuestion {
  id: string
  label: string
  type: 'single-select' | 'multi' | 'text'
  options?: string[]
}

interface EventFormData {
  // Step 1
  title: string
  category: string
  tags: string[]
  coverImage: File | null
  summary: string
  description: string

  // Step 2
  startDateTime: string
  endDateTime: string
  timezone: string
  destinationName: string
  address: string
  transportPlan: string
  transportNotes: string

  // Step 3
  capacity: number
  minGroupSize: number
  autoWaitlist: boolean
  joinType: 'instant' | 'approval'
  joinQuestions: JoinQuestion[]

  // Step 4
  costModel: 'equal-split' | 'fixed-ticket'
  splitCount: number
  budgetItems: BudgetItem[]
  depositPerPerson: number
  paymentSchedule: string
  ticketName: string
  ticketPrice: number
  ticketQuantity: number
  salesStart: string
  salesEnd: string
  eventComponents: EventComponent[]

  // Step 5
  difficulty: string
  requirements: string
  whatsIncluded: string[]
  whatsNotIncluded: string
  cancellationPolicy: string
  weatherContingency: string
  waiverRequired: boolean
  waiverLink: string
  iceRequired: boolean
  packingList: string
  accommodationDetails: string
  transportDetails: string
}

export default function CreateEventWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const totalSteps = 6

  const steps = [
    { number: 1, title: 'Basics', description: 'Event title, description, and details' },
    { number: 2, title: 'Schedule & Location', description: 'When and where' },
    { number: 3, title: 'Capacity & Join Rules', description: 'Who can join and how' },
    { number: 4, title: 'Cost & Split', description: 'Pricing and payment' },
    { number: 5, title: 'Safety & Policies', description: 'Requirements and guidelines' },
    { number: 6, title: 'Review & Publish', description: 'Final review' },
  ]

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    category: '',
    tags: [],
    coverImage: null,
    summary: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    destinationName: '',
    address: '',
    transportPlan: '',
    transportNotes: '',
    capacity: 10,
    minGroupSize: 0,
    autoWaitlist: false,
    joinType: 'instant',
    joinQuestions: [],
    costModel: 'equal-split',
    splitCount: 10,
    budgetItems: [],
    depositPerPerson: 0,
    paymentSchedule: 'pay-all-now',
    ticketName: 'General',
    ticketPrice: 0,
    ticketQuantity: 10,
    salesStart: '',
    salesEnd: '',
    eventComponents: [],
    difficulty: '',
    requirements: '',
    whatsIncluded: [],
    whatsNotIncluded: '',
    cancellationPolicy: '7-days-100',
    weatherContingency: '',
    waiverRequired: false,
    waiverLink: '',
    iceRequired: false,
    packingList: '',
    accommodationDetails: '',
    transportDetails: '',
  })

  // Autosave every 10 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setInterval(() => {
      handleSaveDraft()
    }, 10000)

    return () => clearInterval(timer)
  }, [hasUnsavedChanges, formData])

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }

  const handleSaveDraft = async () => {
    // TODO: Implement API call
    console.log('Saving draft...', formData)
    setHasUnsavedChanges(false)
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (formData.title.length > 80) newErrors.title = 'Title must be 80 characters or less'
      if (!formData.category) newErrors.category = 'Category is required'
      if (!formData.summary.trim()) newErrors.summary = 'Summary is required'
      if (formData.summary.length > 140) newErrors.summary = 'Summary must be 140 characters or less'
    }

    if (step === 2) {
      if (!formData.startDateTime) newErrors.startDateTime = 'Start date/time is required'
      if (!formData.endDateTime) newErrors.endDateTime = 'End date/time is required'
      if (formData.startDateTime && formData.endDateTime && new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
        newErrors.endDateTime = 'End time must be after start time'
      }
      if (!formData.address) newErrors.address = 'Address is required'
    }

    if (step === 3) {
      if (formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1'
      if (formData.minGroupSize > formData.capacity) {
        newErrors.minGroupSize = 'Minimum size cannot exceed capacity'
      }
    }

    if (step === 4) {
      if (formData.costModel === 'equal-split') {
        if (formData.budgetItems.length === 0) {
          newErrors.budgetItems = 'Add at least one budget item'
        }
      } else {
        if (formData.ticketPrice <= 0) {
          newErrors.ticketPrice = 'Ticket price must be greater than 0'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
        window.scrollTo(0, 0)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const goToStep = (step: number) => {
    if (step <= currentStep || validateStep(currentStep)) {
      setCurrentStep(step)
      window.scrollTo(0, 0)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData({ tags: [...formData.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    updateFormData({ tags: formData.tags.filter(t => t !== tag) })
  }

  const addBudgetItem = () => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      name: '',
      type: 'other',
      quantity: 1,
      unitCost: 0,
      paidBy: 'pooled',
      refundable: true,
    }
    updateFormData({ budgetItems: [...formData.budgetItems, newItem] })
  }

  const updateBudgetItem = (id: string, updates: Partial<BudgetItem>) => {
    updateFormData({
      budgetItems: formData.budgetItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    })
  }

  const removeBudgetItem = (id: string) => {
    updateFormData({ budgetItems: formData.budgetItems.filter(item => item.id !== id) })
  }

  const addJoinQuestion = () => {
    const newQuestion: JoinQuestion = {
      id: Date.now().toString(),
      label: '',
      type: 'text',
    }
    updateFormData({ joinQuestions: [...formData.joinQuestions, newQuestion] })
  }

  const updateJoinQuestion = (id: string, updates: Partial<JoinQuestion>) => {
    updateFormData({
      joinQuestions: formData.joinQuestions.map(q =>
        q.id === id ? { ...q, ...updates } : q
      )
    })
  }

  const removeJoinQuestion = (id: string) => {
    updateFormData({ joinQuestions: formData.joinQuestions.filter(q => q.id !== id) })
  }

  // Load default component templates when category changes
  const loadDefaultComponents = async (category: string) => {
    if (!category) return

    try {
      // TODO: Implement component templates API endpoint
      // For now, we'll skip auto-loading components
      console.log('Component templates not yet implemented for category:', category)
    } catch (error) {
      console.error('Error loading component templates:', error)
    }
  }

  const addEventComponent = () => {
    const newComponent: EventComponent = {
      id: `temp-${Date.now()}`,
      name: '',
      description: undefined,
      price: null,
      capacity: null,
      is_required: false,
      display_order: formData.eventComponents.length,
    }
    updateFormData({ eventComponents: [...formData.eventComponents, newComponent] })
  }

  const updateEventComponent = (id: string, updates: Partial<EventComponent>) => {
    updateFormData({
      eventComponents: formData.eventComponents.map(comp =>
        comp.id === id ? { ...comp, ...updates } : comp
      )
    })
  }

  const removeEventComponent = (id: string) => {
    updateFormData({ eventComponents: formData.eventComponents.filter(comp => comp.id !== id) })
  }

  const calculateEqualSplitEstimate = () => {
    const subtotal = formData.budgetItems.reduce((sum, item) =>
      sum + (item.quantity * item.unitCost), 0
    )
    const perPerson = formData.splitCount > 0 ? subtotal / formData.splitCount : 0
    const platformFee = perPerson * 0.05 // 5% example
    const processorFee = perPerson * 0.029 + 0.30 // Stripe example
    const total = perPerson + platformFee + processorFee

    return { subtotal, perPerson, platformFee, processorFee, total }
  }

  const handlePublish = async () => {
    if (!validateStep(6)) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Convert form data to match the API schema
      const result = await createEventAction({
        title: formData.title,
        description: formData.description || undefined,
        start_date: new Date(formData.startDateTime).toISOString(),
        end_date: formData.endDateTime ? new Date(formData.endDateTime).toISOString() : undefined,
        location: formData.address || undefined,
        capacity: formData.capacity || undefined,
        category: formData.category || undefined,
        components: formData.eventComponents.map(comp => ({
          name: comp.name,
          description: comp.description,
          price: comp.price,
          capacity: comp.capacity,
          is_required: comp.is_required,
          display_order: comp.display_order,
        })),
      })

      if (result?.serverError) {
        setSubmitError(result.serverError)
        setIsSubmitting(false)
        return
      }

      if (result?.data) {
        // Success! Clear unsaved changes flag and redirect
        setHasUnsavedChanges(false)
        router.push('/community/events')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to create event')
      setIsSubmitting(false)
    }
  }

  const includedOptions = [
    'Equipment rental',
    'Lift tickets',
    'Meals',
    'Accommodation',
    'Transportation',
    'Guide/Instructor',
    'Insurance',
  ]

  const toggleIncluded = (option: string) => {
    const current = formData.whatsIncluded
    if (current.includes(option)) {
      updateFormData({ whatsIncluded: current.filter(o => o !== option) })
    } else {
      updateFormData({ whatsIncluded: [...current, option] })
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Page content */}
      <div className="max-w-5xl mx-auto">

        {/* Back button */}
        <div className="mb-6">
          <Link className="btn-sm px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300" href="/community/events">
            <svg className="fill-current text-gray-400 dark:text-gray-500 mr-2" width="7" height="12" viewBox="0 0 7 12">
              <path d="M5.4.6 6.8 2l-4 4 4 4-1.4 1.4L0 6z" />
            </svg>
            <span>Back To Events</span>
          </Link>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-2">Create New Event</h1>
          <p>Follow the steps below to create your event and start inviting attendees.</p>
        </header>

        {/* Horizontal stepper - Desktop */}
        <div className="hidden lg:block mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  onClick={() => goToStep(step.number)}
                  className="flex flex-col items-center"
                  disabled={step.number > currentStep}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                      currentStep === step.number
                        ? 'bg-violet-500 text-white'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
                        <path d="M6 11.5L2.5 8 4 6.5l2 2 4.5-4.5L12 5.5z" />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-center text-gray-800 dark:text-gray-100">
                    {step.title}
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left sidebar - Vertical stepper - Mobile/Tablet */}
          <div className="lg:hidden">
            <div className="bg-white dark:bg-gray-800 p-5 shadow-sm rounded-xl">
              <h2 className="text-sm text-gray-800 dark:text-gray-100 font-semibold mb-4">Progress</h2>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <button
                    key={step.number}
                    onClick={() => goToStep(step.number)}
                    disabled={step.number > currentStep}
                    className={`w-full text-left transition ${
                      currentStep === step.number ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                          currentStep === step.number
                            ? 'bg-violet-500 text-white'
                            : currentStep > step.number
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {currentStep > step.number ? (
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                            <path d="M6 11.5L2.5 8 4 6.5l2 2 4.5-4.5L12 5.5z" />
                          </svg>
                        ) : (
                          <span className="text-sm font-semibold">{step.number}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {step.description}
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="ml-4 mt-2 mb-0 h-6 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 p-5 shadow-sm rounded-xl">

              {/* Step header */}
              <div className="mb-6">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Step {currentStep} of {totalSteps}
                </div>
                <h2 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-2">
                  {steps[currentStep - 1]?.title}
                </h2>
                <p className="text-sm">
                  {steps[currentStep - 1]?.description}
                </p>
              </div>

              {/* Error summary */}
              {Object.keys(errors).length > 0 && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Please fix the following errors:</h3>
                  <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                    {Object.values(errors).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 1 - Basics */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Event Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={formData.title}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                      className={`form-input w-full ${errors.title ? 'border-red-300' : ''}`}
                      placeholder="e.g., Whistler Ski Weekend 2024"
                      aria-label="Event title"
                      aria-invalid={!!errors.title}
                      aria-describedby={errors.title ? 'title-error' : undefined}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.title && <span id="title-error" className="text-sm text-red-600 dark:text-red-400">{errors.title}</span>}
                      <span className="text-xs text-gray-500 ml-auto">{formData.title.length}/80</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const newCategory = e.target.value
                        updateFormData({ category: newCategory })
                        // Load default components for this category
                        if (newCategory && formData.eventComponents.length === 0) {
                          loadDefaultComponents(newCategory)
                        }
                      }}
                      className={`form-select w-full ${errors.category ? 'border-red-300' : ''}`}
                      aria-label="Event category"
                      aria-invalid={!!errors.category}
                    >
                      <option value="">Select a category</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="ski-snow">Ski & Snow</option>
                      <option value="skating">Skating</option>
                      <option value="hiking">Hiking</option>
                      <option value="games">Games</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.category && <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">{errors.category}</span>}
                    {formData.category && formData.eventComponents.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ✓ Default components loaded for this category (you can customize them in Step 4)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="form-input flex-1"
                        placeholder="Add tags (press Enter)"
                        aria-label="Add tag"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-violet-500 hover:text-violet-700"
                            aria-label={`Remove ${tag} tag`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Cover Image (16:9 aspect ratio)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-600 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateFormData({ coverImage: e.target.files?.[0] || null })}
                        className="hidden"
                        id="cover-image"
                        aria-label="Upload cover image"
                      />
                      <label htmlFor="cover-image" className="cursor-pointer">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formData.coverImage ? formData.coverImage.name : 'Drop your image here, or browse'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG (16:9 ratio recommended)</p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Short Summary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={140}
                      value={formData.summary}
                      onChange={(e) => updateFormData({ summary: e.target.value })}
                      className={`form-input w-full ${errors.summary ? 'border-red-300' : ''}`}
                      placeholder="A quick description for previews"
                      aria-label="Event summary"
                      aria-invalid={!!errors.summary}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.summary && <span className="text-sm text-red-600 dark:text-red-400">{errors.summary}</span>}
                      <span className="text-xs text-gray-500 ml-auto">{formData.summary.length}/140</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Detailed Description / Itinerary
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      className="form-textarea w-full"
                      rows={8}
                      placeholder="Describe the event in detail, include the itinerary, what to expect..."
                      aria-label="Event description"
                    />
                  </div>
                </div>
              )}

              {/* Step 2 - Schedule & Location */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDateTime}
                        onChange={(e) => updateFormData({ startDateTime: e.target.value })}
                        className={`form-input w-full ${errors.startDateTime ? 'border-red-300' : ''}`}
                        aria-label="Start date and time"
                        aria-invalid={!!errors.startDateTime}
                      />
                      {errors.startDateTime && <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">{errors.startDateTime}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                        End Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDateTime}
                        onChange={(e) => updateFormData({ endDateTime: e.target.value })}
                        className={`form-input w-full ${errors.endDateTime ? 'border-red-300' : ''}`}
                        aria-label="End date and time"
                        aria-invalid={!!errors.endDateTime}
                      />
                      {errors.endDateTime && <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">{errors.endDateTime}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={formData.timezone}
                      onChange={(e) => updateFormData({ timezone: e.target.value })}
                      className="form-input w-full"
                      placeholder="Auto-detected from location"
                      aria-label="Timezone"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Destination Name
                    </label>
                    <input
                      type="text"
                      value={formData.destinationName}
                      onChange={(e) => updateFormData({ destinationName: e.target.value })}
                      className="form-input w-full"
                      placeholder="e.g., Whistler, BC"
                      aria-label="Destination name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Meeting Point / Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateFormData({ address: e.target.value })}
                      className={`form-input w-full ${errors.address ? 'border-red-300' : ''}`}
                      placeholder="Full address or meeting location"
                      aria-label="Meeting point address"
                      aria-invalid={!!errors.address}
                    />
                    {errors.address && <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">{errors.address}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Transport Plan
                    </label>
                    <select
                      value={formData.transportPlan}
                      onChange={(e) => updateFormData({ transportPlan: e.target.value })}
                      className="form-select w-full"
                      aria-label="Transport plan"
                    >
                      <option value="">Select transport option</option>
                      <option value="carpool">Carpool</option>
                      <option value="transit">Public Transit</option>
                      <option value="own-ride">Own Ride</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Transport Notes (Optional)
                    </label>
                    <textarea
                      value={formData.transportNotes}
                      onChange={(e) => updateFormData({ transportNotes: e.target.value })}
                      className="form-textarea w-full"
                      rows={3}
                      placeholder="Additional details about transportation"
                      aria-label="Transport notes"
                    />
                  </div>
                </div>
              )}

              {/* Step 3 - Capacity & Join Rules */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                        Capacity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => updateFormData({ capacity: parseInt(e.target.value) || 0, splitCount: parseInt(e.target.value) || 0, ticketQuantity: parseInt(e.target.value) || 0 })}
                        className={`form-input w-full ${errors.capacity ? 'border-red-300' : ''}`}
                        aria-label="Event capacity"
                        aria-invalid={!!errors.capacity}
                      />
                      {errors.capacity && <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">{errors.capacity}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                        Minimum Group Size (Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minGroupSize}
                        onChange={(e) => updateFormData({ minGroupSize: parseInt(e.target.value) || 0 })}
                        className={`form-input w-full ${errors.minGroupSize ? 'border-red-300' : ''}`}
                        aria-label="Minimum group size"
                        aria-invalid={!!errors.minGroupSize}
                      />
                      {errors.minGroupSize && <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">{errors.minGroupSize}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.autoWaitlist}
                        onChange={(e) => updateFormData({ autoWaitlist: e.target.checked })}
                        className="form-checkbox"
                        aria-label="Enable automatic waitlist"
                      />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        Enable automatic waitlist when full
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">
                      Join Type <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                        <input
                          type="radio"
                          name="joinType"
                          value="instant"
                          checked={formData.joinType === 'instant'}
                          onChange={(e) => updateFormData({ joinType: e.target.value as 'instant' | 'approval' })}
                          className="form-radio mt-0.5"
                          aria-label="Instant confirmation"
                        />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">Instant Confirmation</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Participants can join immediately</div>
                        </div>
                      </label>
                      <label className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                        <input
                          type="radio"
                          name="joinType"
                          value="approval"
                          checked={formData.joinType === 'approval'}
                          onChange={(e) => updateFormData({ joinType: e.target.value as 'instant' | 'approval' })}
                          className="form-radio mt-0.5"
                          aria-label="Host approval required"
                        />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">Host Approval Required</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">You'll review and approve each request</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-100">
                        Join Questions (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={addJoinQuestion}
                        className="text-sm text-violet-500 hover:text-violet-600 font-medium"
                      >
                        + Add Question
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.joinQuestions.map((question) => (
                        <div key={question.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex gap-3 mb-3">
                            <input
                              type="text"
                              value={question.label}
                              onChange={(e) => updateJoinQuestion(question.id, { label: e.target.value })}
                              className="form-input flex-1"
                              placeholder="Question label"
                              aria-label="Question label"
                            />
                            <button
                              type="button"
                              onClick={() => removeJoinQuestion(question.id)}
                              className="text-red-500 hover:text-red-700"
                              aria-label="Remove question"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          <select
                            value={question.type}
                            onChange={(e) => updateJoinQuestion(question.id, { type: e.target.value as JoinQuestion['type'] })}
                            className="form-select w-full"
                            aria-label="Question type"
                          >
                            <option value="text">Text Response</option>
                            <option value="single-select">Single Select</option>
                            <option value="multi">Multiple Choice</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 - Cost & Split */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">
                      Cost Model <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="relative block cursor-pointer">
                        <input
                          type="radio"
                          name="costModel"
                          value="equal-split"
                          checked={formData.costModel === 'equal-split'}
                          onChange={(e) => updateFormData({ costModel: e.target.value as 'equal-split' | 'fixed-ticket' })}
                          className="peer sr-only"
                        />
                        <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg peer-checked:border-violet-500 peer-checked:bg-violet-50 dark:peer-checked:bg-violet-900/20 transition">
                          <div className="font-medium text-gray-800 dark:text-gray-100 mb-1">Equal Split</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Share costs evenly</div>
                        </div>
                      </label>
                      <label className="relative block cursor-pointer">
                        <input
                          type="radio"
                          name="costModel"
                          value="fixed-ticket"
                          checked={formData.costModel === 'fixed-ticket'}
                          onChange={(e) => updateFormData({ costModel: e.target.value as 'equal-split' | 'fixed-ticket' })}
                          className="peer sr-only"
                        />
                        <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg peer-checked:border-violet-500 peer-checked:bg-violet-50 dark:peer-checked:bg-violet-900/20 transition">
                          <div className="font-medium text-gray-800 dark:text-gray-100 mb-1">Fixed Ticket</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Set ticket price</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {formData.costModel === 'equal-split' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                          Split Participant Count
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.splitCount}
                          onChange={(e) => updateFormData({ splitCount: parseInt(e.target.value) || 0 })}
                          className="form-input w-full"
                          aria-label="Split participant count"
                        />
                        {formData.splitCount !== formData.capacity && (
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                            ⚠️ Split count differs from capacity. Per-person cost will be based on {formData.splitCount} people.
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-800 dark:text-gray-100">
                            Budget Items <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={addBudgetItem}
                            className="text-sm text-violet-500 hover:text-violet-600 font-medium"
                          >
                            + Add Item
                          </button>
                        </div>
                        {errors.budgetItems && <span className="text-sm text-red-600 dark:text-red-400 mb-3 block">{errors.budgetItems}</span>}
                        <div className="space-y-3">
                          {formData.budgetItems.map((item) => (
                            <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateBudgetItem(item.id, { name: e.target.value })}
                                  className="form-input"
                                  placeholder="Item name"
                                  aria-label="Budget item name"
                                />
                                <select
                                  value={item.type}
                                  onChange={(e) => updateBudgetItem(item.id, { type: e.target.value as BudgetItem['type'] })}
                                  className="form-select"
                                  aria-label="Budget item type"
                                >
                                  <option value="lift">Lift Ticket</option>
                                  <option value="accommodation">Accommodation</option>
                                  <option value="food">Food</option>
                                  <option value="transport">Transport</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateBudgetItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                                    className="form-input w-full"
                                    placeholder="Qty"
                                    aria-label="Quantity"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unitCost}
                                    onChange={(e) => updateBudgetItem(item.id, { unitCost: parseFloat(e.target.value) || 0 })}
                                    className="form-input w-full"
                                    placeholder="$0.00"
                                    aria-label="Unit cost"
                                  />
                                </div>
                                <select
                                  value={item.paidBy}
                                  onChange={(e) => updateBudgetItem(item.id, { paidBy: e.target.value as 'host' | 'pooled' })}
                                  className="form-select"
                                  aria-label="Paid by"
                                >
                                  <option value="pooled">Pooled</option>
                                  <option value="host">Host Upfront</option>
                                </select>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center text-sm">
                                    <input
                                      type="checkbox"
                                      checked={item.refundable}
                                      onChange={(e) => updateBudgetItem(item.id, { refundable: e.target.checked })}
                                      className="form-checkbox mr-1"
                                      aria-label="Refundable"
                                    />
                                    Refund
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removeBudgetItem(item.id)}
                                    className="text-red-500 hover:text-red-700 ml-auto"
                                    aria-label="Remove budget item"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                            Deposit Per Person (Optional)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.depositPerPerson}
                            onChange={(e) => updateFormData({ depositPerPerson: parseFloat(e.target.value) || 0 })}
                            className="form-input w-full"
                            placeholder="$0.00"
                            aria-label="Deposit per person"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                            Payment Schedule
                          </label>
                          <select
                            value={formData.paymentSchedule}
                            onChange={(e) => updateFormData({ paymentSchedule: e.target.value })}
                            className="form-select w-full"
                            aria-label="Payment schedule"
                          >
                            <option value="pay-all-now">Pay All Now</option>
                            <option value="deposit-now">Deposit Now + Settle Later</option>
                            <option value="settle-after">Settle After Event</option>
                          </select>
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      {formData.budgetItems.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            Per-Person Cost Estimate
                          </h3>
                          <div className="space-y-2 text-sm">
                            {(() => {
                              const estimate = calculateEqualSplitEstimate()
                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal eligible:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-100">${estimate.subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Per-person share:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-100">${estimate.perPerson.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Platform fee (5%):</span>
                                    <span className="text-gray-600 dark:text-gray-400">${estimate.platformFee.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Processor fee:</span>
                                    <span className="text-gray-600 dark:text-gray-400">${estimate.processorFee.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-semibold text-gray-800 dark:text-gray-100">Total per person:</span>
                                    <span className="font-bold text-gray-900 dark:text-gray-100">${estimate.total.toFixed(2)}</span>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                            Ticket Name
                          </label>
                          <input
                            type="text"
                            value={formData.ticketName}
                            onChange={(e) => updateFormData({ ticketName: e.target.value })}
                            className="form-input w-full"
                            placeholder="General Admission"
                            aria-label="Ticket name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                            Ticket Price <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.ticketPrice}
                            onChange={(e) => updateFormData({ ticketPrice: parseFloat(e.target.value) || 0 })}
                            className={`form-input w-full ${errors.ticketPrice ? 'border-red-300' : ''}`}
                            placeholder="$0.00"
                            aria-label="Ticket price"
                            aria-invalid={!!errors.ticketPrice}
                          />
                          {errors.ticketPrice && <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">{errors.ticketPrice}</span>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                          Quantity Available
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.ticketQuantity}
                          onChange={(e) => updateFormData({ ticketQuantity: parseInt(e.target.value) || 0 })}
                          className="form-input w-full"
                          aria-label="Ticket quantity"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                            Sales Start (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.salesStart}
                            onChange={(e) => updateFormData({ salesStart: e.target.value })}
                            className="form-input w-full"
                            aria-label="Sales start time"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                            Sales End (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.salesEnd}
                            onChange={(e) => updateFormData({ salesEnd: e.target.value })}
                            className="form-input w-full"
                            aria-label="Sales end time"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Event Components Section */}
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Event Components</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Add components like tickets, rentals, meals, etc. that attendees can register for
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addEventComponent}
                        className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800"
                      >
                        + Add Component
                      </button>
                    </div>

                    {formData.eventComponents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No components added yet. Components will be auto-loaded when you select a category in Step 1, or you can add them manually.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.eventComponents.map((component) => (
                          <div key={component.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Component Name *
                                </label>
                                <input
                                  type="text"
                                  value={component.name}
                                  onChange={(e) => updateEventComponent(component.id, { name: e.target.value })}
                                  className="form-input w-full"
                                  placeholder="e.g., Lift Ticket, Equipment Rental"
                                  aria-label="Component name"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Price (optional)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={component.price || ''}
                                  onChange={(e) => updateEventComponent(component.id, { price: e.target.value ? parseFloat(e.target.value) : null })}
                                  className="form-input w-full"
                                  placeholder="$0.00"
                                  aria-label="Component price"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Capacity (optional)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={component.capacity || ''}
                                  onChange={(e) => updateEventComponent(component.id, { capacity: e.target.value ? parseInt(e.target.value) : null })}
                                  className="form-input w-full"
                                  placeholder="Unlimited"
                                  aria-label="Component capacity"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center text-sm">
                                  <input
                                    type="checkbox"
                                    checked={component.is_required}
                                    onChange={(e) => updateEventComponent(component.id, { is_required: e.target.checked })}
                                    className="form-checkbox mr-2"
                                    aria-label="Required component"
                                  />
                                  Required for all attendees
                                </label>
                              </div>
                              <div className="flex items-end justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeEventComponent(component.id)}
                                  className="text-red-500 hover:text-red-700"
                                  aria-label="Remove component"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description (optional)
                              </label>
                              <textarea
                                value={component.description || ''}
                                onChange={(e) => updateEventComponent(component.id, { description: e.target.value })}
                                className="form-textarea w-full"
                                rows={2}
                                placeholder="Additional details about this component..."
                                aria-label="Component description"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5 - Safety & Policies */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => updateFormData({ difficulty: e.target.value })}
                      className="form-select w-full"
                      aria-label="Difficulty level"
                    >
                      <option value="">Select difficulty</option>
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Requirements (Skills, Equipment, Fitness)
                    </label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => updateFormData({ requirements: e.target.value })}
                      className="form-textarea w-full"
                      rows={4}
                      placeholder="List any prerequisites, required skills, or equipment participants need..."
                      aria-label="Event requirements"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">
                      What's Included
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {includedOptions.map(option => (
                        <label key={option} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.whatsIncluded.includes(option)}
                            onChange={() => toggleIncluded(option)}
                            className="form-checkbox"
                            aria-label={`Include ${option}`}
                          />
                          <span className="text-sm text-gray-800 dark:text-gray-100">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      What's NOT Included
                    </label>
                    <textarea
                      value={formData.whatsNotIncluded}
                      onChange={(e) => updateFormData({ whatsNotIncluded: e.target.value })}
                      className="form-textarea w-full"
                      rows={3}
                      placeholder="List what participants need to bring or pay for separately..."
                      aria-label="What's not included"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Cancellation Policy
                    </label>
                    <select
                      value={formData.cancellationPolicy}
                      onChange={(e) => updateFormData({ cancellationPolicy: e.target.value })}
                      className="form-select w-full"
                      aria-label="Cancellation policy"
                    >
                      <option value="7-days-100">7+ days: 100% refund</option>
                      <option value="48h-50">48h: 50% refund</option>
                      <option value="24h-none">&lt;24h: No refund</option>
                      <option value="custom">Custom Policy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Weather / Contingency Plan
                    </label>
                    <textarea
                      value={formData.weatherContingency}
                      onChange={(e) => updateFormData({ weatherContingency: e.target.value })}
                      className="form-textarea w-full"
                      rows={3}
                      placeholder="What happens in bad weather or if event needs to be rescheduled..."
                      aria-label="Weather contingency plan"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.waiverRequired}
                        onChange={(e) => updateFormData({ waiverRequired: e.target.checked })}
                        className="form-checkbox"
                        aria-label="Require waiver"
                      />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        Require liability waiver
                      </span>
                    </label>

                    {formData.waiverRequired && (
                      <input
                        type="url"
                        value={formData.waiverLink}
                        onChange={(e) => updateFormData({ waiverLink: e.target.value })}
                        className="form-input w-full ml-8"
                        placeholder="Link to waiver document"
                        aria-label="Waiver link"
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.iceRequired}
                        onChange={(e) => updateFormData({ iceRequired: e.target.checked })}
                        className="form-checkbox"
                        aria-label="Require emergency contact"
                      />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        Require emergency contact (ICE) from participants
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Packing List
                    </label>
                    <textarea
                      value={formData.packingList}
                      onChange={(e) => updateFormData({ packingList: e.target.value })}
                      className="form-textarea w-full"
                      rows={4}
                      placeholder="What participants should bring (clothing, gear, personal items)..."
                      aria-label="Packing list"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Accommodation Details (Optional)
                    </label>
                    <textarea
                      value={formData.accommodationDetails}
                      onChange={(e) => updateFormData({ accommodationDetails: e.target.value })}
                      className="form-textarea w-full"
                      rows={3}
                      placeholder="Address, check-in/out times, rooming arrangements..."
                      aria-label="Accommodation details"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                      Transport Details (Optional)
                    </label>
                    <textarea
                      value={formData.transportDetails}
                      onChange={(e) => updateFormData({ transportDetails: e.target.value })}
                      className="form-textarea w-full"
                      rows={3}
                      placeholder="Carpool slots, gas/parking split rules..."
                      aria-label="Transport details"
                    />
                  </div>
                </div>
              )}

              {/* Step 6 - Review & Publish */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  {/* Submit Error */}
                  {submitError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Error creating event:</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
                    </div>
                  )}

                  {/* Summary Cards */}
                  <div className="space-y-4">
                    {/* Basics */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Event Basics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Title:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.title || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Category:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.category || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tags:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.tags.join(', ') || 'None'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Schedule & Location</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Start:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.startDateTime ? new Date(formData.startDateTime).toLocaleString() : 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">End:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.endDateTime ? new Date(formData.endDateTime).toLocaleString() : 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.destinationName || formData.address || 'Not set'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Capacity & Join</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.capacity} people</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Join Type:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.joinType === 'instant' ? 'Instant Confirmation' : 'Host Approval'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Cost</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Model:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.costModel === 'equal-split' ? 'Equal Split' : 'Fixed Ticket'}</span>
                        </div>
                        {formData.costModel === 'equal-split' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Budget Items:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-100">{formData.budgetItems.length} items</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Est. per person:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-100">${calculateEqualSplitEstimate().total.toFixed(2)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Ticket Price:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-100">${formData.ticketPrice.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Safety */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Safety & Policies</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.difficulty || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Waiver:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.waiverRequired ? 'Required' : 'Not required'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Emergency Contact:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{formData.iceRequired ? 'Required' : 'Not required'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        className="form-checkbox mt-0.5"
                        required
                        aria-label="Confirm details"
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-100">
                        I confirm that all details are accurate and I agree to the refund policy and platform terms.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <hr className="my-6 border-t border-gray-100 dark:border-gray-700/60" />

              {/* Navigation buttons */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`btn border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 ${
                    currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label="Go to previous step"
                >
                  <svg className="fill-current text-gray-400 dark:text-gray-500 mr-2" width="7" height="12" viewBox="0 0 7 12">
                    <path d="M5.4.6 6.8 2l-4 4 4 4-1.4 1.4L0 6z" />
                  </svg>
                  Back
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="btn border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300"
                    aria-label="Save as draft"
                  >
                    Save Draft
                  </button>

                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
                      aria-label="Go to next step"
                    >
                      <span>Next</span>
                      <svg className="fill-current text-gray-400 dark:text-gray-500 ml-2 rotate-180" width="7" height="12" viewBox="0 0 7 12">
                        <path d="M5.4.6 6.8 2l-4 4 4 4-1.4 1.4L0 6z" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isSubmitting}
                      className={`btn bg-violet-500 hover:bg-violet-600 text-white ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label="Publish event"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin w-4 h-4 mr-2 fill-current" viewBox="0 0 16 16">
                            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14a6 6 0 110-12 6 6 0 010 12z" opacity="0.4" />
                            <path d="M14 8a6 6 0 01-6 6V8h6z" />
                          </svg>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 16 16">
                            <path d="M6 11.5L2.5 8 4 6.5l2 2 4.5-4.5L12 5.5z" />
                          </svg>
                          Publish Event
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
