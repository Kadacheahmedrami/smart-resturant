"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Home, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ESP32StatusButton } from "@/components/esp32-status-button"
import { useToast } from "@/hooks/use-toast"

interface Rating {
  id: string
  score: number
  comment: string | null
  orderId: string
  createdAt: string
  order: {
    id: string
    status: string
    items: Array<{
      id: string
      name: string
      quantity: number
      price: number
    }>
    createdAt: string
  }
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch("/api/ratings")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setRatings(data)
        setError(null)
      } catch (error) {
        console.error("Failed to fetch ratings:", error)
        setError("Failed to load ratings. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load ratings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRatings()
  }, [toast])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Order Ratings</h1>
          </div>
          <div className="flex items-center gap-4">
            <ESP32StatusButton />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Customer Ratings</h2>
            <p className="text-muted-foreground">See what our customers are saying about their orders</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Error</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No ratings yet</h3>
              <p className="text-muted-foreground mb-6">There are no ratings available at this time.</p>
              <Link href="/menu">
                <Button>Place an Order</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {ratings.map((rating) => {
                const totalItems = rating.order.items.reduce((total, item) => total + item.quantity, 0)
                const totalPrice = rating.order.items.reduce((total, item) => total + item.price * item.quantity, 0)

                return (
                  <Card key={rating.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <CardTitle>Order #{rating.orderId}</CardTitle>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= rating.score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{new Date(rating.createdAt).toLocaleDateString()}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {rating.comment && (
                          <div className="bg-muted/50 p-4 rounded-md italic">
                            <p>"{rating.comment}"</p>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium mb-2">Order Summary</h4>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              {totalItems} {totalItems === 1 ? "item" : "items"} • ${totalPrice.toFixed(2)}
                            </p>
                            <p>Ordered on {new Date(rating.order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Link href={`/order/${rating.orderId}`}>
                            <Button variant="outline" size="sm">
                              View Order Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
