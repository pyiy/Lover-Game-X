import { type NextRequest, NextResponse } from "next/server"
import { getDefaultConfig, saveDefaultConfig, verifyAdminPassword } from "@/lib/db"
import type { GameConfig } from "@/lib/game-data"

// 获取默认配置
export async function GET() {
  try {
    const config = await getDefaultConfig()
    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("获取默认配置失败:", error)
    return NextResponse.json({ success: false, error: "获取配置失败" }, { status: 500 })
  }
}

// 保存默认配置（需要密码验证）
export async function POST(request: NextRequest) {
  try {
    const { password, config } = (await request.json()) as { password: string; config: GameConfig }

    // 验证密码
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ success: false, error: "密码错误" }, { status: 403 })
    }

    // 验证配置格式
    if (!config || !config.normalCells || !config.boardSize || !config.specialCellPositions) {
      return NextResponse.json({ success: false, error: "配置格式无效" }, { status: 400 })
    }

    const success = await saveDefaultConfig(config)
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: "保存配置失败" }, { status: 500 })
    }
  } catch (error) {
    console.error("保存默认配置失败:", error)
    return NextResponse.json({ success: false, error: "保存配置失败" }, { status: 500 })
  }
}
