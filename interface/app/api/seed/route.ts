import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// This endpoint is for development purposes only
// It seeds the database with initial menu items
export async function POST() {
  try {
    // Check if we already have menu items
    const existingItems = await prisma.menuItem.count()

    if (existingItems > 0) {
      return NextResponse.json({
        message: "Database already seeded",
        count: existingItems,
      })
    }

    // Seed menu items
    const menuItems = await prisma.menuItem.createMany({
      data: [
        {
          name: "Margherita Pizza",
          description: "Classic pizza with tomato sauce, mozzarella, and basil",
          price: 12.99,
          image: "/placeholder.svg?height=200&width=300",
          category: "Pizza",
        },
        {
          name: "Pepperoni Pizza",
          description: "Pizza topped with pepperoni slices and cheese",
          price: 14.99,
          image: "/placeholder.svg?height=200&width=300",
          category: "Pizza",
        },
        {
          name: "Caesar Salad",
          description: "Fresh romaine lettuce with Caesar dressing and croutons",
          price: 8.99,
          image: "/placeholder.svg?height=200&width=300",
          category: "Salad",
        },
        {
          name: "Spaghetti Carbonara",
          description: "Pasta with creamy sauce, pancetta, and Parmesan cheese",
          price: 15.99,
          image: "/placeholder.svg?height=200&width=300",
          category: "Pasta",
        },
        {
          name: "Grilled Salmon",
          description: "Fresh salmon fillet with lemon butter sauce and vegetables",
          price: 18.99,
          image: "/placeholder.svg?height=200&width=300",
          category: "Main Course",
        },
        {
          name: "Chocolate Cake",
          description: "Rich chocolate cake with a scoop of vanilla ice cream",
          price: 7.99,
          image: "/placeholder.svg?height=200&width=300",
          category: "Dessert",
        },
      ],
    })

    return NextResponse.json({
      message: "Database seeded successfully",
      count: menuItems.count,
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
}
