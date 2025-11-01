import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const userId = params.id

    // Simple test card - no Supabase calls
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8F9FB',
            fontSize: 60,
            fontWeight: 'bold',
          }}
        >
          <div style={{ color: '#0C0F1A' }}>Scout Profile</div>
          <div style={{ color: '#FD8AE6', fontSize: 40, marginTop: 20 }}>
            User ID: {userId}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`Error: ${e.message}`)
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    })
  }
}