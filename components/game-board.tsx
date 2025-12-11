"use client"
import type { GameCell, CellType } from "@/lib/game-data"
import { specialCellConfigs } from "@/lib/game-data"
import { cn } from "@/lib/utils"
import {
  Heart,
  Star,
  ArrowUp,
  ArrowDown,
  Pause,
  RotateCw,
  MessageCircle,
  Flame,
  Sparkles,
  Gift,
  AlertTriangle,
  Shuffle,
} from "lucide-react"

interface GameBoardProps {
  cells: GameCell[]
  endpointCells: GameCell[]
  endpointContent: {
    title: string
    subtitle: string
    reward: string
  }
  player1Position: number
  player2Position: number
  currentPlayer: 1 | 2
  onCellClick?: (index: number) => void
  compactMode?: boolean
}

const getCellIcon = (type: CellType) => {
  switch (type) {
    case "forward":
      return <ArrowUp className="w-3 h-3 md:w-4 md:h-4" />
    case "backward":
      return <ArrowDown className="w-3 h-3 md:w-4 md:h-4" />
    case "skip":
      return <Pause className="w-3 h-3 md:w-4 md:h-4" />
    case "again":
      return <RotateCw className="w-3 h-3 md:w-4 md:h-4" />
    case "truth":
      return <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
    case "dare":
      return <Flame className="w-3 h-3 md:w-4 md:h-4" />
    case "kiss":
      return <Heart className="w-3 h-3 md:w-4 md:h-4" />
    case "hug":
      return <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
    case "reward":
      return <Gift className="w-3 h-3 md:w-4 md:h-4" />
    case "punishment":
      return <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
    case "swap":
      return <Shuffle className="w-3 h-3 md:w-4 md:h-4" />
    case "start":
      return <Star className="w-3 h-3 md:w-4 md:h-4" />
    case "end":
      return <Heart className="w-3 h-3 md:w-4 md:h-4 fill-current" />
    case "endpoint-zone":
      return <Star className="w-3 h-3 md:w-4 md:h-4" />
    default:
      return null
  }
}

const getCellColor = (type: CellType) => {
  const config = specialCellConfigs.find((c) => c.type === type)
  if (config) {
    return `${config.color} ${config.borderColor} text-white`
  }

  switch (type) {
    case "start":
      return "bg-green-500 border-green-700 text-white"
    case "end":
      return "bg-gradient-to-br from-red-500 to-pink-500 border-red-700 text-white"
    case "endpoint-zone":
      return "bg-gradient-to-br from-orange-400 to-amber-500 border-orange-600 text-white"
    case "normal":
      return "bg-amber-100 border-amber-300 text-foreground"
    default:
      return "bg-amber-100 border-amber-300 text-foreground"
  }
}

