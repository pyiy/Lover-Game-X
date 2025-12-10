import { NextResponse } from "next/server"
import {
  createRoom,
  getRoomState,
  getRoomConfig,
  updateRoomConfig,
  roomExists,
  initDB,
  type GameState,
  type RoomConfigDB,
} from "@/lib/db"

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: Request) {
  try {
    await initDB()
    const { state, roomConfig } = await request.json()

    let roomId = generateRoomId()
    let attempts = 0

    while ((await roomExists(roomId)) && attempts < 10) {
      roomId = generateRoomId()
      attempts++
    }

    const gameState: GameState = {
      ...state,
      lastUpdate: Date.now(),
    }

    // 生成座位配置
    const seats: RoomConfigDB["seats"] = []
    const maleCount = roomConfig?.maleCount || 1
    const femaleCount = roomConfig?.femaleCount || 1

    for (let i = 0; i < maleCount; i++) {
      seats.push({ index: seats.length, gender: "male", playerId: null, playerName: null })
    }
    for (let i = 0; i < femaleCount; i++) {
      seats.push({ index: seats.length, gender: "female", playerId: null, playerName: null })
    }

    const dbRoomConfig: RoomConfigDB = {
      maleCount,
      femaleCount,
      totalPlayers: maleCount + femaleCount,
      seats,
    }

    const success = await createRoom(roomId, gameState, dbRoomConfig)

    if (success) {
      return NextResponse.json({ roomId, success: true, roomConfig: dbRoomConfig })
    } else {
      return NextResponse.json({ error: "创建房间失败" }, { status: 500 })
    }
  } catch (error) {
    console.error("创建房间错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    await initDB()
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json({ error: "缺少房间号" }, { status: 400 })
    }

    const upperRoomId = roomId.toUpperCase()
    const state = await getRoomState(upperRoomId)
    const roomConfig = await getRoomConfig(upperRoomId)

    if (state) {
      return NextResponse.json({ exists: true, state, roomConfig })
    } else {
      return NextResponse.json({ exists: false })
    }
  } catch (error) {
    console.error("检查房间错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { roomId, seatIndex, playerId, playerName } = await request.json()

    if (!roomId || seatIndex === undefined) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 })
    }

    const roomConfig = await getRoomConfig(roomId.toUpperCase())
    if (!roomConfig) {
      return NextResponse.json({ error: "房间不存在" }, { status: 404 })
    }

    // 检查座位是否已被占用
    const seat = roomConfig.seats.find((s) => s.index === seatIndex)
    if (!seat) {
      return NextResponse.json({ error: "座位不存在" }, { status: 404 })
    }

    // 如果座位已被其他人占用
    if (seat.playerId && seat.playerId !== playerId) {
      return NextResponse.json({ error: "座位已被占用" }, { status: 409 })
    }

    // 先清除该玩家之前可能占用的其他座位
    roomConfig.seats.forEach((s) => {
      if (s.playerId === playerId) {
        s.playerId = null
        s.playerName = null
      }
    })

    // 更新座位
    seat.playerId = playerId
    seat.playerName = playerName

    const success = await updateRoomConfig(roomId.toUpperCase(), roomConfig)
    if (success) {
      return NextResponse.json({ success: true, roomConfig })
    } else {
      return NextResponse.json({ error: "更新座位失败" }, { status: 500 })
    }
  } catch (error) {
    console.error("更新座位错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
