"use client"

import { Button } from "@/components/ui/button"
import { Heart, Trophy, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface WinnerModalProps {
  winner: string
  reward: string
  onRestart: () => void
}

export function WinnerModal({ winner, reward, onRestart }: WinnerModalProps) {
  useEffect(() => {
    // Fire confetti
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ff6b9d", "#ffd93d", "#6bcb77"],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ff6b9d", "#ffd93d", "#6bcb77"],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-rose-100 to-amber-100 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Trophy className="w-20 h-20 text-amber-500" />
            <Sparkles className="w-8 h-8 text-rose-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-rose-600 mb-2 flex items-center justify-center gap-2">
          <Heart className="w-8 h-8 fill-rose-500" />
          恭喜！
          <Heart className="w-8 h-8 fill-rose-500" />
        </h2>

        <p className="text-2xl font-bold text-foreground mb-4">{winner} 获胜！</p>

        <div className="bg-white/80 rounded-xl p-4 mb-6">
          <p className="text-sm text-muted-foreground mb-1">胜利奖励</p>
          <p className="text-lg font-bold text-rose-600">{reward}</p>
        </div>

        <Button onClick={onRestart} className="w-full bg-rose-500 hover:bg-rose-600 text-white text-lg py-6">
          再来一局 💕
        </Button>
      </div>
    </div>
  )
}
