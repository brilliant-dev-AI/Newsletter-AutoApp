'use client'

import { useState, useEffect } from 'react'
import { Link, ExternalLink, Mail, Calendar, Filter, Search, Loader2 } from 'lucide-react'

interface ExtractedLink {
  url: string
  text: string
  context: string
  type: 'internal' | 'external' | 'social' | 'unsubscribe'
}

interface LinkData {
  id: string
  email: string
  subject: string
  from: string
  links: ExtractedLink[]
  receivedAt: string
  processedAt: string
}

export function LinksViewer() {
  const [links, setLinks] = useState<LinkData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubscription, setSelectedSubscription] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    if (selectedSubscription) {
      fetchLinks(selectedSubscription)
    }
  }, [selectedSubscription])

  const fetchLinks = async (subscriptionId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/links?id=${subscriptionId}`)
      const data = await response.json()
      
      if (data.success) {
        setLinks(data.links)
      }
    } catch (error) {
      console.error('Failed to fetch links:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLinks = links.filter(linkData => {
    const matchesSearch = searchTerm === '' || 
      linkData.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      linkData.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      linkData.links.some(link => 
        link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesFilter = filterType === 'all' || 
      linkData.links.some(link => link.type === filterType)
    
    return matchesSearch && matchesFilter
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internal':
        return 'bg-blue-100 text-blue-800'
      case 'external':
        return 'bg-green-100 text-green-800'
      case 'social':
        return 'bg-purple-100 text-purple-800'
      case 'unsubscribe':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading links...</span>
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-8">
        <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No links extracted yet</h3>
        <p className="text-muted-foreground">
          Links will appear here once newsletters are processed
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Extracted Links</h2>
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-input rounded-md bg-background text-foreground text-sm"
          >
            <option value="all">All Types</option>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="social">Social</option>
            <option value="unsubscribe">Unsubscribe</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search links, subjects, or senders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      <div className="space-y-4">
        {filteredLinks.map((linkData) => (
          <div key={linkData.id} className="border rounded-lg p-4 bg-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{linkData.subject}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>From: {linkData.from}</span>
                  <span>Email: {linkData.email}</span>
                  <span>Received: {formatDate(linkData.receivedAt)}</span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {linkData.links.length} link{linkData.links.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {linkData.links.map((link, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-md">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium truncate"
                      >
                        {link.url}
                      </a>
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(link.type)}`}>
                        {link.type}
                      </span>
                    </div>
                    {link.text && link.text !== 'No text' && (
                      <p className="text-sm text-muted-foreground mb-1">{link.text}</p>
                    )}
                    {link.context && link.context !== 'No context' && (
                      <p className="text-xs text-muted-foreground italic">
                        Context: {link.context}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredLinks.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No links found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  )
}
