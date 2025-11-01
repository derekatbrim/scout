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

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F8F9FB',
            padding: '60px',
          }}
        >
          {/* Scout Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#0C0F1A',
                letterSpacing: '-0.02em',
              }}
            >
              scout
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '40px',
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '50px',
              border: '2px solid rgba(0,0,0,0.06)',
            }}
          >
            {/* Profile Picture */}
            <div
              style={{
                display: 'flex',
                flexShrink: 0,
              }}
            >
              {profile.featured_image_url ? (
                <img
                  src={profile.featured_image_url}
                  alt={profile.full_name}
                  width={180}
                  height={180}
                  style={{
                    borderRadius: '20px',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '72px',
                    fontWeight: 'bold',
                  }}
                >
                  {profile.full_name?.charAt(0).toUpperCase() || 'C'}
                </div>
              )}
            </div>

            {/* Info Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}
            >
              {/* Name */}
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: '#0C0F1A',
                  marginBottom: '8px',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {profile.full_name}
              </div>

              {/* Niche */}
              <div
                style={{
                  fontSize: '28px',
                  color: '#5E6370',
                  marginBottom: '12px',
                }}
              >
                {profile.creator_niche || 'Content Creator'}
              </div>

              {/* Location */}
              <div
                style={{
                  fontSize: '22px',
                  color: '#9CA3AF',
                  marginBottom: '40px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                📍 Crystal Lake, Illinois
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'flex',
                  gap: '30px',
                }}
              >
                {/* Earned */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px 30px',
                    backgroundColor: '#F8F9FB',
                    borderRadius: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#0C0F1A',
                      marginBottom: '4px',
                    }}
                  >
                    ${totalValue.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      color: '#5E6370',
                      fontWeight: '500',
                    }}
                  >
                    Earned
                  </div>
                </div>

                {/* Collabs */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px 30px',
                    backgroundColor: '#F8F9FB',
                    borderRadius: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#0C0F1A',
                      marginBottom: '4px',
                    }}
                  >
                    {wonDeals}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      color: '#5E6370',
                      fontWeight: '500',
                    }}
                  >
                    Collabs
                  </div>
                </div>

                {/* Followers */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px 30px',
                    backgroundColor: '#F8F9FB',
                    borderRadius: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#0C0F1A',
                      marginBottom: '4px',
                    }}
                  >
                    {formatFollowerCount(profile.follower_count_range || '')}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      color: '#5E6370',
                      fontWeight: '500',
                    }}
                  >
                    Followers
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Accent */}
          <div
            style={{
              display: 'flex',
              marginTop: '30px',
              height: '8px',
              background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
              borderRadius: '4px',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}