export function GameBoard({
  cells,
  endpointCells,
  endpointContent,
  player1Position,
  player2Position,
  currentPlayer,
  onCellClick,
  compactMode = false,
}: GameBoardProps) {
  const totalCells = cells.length + endpointCells.length + 2

  const getBoardLayout = () => {
    const layout: { row: number; col: number; index: number }[] = []
    const cols = 10
    const rows = 8
    let index = 0

    // 外圈 - 顺时针
    // 顶行 (左到右)
    for (let col = 0; col < cols && index < totalCells; col++) {
      layout.push({ row: 0, col, index: index++ })
    }
    // 右列 (上到下)
    for (let row = 1; row < rows && index < totalCells; row++) {
      layout.push({ row, col: cols - 1, index: index++ })
    }
    // 底行 (右到左)
    for (let col = cols - 2; col >= 0 && index < totalCells; col--) {
      layout.push({ row: rows - 1, col, index: index++ })
    }
    // 左列 (下到上)
    for (let row = rows - 2; row > 0 && index < totalCells; row--) {
      layout.push({ row, col: 0, index: index++ })
    }

    // 内圈 - 继续顺时针（如果格子还没用完）
    if (index < totalCells) {
      // 第二行 (左到右)
      for (let col = 1; col < cols - 1 && index < totalCells; col++) {
        layout.push({ row: 1, col, index: index++ })
      }
      // 倒数第二列 (上到下)
      for (let row = 2; row < rows - 1 && index < totalCells; row++) {
        layout.push({ row, col: cols - 2, index: index++ })
      }
      // 倒数第二行 (右到左)
      for (let col = cols - 3; col >= 1 && index < totalCells; col--) {
        layout.push({ row: rows - 2, col, index: index++ })
      }
      // 第二列 (下到上)
      for (let row = rows - 3; row > 1 && index < totalCells; row--) {
        layout.push({ row, col: 1, index: index++ })
      }
    }

    return layout
  }

  const boardLayout = getBoardLayout()

  const getCellContent = (index: number) => {
    if (index === 0) {
      return { content: "起点", type: "start" as const, player: "both" as const }
    }
    if (index === totalCells - 1) {
      return { content: endpointContent.title, type: "end" as const, player: "both" as const }
    }

    const endpointZoneStart = cells.length + 1
    if (index >= endpointZoneStart) {
      const endpointIndex = index - endpointZoneStart
      if (endpointIndex < endpointCells.length) {
        return endpointCells[endpointIndex]
      }
    }

    const cellIndex = index - 1
    if (cellIndex < cells.length) {
      return cells[cellIndex]
    }

    return { content: "", type: "normal" as const, player: "both" as const }
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Game Title - 居中显示，移动端隐藏或缩小 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 bg-gradient-to-br from-amber-50 to-rose-50 p-2 md:p-6 rounded-xl md:rounded-2xl shadow-xl border-2 border-amber-200">
        <h2 className="text-sm md:text-2xl font-bold text-rose-600 flex items-center gap-1 md:gap-2 justify-center">
          <Heart className="w-3 h-3 md:w-6 md:h-6 fill-rose-500" />
          <span className="hidden sm:inline">情侣飞行棋</span>
          <span className="sm:hidden">飞行棋</span>
          <Heart className="w-3 h-3 md:w-6 md:h-6 fill-rose-500" />
        </h2>
        <p className="text-xs md:text-lg text-amber-700 font-medium mt-0.5 md:mt-1">双人版 V2.0</p>
        <div className="mt-1 md:mt-3 text-[10px] md:text-sm text-muted-foreground max-w-[120px] md:max-w-[200px]">
          <p className="font-medium text-rose-500 line-clamp-2">{endpointContent.reward}</p>
        </div>

        {/* 图例 - 移动端隐藏 */}
        <div className="hidden md:grid mt-4 grid-cols-3 gap-1 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-400" />
            <span>真心话</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-400" />
            <span>大冒险</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-pink-400" />
            <span>亲亲</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-400" />
            <span>前进</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span>后退</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-400" />
            <span>再掷</span>
          </div>
        </div>
      </div>

      {/* Board Grid - 10x8 */}
      <div className="grid grid-cols-10 gap-[2px] md:gap-1 p-1 md:p-4 bg-gradient-to-br from-amber-100 to-rose-100 rounded-xl md:rounded-2xl shadow-2xl border-2 md:border-4 border-amber-300">
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => {
            const cell = boardLayout.find((c) => c.row === row && c.col === col)

            if (!cell) {
              return <div key={`${row}-${col}`} className="aspect-square" />
            }

            const cellContent = getCellContent(cell.index)
            const hasPlayer1 = player1Position === cell.index
            const hasPlayer2 = player2Position === cell.index

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => onCellClick?.(cell.index)}
                className={cn(
                  "aspect-square rounded md:rounded-lg p-0.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-105 hover:z-10 relative border md:border-2 shadow-sm",
                  getCellColor(cellContent.type),
                )}
              >
                {/* 格子图标 */}
                <div className="absolute top-0.5 left-0.5 opacity-70">{getCellIcon(cellContent.type)}</div>

                {/* 格子内容 */}
                <div className="flex flex-col items-center justify-center">
                  <div className="opacity-80">{getCellIcon(cellContent.type)}</div>
                  {/* 桌面端显示文字 */}
                  <span className="hidden md:block text-[7px] leading-tight line-clamp-2 font-medium px-0.5 mt-0.5">
                    {cellContent.content}
                  </span>
                </div>

                {/* 玩家标识 */}
                <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 flex gap-0.5">
                  {hasPlayer1 && (
                    <div
                      className={cn(
                        "w-3 h-3 md:w-5 md:h-5 rounded-full bg-blue-500 border border-white md:border-2 flex items-center justify-center shadow-lg",
                        currentPlayer === 1 && "animate-pulse ring-1 md:ring-2 ring-blue-300",
                      )}
                    >
                      <span className="text-[6px] md:text-[8px] text-white font-bold">♂</span>
                    </div>
                  )}
                  {hasPlayer2 && (
                    <div
                      className={cn(
                        "w-3 h-3 md:w-5 md:h-5 rounded-full bg-pink-500 border border-white md:border-2 flex items-center justify-center shadow-lg",
                        currentPlayer === 2 && "animate-pulse ring-1 md:ring-2 ring-pink-300",
                      )}
                    >
                      <span className="text-[6px] md:text-[8px] text-white font-bold">♀</span>
                    </div>
                  )}
                </div>

                {/* 格子编号 */}
                <span className="absolute bottom-0 right-0.5 text-[4px] md:text-[6px] opacity-40 font-mono">
                  {cell.index + 1}
                </span>
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
