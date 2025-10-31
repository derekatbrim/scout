'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '../lib/supabase'

interface SearchResult {
  id: string
  type: 'brand' | 'deal'
  title: string
  subtitle: string
  href: string
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = supabaseClient()

  // Cmd+K / Ctrl+K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Search brands
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name, category')
        .ilike('name', `%${searchQuery}%`)
        .limit(5)

      // Search deals (only user's deals)
      const { data: deals } = user ? await supabase
        .from('deals')
        .select('id, brand_name, status')
        .eq('user_id', user.id)
        .ilike('brand_name', `%${searchQuery}%`)
        .limit(5) : { data: [] }

      const searchResults: SearchResult[] = [
        ...(brands || []).map(brand => ({
          id: brand.id,
          type: 'brand' as const,
          title: brand.name,
          subtitle: brand.category || 'Brand',
          href: '/dashboard/brands'
        })),
        ...(deals || []).map(deal => ({
          id: deal.id,
          type: 'deal' as const,
          title: deal.brand_name,
          subtitle: `Deal - ${deal.status}`,
          href: '/dashboard/deals'
        }))
      ]

      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    }

    setLoading(false)
  }, [supabase])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(result.href)
    setIsOpen(false)
    setQuery('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-32 p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-slideDown">
        {/* Search Input */}
        <div className="relative border-b border-slate-200">
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search brands and deals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 text-lg bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-[#fd8ae6] rounded-full animate-spin"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    result.type === 'brand' 
                      ? 'bg-[#020c1f] text-white' 
                      : 'bg-[#fd8ae6] text-white'
                  }`}>
                    {result.type === 'brand' ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 group-hover:text-[#fd8ae6] transition-colors truncate">
                      {result.title}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <div className="text-slate-900 font-semibold mb-1">No results found</div>
              <div className="text-sm text-slate-500">Try searching for a different brand or deal</div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">👋</div>
              <div className="text-slate-900 font-semibold mb-1">Start typing to search</div>
              <div className="text-sm text-slate-500">Search across brands and your deals</div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs">ESC</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
