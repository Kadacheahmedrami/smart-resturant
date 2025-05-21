"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface RatingClientProps {
  ratingPromise: Promise<any>
  ratingId: string
}

export function RatingClient({ ratingPromise, ratingId }: RatingClientProps) {
  const [rating, setRating] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load initial rating data from the promise
    ratingPromise
      .then((data) => {
        setRating(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading rating:", err)
        setError("Failed to load rating details")
        setLoading(false)
      })
  }, [ratingPromise])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading rating details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Error</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link href="/ratings">
          <Button>View All Ratings</Button>
        </Link>
      </div>
    )
  }

  if (!rating) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Rating not found</h3>
        <p className="text-muted-foreground mb-6">The rating you're looking for doesn't exist.</p>
        <Link href="/ratings">
          <Button>View All Ratings</Button>
        </Link>
      </div>
    )
  }

  const totalPrice = rating.order.items.reduce((total: number, item: any) => total + item.price * item.quantity, 0)

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Rating for Order #{rating.orderId}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= rating.score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                />
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {rating.comment && (
              <div className="bg-muted/50 p-4 rounded-md italic">
                <p>"{rating.comment}"</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Order Summary</h4>
              <div className="space-y-2">
                {rating.order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </div>
                    <div className="text-sm">
                      {item.quantity} x ${item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4 border-t mt-4">
                <p className="font-bold">Total</p>
                <p className="font-bold">${totalPrice.toFixed(2)}</p>
              </div>
            </div>

            <div className="pt-2">
              <Link href={`/order/${rating.orderId}`}>
                <Button variant="outline">View Order Details</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
