"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface DiceProps {
  onRoll: (value: number) => void
  disabled?: boolean
}

export function Dice({ onRoll, disabled }: DiceProps) {
  const [value, setValue] = useState(1)
  const [isRolling, setIsRolling] = useState(false)

  const roll = () => {
    if (disabled || isRolling) return

    setIsRolling(true)

    // Animate through random values
    let rolls = 0
    const maxRolls = 10
    const interval = setInterval(() => {
      setValue(Math.floor(Math.random() * 6) + 1)
      rolls++

      if (rolls >= maxRolls) {
        clearInterval(interval)
        const finalValue = Math.floor(Math.random() * 6) + 1
        setValue(finalValue)
        setIsRolling(false)
        onRoll(finalValue)
      }
    }, 100)
  }

  const getDiceFace = () => {
    const dotPositions: Record<number, string[]> = {
      1: ["center"],
      2: ["top-right", "bottom-left"],
      3: ["top-right", "center", "bottom-left"],
      4: ["top-left", "top-right", "bottom-left", "bottom-right"],
      5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
      6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
    }

    return dotPositions[value] || []
  }

  const getPositionClass = (pos: string) => {
    switch (pos) {
      case "top-left":
        return "top-2 left-2"
      case "top-right":
        return "top-2 right-2"
      case "middle-left":
        return "top-1/2 -translate-y-1/2 left-2"
      case "middle-right":
        return "top-1/2 -translate-y-1/2 right-2"
      case "bottom-left":
        return "bottom-2 left-2"
      case "bottom-right":
        return "bottom-2 right-2"
      case "center":
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      default:
        return ""
    }
  }

  return (
    <button
      onClick={roll}
      disabled={disabled || isRolling}
      className={cn(
        "relative w-20 h-20 bg-white rounded-xl shadow-lg border-4 border-rose-300 transition-all",
        isRolling && "animate-bounce",
        !disabled && "hover:shadow-xl hover:scale-105 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {getDiceFace().map((pos, i) => (
        <div key={i} className={cn("absolute w-3 h-3 bg-rose-500 rounded-full", getPositionClass(pos))} />
      ))}
    </button>
  )
}
