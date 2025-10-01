'use client'

import { useState, useEffect } from 'react'
import { NewsletterSignup } from '../components/NewsletterSignup'
import { SubscriptionsList } from '../components/SubscriptionsList'
import { LinksViewer } from '../components/LinksViewer'
import { Header } from '../components/Header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

export default function Home() {
  const [activeTab, setActiveTab] = useState('signup')

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Newsletter Automation App
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Automatically sign up for newsletters and extract links from emails using browser automation
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="links">Extracted Links</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signup" className="mt-6">
              <NewsletterSignup onSuccess={() => setActiveTab('subscriptions')} />
            </TabsContent>
            
            <TabsContent value="subscriptions" className="mt-6">
              <SubscriptionsList />
            </TabsContent>
            
            <TabsContent value="links" className="mt-6">
              <LinksViewer />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
