"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import type { ESP32ContextType } from "@/types/esp32"

const ESP32Context = createContext<ESP32ContextType | undefined>(undefined)

export function ESP32Provider({ children }: { children: ReactNode }) {
  const [esp32IP, setESP32IP] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const { toast } = useToast()

  // Load ESP32 IP from localStorage on mount
  useEffect(() => {
    const savedIP = localStorage.getItem("esp32IP")
    if (savedIP) {
      setESP32IP(savedIP)
      // Try to connect automatically if we have a saved IP
      checkConnection(savedIP)
    }
  }, [])

  // Save ESP32 IP to localStorage whenever it changes
  useEffect(() => {
    if (esp32IP) {
      localStorage.setItem("esp32IP", esp32IP)
    }
  }, [esp32IP])

  const checkConnection = async (ip: string) => {
    if (!ip) return false

    try {
      // Changed from /status to /info to match ESP32 endpoint
      const response = await fetch(`http://${ip}/info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Short timeout to avoid long waits if device is not available
        signal: AbortSignal.timeout(3000),
      })

      if (response.ok) {
        setIsConnected(true)
        return true
      } else {
        setIsConnected(false)
        return false
      }
    } catch (error) {
      console.error("Failed to connect to ESP32:", error)
      setIsConnected(false)
      return false
    }
  }

  const connect = async () => {
    if (!esp32IP) {
      toast({
        title: "No IP Address",
        description: "Please enter an ESP32 IP address first",
        variant: "destructive",
      })
      return false
    }

    const success = await checkConnection(esp32IP)

    if (success) {
      toast({
        title: "Connected",
        description: `Successfully connected to ESP32 at ${esp32IP}`,
      })
    } else {
      toast({
        title: "Connection Failed",
        description: "Could not connect to ESP32. Please check the IP address and try again.",
        variant: "destructive",
      })
    }

    return success
  }

  const disconnect = () => {
    setIsConnected(false)
    toast({
      title: "Disconnected",
      description: "Disconnected from ESP32",
    })
  }

  const sendStatus = async (orderId: string, status: string) => {
    // Skip sending PENDING status - never send this status
    if (status.toLowerCase() === "pending") {
      console.log("Skipping PENDING status - not sending to ESP32")
      return true
    }

    // Check if we're connected and have an IP
    if (!isConnected || !esp32IP) {
      console.log("ESP32 not connected, skipping status update")
      return false
    }

    // Use localStorage to track which statuses have been sent for each order
    const sentStatusKey = `esp32_sent_${orderId}_${status.toLowerCase()}`
    const alreadySent = localStorage.getItem(sentStatusKey)

    if (alreadySent) {
      console.log(`Status ${status} for order ${orderId} already sent to ESP32, skipping duplicate`)
      return true
    }

    try {
      console.log(`Sending status ${status} for order ${orderId} to ESP32 at ${esp32IP}`)

      const response = await fetch(`http://${esp32IP}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          status: status.toLowerCase(),
        }),
        // Add a timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        // Mark this status as sent for this order
        localStorage.setItem(sentStatusKey, "true")

        toast({
          title: "ESP32 Updated",
          description: `ESP32 status updated to ${status}`,
        })
        return true
      } else {
        toast({
          title: "ESP32 Update Failed",
          description: `Failed to update ESP32 status: ${response.statusText}`,
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Failed to send status to ESP32:", error)
      toast({
        title: "ESP32 Update Failed",
        description: "Failed to update ESP32 status: connection error",
        variant: "destructive",
      })

      // Only disconnect if it's a network error, not a timeout
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setIsConnected(false)
      }

      return false
    }
  }

  return (
    <ESP32Context.Provider
      value={{
        esp32IP,
        setESP32IP,
        isConnected,
        connect,
        disconnect,
        sendStatus,
      }}
    >
      {children}
    </ESP32Context.Provider>
  )
}

export function useESP32() {
  const context = useContext(ESP32Context)
  if (context === undefined) {
    throw new Error("useESP32 must be used within an ESP32Provider")
  }
  return context
}
