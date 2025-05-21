"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Home, Minus, Plus, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ESP32StatusButton } from "@/components/esp32-status-button"
import type { MenuItem } from "@/types/menu"

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number }>>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("/api/menu")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setMenuItems(data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch menu:", error)
        toast({
          title: "Error",
          description: "Failed to load menu items. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchMenu()
  }, [toast])

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.item.id === item.id)
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.item.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      } else {
        return [...prevCart, { item, quantity: 1 }]
      }
    })

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    })
  }

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId)
      return
    }

    setCart((prevCart) =>
      prevCart.map((cartItem) => (cartItem.item.id === itemId ? { ...cartItem, quantity: newQuantity } : cartItem)),
    )
  }

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => prevCart.filter((cartItem) => cartItem.item.id !== itemId))
  }

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((cartItem) => ({
            menuItemId: cartItem.item.id,
            quantity: cartItem.quantity,
            name: cartItem.item.name,
            price: cartItem.item.price,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create order")
      }

      const data = await response.json()

      // Clear cart and redirect to order page
      setCart([])
      router.push(`/order/${data.id}`)
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Order Failed",
        description: "There was a problem placing your order. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = cart.reduce((total, item) => total + item.item.price * item.quantity, 0)

  return (
    <div className="min-h-screen mb-32 md:mb-24 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Menu</h1>
          </div>
          <div className="flex items-center gap-4">
            <ESP32StatusButton />
            <div className="relative">
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Cart</span>
                {totalItems > 0 && <Badge className="ml-1 bg-primary text-primary-foreground">{totalItems}</Badge>}
              </Button>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-10">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">No menu items available</h3>
            <p className="text-muted-foreground mb-6">Please check back later or seed the database.</p>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch("/api/seed", { method: "POST" })
                  if (response.ok) {
                    toast({
                      title: "Database Seeded",
                      description: "Menu items have been added to the database.",
                    })
                    window.location.reload()
                  }
                } catch (error) {
                  toast({
                    title: "Seeding Failed",
                    description: "Failed to seed the database.",
                    variant: "destructive",
                  })
                }
              }}
            >
              Seed Database
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative h-48 w-full">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{item.name}</CardTitle>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                  <p className="text-lg font-bold mt-2">${item.price.toFixed(2)}</p>
                </CardContent>
                <CardFooter>
                  {cart.find((cartItem) => cartItem.item.id === item.id) ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => {
                            const currentItem = cart.find((cartItem) => cartItem.item.id === item.id)
                            if (currentItem) {
                              updateQuantity(item.id, currentItem.quantity - 1)
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">
                          {cart.find((cartItem) => cartItem.item.id === item.id)?.quantity || 0}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => {
                            const currentItem = cart.find((cartItem) => cartItem.item.id === item.id)
                            if (currentItem) {
                              updateQuantity(item.id, currentItem.quantity + 1)
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => removeFromCart(item.id)}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => addToCart(item)} className="w-full">
                      Add to Cart
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
            <div className="container flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-medium">
                  {totalItems} {totalItems === 1 ? "item" : "items"} in cart
                </p>
                <p className="text-lg font-bold">Total: ${totalPrice.toFixed(2)}</p>
              </div>
              <Button size="lg" onClick={placeOrder} disabled={loading}>
                {loading ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
