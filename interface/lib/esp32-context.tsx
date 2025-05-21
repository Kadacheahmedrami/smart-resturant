"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

interface ESP32ContextType {
  esp32IP: string
  setESP32IP: (ip: string) => void
  isConnected: boolean
  connect: () => Promise<boolean>
  disconnect: () => void
  sendStatus: (status: string) => Promise<boolean>
}

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

  const sendStatus = async (status: string) => {
    if (!isConnected || !esp32IP) {
      return false
    }

    try {
      const response = await fetch(`http://${esp32IP}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: status.toLowerCase() }),
      })

      if (response.ok) {
        toast({
          title: "ESP32 Updated",
          description: `ESP32 status updated to ${status}`,
        })
        return true
      } else {
        toast({
          title: "ESP32 Update Failed",
          description: "Failed to update ESP32 status",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Failed to send status to ESP32:", error)
      toast({
        title: "ESP32 Update Failed",
        description: "Failed to update ESP32 status",
        variant: "destructive",
      })
      setIsConnected(false)
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
