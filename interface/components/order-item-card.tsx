"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import type { OrderItem } from "@/types/order"

interface OrderItemCardProps {
  item: OrderItem
  index: number
}

export function OrderItemCard({ item, index }: OrderItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
    >
      <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0">
        <Image
          src={`/placeholder.svg?height=64&width=64&text=${encodeURIComponent(item.name.substring(0, 10))}`}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="font-medium truncate">{item.name}</h4>
          <span className="text-sm font-semibold shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
          {item.notes && (
            <span className="text-xs text-muted-foreground italic truncate max-w-[150px]" title={item.notes}>
              "{item.notes}"
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
