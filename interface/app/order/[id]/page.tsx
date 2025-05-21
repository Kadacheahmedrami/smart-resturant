import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ESP32StatusButton } from "@/components/esp32-status-button"
import { OrderClient } from "@/components/order-client"
import { ThemeToggle } from "@/components/theme-toggle"
import { prisma } from "@/lib/prisma"

// Server Component that fetches order data
async function getOrder(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        rating: true,
      },
    })

    return order
  } catch (error) {
    console.error("Error fetching order:", error)
    throw new Error("Failed to fetch order details")
  }
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Await the params promise to get the actual values
  const { id } = await params

  // Fetch the order data directly in the server component
  let orderData = null
  let errorMessage = null

  try {
    orderData = await getOrder(id)
  } catch (error) {
    console.error("Error fetching order:", error)
    errorMessage = "Failed to fetch order details"
  }

  // Create a shortened version of the ID for display
  const shortId = id.length > 8 ? `${id.substring(0, 8)}...` : id

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="transition-colors hover:bg-muted">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
            <h1 className="text-xl font-heading flex items-center">
              <span>Order</span>
              <span className="ml-2 max-w-[150px] sm:max-w-[300px] truncate text-muted-foreground" title={id}>
                #{id}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <ESP32StatusButton />
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="gap-1 transition-colors hover:bg-muted">
                <ArrowLeft className="h-4 w-4" />
                All Orders
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-heading mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:from-primary dark:to-primary/70">
              Order Status
            </h2>
            <p className="text-muted-foreground">Track the progress of your order in real-time</p>
          </div>

          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading status...</p>
              </div>
            }
          >
            <OrderClient initialOrder={orderData} initialError={errorMessage} orderId={id} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
