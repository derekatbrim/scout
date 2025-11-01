import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Stripe API routes are working!',
    timestamp: new Date().toISOString()
  })
}

export async function POST() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'POST is working too!',
    timestamp: new Date().toISOString()
  })
}
