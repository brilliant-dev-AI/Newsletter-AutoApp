'use client'

import { useState } from 'react'
import { Globe, Mail, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface NewsletterSignupProps {
  onSuccess: () => void
}

export function NewsletterSignup({ onSuccess }: NewsletterSignupProps) {
  const [url, setUrl] = useState('')
  const [framework, setFramework] = useState<'playwright' | 'skyvern' | 'browserbase'>('playwright')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    subscriptionId?: string
    email?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletter/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          framework,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          subscriptionId: data.subscriptionId,
          email: data.email,
        })
        setUrl('')
        setTimeout(() => onSuccess(), 2000)
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to sign up for newsletter',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Sign Up for Newsletter</h2>
        <p className="text-muted-foreground">
          Enter a website URL and we'll automatically sign you up for their newsletter
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            Website URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="framework" className="block text-sm font-medium mb-2">
            Automation Framework
          </label>
          <select
            id="framework"
            value={framework}
            onChange={(e) => setFramework(e.target.value as any)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="playwright">Playwright (Recommended)</option>
            <option value="skyvern">Skyvern</option>
            <option value="browserbase">Browserbase</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing up...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>Sign Up for Newsletter</span>
            </>
          )}
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded-md border ${
          result.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{result.message}</span>
          </div>
          {result.success && result.email && (
            <div className="mt-2 text-sm">
              <p>Generated email: <code className="bg-gray-100 px-1 rounded">{result.email}</code></p>
              {result.subscriptionId && (
                <p>Subscription ID: <code className="bg-gray-100 px-1 rounded">{result.subscriptionId}</code></p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
