import { NextResponse } from "next/server"
import { createRoom, getRoomState, roomExists, type GameState } from "@/lib/db"

// 生成6位房间号
function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 创建房间
export async function POST(request: Request) {
  try {
    const { state } = await request.json()

    let roomId = generateRoomId()
    let attempts = 0

    // 确保房间号唯一
    while ((await roomExists(roomId)) && attempts < 10) {
      roomId = generateRoomId()
      attempts++
    }

    const gameState: GameState = {
      ...state,
      lastUpdate: Date.now(),
    }

    const success = await createRoom(roomId, gameState)

    if (success) {
      return NextResponse.json({ roomId, success: true })
    } else {
      return NextResponse.json({ error: "创建房间失败" }, { status: 500 })
    }
  } catch (error) {
    console.error("创建房间错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

// 加入房间（检查房间是否存在）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json({ error: "缺少房间号" }, { status: 400 })
    }

    const state = await getRoomState(roomId.toUpperCase())

    if (state) {
      return NextResponse.json({ exists: true, state })
    } else {
      return NextResponse.json({ exists: false })
    }
  } catch (error) {
    console.error("检查房间错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
