"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GameBoard } from "@/components/game-board"
import { Dice } from "@/components/dice"
import { PlayerPanel } from "@/components/player-panel"
import { TaskModal } from "@/components/task-modal"
import { ConfigModal } from "@/components/config-modal"
import { WinnerModal } from "@/components/winner-modal"
import { GameTimer } from "@/components/game-timer"
import { RoomManager } from "@/components/room-manager"
import { SyncIndicator } from "@/components/sync-indicator"
import { useGameSync, type SyncState } from "@/hooks/use-game-sync"
import { type GameCell, type GameConfig, defaultGameConfig, shuffleArray, generateBoard } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { Settings, RotateCcw, Heart, Loader2 } from "lucide-react"

export default function GamePage() {
  const [config, setConfig] = useState<GameConfig>(defaultGameConfig)
  const [cells, setCells] = useState<GameCell[]>([])
  const [endpointCells, setEndpointCells] = useState<GameCell[]>([])

  const [player1Position, setPlayer1Position] = useState(0)
  const [player2Position, setPlayer2Position] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [currentTask, setCurrentTask] = useState<GameCell | null>(null)
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [skipNextTurn, setSkipNextTurn] = useState<{ player1: boolean; player2: boolean }>({
    player1: false,
    player2: false,
  })
  const [canRollAgain, setCanRollAgain] = useState(false)
  const [previewCell, setPreviewCell] = useState<{ cell: GameCell; index: number } | null>(null)

  const [syncEnabled, setSyncEnabled] = useState<boolean | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [isWaitingForPlayer2, setIsWaitingForPlayer2] = useState(false)
  const [player2Joined, setPlayer2Joined] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const isLocalUpdateRef = useRef(false)

  const [player1Gender, setPlayer1Gender] = useState<"male" | "female">("male")
  const [player2Gender, setPlayer2Gender] = useState<"male" | "female">("female")

  const [timerSeconds, setTimerSeconds] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDuration, setTimerDuration] = useState(60)

  const [taskChangedCells, setTaskChangedCells] = useState<{ [cellIndex: number]: boolean }>({})
  const [myPlayerNumber, setMyPlayerNumber] = useState<1 | 2 | null>(null)

  const { isSyncing, isConnected, remoteState, pushState, setRemoteState, fetchStateImmediately } = useGameSync(
    roomId,
    !!roomId && gameStarted,
  )

  const totalCells = cells.length + endpointCells.length + 2

  useEffect(() => {
    async function checkSync() {
      try {
        const res = await fetch("/api/sync-status")
        const data = await res.json()
        setSyncEnabled(data.syncEnabled)

        if (!data.syncEnabled) {
          setGameStarted(true)
        }
      } catch {
        setSyncEnabled(false)
        setGameStarted(true)
      }
    }
    checkSync()
  }, [])

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/game-config")
      if (response.ok) {
        const savedConfig = await response.json()
        setConfig(savedConfig)
        return savedConfig
      }
    } catch (error) {
      console.error("加载配置失败:", error)
    }
    return defaultGameConfig
  }, [])

  const initGame = useCallback((gameConfig: GameConfig) => {
    const board = generateBoard(gameConfig)
    setCells(board)
    setEndpointCells(shuffleArray([...gameConfig.endpointCells]))
    setPlayer1Position(0)
    setPlayer2Position(0)
    setCurrentPlayer(1)
    setWinner(null)
    setCurrentTask(null)
    setCurrentTaskIndex(null)
    setSkipNextTurn({ player1: false, player2: false })
    setCanRollAgain(false)
    setIsLoading(false)
    setTaskChangedCells({})
  }, [])

  useEffect(() => {
    loadConfig().then(initGame)
  }, [loadConfig, initGame])

  useEffect(() => {
    if (remoteState) {
      // Always apply remote state - server is the source of truth
      setPlayer1Position(remoteState.player1Position)
      setPlayer2Position(remoteState.player2Position)
      setCurrentPlayer(remoteState.currentPlayer)
      setSkipNextTurn(remoteState.skipNextTurn)
      setCanRollAgain(remoteState.canRollAgain)
      setWinner(remoteState.winner)
      if (remoteState.cells && remoteState.cells.length > 0) setCells(remoteState.cells)
      if (remoteState.endpointCells && remoteState.endpointCells.length > 0) setEndpointCells(remoteState.endpointCells)
      if (remoteState.timerSeconds !== undefined) setTimerSeconds(remoteState.timerSeconds)
      if (remoteState.timerRunning !== undefined) setTimerRunning(remoteState.timerRunning)
      if (remoteState.timerDuration !== undefined) setTimerDuration(remoteState.timerDuration)
      if (remoteState.player1Gender) setPlayer1Gender(remoteState.player1Gender)
      if (remoteState.player2Gender) setPlayer2Gender(remoteState.player2Gender)
      if (remoteState.taskChangedCells) setTaskChangedCells(remoteState.taskChangedCells)
      if (remoteState.player2Joined !== undefined) {
        setPlayer2Joined(remoteState.player2Joined)
        if (remoteState.player2Joined) {
          setIsWaitingForPlayer2(false)
        }
      }
      if (remoteState.config) {
        setConfig(remoteState.config)
      }
    }
  }, [remoteState])

  const syncStateWithOverrides = useCallback(
    (overrides: Partial<SyncState> = {}) => {
      if (!roomId || !gameStarted) return

      // Remove isRolling from overrides if present
      const { isRolling: _isRolling, ...cleanOverrides } = overrides as any

      const finalState: SyncState = {
        player1Position: overrides.player1Position ?? player1Position,
        player2Position: overrides.player2Position ?? player2Position,
        currentPlayer: overrides.currentPlayer ?? currentPlayer,
        skipNextTurn: overrides.skipNextTurn ?? skipNextTurn,
        canRollAgain: overrides.canRollAgain ?? canRollAgain,
        winner: overrides.winner ?? winner,
        cells: overrides.cells ?? cells,
        endpointCells: overrides.endpointCells ?? endpointCells,
        timerSeconds: overrides.timerSeconds ?? timerSeconds,
        timerRunning: overrides.timerRunning ?? timerRunning,
        timerDuration: overrides.timerDuration ?? timerDuration,
        player1Gender: overrides.player1Gender ?? player1Gender,
        player2Gender: overrides.player2Gender ?? player2Gender,
        taskChangedCells: overrides.taskChangedCells ?? taskChangedCells,
        player2Joined: overrides.player2Joined ?? player2Joined,
        config: overrides.config ?? config,
      }

      pushState(finalState)
    },
    [
      roomId,
      gameStarted,
      player1Position,
      player2Position,
      currentPlayer,
      skipNextTurn,
      canRollAgain,
      winner,
      cells,
      endpointCells,
      timerSeconds,
      timerRunning,
      timerDuration,
      player1Gender,
      player2Gender,
      taskChangedCells,
      player2Joined,
      config,
      pushState,
    ],
  )

  const syncState = useCallback(() => {
    syncStateWithOverrides({})
  }, [syncStateWithOverrides])

  const handleCreateRoom = async (selectedGender: "male" | "female"): Promise<string | null> => {
    try {
      const p1Gender = selectedGender
      const p2Gender = selectedGender === "male" ? "female" : "male"

      setPlayer1Gender(p1Gender)
      setPlayer2Gender(p2Gender)
      setIsHost(true)
      setMyPlayerNumber(1)

      const state: SyncState = {
        player1Position: 0,
        player2Position: 0,
        currentPlayer: 1,
        skipNextTurn: { player1: false, player2: false },
        canRollAgain: false,
        winner: null,
        cells,
        endpointCells,
        isRolling: false,
        timerSeconds: 60,
        timerRunning: false,
        timerDuration: 60,
        player1Gender: p1Gender,
        player2Gender: p2Gender,
        taskChangedCells: {},
        player2Joined: false,
        config: config,
      }

      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      })

      if (res.ok) {
        const data = await res.json()
        setRoomId(data.roomId)
        setGameStarted(true)
        setIsWaitingForPlayer2(true)
        setPlayer2Joined(false)
        return data.roomId
      }
    } catch (error) {
      console.error("创建房间失败:", error)
    }
    return null
  }

  const handleJoinRoom = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/room?roomId=${id}`)
      const data = await res.json()

      if (data.exists && data.state) {
        setRoomId(id.toUpperCase())
        setRemoteState(data.state)
        setPlayer1Position(data.state.player1Position)
        setPlayer2Position(data.state.player2Position)
        setCurrentPlayer(data.state.currentPlayer)
        setSkipNextTurn(data.state.skipNextTurn)
        setCanRollAgain(data.state.canRollAgain)
        setWinner(data.state.winner)
        if (data.state.cells.length > 0) setCells(data.state.cells)
        if (data.state.endpointCells.length > 0) setEndpointCells(data.state.endpointCells)
        if (data.state.player1Gender) setPlayer1Gender(data.state.player1Gender)
        if (data.state.player2Gender) setPlayer2Gender(data.state.player2Gender)
        if (data.state.timerSeconds !== undefined) setTimerSeconds(data.state.timerSeconds)
        if (data.state.timerRunning !== undefined) setTimerRunning(data.state.timerRunning)
        if (data.state.timerDuration !== undefined) setTimerDuration(data.state.timerDuration)
        if (data.state.taskChangedCells) setTaskChangedCells(data.state.taskChangedCells)
        if (data.state.config) {
          setConfig(data.state.config)
        }
        setGameStarted(true)
        setPlayer2Joined(true)
        setIsWaitingForPlayer2(false)
        setIsHost(false)
        setMyPlayerNumber(2)

        // 通知房主玩家2已加入
        const updatedState: SyncState = {
          ...data.state,
          player2Joined: true,
        }
        await fetch("/api/game-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: id.toUpperCase(), state: updatedState }),
        })

        return true
      }
    } catch (error) {
      console.error("加入房间失败:", error)
    }
    return false
  }

  const handleCheckPlayer2Joined = async (): Promise<boolean> => {
    if (!roomId) return false
    const state = await fetchStateImmediately()
    if (state && state.player2Joined) {
      setPlayer2Joined(true)
      setIsWaitingForPlayer2(false)
      return true
    }
    return false
  }

  const handlePlayLocal = () => {
    setRoomId(null)
    setGameStarted(true)
    setPlayer2Joined(true)
    setIsWaitingForPlayer2(false)
  }

  const handleConfigSave = (newConfig: GameConfig) => {
    setConfig(newConfig)
    initGame(newConfig)
  }

  const getCellContent = useCallback(
    (index: number): GameCell | null => {
      if (index === 0 || index >= totalCells - 1) return null

      const endpointZoneStart = cells.length + 1
      if (index >= endpointZoneStart) {
        const endpointIndex = index - endpointZoneStart
        if (endpointIndex < endpointCells.length) {
          return endpointCells[endpointIndex]
        }
      }

      const cellIndex = index - 1
      if (cellIndex >= 0 && cellIndex < cells.length) {
        return cells[cellIndex]
      }

      return null
    },
    [cells, endpointCells, totalCells],
  )

  const handleCellClick = useCallback(
    (index: number) => {
      const cell = getCellContent(index)
      if (cell) {
        setPreviewCell({ cell, index })
      }
    },
    [getCellContent],
  )

  const getCurrentPlayerGender = useCallback(() => {
    return currentPlayer === 1 ? player1Gender : player2Gender
  }, [currentPlayer, player1Gender, player2Gender])

  const handleTimerChange = useCallback(
    (seconds: number, running: boolean, duration: number) => {
      setTimerSeconds(seconds)
      setTimerRunning(running)
      setTimerDuration(duration)
      // Sync immediately when timer changes
      if (roomId && gameStarted) {
        const state: SyncState = {
          player1Position,
          player2Position,
          currentPlayer,
          skipNextTurn,
          canRollAgain,
          winner,
          cells,
          endpointCells,
          timerSeconds: seconds,
          timerRunning: running,
          timerDuration: duration,
          player1Gender,
          player2Gender,
          taskChangedCells,
          player2Joined,
          config: config,
        }
        pushState(state)
      }
    },
    [
      roomId,
      gameStarted,
      player1Position,
      player2Position,
      currentPlayer,
      skipNextTurn,
      canRollAgain,
      winner,
      cells,
      endpointCells,
      player1Gender,
      player2Gender,
      taskChangedCells,
      player2Joined,
      config,
      pushState,
    ],
  )

  const handleTaskChange = useCallback(
    (newCell: GameCell) => {
      if (currentTaskIndex !== null) {
        setCurrentTask(newCell)
        setTaskChangedCells((prev) => ({ ...prev, [currentTaskIndex]: true }))
      }
    },
    [currentTaskIndex],
  )

  const handleDiceRoll = (value: number) => {
    // In online mode, turn control is handled by canCurrentDeviceRoll which checks currentPlayer === myPlayerNumber
    if (isRolling) return

    const skipKey = currentPlayer === 1 ? "player1" : "player2"
    if (skipNextTurn[skipKey]) {
      setSkipNextTurn((prev) => ({ ...prev, [skipKey]: false }))
      const nextPlayer = currentPlayer === 1 ? 2 : 1
      setCurrentPlayer(nextPlayer)
      setTimeout(() => syncStateWithOverrides({ currentPlayer: nextPlayer }), 100)
      return
    }

    setIsRolling(true)
    setCanRollAgain(false)
    setPreviewCell(null)

    if (roomId && gameStarted) {
      syncStateWithOverrides({})
    }

    const currentPos = currentPlayer === 1 ? player1Position : player2Position
    let newPos = currentPos + value

    if (newPos >= totalCells - 1) {
      newPos = totalCells - 1
      const winnerName =
        currentPlayer === 1
          ? `玩家1 (${player1Gender === "male" ? "♂" : "♀"})`
          : `玩家2 (${player2Gender === "male" ? "♂" : "♀"})`
      setWinner(winnerName)
    }

    const newPlayer1Position = currentPlayer === 1 ? newPos : player1Position
    const newPlayer2Position = currentPlayer === 2 ? newPos : player2Position

    if (currentPlayer === 1) {
      setPlayer1Position(newPos)
    } else {
      setPlayer2Position(newPos)
    }

    setTimeout(() => {
      const task = getCellContent(newPos)
      if (task && !winner) {
        setCurrentTask(task)
        setCurrentTaskIndex(newPos)
        syncStateWithOverrides({
          player1Position: newPlayer1Position,
          player2Position: newPlayer2Position,
        })
      } else {
        const nextPlayer = currentPlayer === 1 ? 2 : 1
        setCurrentPlayer(nextPlayer)
        setIsRolling(false)
        syncStateWithOverrides({
          currentPlayer: nextPlayer,
          player1Position: newPlayer1Position,
          player2Position: newPlayer2Position,
        })
      }
    }, 500)
  }

  const handleTaskComplete = (effect?: GameCell["effect"]) => {
    setCurrentTask(null)
    setCurrentTaskIndex(null)
    setIsRolling(false)

    let newPlayer1Position = player1Position
    let newPlayer2Position = player2Position
    let shouldRollAgain = false

    if (effect) {
      const currentPos = currentPlayer === 1 ? player1Position : player2Position

      switch (effect.type) {
        case "move":
          if (effect.value) {
            let newPos = effect.value === -999 ? 0 : currentPos + effect.value
            newPos = Math.max(0, Math.min(newPos, totalCells - 1))
            if (currentPlayer === 1) {
              setPlayer1Position(newPos)
              newPlayer1Position = newPos
            } else {
              setPlayer2Position(newPos)
              newPlayer2Position = newPos
            }
          }
          break
        case "skip":
          const skipKey = currentPlayer === 1 ? "player1" : "player2"
          setSkipNextTurn((prev) => ({ ...prev, [skipKey]: true }))
          break
        case "again":
          setCanRollAgain(true)
          setIsRolling(false)
          shouldRollAgain = true
          setTimeout(
            () =>
              syncStateWithOverrides({
                canRollAgain: true,
                isRolling: false,
              }),
            100,
          )
          return
        case "swap":
          const temp = player1Position
          setPlayer1Position(player2Position)
          setPlayer2Position(temp)
          newPlayer1Position = player2Position
          newPlayer2Position = temp
          break
      }
    }

    if (!winner && !canRollAgain && !shouldRollAgain) {
      const nextPlayer = currentPlayer === 1 ? 2 : 1
      setCurrentPlayer(nextPlayer)
      setIsRolling(false)
      setTimeout(
        () =>
          syncStateWithOverrides({
            currentPlayer: nextPlayer,
            player1Position: newPlayer1Position,
            player2Position: newPlayer2Position,
          }),
        100,
      )
    } else {
      setIsRolling(false)
      setTimeout(
        () =>
          syncStateWithOverrides({
            player1Position: newPlayer1Position,
            player2Position: newPlayer2Position,
          }),
        100,
      )
    }
  }

  const handleRestart = () => {
    initGame(config)
    setTimeout(syncState, 100)
  }

  const canCurrentDeviceRoll = useCallback(() => {
    // 本地模式下，任何时候都可以投
    if (!roomId) return true
    // 在线模式下，如果正在投掷则不允许
    if (isRolling) return false
    // 如果玩家2还没加入，不允许投掷
    if (!player2Joined) return false
    // 在线模式下，只有当前回合的玩家才能投掷
    if (myPlayerNumber !== null && currentPlayer !== myPlayerNumber) return false
    return true
  }, [roomId, isRolling, player2Joined, myPlayerNumber, currentPlayer])

  if (syncEnabled === null || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-rose-500 mx-auto mb-4 animate-spin" />
          <p className="text-base md:text-lg text-muted-foreground">加载游戏中...</p>
        </div>
      </div>
    )
  }

  if (syncEnabled && (!gameStarted || (isWaitingForPlayer2 && !player2Joined))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold text-rose-600 text-center mb-6 flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 md:w-8 md:h-8 fill-rose-500" />
            情侣飞行棋
          </h1>
          <RoomManager
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onPlayLocal={handlePlayLocal}
            waitingRoomId={roomId}
            isWaitingForPlayer2={isWaitingForPlayer2}
            onCheckPlayer2Joined={handleCheckPlayer2Joined}
          />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <h1 className="text-lg md:text-2xl font-bold text-rose-600 flex items-center gap-1 md:gap-2">
            <Heart className="w-4 h-4 md:w-6 md:h-6 fill-rose-500" />
            <span className="hidden sm:inline">情侣飞行棋</span>
          </h1>

          <div className="flex items-center gap-2">
            {roomId && <SyncIndicator roomId={roomId} isSyncing={isSyncing} isConnected={isConnected} />}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
              className="bg-white/80 text-xs md:text-sm h-8 px-2 md:px-3"
            >
              <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">自定义</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              className="bg-white/80 text-xs md:text-sm h-8 px-2 md:px-3"
            >
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">重新开始</span>
            </Button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] gap-2 md:gap-3">
          {/* Side Panel */}
          <div className="order-1 lg:order-2 space-y-2 md:space-y-3">
            {/* 玩家信息 */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <PlayerPanel
                playerNumber={1}
                name={`玩家1 (${player1Gender === "male" ? "♂" : "♀"})`}
                position={player1Position}
                isCurrentPlayer={currentPlayer === 1}
                totalCells={totalCells}
                isSkipped={skipNextTurn.player1}
              />
              <PlayerPanel
                playerNumber={2}
                name={`玩家2 (${player2Gender === "male" ? "♂" : "♀"})`}
                position={player2Position}
                isCurrentPlayer={currentPlayer === 2}
                totalCells={totalCells}
                isSkipped={skipNextTurn.player2}
              />
            </div>

            {/* 骰子和计时器 */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {/* Dice */}
              <div className="bg-white/90 rounded-xl p-3 md:p-4 text-center shadow-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                  {canRollAgain ? (
                    <span className="text-yellow-600 font-bold">可以再掷!</span>
                  ) : (
                    <>
                      {currentPlayer === 1
                        ? player1Gender === "male"
                          ? "♂"
                          : "♀"
                        : player2Gender === "male"
                          ? "♂"
                          : "♀"}{" "}
                      的回合
                    </>
                  )}
                </p>
                <div className="flex justify-center">
                  <Dice onRoll={handleDiceRoll} disabled={!canCurrentDeviceRoll() || !!currentTask || !!winner} />
                </div>
                {roomId && isRolling && <p className="text-xs text-amber-600 mt-2 animate-pulse">投掷中...</p>}
              </div>

              {/* Game Timer with sync */}
              <GameTimer
                syncEnabled={!!roomId}
                syncedSeconds={timerSeconds}
                syncedRunning={timerRunning}
                syncedDuration={timerDuration}
                onTimerChange={handleTimerChange}
              />
            </div>

            {previewCell && (
              <div className="lg:hidden bg-white/90 rounded-xl p-3 shadow-lg border-2 border-amber-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">格子 #{previewCell.index + 1}</span>
                  <button
                    onClick={() => setPreviewCell(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm font-medium text-center text-gray-800">{previewCell.cell.content}</p>
              </div>
            )}

            {/* Game Rules */}
            <div className="hidden lg:block bg-white/70 rounded-xl p-3 text-sm">
              <h3 className="font-bold mb-2 text-rose-600">游戏规则</h3>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>• 双方轮流投掷骰子前进</li>
                <li>• 完成格子上的任务后换对方</li>
                <li>• 不同颜色格子有不同任务类型</li>
                <li>• 普通格子可点击"换一个"换专属任务</li>
                <li>• 先到达终点者获胜</li>
              </ul>
            </div>
          </div>

          {/* Board */}
          <div className="order-2 lg:order-1">
            <GameBoard
              cells={cells}
              endpointCells={endpointCells}
              endpointContent={config.endpointContent}
              player1Position={player1Position}
              player2Position={player2Position}
              currentPlayer={currentPlayer}
              onCellClick={handleCellClick}
            />

            <div className="lg:hidden mt-2 bg-white/80 rounded-lg p-2">
              <div className="grid grid-cols-6 gap-1 text-[9px] text-center">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-blue-400 mb-0.5" />
                  <span>真心话</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-purple-400 mb-0.5" />
                  <span>大冒险</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-pink-400 mb-0.5" />
                  <span>亲亲</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-green-400 mb-0.5" />
                  <span>前进</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-red-400 mb-0.5" />
                  <span>后退</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-yellow-400 mb-0.5" />
                  <span>再掷</span>
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-1">点击格子查看内容</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {currentTask && (
        <TaskModal
          cell={currentTask}
          onComplete={handleTaskComplete}
          playerName={
            currentPlayer === 1
              ? `玩家1 (${player1Gender === "male" ? "♂" : "♀"})`
              : `玩家2 (${player2Gender === "male" ? "♂" : "♀"})`
          }
          currentPlayerGender={getCurrentPlayerGender()}
          config={config}
          cellIndex={currentTaskIndex ?? undefined}
          canChangeTask={currentTaskIndex !== null && !taskChangedCells[currentTaskIndex]}
          onTaskChange={handleTaskChange}
        />
      )}

      {showConfig && (
        <ConfigModal
          isOpen={showConfig}
          config={config}
          onSave={handleConfigSave}
          onClose={() => setShowConfig(false)}
          onReset={() => {
            import("@/lib/game-data").then(({ defaultGameConfig }) => {
              setConfig(defaultGameConfig)
            })
          }}
        />
      )}

      {winner && <WinnerModal winner={winner} reward={config.endpointContent.reward} onRestart={handleRestart} />}
    </main>
  )
}
