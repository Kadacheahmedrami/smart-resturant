import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pusher } from "@/lib/pusher"

export async function GET() {
  try {
    const ratings = await prisma.rating.findMany({
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(ratings)
  } catch (error) {
    console.error("Error fetching ratings:", error)
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request body
    if (!body.orderId || !body.score || body.score < 1 || body.score > 5) {
      return NextResponse.json({ error: "Invalid rating data" }, { status: 400 })
    }

    // Check if order exists and is in READY status
    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "READY") {
      return NextResponse.json({ error: "Can only rate orders that are ready" }, { status: 400 })
    }

    // Check if rating already exists for this order
    const existingRating = await prisma.rating.findUnique({
      where: { orderId: body.orderId },
    })

    if (existingRating) {
      // Update existing rating
      const updatedRating = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          score: body.score,
          comment: body.comment || "",
        },
        include: {
          order: true,
        },
      })

      // Trigger Pusher event for real-time updates
      await pusher.trigger(`order-${body.orderId}`, "rating-updated", {
        rating: updatedRating,
      })

      return NextResponse.json(updatedRating)
    } else {
      // Create new rating
      const newRating = await prisma.rating.create({
        data: {
          score: body.score,
          comment: body.comment || "",
          order: {
            connect: { id: body.orderId },
          },
        },
        include: {
          order: true,
        },
      })

      // Trigger Pusher event for real-time updates
      await pusher.trigger(`order-${body.orderId}`, "rating-created", {
        rating: newRating,
      })

      return NextResponse.json(newRating, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating/updating rating:", error)
    return NextResponse.json({ error: "Failed to save rating" }, { status: 500 })
  }
}
