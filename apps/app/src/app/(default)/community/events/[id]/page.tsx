import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getEventWithComponents, checkUserRegistration } from '@v1/supabase/queries'
import { getUser } from '@v1/supabase/queries'
import EventImage from '@/../public/images/meetup-image.jpg'
import EventPhoto01 from '@/../public/images/meetup-photo-01.jpg'
import EventPhoto02 from '@/../public/images/meetup-photo-02.jpg'
import EventPhoto03 from '@/../public/images/meetup-photo-03.jpg'
import UserImage07 from '@/../public/images/user-32-07.jpg'
import UserImage08 from '@/../public/images/user-32-08.jpg'
import UserImage02 from '@/../public/images/user-32-02.jpg'
import UserImage01 from '@/../public/images/user-32-01.jpg'
import UserImage03 from '@/../public/images/user-32-03.jpg'
import UserImage05 from '@/../public/images/user-32-05.jpg'
import UserImage04 from '@/../public/images/user-32-04.jpg'
import UserImage06 from '@/../public/images/user-32-06.jpg'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: event } = await getEventWithComponents(params.id)

  return {
    title: event ? `${event.title} - Mosaic` : 'Event - Mosaic',
    description: event?.description || 'View event details',
  }
}

export default async function EventPage({ params, searchParams }: {
  params: { id: string },
  searchParams: { registered?: string }
}) {
  const { id } = params
  const { data: event, error } = await getEventWithComponents(id)

  if (error || !event) {
    notFound()
  }

  // Check if user is authenticated
  const { data: userData } = await getUser()
  const user = userData?.user

  // Check if user already registered
  let existingRegistration = null
  if (user) {
    const { data: registration } = await checkUserRegistration(id, user.id)
    existingRegistration = registration
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
    return date.toLocaleDateString('en-US', options)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDateRange = () => {
    if (!event.start_date) return 'Date TBA'

    const startDate = formatDate(event.start_date)
    const startTime = formatTime(event.start_date)
    const endTime = event.end_date ? formatTime(event.end_date) : ''

    return endTime
      ? `${startDate} - ${startTime} → ${endTime}`
      : `${startDate} - ${startTime}`
  }

  const calculateTotalPrice = () => {
    if (!event.event_components || event.event_components.length === 0) {
      return 0
    }
    return event.event_components.reduce((sum, comp) => {
      if (comp.is_required && comp.price) {
        return sum + comp.price
      }
      return sum
    }, 0)
  }

  const totalPrice = calculateTotalPrice()
  const isFree = totalPrice === 0

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Success message */}
      {searchParams.registered === 'true' && (
        <div className="max-w-5xl mx-auto mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ Registration successful! You're all set for this event.
          </p>
        </div>
      )}

      {/* Page content */}
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:space-x-8 xl:space-x-16">
        {/* Content */}
        <div>
          <div className="mb-6">
            <Link className="btn-sm px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300" href="/community/events">
              <svg className="fill-current text-gray-400 dark:text-gray-500 mr-2" width="7" height="12" viewBox="0 0 7 12">
                <path d="M5.4.6 6.8 2l-4 4 4 4-1.4 1.4L0 6z" />
              </svg>
              <span>Back To Events</span>
            </Link>
          </div>
          <div className="text-sm font-semibold text-violet-500 uppercase mb-2">{formatDateRange()}</div>
          <header className="mb-4">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-2">{event.title}</h1>
            <p>{event.description || 'Join us for an amazing event!'}</p>
          </header>

          {/* Meta */}
          <div className="space-y-3 sm:flex sm:items-center sm:justify-between sm:space-y-0 mb-6">
            {/* Author */}
            <div className="flex items-center sm:mr-4">
              <a className="block mr-2 shrink-0" href="#0">
                <Image className="rounded-full" src={UserImage07} width={32} height={32} alt="Host" />
              </a>
              <div className="text-sm whitespace-nowrap">
                Hosted by{' '}
                <a className="font-semibold text-gray-800 dark:text-gray-100" href="#0">
                  Event Organizer
                </a>
              </div>
            </div>
            {/* Right side */}
            <div className="flex flex-wrap items-center sm:justify-end space-x-2">
              {/* Tags */}
              {event.location && (
                <div className="text-xs inline-flex items-center font-medium border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-400 rounded-full text-center px-2.5 py-1">
                  <svg className="w-4 h-4 fill-gray-400 dark:fill-gray-500 mr-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              )}
              {event.category && (
                <div className="text-xs inline-flex items-center font-medium border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-400 rounded-full text-center px-2.5 py-1">
                  <span>{event.category}</span>
                </div>
              )}
              {isFree && (
                <div className="text-xs inline-flex font-medium uppercase bg-green-500/20 text-green-700 rounded-full text-center px-2.5 py-1">
                  Free
                </div>
              )}
            </div>
          </div>

          {/* Image */}
          <figure className="mb-6">
            <Image className="w-full rounded-xs" src={EventImage} width={640} height={360} alt="Event" />
          </figure>

          {/* Post content */}
          <div>
            <h2 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-2">Event Details</h2>
            <div className="mb-6 whitespace-pre-wrap">
              {event.description || 'No additional details provided for this event.'}
            </div>

            {/* Event Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-100">When</div>
                  <div>{formatDateRange()}</div>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-100">Where</div>
                    <div>{event.location}</div>
                  </div>
                </div>
              )}

              {event.capacity && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-100">Capacity</div>
                    <div>{event.capacity} people</div>
                  </div>
                </div>
              )}
            </div>

            {/* What's Included */}
            {event.event_components && event.event_components.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">What's Included</h3>
                <div className="space-y-2">
                  {event.event_components.map((component) => (
                    <div key={component.id} className="flex items-start justify-between py-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 dark:text-gray-100">{component.name}</span>
                          {component.is_required && (
                            <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        {component.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {component.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        {component.price !== null && component.price > 0 ? (
                          <span className="font-semibold text-gray-800 dark:text-gray-100">
                            ${component.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-green-600 dark:text-green-400">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <hr className="my-6 border-t border-gray-100 dark:border-gray-700/60" />

          {/* Photos */}
          <div>
            <h2 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-2">Photos (3)</h2>
            <div className="grid grid-cols-3 gap-4 my-6">
              <a className="block" href="#0">
                <Image className="w-full rounded-xs" src={EventPhoto01} width={203} height={152} alt="Event photo 01" />
              </a>
              <a className="block" href="#0">
                <Image className="w-full rounded-xs" src={EventPhoto02} width={203} height={152} alt="Event photo 02" />
              </a>
              <a className="block" href="#0">
                <Image className="w-full rounded-xs" src={EventPhoto03} width={203} height={152} alt="Event photo 03" />
              </a>
            </div>
          </div>

          <hr className="my-6 border-t border-gray-100 dark:border-gray-700/60" />

          {/* Comments */}
          <div>
            <h2 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-2">Comments (3)</h2>
            <ul className="space-y-5 my-6">
              {/* Comment */}
              <li className="flex items-start">
                <a className="block mr-3 shrink-0" href="#0">
                  <Image className="rounded-full" src={UserImage07} width={32} height={32} alt="User 07" />
                </a>
                <div className="grow">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Taylor Nieman</div>
                  <div className="italic">
                    "Looking forward to this event! Can't wait to attend."
                  </div>
                </div>
              </li>
              {/* Comment */}
              <li className="flex items-start">
                <a className="block mr-3 shrink-0" href="#0">
                  <Image className="rounded-full" src={UserImage08} width={32} height={32} alt="User 08" />
                </a>
                <div className="grow">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Meagan Loyst</div>
                  <div className="italic">
                    "This looks amazing! See you there."
                  </div>
                </div>
              </li>
              {/* Comment */}
              <li className="flex items-start">
                <a className="block mr-3 shrink-0" href="#0">
                  <Image className="rounded-full" src={UserImage02} width={32} height={32} alt="User 02" />
                </a>
                <div className="grow">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Frank Malik</div>
                  <div className="italic">
                    "Great initiative! Count me in."
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* 1st block */}
          <div className="bg-white dark:bg-gray-800 p-5 shadow-sm rounded-xl lg:w-[18rem] xl:w-[20rem]">
            <div className="space-y-2">
              {existingRegistration && existingRegistration.status !== 'cancelled' ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-lg mb-4">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    ✓ You're registered
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Status: {existingRegistration.status}
                  </p>
                </div>
              ) : user ? (
                <Link
                  href={`/community/events/${event.id}/register`}
                  className="btn w-full bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
                >
                  <svg className="fill-current shrink-0" width="16" height="16" viewBox="0 0 16 16">
                    <path d="m2.457 8.516.969-.99 2.516 2.481 5.324-5.304.985.989-6.309 6.284z" />
                  </svg>
                  <span className="ml-1">Register / Attend</span>
                </Link>
              ) : (
                <Link
                  href={`/signin?redirect=/community/events/${event.id}/register`}
                  className="btn w-full bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
                >
                  <svg className="fill-current shrink-0" width="16" height="16" viewBox="0 0 16 16">
                    <path d="m2.457 8.516.969-.99 2.516 2.481 5.324-5.304.985.989-6.309 6.284z" />
                  </svg>
                  <span className="ml-1">Sign in to Register</span>
                </Link>
              )}
              <button className="btn w-full border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300">
                <svg className="fill-red-500 shrink-0" width="16" height="16" viewBox="0 0 16 16">
                  <path d="M14.682 2.318A4.485 4.485 0 0 0 11.5 1 4.377 4.377 0 0 0 8 2.707 4.383 4.383 0 0 0 4.5 1a4.5 4.5 0 0 0-3.182 7.682L8 15l6.682-6.318a4.5 4.5 0 0 0 0-6.364Zm-1.4 4.933L8 12.247l-5.285-5A2.5 2.5 0 0 1 4.5 3c1.437 0 2.312.681 3.5 2.625C9.187 3.681 10.062 3 11.5 3a2.5 2.5 0 0 1 1.785 4.251h-.003Z" />
                </svg>
                <span className="ml-2">Favorite</span>
              </button>

              {!isFree && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 mb-1">Starting from</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${totalPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Required components
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2nd block */}
          <div className="bg-white dark:bg-gray-800 p-5 shadow-sm rounded-xl lg:w-[18rem] xl:w-[20rem]">
            <div className="flex justify-between space-x-1 mb-5">
              <div className="text-sm text-gray-800 dark:text-gray-100 font-semibold">Attendees (12)</div>
              <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">
                View All
              </a>
            </div>
            <ul className="space-y-3">
              <li>
                <div className="flex justify-between">
                  <div className="grow flex items-center">
                    <div className="relative mr-3">
                      <Image className="w-8 h-8 rounded-full" src={UserImage08} width={32} height={32} alt="User 08" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Carolyn McNeail</span>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex justify-between">
                  <div className="grow flex items-center">
                    <div className="relative mr-3">
                      <Image className="w-8 h-8 rounded-full" src={UserImage01} width={32} height={32} alt="User 01" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Dominik Lamakani</span>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex justify-between">
                  <div className="grow flex items-center">
                    <div className="relative mr-3">
                      <Image className="w-8 h-8 rounded-full" src={UserImage03} width={32} height={32} alt="User 03" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Ivan Mesaros</span>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex justify-between">
                  <div className="grow flex items-center">
                    <div className="relative mr-3">
                      <Image className="w-8 h-8 rounded-full" src={UserImage05} width={32} height={32} alt="User 05" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Maria Martinez</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* 3rd block */}
          <div className="bg-white dark:bg-gray-800 p-5 shadow-sm rounded-xl lg:w-[18rem] xl:w-[20rem]">
            <div className="flex justify-between space-x-1 mb-5">
              <div className="text-sm text-gray-800 dark:text-gray-100 font-semibold">Invite Friends</div>
              <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">
                View All
              </a>
            </div>
            <ul className="space-y-3">
              <li>
                <div className="flex items-center justify-between">
                  <div className="grow flex items-center">
                    <div className="relative mr-3">
                      <Image className="w-8 h-8 rounded-full" src={UserImage02} width={32} height={32} alt="User 02" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Haruki Masuno</span>
                    </div>
                  </div>
                  <button className="btn-xs text-xs border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-full shadow-none">
                    Invite
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center justify-between">
                  <div className="grow flex items-center">
                    <div className="relative mr-3">
                      <Image className="w-8 h-8 rounded-full" src={UserImage04} width={32} height={32} alt="User 04" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Joe Huang</span>
                    </div>
                  </div>
                  <button className="btn-xs text-xs border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-full shadow-none">
                    Invite
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center justify-between">
                  <div className="grow flex items-center">
                    <div className="relative mr-3">
                      <Image className="w-8 h-8 rounded-full" src={UserImage06} width={32} height={32} alt="User 06" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Carolyn McNeail</span>
                    </div>
                  </div>
                  <button className="btn-xs text-xs border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-full shadow-none">
                    Invite
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center justify-between">
                  <div className="grow flex items-center">
                    <div className="relative mr-3">
                      <Image className="w-8 h-8 rounded-full" src={UserImage08} width={32} height={32} alt="User 08" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Lisa Sitwala</span>
                    </div>
                  </div>
                  <button className="btn-xs text-xs border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-full shadow-none">
                    Invite
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
