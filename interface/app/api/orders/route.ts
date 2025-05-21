import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pusher } from "@/lib/pusher"

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request body
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Invalid order items" }, { status: 400 })
    }

    // Create a new order with items
    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        items: {
          create: body.items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
            notes: item.notes || "",
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Trigger Pusher event for real-time updates to the chef dashboard
    await pusher.trigger("orders", "order-created", {
      order: order,
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
