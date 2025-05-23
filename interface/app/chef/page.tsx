"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Home, X, Check, Eye, Clock, Bell, Utensils, MenuIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { OrderDetailsModal } from "@/components/order-details-modal"
import { useToast } from "@/hooks/use-toast"
import { ESP32StatusButton } from "@/components/esp32-status-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useESP32 } from "@/lib/esp32-context"
import { pusherClient } from "@/lib/pusher"
import type { Order } from "@/types/order"
import { OrderStatus } from "@prisma/client"

export default function ChefPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null)
  const notificationSound = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()
  const { isConnected, sendStatus } = useESP32()

  // Initialize audio element for notification sound
  useEffect(() => {
    notificationSound.current = new Audio("/notification.mp3")
    return () => {
      if (notificationSound.current) {
        notificationSound.current.pause()
        notificationSound.current = null
      }
    }
  }, [])

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

    // Subscribe to Pusher channel for real-time updates
    const channel = pusherClient.subscribe("orders")

    // Listen for new orders
    channel.bind("order-created", (data: { order: Order }) => {
      // Play notification sound
      if (notificationSound.current) {
        notificationSound.current.play().catch((err) => console.error("Error playing notification:", err))
      }

      // Add the new order to the list
      setOrders((prevOrders) => [data.order, ...prevOrders])

      // Show notification
      setNewOrderAlert(data.order.id)
      setTimeout(() => setNewOrderAlert(null), 5000)

      toast({
        title: "New Order Received",
        description: `Order #${data.order.id.substring(0, 8)}... has been placed`,
      })
    })

    // Listen for order updates
    channel.bind("order-updated", (data: { order: Order }) => {
      setOrders((prevOrders) => prevOrders.map((order) => (order.id === data.order.id ? data.order : order)))

      if (selectedOrder?.id === data.order.id) {
        setSelectedOrder(data.order)
      }
    })

    // Poll for new orders every 30 seconds as a fallback
    const intervalId = setInterval(fetchOrders, 30000)

    return () => {
      clearInterval(intervalId)
      pusherClient.unsubscribe("orders")
    }
  }, [toast])

  // Update the updateOrderStatus function to include the order ID
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
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

      // If ESP32 is connected, send the status update (but not for PENDING)
      if (isConnected && newStatus !== "PENDING") {
        sendStatus(orderId, newStatus)
      }

      toast({
        title: `Order ${newStatus.toLowerCase()}`,
        description: `Order #${orderId.substring(0, 8)}... has been ${newStatus.toLowerCase()}`,
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

  // Filter orders by status for better organization
  const pendingOrders = orders.filter((order) => order.status === "PENDING")
  const acceptedOrders = orders.filter((order) => order.status === "ACCEPTED")
  const completedOrders = orders.filter((order) => order.status === "READY" || order.status === "REJECTED")

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
            <h1 className="text-xl font-heading truncate">Chef Dashboard</h1>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <ESP32StatusButton />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>

          {/* Mobile navigation */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <ESP32StatusButton />
            <MobileMenu />
          </div>
        </div>
      </header>
      <main className="flex-1 container py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-heading mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:from-primary dark:to-primary/70">
              Incoming Orders
            </h2>
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
            <div className="space-y-8">
              {pendingOrders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                    Pending Orders ({pendingOrders.length})
                  </h3>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {pendingOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={newOrderAlert === order.id ? { scale: 0.95, opacity: 0 } : false}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={newOrderAlert === order.id ? "relative" : ""}
                        >
                          {newOrderAlert === order.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 z-10"
                            >
                              <Bell className="h-4 w-4" />
                            </motion.div>
                          )}
                          <Card
                            className={`border-amber-200 dark:border-amber-900/30 ${
                              newOrderAlert === order.id
                                ? "shadow-lg ring-2 ring-amber-500 dark:ring-amber-400"
                                : "shadow-sm hover:shadow-md"
                            } transition-all duration-300`}
                          >
                            <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-bold text-lg">Order #{order.id.substring(0, 8)}...</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <StatusBadge status={order.status} />
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="grid grid-cols-[80px_1fr] gap-4">
                                <div className="relative h-20 w-20 rounded-md overflow-hidden">
                                  {order.items[0]?.menuItemId ? (
                                    <Image
                                      src={
                                        order.items[0].image ||
                                        `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(order.items[0].name)}`
                                      }
                                      alt={order.items[0].name}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="bg-muted h-full w-full flex items-center justify-center">
                                      <Utensils className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="space-y-1">
                                    {order.items.slice(0, 2).map((item, index) => (
                                      <div key={index} className="flex justify-between">
                                        <p className="font-medium">
                                          {item.quantity}x {item.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                      </div>
                                    ))}
                                    {order.items.length > 2 && (
                                      <p className="text-sm text-muted-foreground">
                                        +{order.items.length - 2} more items
                                      </p>
                                    )}
                                  </div>
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Ordered{" "}
                                    {new Date(order.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openOrderDetails(order)}
                                className="gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, "REJECTED")}
                                  className="border-red-200 hover:bg-red-100 hover:text-red-600 gap-1 dark:border-red-900/30 dark:hover:bg-red-900/30"
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
                              </div>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {acceptedOrders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    In Progress ({acceptedOrders.length})
                  </h3>
                  <div className="space-y-4">
                    {acceptedOrders.map((order) => (
                      <Card
                        key={order.id}
                        className="border-green-200 dark:border-green-900/30 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-lg">Order #{order.id.substring(0, 8)}...</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-[80px_1fr] gap-4">
                            <div className="relative h-20 w-20 rounded-md overflow-hidden">
                              {order.items[0]?.menuItemId ? (
                                <Image
                                  src={
                                    order.items[0].image ||
                                    `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(order.items[0].name)}`
                                  }
                                  alt={order.items[0].name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="bg-muted h-full w-full flex items-center justify-center">
                                  <Utensils className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="space-y-1">
                                {order.items.slice(0, 2).map((item, index) => (
                                  <div key={index} className="flex justify-between">
                                    <p className="font-medium">
                                      {item.quantity}x {item.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <p className="text-sm text-muted-foreground">+{order.items.length - 2} more items</p>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                Ordered{" "}
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <Button variant="outline" size="sm" onClick={() => openOrderDetails(order)} className="gap-1">
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "READY")}
                            className="bg-blue-600 hover:bg-blue-700 gap-1"
                          >
                            <Clock className="h-4 w-4" />
                            Mark Ready
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {completedOrders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Completed Orders ({completedOrders.length})
                  </h3>
                  <div className="space-y-4">
                    {completedOrders.slice(0, 5).map((order) => (
                      <Card
                        key={order.id}
                        className="opacity-80 hover:opacity-100 border-muted shadow-sm transition-all duration-300"
                      >
                        <CardHeader className="pb-2 bg-muted/30">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-lg">Order #{order.id.substring(0, 8)}...</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-[80px_1fr] gap-4">
                            <div className="relative h-20 w-20 rounded-md overflow-hidden">
                              {order.items[0]?.menuItemId ? (
                                <Image
                                  src={
                                    order.items[0].image ||
                                    `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(order.items[0].name)}`
                                  }
                                  alt={order.items[0].name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="bg-muted h-full w-full flex items-center justify-center">
                                  <Utensils className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="space-y-1">
                                {order.items.slice(0, 2).map((item, index) => (
                                  <div key={index} className="flex justify-between">
                                    <p className="font-medium">
                                      {item.quantity}x {item.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <p className="text-sm text-muted-foreground">+{order.items.length - 2} more items</p>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                Ordered{" "}
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDetails(order)}
                            className="gap-1 w-full"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                    {completedOrders.length > 5 && (
                      <p className="text-center text-sm text-muted-foreground">
                        +{completedOrders.length - 5} more completed orders
                      </p>
                    )}
                  </div>
                </div>
              )}
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

      {/* Hidden audio element for notification sound */}
      <audio ref={notificationSound} src="/notification.mp3" preload="auto" />
    </div>
  )
}

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <MenuIcon className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-48 rounded-md border bg-background shadow-lg">
          <div className="py-1">
            <Link href="/" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </div>
            </Link>
            <Link href="/menu" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                <span>Menu</span>
              </div>
            </Link>
            <Link href="/orders" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Orders</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
