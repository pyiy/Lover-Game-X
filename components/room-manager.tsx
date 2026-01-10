"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Copy, Check, Users, Plus, LogIn, Loader2 } from "lucide-react"

interface RoomManagerProps {
  onCreateRoom: (player1Gender: "male" | "female") => Promise<string | null>
  onJoinRoom: (roomId: string) => Promise<boolean>
  onPlayLocal: () => void
  waitingRoomId?: string | null
  isWaitingForPlayer2?: boolean
  onCheckPlayer2Joined?: () => Promise<boolean>
}

export function RoomManager({
  onCreateRoom,
  onJoinRoom,
  onPlayLocal,
  waitingRoomId,
  isWaitingForPlayer2,
  onCheckPlayer2Joined,
}: RoomManagerProps) {
  const [mode, setMode] = useState<"select" | "create" | "join" | "gender" | "waiting">("select")
  const [roomId, setRoomId] = useState("")
  const [inputRoomId, setInputRoomId] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | null>(null)

  useEffect(() => {
    if (waitingRoomId && isWaitingForPlayer2) {
      setRoomId(waitingRoomId)
      setMode("waiting")
    }
  }, [waitingRoomId, isWaitingForPlayer2])

  useEffect(() => {
    if (mode !== "waiting" || !onCheckPlayer2Joined) return

    const interval = setInterval(async () => {
      const joined = await onCheckPlayer2Joined()
      if (joined) {
        // 玩家2已加入，由父组件处理
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [mode, onCheckPlayer2Joined])

  const handleGenderSelect = async (gender: "male" | "female") => {
    setSelectedGender(gender)
    setLoading(true)
    setError("")
    const id = await onCreateRoom(gender)
    if (id) {
      setRoomId(id)
      setMode("waiting") // 改为进入等待模式
    } else {
      setError("创建房间失败，请重试")
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!inputRoomId.trim()) {
      setError("请输入房间号")
      return
    }
    setLoading(true)
    setError("")
    const success = await onJoinRoom(inputRoomId.toUpperCase())
    if (!success) {
      setError("房间不存在或已过期")
    }
    setLoading(false)
  }

  const copyRoomId = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(roomId)
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement("textarea")
        textArea.value = roomId
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand("copy")
        } catch (e) {
          console.error("execCommand copy failed:", e)
        }
        document.body.removeChild(textArea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  if (mode === "waiting" && roomId) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/95 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-rose-600">等待对方加入</CardTitle>
          <CardDescription>
            你选择了 {selectedGender === "male" ? "男方 (♂)" : "女方 (♀)"}
            <br />
            分享房间号给另一位玩家
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="text-3xl font-mono font-bold tracking-widest bg-rose-50 px-6 py-3 rounded-lg select-all">
              {roomId}
            </div>
            <Button variant="outline" size="icon" onClick={copyRoomId} className="shrink-0 bg-transparent">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          {copied && <p className="text-center text-sm text-green-600">已复制到剪贴板!</p>}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-center text-sm text-amber-700">请将房间号分享给你的另一半，等待TA加入后游戏将自动开始</p>
          </div>
          <div className="flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
            <span className="text-sm text-muted-foreground">等待玩家2加入中...</span>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setMode("select")
              setRoomId("")
              setSelectedGender(null)
            }}
            className="w-full"
          >
            取消
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (mode === "gender") {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/95 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-rose-600">选择你的角色</CardTitle>
          <CardDescription>你是男方还是女方？</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleGenderSelect("male")}
              disabled={loading}
              className="h-24 text-lg bg-blue-500 hover:bg-blue-600 flex flex-col gap-2"
            >
              {loading && selectedGender === "male" ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <span className="text-3xl">♂</span>
                  <span>男方</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => handleGenderSelect("female")}
              disabled={loading}
              className="h-24 text-lg bg-pink-500 hover:bg-pink-600 flex flex-col gap-2"
            >
              {loading && selectedGender === "female" ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <span className="text-3xl">♀</span>
                  <span>女方</span>
                </>
              )}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button variant="outline" onClick={() => setMode("select")} className="w-full">
            返回
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (mode === "join") {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/95 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-rose-600">加入房间</CardTitle>
          <CardDescription>输入对方分享的房间号</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="请输入6位房间号"
            value={inputRoomId}
            onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
            className="text-center text-xl font-mono tracking-widest"
            maxLength={6}
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode("select")} className="flex-1">
              返回
            </Button>
            <Button onClick={handleJoin} disabled={loading} className="flex-1 bg-rose-500 hover:bg-rose-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              加入
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/95 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-rose-600">多端同步已启用</CardTitle>
        <CardDescription>选择游戏模式开始游玩</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={() => setMode("gender")}
          disabled={loading}
          className="w-full h-14 text-lg bg-rose-500 hover:bg-rose-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          创建房间
        </Button>
        <Button onClick={() => setMode("join")} variant="outline" className="w-full h-14 text-lg">
          <LogIn className="w-5 h-5 mr-2" />
          加入房间
        </Button>
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">或者</span>
          </div>
        </div>
        <Button onClick={onPlayLocal} variant="ghost" className="w-full text-muted-foreground">
          <Users className="w-4 h-4 mr-2" />
          本地双人游戏（不同步）
        </Button>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </CardContent>
    </Card>
  )
}
