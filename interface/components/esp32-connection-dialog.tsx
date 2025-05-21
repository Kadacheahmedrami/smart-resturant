"use client"

import { useState } from "react"
import { Wifi, WifiOff } from "lucide-react"

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
import { useESP32 } from "@/lib/esp32-context"

interface ESP32ConnectionDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ESP32ConnectionDialog({ isOpen, onClose }: ESP32ConnectionDialogProps) {
  const { esp32IP, setESP32IP, isConnected, connect, disconnect } = useESP32()
  const [inputIP, setInputIP] = useState(esp32IP)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    setESP32IP(inputIP)
    await connect()
    setIsConnecting(false)
  }

  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ESP32 Connection</DialogTitle>
          <DialogDescription>
            Enter the IP address of your ESP32 device to connect and receive status updates.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="esp32-ip" className="text-right">
              ESP32 IP
            </Label>
            <Input
              id="esp32-ip"
              placeholder="192.168.1.100"
              value={inputIP}
              onChange={(e) => setInputIP(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
            <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
        <DialogFooter>
          {isConnected ? (
            <Button variant="outline" onClick={handleDisconnect}>
              <WifiOff className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Connect
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
