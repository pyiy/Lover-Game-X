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

  const copyRoomId = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(roomId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = roomId
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          const successful = document.execCommand("copy")
          if (successful) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
        } catch (e) {
          console.error("execCommand copy failed:", e)
        }
        document.body.removeChild(textArea)
      }
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  return (
    <div className="flex items-center gap-1.5 md:gap-2 bg-white/90 rounded-full px-2 md:px-3 py-1 md:py-1.5 shadow-sm">
      {isConnected ? (
        <Wifi className={`w-3 h-3 md:w-4 md:h-4 ${isSyncing ? "text-yellow-500 animate-pulse" : "text-green-500"}`} />
      ) : (
        <WifiOff className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
      )}
      <span className="text-[10px] md:text-xs font-mono font-medium">{roomId}</span>
      <Button variant="ghost" size="sm" className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-gray-100" onClick={copyRoomId}>
        {copied ? (
          <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-500" />
        ) : (
          <Copy className="w-2.5 h-2.5 md:w-3 md:h-3" />
        )}
      </Button>
    </div>
  )
}
