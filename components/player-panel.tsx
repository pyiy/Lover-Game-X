"use client"

import { cn } from "@/lib/utils"
import { Pause } from "lucide-react"

interface PlayerPanelProps {
  playerNumber: 1 | 2
  name: string
  position: number
  isCurrentPlayer: boolean
  totalCells: number
  isSkipped?: boolean
}

export function PlayerPanel({
  playerNumber,
  name,
  position,
  isCurrentPlayer,
  totalCells,
  isSkipped,
}: PlayerPanelProps) {
  const progress = (position / (totalCells - 1)) * 100

  return (
    <div
      className={cn(
        "p-2 md:p-4 rounded-xl transition-all border-2",
        playerNumber === 1 ? "bg-blue-50 border-blue-300" : "bg-pink-50 border-pink-300",
        isCurrentPlayer && "ring-2 md:ring-4 ring-offset-1 md:ring-offset-2",
        isCurrentPlayer && playerNumber === 1 && "ring-blue-400",
        isCurrentPlayer && playerNumber === 2 && "ring-pink-400",
      )}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div
          className={cn(
            "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white text-base md:text-xl font-bold shrink-0",
            playerNumber === 1 ? "bg-blue-500" : "bg-pink-500",
          )}
        >
          {playerNumber === 1 ? "♂" : "♀"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm md:text-lg truncate">{playerNumber === 1 ? "玩家1" : "玩家2"}</p>
          <p className="text-[10px] md:text-sm text-muted-foreground">
            {position + 1} / {totalCells}
          </p>
        </div>

        {isSkipped && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-200 rounded-full text-[10px] md:text-xs text-gray-600 shrink-0">
            <Pause className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span>停</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-1.5 md:mt-3 h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", playerNumber === 1 ? "bg-blue-500" : "bg-pink-500")}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isCurrentPlayer && !isSkipped && (
        <p className="hidden md:block mt-2 text-center text-sm font-medium animate-pulse">轮到你了！点击骰子</p>
      )}

      {isCurrentPlayer && isSkipped && (
        <p className="hidden md:block mt-2 text-center text-sm font-medium text-gray-500">本轮暂停，点击骰子跳过</p>
      )}
    </div>
  )
}
