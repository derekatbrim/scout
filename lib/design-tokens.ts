/**
 * Scout Design System Tokens
 * 
 * Reference: Contra × Linear × Notion
 * Philosophy: Warm minimalism with intelligent depth
 * 
 * Usage: Import these tokens instead of hardcoding values
 * Example: `className={colors.surface}` instead of `className="bg-white"`
 */

// ========================================
// Color System
// ========================================

export const colors = {
  // Backgrounds
  base: '#F8F9FB',           // Page background - softer than slate-50
  surface: '#FFFFFF',        // Cards, panels, drawers
  
  // Borders
  border: 'rgba(0,0,0,0.06)', // Subtle borders - barely there
  borderHover: 'rgba(0,0,0,0.12)',
  
  // Text
  textPrimary: '#0C0F1A',    // Main content, titles
  textSecondary: '#5E6370',  // Metadata, captions
  textTertiary: '#9CA3AF',   // Disabled, placeholders
  
  // Brand Accent (Pink → Purple gradient)
  accentPink: '#FD8AE6',
  accentPurple: '#C77DFF',
  
  // CTA Navy
  ctaNavy: '#0C0F1A',
  
  // Semantic Colors
  success: '#3AC46A',
  warning: '#FFB020',
  info: '#3D82F0',
  error: '#EF4444',
  
  // Category-specific gradients (for brand cards)
  categoryFood: 'rgba(251,146,60,0.04)',      // Orange tint
  categoryHealth: 'rgba(34,197,94,0.04)',     // Green tint
  categoryBeauty: 'rgba(253,138,230,0.04)',   // Pink tint
  categoryTech: 'rgba(59,130,246,0.04)',      // Blue tint
  categoryDefault: 'rgba(100,116,139,0.04)',  // Slate tint
}

// ========================================
// Typography
// ========================================

export const typography = {
  // Font Families
  fontHeading: '"Bricolage Grotesque", system-ui, -apple-system, sans-serif',
  fontBody: '"Libre Franklin", system-ui, -apple-system, sans-serif',
  
  // Font Sizes & Weights
  h1: {
    size: '30px',
    weight: '600',
    lineHeight: '1.2',
    color: colors.textPrimary,
  },
  h2: {
    size: '22px',
    weight: '500',
    lineHeight: '1.3',
    color: colors.textPrimary,
  },
  cardTitle: {
    size: '18px',
    weight: '600',
    lineHeight: '1.4',
    color: colors.textPrimary,
  },
  cardMeta: {
    size: '14px',
    weight: '500',
    lineHeight: '1.4',
    color: colors.textSecondary,
  },
  body: {
    size: '15px',
    weight: '400',
    lineHeight: '1.5',
    color: '#2B2B2B',
  },
  label: {
    size: '13px',
    weight: '500',
    lineHeight: '1.4',
    color: colors.textPrimary,
  },
}

// ========================================
// Spacing & Layout
// ========================================

export const spacing = {
  sectionVertical: {
    top: '80px',
    bottom: '60px',
  },
  cardPadding: {
    x: '28px',
    y: '24px',
  },
  cardGap: '28px',
  containerMaxWidth: '1152px', // max-w-6xl equivalent
}

// ========================================
// Border Radius
// ========================================

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
}

// ========================================
// Shadows
// ========================================

export const shadows = {
  card: '0 4px 12px rgba(0,0,0,0.04)',
  cardHover: '0 6px 14px rgba(0,0,0,0.06)',
  button: '0 2px 8px rgba(0,0,0,0.04)',
  drawer: '0 8px 24px rgba(0,0,0,0.08)',
  none: 'none',
}

// ========================================
// Transitions
// ========================================

export const transitions = {
  fast: '0.1s ease-out',
  default: '0.15s ease-out',
  medium: '0.2s ease-out',
  slow: '0.25s ease-out',
  drawer: '0.25s ease-in-out',
}

// ========================================
// Gradients
// ========================================

export const gradients = {
  // Pink → Purple (primary brand gradient)
  pinkPurple: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
  
  // Subtle background glows
  heroGlow: 'radial-gradient(circle at 70% 20%, rgba(253,138,230,0.15), transparent 60%)',
  cardGlow: 'radial-gradient(circle at 50% 0%, rgba(253,138,230,0.08), transparent 70%)',
  
  // Category-specific card backgrounds
  food: 'linear-gradient(135deg, rgba(251,146,60,0.04) 0%, rgba(251,146,60,0.02) 100%)',
  health: 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, rgba(34,197,94,0.02) 100%)',
  beauty: 'linear-gradient(135deg, rgba(253,138,230,0.04) 0%, rgba(253,138,230,0.02) 100%)',
  tech: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(59,130,246,0.02) 100%)',
}

// ========================================
// Motion Presets
// ========================================

export const motion = {
  // For Framer Motion
  pageTransition: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  
  cardHover: {
    scale: 1.01,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  
  drawerSlide: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
}

// ========================================
// Helper Functions
// ========================================

/**
 * Get category-specific gradient for brand cards
 */
export const getCategoryGradient = (category: string): string => {
  const lowerCat = category?.toLowerCase() || ''
  
  if (lowerCat.includes('food') || lowerCat.includes('beverage')) {
    return gradients.food
  }
  if (lowerCat.includes('health') || lowerCat.includes('fitness')) {
    return gradients.health
  }
  if (lowerCat.includes('beauty') || lowerCat.includes('personal care')) {
    return gradients.beauty
  }
  if (lowerCat.includes('tech') || lowerCat.includes('gadget')) {
    return gradients.tech
  }
  
  return 'linear-gradient(135deg, rgba(100,116,139,0.04) 0%, rgba(100,116,139,0.02) 100%)'
}

/**
 * Get category-specific avatar color
 */
export const getCategoryAvatarColor = (category: string): string => {
  const lowerCat = category?.toLowerCase() || ''
  
  if (lowerCat.includes('food') || lowerCat.includes('beverage')) {
    return 'bg-orange-500'
  }
  if (lowerCat.includes('health') || lowerCat.includes('fitness')) {
    return 'bg-green-500'
  }
  if (lowerCat.includes('beauty') || lowerCat.includes('personal care')) {
    return 'bg-pink-500'
  }
  if (lowerCat.includes('tech') || lowerCat.includes('gadget')) {
    return 'bg-blue-500'
  }
  
  return 'bg-slate-700'
}

/**
 * Get status badge styling
 */
export const getStatusStyle = (status: string): { bg: string; text: string } => {
  switch (status.toLowerCase()) {
    case 'high':
    case 'won':
    case 'delivered':
      return { bg: 'bg-green-50', text: 'text-green-700' }
    case 'medium':
    case 'negotiating':
      return { bg: 'bg-yellow-50', text: 'text-yellow-700' }
    case 'low':
      return { bg: 'bg-slate-100', text: 'text-slate-600' }
    case 'pitched':
      return { bg: 'bg-blue-50', text: 'text-blue-700' }
    case 'prospect':
      return { bg: 'bg-slate-100', text: 'text-slate-700' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700' }
  }
}