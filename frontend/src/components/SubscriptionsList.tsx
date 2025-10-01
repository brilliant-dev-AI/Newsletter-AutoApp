'use client'

import { useState, useEffect } from 'react'
import { Mail, Globe, Calendar, Trash2, ExternalLink, Loader2 } from 'lucide-react'

interface Subscription {
  id: string
  email: string
  url: string
  status: string
  framework: string
  createdAt: string
  updatedAt: string
  lastEmailReceived?: string
}

export function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions`)
      const data = await response.json()
      
      if (data.success) {
        setSubscriptions(data.subscriptions)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSubscription = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setSubscriptions(subscriptions.filter(sub => sub.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error)
    } finally {
      setDeletingId(null)
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading subscriptions...</span>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No subscriptions yet</h3>
        <p className="text-muted-foreground">
          Sign up for your first newsletter to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Subscriptions</h2>
        <button
          onClick={fetchSubscriptions}
          className="text-sm text-primary hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {subscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={subscription.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    {subscription.url}
                  </a>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{subscription.email}</span>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {subscription.framework}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created: {formatDate(subscription.createdAt)}</span>
                  </div>
                  {subscription.lastEmailReceived && (
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>Last email: {formatDate(subscription.lastEmailReceived)}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteSubscription(subscription.id)}
                disabled={deletingId === subscription.id}
                className="ml-4 p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
              >
                {deletingId === subscription.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
