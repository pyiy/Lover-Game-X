"use client"

import { Wifi, WifiOff, Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface SyncIndicatorProps {
  roomId: string
  isSyncing: boolean
  isConnected: boolean
}

export function SyncIndicator({ roomId, isSyncing, isConnected }: SyncIndicatorProps) {
  const [copied, setCopied] = useState(false)

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-white/90 rounded-full px-3 py-1.5 shadow-sm">
      {isConnected ? (
        <Wifi className={`w-4 h-4 ${isSyncing ? "text-yellow-500 animate-pulse" : "text-green-500"}`} />
      ) : (
        <WifiOff className="w-4 h-4 text-red-500" />
      )}
      <span className="text-xs font-mono font-medium">{roomId}</span>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={copyRoomId}>
        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      </Button>
    </div>
  )
}
