import { NextResponse } from "next/server"
import { getRoomState, getRoomConfig, updateRoomState, initDB, type GameState } from "@/lib/db"

export async function GET(request: Request) {
  try {
    await initDB()
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")
    const lastUpdate = Number.parseInt(searchParams.get("lastUpdate") || "0")

    if (!roomId) {
      return NextResponse.json({ error: "缺少房间号" }, { status: 400 })
    }

    const upperRoomId = roomId.toUpperCase()
    const state = await getRoomState(upperRoomId)
    const roomConfig = await getRoomConfig(upperRoomId)

    if (!state) {
      return NextResponse.json({ error: "房间不存在" }, { status: 404 })
    }

    return NextResponse.json({
      updated: state.lastUpdate > lastUpdate,
      state,
      roomConfig,
    })
  } catch (error) {
    console.error("获取状态错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

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
