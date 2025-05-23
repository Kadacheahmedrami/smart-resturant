export interface OrderItem {
  id: string
  menuItemId: number
  orderId: string
  quantity: number
  name: string
  price: number
  notes?: string
  image: string | null
}

export interface Rating {
  id: string
  score: number
  comment: string | null
  orderId: string
  createdAt: string
}

export interface Order {
  id: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "READY"
  items: OrderItem[]
  rating?: Rating | null
  createdAt: string
  updatedAt: string

}


// types/order.ts
export type OrderStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "READY";