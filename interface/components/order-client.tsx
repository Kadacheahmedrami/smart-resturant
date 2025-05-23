"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle, CreditCard, Clock, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { StarRating } from "@/components/star-rating"
import { useToast } from "@/hooks/use-toast"
import { pusherClient } from "@/lib/pusher"
import { PaymentDialog } from "@/components/payment-dialog"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/types/order"

interface OrderClientProps {
  initialOrder: Order | null
  initialError: string | null
  orderId: string
}

export function OrderClient({ initialOrder, initialError, orderId }: OrderClientProps) {
  const [order, setOrder] = useState<Order | null>(initialOrder)
  const [loading, setLoading] = useState(!initialOrder && !initialError)
  const [error, setError] = useState<string | null>(initialError)
  const [isPaid, setIsPaid] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if the order has a payment status stored in localStorage
    const paymentStatus = localStorage.getItem(`order_${orderId}_paid`)
    if (paymentStatus === "true") {
      setIsPaid(true)
    }


    // If we don't have initial order data and there's no error, fetch it
    if (!initialOrder && !initialError) {
      const fetchOrder = async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}`)

          if (!response.ok) {
            throw new Error(`Error: ${response.status}`)
          }

          const data = await response.json()
          setOrder(data)

      
        } catch (err) {
          console.error("Error fetching order:", err)
          setError("Failed to fetch order details. Please try again.")
        } finally {
          setLoading(false)
        }
      }

      fetchOrder()
    }

    // Subscribe to Pusher channel for real-time updates
    const channel = pusherClient.subscribe(`order-${orderId}`)

    // Listen for order updates
    channel.bind("order-updated", (data: { order: Order }) => {
      setOrder(data.order)

   
      toast({
        title: "Order Updated",
        description: `Your order status has been updated to ${data.order.status}`,
      })
    })

    // Listen for rating updates
    channel.bind("rating-updated", (data: { rating: any }) => {
      setOrder((prevOrder) => {
        if (!prevOrder) return null
        return { ...prevOrder, rating: data.rating }
      })
    })

    channel.bind("rating-created", (data: { rating: any }) => {
      setOrder((prevOrder) => {
        if (!prevOrder) return null
        return { ...prevOrder, rating: data.rating }
      })
    })

    return () => {
      // Unsubscribe from Pusher channel when component unmounts
      pusherClient.unsubscribe(`order-${orderId}`)
    }
  }, [orderId, toast, initialOrder, initialError])

  const handlePayment = () => {
    setIsPaymentDialogOpen(true)
  }

  const completePayment = () => {
    setIsPaid(true)
    setIsPaymentDialogOpen(false)

    // Store payment status in localStorage
    localStorage.setItem(`order_${orderId}_paid`, "true")

    toast({
      title: "Payment Successful",
      description: "Thank you for your payment! Please rate your experience.",
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading status...</p>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 border rounded-lg bg-destructive/5 border-destructive/20"
      >
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link href="/menu">
          <Button>Browse Menu</Button>
        </Link>
      </motion.div>
    )
  }

  if (!order) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 border rounded-lg"
      >
        <h3 className="text-xl font-semibold mb-2">Order not found</h3>
        <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
        <Link href="/menu">
          <Button>Browse Menu</Button>
        </Link>
      </motion.div>
    )
  }

  const totalPrice = order.items.reduce((total, item) => total + item.price * item.quantity, 0)
  const orderDate = new Date(order.createdAt)

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center"
      >
        <StatusBadge status={order.status} size="lg" />
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date(order.updatedAt).toLocaleString()}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden border-muted/40 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="bg-muted/20">
            <CardTitle className="flex justify-between items-center">
              <span>Order Details</span>
              <Badge variant="outline" className="font-mono text-xs">
                {orderDate.toLocaleDateString()} {orderDate.toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Order ID</h4>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div className="bg-muted/10 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <p className="font-medium">{order.status}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Items
                </h4>
                <div className="space-y-2 divide-y divide-border/50">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{item.notes}"</p>}
                      </div>
                      <div className="text-sm font-medium">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <p className="font-bold">Total</p>
                <p className="font-bold text-lg">${totalPrice.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {order.status === "ACCEPTED" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-900/50 rounded-lg p-6 text-center shadow-sm"
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-heading mb-2 text-green-800 dark:text-green-400">
              Your order has been accepted!
            </h3>
            <p className="text-green-700 dark:text-green-300 mb-4">
              The restaurant is preparing your food. We'll notify you when it's ready.
            </p>
            <div className="w-full max-w-md mx-auto bg-white/50 dark:bg-white/5 rounded-full h-2.5 mb-4 overflow-hidden">
              <motion.div
                className="bg-green-600 h-2.5 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "50%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
            <p className="text-sm text-green-600 dark:text-green-300 flex items-center justify-center">
              <Clock className="h-4 w-4 mr-1" />
              Estimated preparation time: 15-20 minutes
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {order.status === "READY" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <motion.div
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-6 text-center shadow-sm"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  duration: 2,
                }}
              >
                <CheckCircle className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-heading mb-2 text-blue-800 dark:text-blue-400">
                Your order is ready for pickup!
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                Please proceed to the counter to collect your order.
              </p>
              <div className="w-full max-w-md mx-auto bg-white/50 dark:bg-white/5 rounded-full h-2.5 mb-4 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full w-full" />
              </div>
            </motion.div>

            {!isPaid && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-blue-200 dark:border-blue-900/30 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20">
                    <CardTitle className="text-blue-800 dark:text-blue-400">Payment Required</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Total Amount Due:</p>
                        <p className="text-xl font-bold">${totalPrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Please complete your payment to finalize your order. We accept all major credit cards.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-900/5">
                    <Button onClick={handlePayment} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {isPaid && !order.rating && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-green-200 dark:border-green-900/30 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-900/20">
                    <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Payment Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Thank you for your payment! Please rate your experience with us.
                      </p>
                    </div>
                    <StarRating orderId={order.id} onRatingSubmitted={() => {}} />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {isPaid && order.rating && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-green-200 dark:border-green-900/30 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-900/20">
                    <CardTitle className="text-green-800 dark:text-green-400">Your Rating</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} filled={star <= order.rating!.score} />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {order.rating.createdAt
                          ? `Submitted on ${new Date(order.rating.createdAt).toLocaleDateString()}`
                          : ""}
                      </span>
                    </div>
                    {order.rating.comment && (
                      <div className="bg-muted/20 p-4 rounded-md italic">
                        <p>"{order.rating.comment}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {order.status === "REJECTED" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-6 text-center shadow-sm"
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-heading mb-2 text-red-800 dark:text-red-400">Your order has been rejected</h3>
            <p className="text-red-700 dark:text-red-300 mb-6">
              We're sorry, but the restaurant cannot fulfill your order at this time. This could be due to high demand
              or unavailable ingredients.
            </p>
            <Link href="/menu">
              <Button className="bg-red-600 hover:bg-red-700 text-white">Order Again</Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onPaymentComplete={completePayment}
        amount={totalPrice}
      />
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
