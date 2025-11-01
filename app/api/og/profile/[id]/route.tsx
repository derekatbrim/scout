import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const userId = params.id

    // Fetch profile data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
      {
        headers: {
          apikey: supabaseAnonKey!,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      }
    )

    const profiles = await profileRes.json()
    const profile = profiles[0]

    if (!profile) {
      return new Response('Profile not found', { status: 404 })
    }

    // Fetch deal stats
    const dealsRes = await fetch(
      `${supabaseUrl}/rest/v1/deals?user_id=eq.${userId}&status=in.(won,delivered)&select=deal_value`,
      {
        headers: {
          apikey: supabaseAnonKey!,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      }
    )

    const deals = await dealsRes.json()
    const wonDeals = Array.isArray(deals) ? deals.length : 0
    const totalValue = Array.isArray(deals)
      ? deals.reduce((sum: number, d: any) => sum + (d.deal_value || 0), 0)
      : 0

    const formatFollowerCount = (range: string) => {
      if (!range) return '0'
      if (range === '1M+') return '1M+'
      return range.replace('k', 'K')
    }

    // Create username from full name or use first name
    const username = profile.full_name?.toLowerCase().replace(/\s+/g, '') || 'creator'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: '#0C0F1A',
            position: 'relative',
          }}
        >
          {/* Left gradient bar */}
          <div
            style={{
              display: 'flex',
              width: '24px',
              background: 'linear-gradient(180deg, #FD8AE6 0%, #C77DFF 100%)',
            }}
          />

          {/* Main content area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '60px 80px',
              justifyContent: 'space-between',
            }}
          >
            {/* Top - Scout logo in box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  padding: '12px 24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                  }}
                >
                  SCOUT
                </div>
              </div>
            </div>

            {/* Middle - Main content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {/* Gradient slash + username */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: '120px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    backgroundClip: 'text',
                    color: 'transparent',
                    lineHeight: 1,
                  }}
                >
                  /
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: '72px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {username}
                </div>
              </div>

              {/* CTA blurb */}
              <div
                style={{
                  display: 'flex',
                  fontSize: '32px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.4,
                  maxWidth: '900px',
                }}
              >
                {profile.creator_niche || 'Content creator'} available for brand collaborations. 
                {wonDeals > 0 && ` ${wonDeals} successful partnership${wonDeals !== 1 ? 's' : ''}.`}
                {totalValue > 0 && ` $${totalValue.toLocaleString()} earned.`}
                {` ${formatFollowerCount(profile.follower_count_range || '')} followers.`}
              </div>
            </div>

            {/* Bottom - spacer */}
            <div style={{ display: 'flex' }} />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    })
  }
}