import Link from 'next/link'
import Image from 'next/image'
import EventsThumb01 from '@/../public/images/meetups-thumb-01.jpg'

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getEvents() {
  try {
    const response = await fetch(`${API_URL}/api/events`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      console.error('Failed to fetch events:', response.statusText);
      return [];
    }

    const { data } = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function truncateDescription(description: string, maxLength: number = 100): string {
  if (!description) return 'No description provided';
  if (description.length <= maxLength) return description;

  // Truncate at word boundary
  const truncated = description.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  return lastSpaceIndex > 0
    ? truncated.substring(0, lastSpaceIndex) + '...'
    : truncated + '...';
}

export default async function EventsPosts() {
  const events = await getEvents();

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No events found. Create your first event!</p>
      </div>
    );
  }

  return (
    <div className="grid xl:grid-cols-2 gap-6">

      {events.map((event: any) => (
        <article key={event.id} className="flex bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden">
          {/* Image */}
          <Link className="relative block w-24 sm:w-[14rem] xl:sidebar-expanded:w-40 2xl:sidebar-expanded:w-[14rem] shrink-0" href={`/community/events/${event.id}`}>
            <Image
              className="absolute object-cover object-center w-full h-full"
              src={EventsThumb01}
              width={220}
              height={236}
              alt={event.title}
            />
            {/* Like button */}
            <button className="absolute top-0 right-0 mt-4 mr-4">
              <div className="text-gray-100 bg-gray-900/60 rounded-full">
                <span className="sr-only">Like</span>
                <svg className="h-8 w-8 fill-current" viewBox="0 0 32 32">
                  <path d="M22.682 11.318A4.485 4.485 0 0019.5 10a4.377 4.377 0 00-3.5 1.707A4.383 4.383 0 0012.5 10a4.5 4.5 0 00-3.182 7.682L16 24l6.682-6.318a4.5 4.5 0 000-6.364zm-1.4 4.933L16 21.247l-5.285-5A2.5 2.5 0 0112.5 12c1.437 0 2.312.681 3.5 2.625C17.187 12.681 18.062 12 19.5 12a2.5 2.5 0 011.785 4.251h-.003z" />
                </svg>
              </div>
            </button>
          </Link>
          {/* Content */}
          <div className="grow p-5 flex flex-col">
            <div className="grow">
              <div className="text-sm font-semibold text-violet-500 uppercase mb-2">
                {formatDate(event.start_date)}
              </div>
              <Link className="inline-flex mb-2" href={`/community/events/${event.id}`}>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{event.title}</h3>
              </Link>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {truncateDescription(event.description)}
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-between items-center mt-3">
              {/* Tag */}
              <div className="text-xs inline-flex items-center font-medium border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-400 rounded-full text-center px-2.5 py-1">
                {event.location ? (
                  <>
                    <svg className="w-3 h-3 fill-gray-400 dark:fill-gray-500 mr-1" viewBox="0 0 12 12">
                      <path d="M6 0a4 4 0 0 0-4 4c0 2.4 4 8 4 8s4-5.6 4-8a4 4 0 0 0-4-4Zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
                    </svg>
                    <span>{event.location}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-3 fill-gray-400 dark:fill-gray-500 mr-2" viewBox="0 0 16 12">
                      <path d="m16 2-4 2.4V2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.6l4 2.4V2ZM2 10V2h8v8H2Z" />
                    </svg>
                    <span>Online Event</span>
                  </>
                )}
              </div>
              {/* Capacity */}
              {event.capacity && (
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {event.capacity} spots
                </div>
              )}
            </div>
          </div>
        </article>
      ))}

    </div>
  )
}
