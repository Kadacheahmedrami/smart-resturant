import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all orders, sorted by creation date (newest first)
    // Include the related MenuItem data to get the image
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                image: true, // Only select the image field from MenuItem
              }
            }
          }
        },
        rating: true, // Also include rating if you need it
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform the data to match your OrderItem interface
    const transformedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        id: item.id,
        menuItemId: item.menuItemId,
        orderId: item.orderId,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        notes: item.notes,
        image: item.menuItem.image, // Get image from the related MenuItem
      }))
    }))

    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error("Error fetching orders for chef:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}