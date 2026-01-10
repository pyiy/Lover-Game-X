import { NextResponse } from "next/server"
import { getRoomState, updateRoomState, type GameState } from "@/lib/db"

// 获取游戏状态
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")
    const lastUpdate = Number.parseInt(searchParams.get("lastUpdate") || "0")

    if (!roomId) {
      return NextResponse.json({ error: "缺少房间号" }, { status: 400 })
    }

    const state = await getRoomState(roomId.toUpperCase())

    if (!state) {
      return NextResponse.json({ error: "房间不存在" }, { status: 404 })
    }

    // 如果客户端的lastUpdate和服务器一致，说明没有更新
    if (state.lastUpdate <= lastUpdate) {
      return NextResponse.json({ updated: false })
    }

    return NextResponse.json({ updated: true, state })
  } catch (error) {
    console.error("获取状态错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

// 更新游戏状态
export async function POST(request: Request) {
  try {
    const { roomId, state } = await request.json()

    if (!roomId || !state) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 })
    }

    const gameState: GameState = {
      ...state,
      lastUpdate: Date.now(),
    }

    const success = await updateRoomState(roomId.toUpperCase(), gameState)

    if (success) {
      return NextResponse.json({ success: true, lastUpdate: gameState.lastUpdate })
    } else {
      return NextResponse.json({ error: "更新失败" }, { status: 500 })
    }
  } catch (error) {
    console.error("更新状态错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
