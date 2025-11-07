export const metadata = {
  title: 'Events - Mosaic',
  description: 'Page description',
}

import SearchForm from '@/components/search-form'
import EventsPosts from './events-posts'
import PaginationNumeric from '@/components/pagination-numeric'
import Link from 'next/link'

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getEventsCount() {
  try {
    const response = await fetch(`${API_URL}/api/events`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return 0;
    }

    const { data } = await response.json();
    return data?.length || 0;
  } catch (error) {
    console.error('Error fetching events count:', error);
    return 0;
  }
}

export default async function Events() {
  const eventsCount = await getEventsCount();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-5">

        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Discover Events</h1>
        </div>

        {/* Right: Actions */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">

          {/* Search form */}
          <SearchForm placeholder="Search…" />

          {/* Add event button */}
          <Link href="/community/events/create" className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Add Event</span>
          </Link>

        </div>

      </div>

      {/* Filters */}
      <div className="mb-5">
        <ul className="flex flex-wrap -m-1">
          <li className="m-1">
            <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-transparent shadow-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800 transition">
              View All
            </button>
          </li>
          <li className="m-1">
            <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">
              Online
            </button>
          </li>
          <li className="m-1">
            <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">
              Local
            </button>
          </li>
          <li className="m-1">
            <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">
              This Week
            </button>
          </li>
          <li className="m-1">
            <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">
              This Month
            </button>
          </li>
          <li className="m-1">
            <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">
              Following
            </button>
          </li>
        </ul>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">
        {eventsCount} {eventsCount === 1 ? 'Event' : 'Events'}
      </div>

      {/* Content */}
      <EventsPosts />

      {/* Pagination */}
      <div className="mt-8">
        <PaginationNumeric />
      </div>
    </div>
  )
}
