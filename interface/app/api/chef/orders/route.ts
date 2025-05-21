import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all orders, sorted by creation date (newest first)
    // We'll filter on the client side if needed
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
    console.error("Error fetching orders for chef:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
