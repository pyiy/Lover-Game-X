import { NextResponse } from "next/server"
import { defaultGameConfig, type GameConfig } from "@/lib/game-data"

let savedConfig: GameConfig = defaultGameConfig

export async function GET() {
  return NextResponse.json(savedConfig)
}

export async function POST(request: Request) {
  try {
    const config = await request.json()
    savedConfig = config
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}
