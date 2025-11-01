import { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import PublicProfileClient from './client'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    return {
      title: 'Profile Not Found | Scout',
      description: 'This creator profile could not be found.',
    }
  }

  const title = `${profile.full_name} | Scout Creator Profile`
  const description =
    profile.bio ||
    `${profile.full_name} is a ${profile.creator_niche || 'content creator'} available for brand collaborations. View portfolio and get in touch.`

  const ogImageUrl = `https://scout-social.com/api/og/profile/${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://scout-social.com/profile/${id}`,
      siteName: 'Scout',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profile.full_name}'s creator profile`,
        },
      ],
      locale: 'en_US',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: profile.instagram_handle ? `@${profile.instagram_handle}` : undefined,
    },
    alternates: {
      canonical: `https://scout-social.com/profile/${id}`,
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const resolvedParams = await params
  return <PublicProfileClient params={resolvedParams} />
}