'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { showToast } from '@/components/ui/toast'

interface Review {
  id: string
  brand_id: string
  user_id: string
  rating: number
  review_text: string
  pros: string
  cons: string
  deal_value: number | null
  response_time: string | null
  would_work_again: boolean
  created_at: string
  profiles: {
    full_name: string
    instagram_handle: string
    creator_niche: string
  }
}

interface BrandReviewsProps {
  brandId: string
  brandName: string
  userId?: string
}

export function BrandReviews({ brandId, brandName, userId }: BrandReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [userHasReviewed, setUserHasReviewed] = useState(false)
  const supabase = supabaseClient()

  // Review form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [responseTime, setResponseTime] = useState('')
  const [wouldWorkAgain, setWouldWorkAgain] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [brandId])

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from('brand_reviews')
      .select(`
        *,
        profiles (
          full_name,
          instagram_handle,
          creator_niche
        )
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading reviews:', error)
    } else {
      setReviews(data || [])
      
      // Check if current user has reviewed
      if (userId) {
        const userReview = data?.find(r => r.user_id === userId)
        setUserHasReviewed(!!userReview)
      }
    }
    setLoading(false)
  }

  const submitReview = async () => {
    if (!userId) {
      showToast('Please log in to submit a review', 'error')
      return
    }

    if (rating === 0) {
      showToast('Please select a rating', 'error')
      return
    }

    if (!reviewText.trim()) {
      showToast('Please write a review', 'error')
      return
    }

    setSubmitting(true)

    const { error } = await supabase.from('brand_reviews').insert({
      brand_id: brandId,
      user_id: userId,
      rating,
      review_text: reviewText,
      pros: pros || null,
      cons: cons || null,
      deal_value: dealValue ? parseInt(dealValue) : null,
      response_time: responseTime || null,
      would_work_again: wouldWorkAgain,
    })

    if (error) {
      showToast('Error submitting review: ' + error.message, 'error')
    } else {
      showToast('✓ Review submitted!', 'success')
      setShowModal(false)
      resetForm()
      loadReviews()
    }

    setSubmitting(false)
  }

  const resetForm = () => {
    setRating(0)
    setHoverRating(0)
    setReviewText('')
    setPros('')
    setCons('')
    setDealValue('')
    setResponseTime('')
    setWouldWorkAgain(null)
  }

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const getStarColor = (index: number) => {
    const activeRating = hoverRating || rating
    return index <= activeRating ? '#FD8AE6' : '#E5E7EB'
  }

  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(r => {
      dist[r.rating as keyof typeof dist]++
    })
    return dist
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-500">
        Loading reviews...
      </div>
    )
  }

  const avgRating = getAverageRating()
  const distribution = getRatingDistribution()

  return (
    <div className="space-y-6">
      {/* Header with average rating */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-5xl font-bold text-slate-900">{avgRating}</div>
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5"
                    fill={parseFloat(avgRating) >= star ? '#FD8AE6' : '#E5E7EB'}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-slate-500">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>

          {/* Rating distribution */}
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star as keyof typeof distribution]
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600 w-8">{star}★</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#fd8ae6] to-[#c77dff] rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-slate-500 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Write review button */}
        {userId && !userHasReviewed && (
          <Button
            onClick={() => setShowModal(true)}
            className="whitespace-nowrap"
          >
            Write a review
          </Button>
        )}
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">💭</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No reviews yet
          </h3>
          <p className="text-slate-600 mb-4">
            Be the first to share your experience with {brandName}
          </p>
          {userId && (
            <Button onClick={() => setShowModal(true)}>
              Write the first review
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-slate-50 rounded-xl p-6 border border-slate-200"
            >
              {/* Review header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    }}
                  >
                    {review.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {review.profiles?.full_name || 'Anonymous'}
                    </div>
                    {review.profiles?.instagram_handle && (
                      <div className="text-sm text-slate-500">
                        @{review.profiles.instagram_handle}
                      </div>
                    )}
                    {review.profiles?.creator_niche && (
                      <div className="text-xs text-slate-500 mt-1">
                        {review.profiles.creator_niche}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {formatDate(review.created_at)}
                </div>
              </div>

              {/* Star rating */}
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5"
                    fill={star <= review.rating ? '#FD8AE6' : '#E5E7EB'}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Review text */}
              <p className="text-slate-700 mb-4 leading-relaxed">
                {review.review_text}
              </p>

              {/* Pros/Cons */}
              {(review.pros || review.cons) && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {review.pros && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        PROS
                      </div>
                      <p className="text-sm text-green-800">{review.pros}</p>
                    </div>
                  )}
                  {review.cons && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        CONS
                      </div>
                      <p className="text-sm text-red-800">{review.cons}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap gap-3 text-sm">
                {review.deal_value && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                    💰 ${review.deal_value.toLocaleString()} deal
                  </span>
                )}
                {review.response_time && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                    ⏱️ {review.response_time}
                  </span>
                )}
                {review.would_work_again !== null && (
                  <span
                    className={`px-3 py-1 rounded-full font-medium ${
                      review.would_work_again
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {review.would_work_again ? '✓ Would work again' : '✗ Would not work again'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900">
                Review {brandName}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Star rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Overall Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg
                        className="w-10 h-10 cursor-pointer"
                        fill={getStarColor(star)}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Your Review *
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience working with this brand..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] resize-none"
                />
              </div>

              {/* Pros */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  What did you like? (Optional)
                </label>
                <input
                  type="text"
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  placeholder="e.g., Fast response, clear brief, paid on time"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6]"
                />
              </div>

              {/* Cons */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  What could be better? (Optional)
                </label>
                <input
                  type="text"
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  placeholder="e.g., Slow to respond, unclear expectations"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6]"
                />
              </div>

              {/* Deal value */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Deal Value (Optional)
                </label>
                <input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  placeholder="2000"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6]"
                />
              </div>

              {/* Response time */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  How quickly did they respond? (Optional)
                </label>
                <select
                  value={responseTime}
                  onChange={(e) => setResponseTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6]"
                >
                  <option value="">Select timeframe</option>
                  <option value="Same day">Same day</option>
                  <option value="1-2 days">1-2 days</option>
                  <option value="3-7 days">3-7 days</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="2+ weeks">2+ weeks</option>
                  <option value="No response">No response</option>
                </select>
              </div>

              {/* Would work again */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Would you work with them again? (Optional)
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setWouldWorkAgain(true)}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                      wouldWorkAgain === true
                        ? 'bg-green-100 border-2 border-green-500 text-green-700'
                        : 'bg-slate-100 border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    ✓ Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWouldWorkAgain(false)}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                      wouldWorkAgain === false
                        ? 'bg-red-100 border-2 border-red-500 text-red-700'
                        : 'bg-slate-100 border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    ✗ No
                  </button>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={submitReview}
                  disabled={submitting || rating === 0 || !reviewText.trim()}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
