import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

// Export price IDs for easy access
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || '',
  PRO_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL || '',
  PRO_LIFETIME: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_LIFETIME || '',
  PREMIUM_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_MONTHLY || '',
  PREMIUM_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_ANNUAL || '',
  PREMIUM_LIFETIME: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_LIFETIME || '',
}