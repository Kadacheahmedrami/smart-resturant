import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ESP32StatusButton } from "@/components/esp32-status-button"
import { RatingClient } from "@/components/rating-client"
import { prisma } from "@/lib/prisma"

// Server Component that fetches rating data
async function getRating(id: string) {
  try {
    const rating = await prisma.rating.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    })

    return rating
  } catch (error) {
    console.error("Error fetching rating:", error)
    throw new Error("Failed to fetch rating details")
  }
}

export default async function RatingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Await the params promise to get the actual values
  const { id } = await params
  const ratingPromise = getRating(id)

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
            <h1 className="text-xl font-bold">Rating Details</h1>
          </div>
          <div className="flex items-center gap-4">
            <ESP32StatusButton />
            <Link href="/ratings">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                All Ratings
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Rating Details</h2>
            <p className="text-muted-foreground">View detailed information about this rating</p>
          </div>

          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading rating details...</p>
              </div>
            }
          >
            <RatingClient ratingPromise={ratingPromise} ratingId={id} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
