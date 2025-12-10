import { NextResponse } from "next/server"
import { isDBAvailable, initDB } from "@/lib/db"

export async function GET() {
  try {
    const available = await isDBAvailable()

    if (available) {
      // 尝试初始化数据库表
      await initDB()
    }

    return NextResponse.json({
      syncEnabled: available,
      message: available ? "多端同步已启用" : "未配置数据库，使用单机模式",
    })
  } catch (error) {
    return NextResponse.json({
      syncEnabled: false,
      message: "数据库连接失败",
    })
  }
}
