"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Home, X, Check, Eye, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { OrderDetailsModal } from "@/components/order-details-modal"
import { useToast } from "@/hooks/use-toast"
import { ESP32StatusButton } from "@/components/esp32-status-button"
import { useESP32 } from "@/lib/esp32-context"
import type { Order } from "@/types/order"

export default function ChefPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()
  const { isConnected, sendStatus } = useESP32()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/chef/orders")

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

    // Poll for new orders every 10 seconds
    const intervalId = setInterval(fetchOrders, 10000)

    return () => clearInterval(intervalId)
  }, [toast])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
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

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
      )

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }

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
    }
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

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
            <h1 className="text-xl font-bold">Chef Dashboard</h1>
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
            <h2 className="text-3xl font-bold mb-2">Incoming Orders</h2>
            <p className="text-muted-foreground">Accept or reject customer orders</p>
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
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">No pending orders</h3>
              <p className="text-muted-foreground">All orders have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className={order.status === "READY" ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id}</h3>
                        <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <p>
                            {item.quantity}x {item.name}
                          </p>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-muted-foreground">+{order.items.length - 2} more items</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={() => openOrderDetails(order)} className="gap-1">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <div className="flex gap-2">
                      {order.status === "PENDING" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "REJECTED")}
                            className="border-red-200 hover:bg-red-100 hover:text-red-600 gap-1"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "ACCEPTED")}
                            className="bg-green-600 hover:bg-green-700 gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </Button>
                        </>
                      )}

                      {order.status === "ACCEPTED" && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "READY")}
                          className="bg-blue-600 hover:bg-blue-700 gap-1"
                        >
                          <Clock className="h-4 w-4" />
                          Mark Ready
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAccept={
            selectedOrder.status === "PENDING"
              ? () => {
                  updateOrderStatus(selectedOrder.id, "ACCEPTED")
                  setIsModalOpen(false)
                }
              : undefined
          }
          onReject={
            selectedOrder.status === "PENDING"
              ? () => {
                  updateOrderStatus(selectedOrder.id, "REJECTED")
                  setIsModalOpen(false)
                }
              : undefined
          }
          onReady={
            selectedOrder.status === "ACCEPTED"
              ? () => {
                  updateOrderStatus(selectedOrder.id, "READY")
                  setIsModalOpen(false)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
