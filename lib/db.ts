import mysql from "mysql2/promise"

export interface DBConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export function getDBConfig(): DBConfig | null {
  const host = process.env.MYSQL_HOST
  const user = process.env.MYSQL_USER
  const password = process.env.MYSQL_PASSWORD
  const database = process.env.MYSQL_DATABASE

  if (!host || !user || !password || !database) {
    return null
  }

  return {
    host,
    port: Number.parseInt(process.env.MYSQL_PORT || "3306"),
    user,
    password,
    database,
  }
}

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool | null {
  if (pool) return pool

  const config = getDBConfig()
  if (!config) return null

  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  return pool
}

export async function isDBAvailable(): Promise<boolean> {
  const p = getPool()
  if (!p) return false

  try {
    const conn = await p.getConnection()
    conn.release()
    return true
  } catch {
    return false
  }
}

export async function initDB(): Promise<boolean> {
  const p = getPool()
  if (!p) return false

  try {
    await p.execute(`
      CREATE TABLE IF NOT EXISTS game_rooms (
        id VARCHAR(10) PRIMARY KEY,
        state JSON NOT NULL,
        room_config JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)
    return true
  } catch (error) {
    console.error("初始化数据库失败:", error)
    return false
  }
}

export interface GameState {
  players: {
    id: string
    name: string
    gender: "male" | "female"
    position: number
    isSkipped: boolean
    seatIndex: number
  }[]
  currentPlayerIndex: number
  canRollAgain: boolean
  winner: string | null
  cells: any[]
  endpointCells: any[]
  lastUpdate: number
  timer: {
    duration: number
    timeLeft: number
    isRunning: boolean
  }
}

export interface RoomConfigDB {
  maleCount: number
  femaleCount: number
  totalPlayers: number
  seats: {
    index: number
    gender: "male" | "female"
    playerId: string | null
    playerName: string | null
  }[]
}

export async function createRoom(roomId: string, state: GameState, roomConfig: RoomConfigDB): Promise<boolean> {
  const p = getPool()
  if (!p) return false

  try {
    await initDB()
    await p.execute(
      "INSERT INTO game_rooms (id, state, room_config) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE state = VALUES(state), room_config = VALUES(room_config)",
      [roomId, JSON.stringify(state), JSON.stringify(roomConfig)],
    )
    return true
  } catch (error) {
    console.error("创建房间失败:", error)
    return false
  }
}

export async function getRoomState(roomId: string): Promise<GameState | null> {
  const p = getPool()
  if (!p) return null

  try {
    await initDB()
    const [rows] = await p.execute<mysql.RowDataPacket[]>("SELECT state FROM game_rooms WHERE id = ?", [roomId])
    if (rows.length === 0) return null
    const state = rows[0].state
    if (typeof state === "string") {
      return JSON.parse(state)
    }
    return state as GameState
  } catch (error) {
    console.error("获取房间状态失败:", error)
    return null
  }
}

export async function getRoomConfig(roomId: string): Promise<RoomConfigDB | null> {
  const p = getPool()
  if (!p) return null

  try {
    await initDB()
    const [rows] = await p.execute<mysql.RowDataPacket[]>("SELECT room_config FROM game_rooms WHERE id = ?", [roomId])
    if (rows.length === 0) return null
    const config = rows[0].room_config
    if (typeof config === "string") {
      return JSON.parse(config)
    }
    return config as RoomConfigDB
  } catch (error) {
    console.error("获取房间配置失败:", error)
    return null
  }
}

export async function updateRoomConfig(roomId: string, config: RoomConfigDB): Promise<boolean> {
  const p = getPool()
  if (!p) return false

  try {
    const [result] = await p.execute<mysql.ResultSetHeader>("UPDATE game_rooms SET room_config = ? WHERE id = ?", [
      JSON.stringify(config),
      roomId,
    ])
    return result.affectedRows > 0
  } catch (error) {
    console.error("更新房间配置失败:", error)
    return false
  }
}

export async function updateRoomState(roomId: string, state: GameState): Promise<boolean> {
  const p = getPool()
  if (!p) return false

  try {
    const [result] = await p.execute<mysql.ResultSetHeader>("UPDATE game_rooms SET state = ? WHERE id = ?", [
      JSON.stringify(state),
      roomId,
    ])
    return result.affectedRows > 0
  } catch (error) {
    console.error("更新房间状态失败:", error)
    return false
  }
}

export async function roomExists(roomId: string): Promise<boolean> {
  const p = getPool()
  if (!p) return false

  try {
    await initDB()
    const [rows] = await p.execute<mysql.RowDataPacket[]>("SELECT 1 FROM game_rooms WHERE id = ?", [roomId])
    return rows.length > 0
  } catch (error) {
    console.error("检查房间失败:", error)
    return false
  }
}

export async function cleanupRooms(): Promise<void> {
  const p = getPool()
  if (!p) return

  try {
    await p.execute("DELETE FROM game_rooms WHERE updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)")
  } catch (error) {
    console.error("清理房间失败:", error)
  }
}
