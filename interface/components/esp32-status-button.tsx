"use client"

import { useState } from "react"
import { Wifi, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ESP32ConnectionDialog } from "@/components/esp32-connection-dialog"
import { useESP32 } from "@/lib/esp32-context"
import { motion } from "framer-motion"

export function ESP32StatusButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { isConnected } = useESP32()

  return (
    <>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 transition-all duration-300 ${
            isConnected
              ? "border-green-500 text-green-600 dark:border-green-700 dark:text-green-500"
              : "border-red-300 text-red-500 dark:border-red-800 dark:text-red-400"
          }`}
          onClick={() => setIsDialogOpen(true)}
        >
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4" />
              <span className="hidden sm:inline">ESP32 Connected</span>
              <span className="sm:hidden">ESP32</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="hidden sm:inline">ESP32 Disconnected</span>
              <span className="sm:hidden">ESP32</span>
            </>
          )}
        </Button>
      </motion.div>

      <ESP32ConnectionDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  )
}
