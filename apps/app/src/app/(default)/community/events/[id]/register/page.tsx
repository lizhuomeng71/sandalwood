import { notFound, redirect } from 'next/navigation'
import { getEventWithComponents, checkUserRegistration } from '@v1/supabase/queries'
import { getUser } from '@v1/supabase/queries'
import RegisterForm from './register-form'

export const metadata = {
  title: 'Register for Event - Mosaic',
  description: 'Complete your event registration',
}

export default async function RegisterPage({ params }: { params: { id: string } }) {
  const { id } = params

  // Get the event with components
  const { data: event, error: eventError } = await getEventWithComponents(id)

  if (eventError || !event) {
    notFound()
  }

  // Check if user is authenticated
  const { data: userData } = await getUser()

  if (!userData.user) {
    redirect(`/signin?redirect=/community/events/${id}/register`)
  }

  // Check if user already registered
  const { data: existingRegistration } = await checkUserRegistration(id, userData.user.id)

  if (existingRegistration && existingRegistration.status !== 'cancelled') {
    redirect(`/community/events/${id}?registered=true`)
  }

  return <RegisterForm event={event} user={userData.user} />
}
