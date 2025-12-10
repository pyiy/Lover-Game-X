"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { type GameConfig, type GameCell, type CellType, defaultGameConfig, specialCellConfigs } from "@/lib/game-data"
import { X, Save, RotateCcw, Plus, Trash2, Download, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfigModalProps {
  config: GameConfig
  onSave: (config: GameConfig) => void
  onClose: () => void
}

type TabType =
  | "normal"
  | "truth"
  | "dare"
  | "kiss"
  | "hug"
  | "punishment"
  | "reward"
  | "effect"
  | "endpoint"
  | "male"
  | "female"
  | "positions"

export function ConfigModal({ config, onSave, onClose }: ConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<GameConfig>(config)
  const [activeTab, setActiveTab] = useState<TabType>("normal")
  const [isSaving, setIsSaving] = useState(false)

  const tabs: { id: TabType; label: string; color: string }[] = [
    { id: "normal", label: "普通", color: "bg-amber-100 text-amber-800" },
    { id: "truth", label: "真心话", color: "bg-blue-400" },
    { id: "dare", label: "大冒险", color: "bg-purple-400" },
    { id: "kiss", label: "亲亲", color: "bg-pink-400" },
    { id: "hug", label: "抱抱", color: "bg-rose-300" },
    { id: "punishment", label: "惩罚", color: "bg-orange-500" },
    { id: "reward", label: "奖励", color: "bg-emerald-400" },
    { id: "effect", label: "效果", color: "bg-yellow-400" },
    { id: "endpoint", label: "终点区", color: "bg-gradient-to-r from-orange-400 to-amber-500" },
    { id: "male", label: "男生专属", color: "bg-blue-500" },
    { id: "female", label: "女生专属", color: "bg-pink-500" },
    { id: "positions", label: "位置设定", color: "bg-indigo-400" },
  ]

  const getCellsForTab = (tab: TabType): GameCell[] => {
    switch (tab) {
      case "normal":
        return localConfig.normalCells
      case "truth":
        return localConfig.truthCells
      case "dare":
        return localConfig.dareCells
      case "kiss":
        return localConfig.kissCells
      case "hug":
        return localConfig.hugCells
      case "punishment":
        return localConfig.punishmentCells
      case "reward":
        return localConfig.rewardCells
      case "effect":
        return localConfig.effectCells
      case "endpoint":
        return localConfig.endpointCells
      case "male":
        return localConfig.maleCells
      case "female":
        return localConfig.femaleCells
      default:
        return []
    }
  }

  const updateCellsForTab = (tab: TabType, cells: GameCell[]) => {
    const keyMap: { [key in TabType]?: keyof GameConfig } = {
      normal: "normalCells",
      truth: "truthCells",
      dare: "dareCells",
      kiss: "kissCells",
      hug: "hugCells",
      punishment: "punishmentCells",
      reward: "rewardCells",
      effect: "effectCells",
      endpoint: "endpointCells",
      male: "maleCells",
      female: "femaleCells",
    }
    const key = keyMap[tab]
    if (key) {
      setLocalConfig((prev) => ({ ...prev, [key]: cells }))
    }
  }

  const addCell = (tab: TabType) => {
    const cells = getCellsForTab(tab)
    const typeMap: { [key in TabType]?: CellType } = {
      normal: "normal",
      truth: "truth",
      dare: "dare",
      kiss: "kiss",
      hug: "hug",
      punishment: "punishment",
      reward: "reward",
      effect: "forward",
      endpoint: "endpoint-zone",
      male: "dare",
      female: "dare",
    }
    const playerMap: { [key in TabType]?: "male" | "female" | "both" } = {
      male: "male",
      female: "female",
    }
    const newCell: GameCell = {
      id: Date.now(),
      content: "新任务内容",
      type: typeMap[tab] || "normal",
      player: playerMap[tab] || "both",
    }
    updateCellsForTab(tab, [...cells, newCell])
  }

  const updateCell = (tab: TabType, index: number, content: string) => {
    const cells = [...getCellsForTab(tab)]
    cells[index] = { ...cells[index], content }
    updateCellsForTab(tab, cells)
  }

  const updateCellPlayer = (tab: TabType, index: number, player: "male" | "female" | "both") => {
    const cells = [...getCellsForTab(tab)]
    cells[index] = { ...cells[index], player }
    updateCellsForTab(tab, cells)
  }

  const deleteCell = (tab: TabType, index: number) => {
    const cells = getCellsForTab(tab).filter((_, i) => i !== index)
    updateCellsForTab(tab, cells)
  }

  const updateEffectCellType = (index: number, type: CellType) => {
    const cells = [...localConfig.effectCells]
    cells[index] = { ...cells[index], type }
    setLocalConfig((prev) => ({ ...prev, effectCells: cells }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/game-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localConfig),
      })
      if (response.ok) {
        onSave(localConfig)
        onClose()
      }
    } catch (error) {
      console.error("保存失败:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setLocalConfig(defaultGameConfig)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(localConfig, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "game-config.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        setLocalConfig({ ...defaultGameConfig, ...imported })
      } catch (error) {
        console.error("导入失败:", error)
        alert("导入失败，请检查文件格式")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const updateSpecialPosition = (position: number, type: CellType | null) => {
    const newPositions = { ...localConfig.specialCellPositions }
    if (type === null) {
      delete newPositions[position]
    } else {
      newPositions[position] = type
    }
    setLocalConfig((prev) => ({ ...prev, specialCellPositions: newPositions }))
  }

  // 是否显示性别选择器（通用格子才显示）
  const showGenderSelector = !["male", "female", "effect"].includes(activeTab)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b bg-gradient-to-r from-rose-50 to-amber-50">
          <h2 className="text-lg md:text-xl font-bold text-foreground">自定义游戏配置</h2>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              <Button variant="outline" size="sm" className="bg-transparent" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">导入</span>
                </span>
              </Button>
            </label>
            <Button variant="outline" size="sm" onClick={handleExport} className="bg-transparent">
              <Download className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">导出</span>
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? `${tab.color} text-white shadow-md scale-105`
                  : "bg-white text-gray-600 hover:bg-gray-100",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {activeTab === "positions" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm md:text-base">棋盘大小</h3>
                <input
                  type="number"
                  value={localConfig.boardSize}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({ ...prev, boardSize: Number.parseInt(e.target.value) || 48 }))
                  }
                  className="w-20 p-2 border rounded-lg text-center text-sm"
                  min={20}
                  max={80}
                />
              </div>

              <div>
                <h3 className="font-bold mb-2 text-sm md:text-base">特殊格子位置</h3>
                <p className="text-xs text-muted-foreground mb-3">设置哪些位置固定为特殊格子类型</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(localConfig.specialCellPositions).map(([pos, type]) => (
                    <div key={pos} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="text-xs md:text-sm font-mono w-8">#{pos}</span>
                      <select
                        value={type}
                        onChange={(e) => updateSpecialPosition(Number.parseInt(pos), e.target.value as CellType)}
                        className="flex-1 p-1 text-xs border rounded"
                      >
                        {specialCellConfigs.map((cfg) => (
                          <option key={cfg.type} value={cfg.type}>
                            {cfg.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateSpecialPosition(Number.parseInt(pos), null)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-transparent"
                  onClick={() => {
                    const newPos = Math.max(...Object.keys(localConfig.specialCellPositions).map(Number), 0) + 5
                    if (newPos <= localConfig.boardSize) {
                      updateSpecialPosition(newPos, "truth")
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加位置
                </Button>
              </div>

              {/* 终点设置 */}
              <div className="p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h3 className="font-bold text-orange-700 mb-3 text-sm md:text-base">终点区域设置</h3>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">终点标题</label>
                    <input
                      type="text"
                      value={localConfig.endpointContent.title}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          endpointContent: { ...prev.endpointContent, title: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">副标题</label>
                    <input
                      type="text"
                      value={localConfig.endpointContent.subtitle}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          endpointContent: { ...prev.endpointContent, subtitle: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">胜利奖励</label>
                    <input
                      type="text"
                      value={localConfig.endpointContent.reward}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          endpointContent: { ...prev.endpointContent, reward: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm md:text-base">
                  {tabs.find((t) => t.id === activeTab)?.label}格子内容
                  <span className="text-xs md:text-sm font-normal text-muted-foreground ml-2">
                    ({getCellsForTab(activeTab).length}个)
                  </span>
                </h3>
                <Button variant="outline" size="sm" onClick={() => addCell(activeTab)}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加
                </Button>
              </div>

              {activeTab === "male" && (
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                  <p className="text-xs text-blue-700">
                    男生专属格子：当男生玩家踩到普通格子但内容不适合时，会从这里随机抽取任务
                  </p>
                </div>
              )}

              {activeTab === "female" && (
                <div className="p-2 bg-pink-50 rounded-lg border border-pink-200 mb-3">
                  <p className="text-xs text-pink-700">
                    女生专属格子：当女生玩家踩到普通格子但内容不适合时，会从这里随机抽取任务
                  </p>
                </div>
              )}

              {getCellsForTab(activeTab).map((cell, index) => (
                <div key={cell.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-muted-foreground w-5 pt-2">{index + 1}</span>

                  {activeTab === "effect" && (
                    <select
                      value={cell.type}
                      onChange={(e) => updateEffectCellType(index, e.target.value as CellType)}
                      className="p-1.5 text-xs border rounded w-16 md:w-20"
                    >
                      <option value="forward">前进</option>
                      <option value="backward">后退</option>
                      <option value="skip">停一轮</option>
                      <option value="again">再掷</option>
                      <option value="swap">交换</option>
                    </select>
                  )}

                  {showGenderSelector && (
                    <select
                      value={cell.player || "both"}
                      onChange={(e) => updateCellPlayer(activeTab, index, e.target.value as "male" | "female" | "both")}
                      className="p-1.5 text-xs border rounded w-14 md:w-16"
                    >
                      <option value="both">通用</option>
                      <option value="male">♂</option>
                      <option value="female">♀</option>
                    </select>
                  )}

                  <textarea
                    value={cell.content}
                    onChange={(e) => updateCell(activeTab, index, e.target.value)}
                    className="flex-1 p-2 border rounded-lg text-xs md:text-sm resize-none"
                    rows={2}
                  />
                  <button onClick={() => deleteCell(activeTab, index)} className="text-red-400 hover:text-red-600 pt-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 p-3 md:p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={handleReset} className="bg-transparent text-xs md:text-sm">
            <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            重置
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose} className="bg-transparent text-xs md:text-sm">
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs md:text-sm"
          >
            <Save className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  )
}
