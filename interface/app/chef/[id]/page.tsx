import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ESP32StatusButton } from "@/components/esp32-status-button"
import { ChefOrderClient } from "@/components/chef-order-client"
import { prisma } from "@/lib/prisma"

// Server Component that fetches order data for chef
async function getOrderForChef(id: string) {
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
    console.error("Error fetching order for chef:", error)
    throw new Error("Failed to fetch order details")
  }
}

export default async function ChefOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Await the params promise to get the actual values
  const { id } = await params
  const orderPromise = getOrderForChef(id)

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
            <h1 className="text-xl font-bold">Chef View: Order #{id}</h1>
          </div>
          <div className="flex items-center gap-4">
            <ESP32StatusButton />
            <Link href="/chef">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Order Management</h2>
            <p className="text-muted-foreground">View and update order details</p>
          </div>

          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading order details...</p>
              </div>
            }
          >
            <ChefOrderClient orderPromise={orderPromise} orderId={id} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
