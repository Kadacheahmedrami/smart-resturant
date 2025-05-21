import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pusher } from "@/lib/pusher"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        rating: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Validate request body
    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Validate status value
    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "READY"]
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: body.status,
        updatedAt: new Date(),
      },
      include: {
        items: true,
        rating: true,
      },
    })

    // Trigger Pusher event for real-time updates
    await pusher.trigger(`order-${id}`, "order-updated", {
      order: updatedOrder,
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
