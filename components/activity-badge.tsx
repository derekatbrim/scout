'use client'

interface ActivityBadgeProps {
  status: 'active' | 'moderate' | 'quiet' | 'unknown'
  score?: number
  lastCampaignDate?: string | null
  compact?: boolean
}

export function ActivityBadge({ 
  status, 
  score, 
  lastCampaignDate, 
  compact = false 
}: ActivityBadgeProps) {
  const config = {
    active: {
      label: 'Active',
      fullLabel: 'Active campaigns',
      color: '#22C55E',
      bgColor: 'rgba(34,197,94,0.08)',
      borderColor: 'rgba(34,197,94,0.15)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      )
    },
    moderate: {
      label: 'Moderate',
      fullLabel: 'Moderate activity',
      color: '#3B82F6',
      bgColor: 'rgba(59,130,246,0.08)',
      borderColor: 'rgba(59,130,246,0.15)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    },
    quiet: {
      label: 'Quiet',
      fullLabel: 'Quiet period',
      color: '#9CA3AF',
      bgColor: 'rgba(156,163,175,0.08)',
      borderColor: 'rgba(156,163,175,0.15)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )
    },
    unknown: {
      label: 'Unknown',
      fullLabel: 'Not tracked',
      color: '#D1D5DB',
      bgColor: 'transparent',
      borderColor: 'transparent',
      icon: null
    }
  }

  const { label, fullLabel, color, bgColor, borderColor, icon } = config[status]

  // Don't render if unknown
  if (status === 'unknown') return null

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1"
        style={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '6px',
          color: color,
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: 'var(--font-libre), sans-serif'
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-2.5 py-1.5"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        color: color,
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'var(--font-libre), sans-serif'
      }}
    >
      {icon}
      <span>{fullLabel}</span>
      {lastCampaignDate && (
        <span style={{ opacity: 0.7, fontSize: '11px' }}>
          · {getTimeAgo(lastCampaignDate)}
        </span>
      )}
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}
