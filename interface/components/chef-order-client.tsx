"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, X, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { useToast } from "@/hooks/use-toast"
import { useESP32 } from "@/lib/esp32-context"
import type { Order } from "@/types/order"

interface ChefOrderClientProps {
  orderPromise: Promise<Order | null>
  orderId: string
}

export function ChefOrderClient({ orderPromise, orderId }: ChefOrderClientProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const { isConnected, sendStatus } = useESP32()

  useEffect(() => {
    // Load initial order data from the promise
    orderPromise
      .then((data) => {
        setOrder(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading order:", err)
        setError("Failed to load order details")
        setLoading(false)
      })
  }, [orderPromise])

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update order status")
      }

      const updatedOrder = await response.json()
      setOrder(updatedOrder)

      // If ESP32 is connected, send the status update
      if (isConnected) {
        sendStatus(newStatus)
      }

      toast({
        title: `Order ${newStatus.toLowerCase()}`,
        description: `Order #${orderId} has been ${newStatus.toLowerCase()}`,
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading order details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Error</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link href="/chef">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Order not found</h3>
        <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
        <Link href="/chef">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const totalPrice = order.items.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <StatusBadge status={order.status} size="lg" />
        <p className="text-sm text-muted-foreground">
          Ordered at {new Date(order.createdAt).toLocaleTimeString()} on{" "}
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">
                      {item.quantity}x {item.name}
                    </p>
                    {item.notes && <p className="text-xs text-muted-foreground">Note: {item.notes}</p>}
                  </div>
                  <div className="text-sm">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <p className="font-bold">Total</p>
              <p className="font-bold">${totalPrice.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {order.status === "PENDING" && (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => updateOrderStatus("REJECTED")}
                disabled={isUpdating}
                className="border-red-200 hover:bg-red-100 hover:text-red-600 gap-1 flex-1"
              >
                <X className="h-4 w-4" />
                Reject Order
              </Button>
              <Button
                onClick={() => updateOrderStatus("ACCEPTED")}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 gap-1 flex-1"
              >
                <Check className="h-4 w-4" />
                Accept Order
              </Button>
            </div>
          )}

          {order.status === "ACCEPTED" && (
            <Button
              onClick={() => updateOrderStatus("READY")}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 gap-1 w-full"
            >
              <Clock className="h-4 w-4" />
              Mark as Ready
            </Button>
          )}

          {(order.status === "REJECTED" || order.status === "READY") && (
            <p className="text-center text-muted-foreground w-full">
              This order is {order.status === "REJECTED" ? "rejected" : "ready for pickup"} and cannot be updated
              further.
            </p>
          )}
        </CardFooter>
      </Card>

      {order.rating && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} filled={star <= order.rating!.score} />
                ))}
              </div>
              <span className="ml-2 text-sm text-muted-foreground">
                {order.rating.createdAt ? `Submitted on ${new Date(order.rating.createdAt).toLocaleDateString()}` : ""}
              </span>
            </div>
            {order.rating.comment && <p className="text-sm italic">"{order.rating.comment}"</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={filled ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
