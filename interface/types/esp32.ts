// Create a new file for ESP32 types
export interface ESP32ContextType {
    esp32IP: string
    setESP32IP: (ip: string) => void
    isConnected: boolean
    connect: () => Promise<boolean>
    disconnect: () => void
    sendStatus: (orderId: string, status: string) => Promise<boolean>
  }
  