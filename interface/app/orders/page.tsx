"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { useToast } from "@/hooks/use-toast"
import { ESP32StatusButton } from "@/components/esp32-status-button"
import type { Order } from "@/types/order"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setOrders(data)
        setError(null)
      } catch (error) {
        console.error("Failed to fetch orders:", error)
        setError("Failed to load orders. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
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
            <h1 className="text-xl font-bold">My Orders</h1>
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
            <h2 className="text-3xl font-bold mb-2">Order History</h2>
            <p className="text-muted-foreground">View and track all your orders</p>
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
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
              <Link href="/menu">
                <Button>Browse Menu</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const totalPrice = order.items.reduce((total, item) => total + item.price * item.quantity, 0)

                return (
                  <Card key={order.id}>
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle>Order #{order.id}</CardTitle>
                        <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between py-1">
                            <p>{item.name}</p>
                            <p>x{item.quantity}</p>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-muted-foreground">+{order.items.length - 3} more items</p>
                        )}
                        <div className="flex justify-between pt-2 border-t mt-2">
                          <p className="font-bold">Total</p>
                          <p className="font-bold">${totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/order/${order.id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          View Order Details
                        </Button>
                      </Link>
                    </CardFooter>
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
