"use client"

import { Check, X, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import type { Order } from "@/types/order"

interface OrderDetailsModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onAccept?: () => void
  onReject?: () => void
  onReady?: () => void
}

export function OrderDetailsModal({ order, isOpen, onClose, onAccept, onReject, onReady }: OrderDetailsModalProps) {
  const totalPrice = order.items.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Order #{order.id}</span>
            <StatusBadge status={order.status} />
          </DialogTitle>
          <DialogDescription>
            Placed at {new Date(order.createdAt).toLocaleTimeString()} on{" "}
            {new Date(order.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between">
                    <p className="font-medium">
                      {item.quantity}x {item.name}
                    </p>
                    <p>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  {item.notes && <p className="text-sm text-muted-foreground mt-1">Note: {item.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t">
            <p className="font-bold">Total</p>
            <p className="font-bold">${totalPrice.toFixed(2)}</p>
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between">
          {onReject && onAccept ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={onReject}
                className="border-red-200 hover:bg-red-100 hover:text-red-600 gap-1 flex-1"
              >
                <X className="h-4 w-4" />
                Reject Order
              </Button>
              <Button onClick={onAccept} className="bg-green-600 hover:bg-green-700 gap-1 flex-1">
                <Check className="h-4 w-4" />
                Accept Order
              </Button>
            </div>
          ) : onReady ? (
            <div className="flex gap-2 w-full">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Close
              </Button>
              <Button onClick={onReady} className="bg-blue-600 hover:bg-blue-700 gap-1 flex-1">
                <Clock className="h-4 w-4" />
                Mark as Ready
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
