import { Mail, Zap, Link } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Newsletter Automation</h1>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4" />
              <span>Browser Automation</span>
            </div>
            <div className="flex items-center space-x-1">
              <Link className="h-4 w-4" />
              <span>Link Extraction</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
