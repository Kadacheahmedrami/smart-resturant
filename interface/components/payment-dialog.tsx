"use client"

import type React from "react"

import { useState } from "react"
import { CreditCard, Calendar, User, Lock, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onPaymentComplete: () => void
  amount: number
}

export function PaymentDialog({ isOpen, onClose, onPaymentComplete, amount }: PaymentDialogProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [cvv, setCvv] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")

    // Add space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ")

    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19)
  }

  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")

    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
    }

    return digits
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
  }

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!cardNumber || cardNumber.replace(/\s/g, "").length !== 16) {
      newErrors.cardNumber = "Please enter a valid 16-digit card number"
    }

    if (!expiryDate || expiryDate.length !== 5) {
      newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)"
    } else {
      const [month, year] = expiryDate.split("/")
      const currentYear = new Date().getFullYear() % 100
      const currentMonth = new Date().getMonth() + 1

      if (Number.parseInt(month) < 1 || Number.parseInt(month) > 12) {
        newErrors.expiryDate = "Invalid month"
      } else if (
        Number.parseInt(year) < currentYear ||
        (Number.parseInt(year) === currentYear && Number.parseInt(month) < currentMonth)
      ) {
        newErrors.expiryDate = "Card has expired"
      }
    }

    if (!cardholderName) {
      newErrors.cardholderName = "Please enter the cardholder name"
    }

    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = "Please enter a valid CVV"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setIsSuccess(true)

      // Show success state for a moment before closing
      setTimeout(() => {
        setIsSuccess(false)
        onPaymentComplete()
      }, 1500)
    }, 1500)
  }

  const handleDialogClose = () => {
    if (!isProcessing) {
      setCardNumber("")
      setExpiryDate("")
      setCardholderName("")
      setCvv("")
      setErrors({})
      setIsSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
              >
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </motion.div>
              <h2 className="text-xl font-heading text-center mb-2">Payment Successful!</h2>
              <p className="text-center text-muted-foreground mb-4">
                Your payment of ${amount.toFixed(2)} has been processed successfully.
              </p>
              <p className="text-center text-sm text-muted-foreground">Redirecting you back...</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
                <DialogDescription>Enter your payment details to complete your order.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="card-number" className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Card Number
                  </Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    className={errors.cardNumber ? "border-red-500 dark:border-red-700" : ""}
                  />
                  {errors.cardNumber && <p className="text-xs text-red-500 dark:text-red-400">{errors.cardNumber}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expiry-date" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Expiry Date
                    </Label>
                    <Input
                      id="expiry-date"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={handleExpiryDateChange}
                      maxLength={5}
                      className={errors.expiryDate ? "border-red-500 dark:border-red-700" : ""}
                    />
                    {errors.expiryDate && <p className="text-xs text-red-500 dark:text-red-400">{errors.expiryDate}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cvv" className="flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      className={errors.cvv ? "border-red-500 dark:border-red-700" : ""}
                    />
                    {errors.cvv && <p className="text-xs text-red-500 dark:text-red-400">{errors.cvv}</p>}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cardholder-name" className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Cardholder Name
                  </Label>
                  <Input
                    id="cardholder-name"
                    placeholder="John Doe"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className={errors.cardholderName ? "border-red-500 dark:border-red-700" : ""}
                  />
                  {errors.cardholderName && (
                    <p className="text-xs text-red-500 dark:text-red-400">{errors.cardholderName}</p>
                  )}
                </div>

                <div className="mt-2 p-4 bg-muted rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-lg font-bold">${amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleDialogClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    `Pay $${amount.toFixed(2)}`
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
