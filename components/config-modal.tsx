"use client"

import type { GameConfig, CellType, GameCell } from "@/lib/game-data"
import { specialCellConfigs } from "@/lib/game-data"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus, Trash2, Save, RotateCcw, Download, Upload, Copy, ClipboardPaste, Lock } from "lucide-react"

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  config: GameConfig
  onSave: (config: GameConfig) => void
  onReset: () => void
}

export function ConfigModal({ isOpen, onClose, config, onSave, onReset }: ConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<GameConfig>(config)
  const [activeTab, setActiveTab] = useState("normal")
  const [newCellContent, setNewCellContent] = useState("")
  const [newCellGender, setNewCellGender] = useState<"both" | "male" | "female">("both")
  const [newPosition, setNewPosition] = useState("")
  const [newPositionType, setNewPositionType] = useState<CellType>("truth")
  const [showImportExport, setShowImportExport] = useState(false)
  const [importExportText, setImportExportText] = useState("")
  const [importExportMode, setImportExportMode] = useState<"import" | "export">("export")
  const [importTarget, setImportTarget] = useState<"current" | "default">("current")
  const [adminPassword, setAdminPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  if (!isOpen) return null

  const cellTypeToTab: { [key: string]: CellType[] } = {
    normal: ["normal"],
    male: ["normal"],
    female: ["normal"],
    truth: ["truth"],
    dare: ["dare"],
    kiss: ["kiss"],
    hug: ["hug"],
    punishment: ["punishment"],
    reward: ["reward"],
    endpoint: ["endpoint-zone"],
    positions: [],
  }

  const tabToConfigKey: { [key: string]: keyof GameConfig } = {
    normal: "normalCells",
    male: "maleCells",
    female: "femaleCells",
    truth: "truthCells",
    dare: "dareCells",
    kiss: "kissCells",
    hug: "hugCells",
    punishment: "punishmentCells",
    reward: "rewardCells",
    endpoint: "endpointCells",
  }

  const handleAddCell = () => {
    if (!newCellContent.trim()) return

    const configKey = tabToConfigKey[activeTab]
    if (!configKey) return

    const cells = localConfig[configKey] as GameCell[]
    const newId = Math.max(...cells.map((c) => c.id), 0) + 1

    let cellType: CellType = "normal"
    if (activeTab === "truth") cellType = "truth"
    else if (activeTab === "dare") cellType = "dare"
    else if (activeTab === "kiss") cellType = "kiss"
    else if (activeTab === "hug") cellType = "hug"
    else if (activeTab === "punishment") cellType = "punishment"
    else if (activeTab === "reward") cellType = "reward"
    else if (activeTab === "endpoint") cellType = "endpoint-zone"

    const newCell: GameCell = {
      id: newId,
      content: newCellContent,
      type: cellType,
      player: activeTab === "male" ? "male" : activeTab === "female" ? "female" : newCellGender,
    }

    setLocalConfig({
      ...localConfig,
      [configKey]: [...cells, newCell],
    })
    setNewCellContent("")
    setNewCellGender("both")
  }

  const handleDeleteCell = (id: number) => {
    const configKey = tabToConfigKey[activeTab]
    if (!configKey) return

    const cells = localConfig[configKey] as GameCell[]
    setLocalConfig({
      ...localConfig,
      [configKey]: cells.filter((c) => c.id !== id),
    })
  }

  const handleAddPosition = () => {
    const pos = Number.parseInt(newPosition)
    if (isNaN(pos) || pos < 1 || pos > localConfig.boardSize) {
      alert(`请输入1到${localConfig.boardSize}之间的位置编号`)
      return
    }
    if (localConfig.specialCellPositions[pos]) {
      alert(`位置 ${pos} 已经设置了特殊格子`)
      return
    }
    setLocalConfig({
      ...localConfig,
      specialCellPositions: {
        ...localConfig.specialCellPositions,
        [pos]: newPositionType,
      },
    })
    setNewPosition("")
  }

  const handleDeletePosition = (position: number) => {
    const newPositions = { ...localConfig.specialCellPositions }
    delete newPositions[position]
    setLocalConfig({
      ...localConfig,
      specialCellPositions: newPositions,
    })
  }

  const handleSave = () => {
    onSave(localConfig)
    onClose()
  }

  const handleExportConfig = () => {
    const configJson = JSON.stringify(localConfig, null, 2)
    setImportExportText(configJson)
    setImportExportMode("export")
    setShowImportExport(true)
  }

  const handleImportConfig = () => {
    setImportExportText("")
    setImportExportMode("import")
    setImportTarget("current")
    setAdminPassword("")
    setShowImportExport(true)
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(importExportText)
      alert("配置已复制到剪贴板！")
    } catch (err) {
      const textArea = document.createElement("textarea")
      textArea.value = importExportText
      textArea.style.position = "fixed"
      textArea.style.left = "-9999px"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      alert("配置已复制到剪贴板！")
    }
  }

  const handlePasteAndImport = async () => {
    try {
      const importedConfig = JSON.parse(importExportText) as GameConfig
      if (!importedConfig.normalCells || !importedConfig.boardSize || !importedConfig.specialCellPositions) {
        alert("配置格式无效，请检查JSON内容")
        return
      }

      if (importTarget === "current") {
        // 导入到当前房间
        setLocalConfig(importedConfig)
        setShowImportExport(false)
        setImportExportText("")
        alert("配置已导入到当前房间！")
      } else {
        // 导入到默认配置，需要密码验证
        if (!adminPassword.trim()) {
          alert("请输入管理员密码")
          return
        }

        setIsSubmitting(true)
        try {
          const response = await fetch("/api/default-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: adminPassword, config: importedConfig }),
          })
          const result = await response.json()

          if (result.success) {
            setShowImportExport(false)
            setImportExportText("")
            setAdminPassword("")
            alert("配置已保存为默认配置！新创建的房间将使用此配置。")
          } else {
            alert(result.error || "保存失败")
          }
        } catch (error) {
          alert("网络错误，请重试")
        } finally {
          setIsSubmitting(false)
        }
      }
    } catch {
      alert("配置格式无效，请确保粘贴的是正确的JSON格式")
    }
  }

  const renderCellList = () => {
    const configKey = tabToConfigKey[activeTab]
    if (!configKey) return null

    const cells = localConfig[configKey] as GameCell[]

    return (
      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
        {cells.map((cell) => (
          <div key={cell.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <span className="flex-1 text-sm">{cell.content}</span>
            {(activeTab === "normal" || activeTab === "truth" || activeTab === "dare") && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  cell.player === "male"
                    ? "bg-blue-100 text-blue-600"
                    : cell.player === "female"
                      ? "bg-pink-100 text-pink-600"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {cell.player === "male" ? "男" : cell.player === "female" ? "女" : "通用"}
              </span>
            )}
            <button onClick={() => handleDeleteCell(cell.id)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    )
  }

  const renderPositionList = () => {
    const positions = Object.entries(localConfig.specialCellPositions)
      .map(([pos, type]) => ({ position: Number.parseInt(pos), type }))
      .sort((a, b) => a.position - b.position)

    return (
      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
        {positions.map(({ position, type }) => {
          const config = specialCellConfigs.find((c) => c.type === type)
          return (
            <div key={position} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="w-12 text-center font-mono text-sm bg-white rounded px-2 py-1">{position}</span>
              <span className={`flex-1 text-sm px-2 py-1 rounded ${config?.color || "bg-gray-200"} text-white`}>
                {config?.name || type}
              </span>
              <button onClick={() => handleDeletePosition(position)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">游戏配置</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportConfig} className="bg-transparent text-xs">
              <Download className="w-3 h-3 mr-1" />
              导出
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportConfig} className="bg-transparent text-xs">
              <Upload className="w-3 h-3 mr-1" />
              导入
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1 h-auto mb-4 bg-transparent">
              <TabsTrigger value="normal" className="text-xs data-[state=active]:bg-rose-100">
                普通
              </TabsTrigger>
              <TabsTrigger value="male" className="text-xs data-[state=active]:bg-blue-100">
                男生专属
              </TabsTrigger>
              <TabsTrigger value="female" className="text-xs data-[state=active]:bg-pink-100">
                女生专属
              </TabsTrigger>
              <TabsTrigger value="truth" className="text-xs data-[state=active]:bg-blue-100">
                真心话
              </TabsTrigger>
              <TabsTrigger value="dare" className="text-xs data-[state=active]:bg-purple-100">
                大冒险
              </TabsTrigger>
              <TabsTrigger value="kiss" className="text-xs data-[state=active]:bg-pink-100">
                亲亲
              </TabsTrigger>
              <TabsTrigger value="hug" className="text-xs data-[state=active]:bg-rose-100">
                抱抱
              </TabsTrigger>
              <TabsTrigger value="punishment" className="text-xs data-[state=active]:bg-orange-100">
                惩罚
              </TabsTrigger>
              <TabsTrigger value="reward" className="text-xs data-[state=active]:bg-emerald-100">
                奖励
              </TabsTrigger>
              <TabsTrigger value="endpoint" className="text-xs data-[state=active]:bg-yellow-100">
                终点区
              </TabsTrigger>
              <TabsTrigger value="positions" className="text-xs data-[state=active]:bg-indigo-100">
                位置设定
              </TabsTrigger>
            </TabsList>

            {/* Cell list tabs */}
            {Object.keys(tabToConfigKey).map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {renderCellList()}
                <div className="flex gap-2 mt-4">
                  <Input
                    value={newCellContent}
                    onChange={(e) => setNewCellContent(e.target.value)}
                    placeholder="输入新内容..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAddCell()}
                  />
                  {(tab === "normal" || tab === "truth" || tab === "dare") && tab !== "male" && tab !== "female" && (
                    <select
                      value={newCellGender}
                      onChange={(e) => setNewCellGender(e.target.value as "both" | "male" | "female")}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="both">通用</option>
                      <option value="male">男生</option>
                      <option value="female">女生</option>
                    </select>
                  )}
                  <Button onClick={handleAddCell} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>
            ))}

            {/* Positions tab */}
            <TabsContent value="positions" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">棋盘大小</label>
                <Input
                  type="number"
                  value={localConfig.boardSize}
                  onChange={(e) => setLocalConfig({ ...localConfig, boardSize: Number.parseInt(e.target.value) || 48 })}
                  min={20}
                  max={100}
                />
              </div>
              {renderPositionList()}
              <div className="flex gap-2 mt-4 flex-wrap">
                <Input
                  type="number"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="位置编号"
                  className="w-24"
                  min={1}
                  max={localConfig.boardSize}
                />
                <select
                  value={newPositionType}
                  onChange={(e) => setNewPositionType(e.target.value as CellType)}
                  className="flex-1 min-w-[120px] px-2 py-1 border rounded text-sm"
                >
                  {specialCellConfigs.map((config) => (
                    <option key={config.type} value={config.type}>
                      {config.name}
                    </option>
                  ))}
                </select>
                <Button onClick={handleAddPosition} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
                  <Plus className="w-4 h-4 mr-1" />
                  添加
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-2 p-4 border-t">
          <Button variant="outline" onClick={onReset} className="bg-transparent">
            <RotateCcw className="w-4 h-4 mr-1" />
            重置默认
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              取消
            </Button>
            <Button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600 text-white">
              <Save className="w-4 h-4 mr-1" />
              保存
            </Button>
          </div>
        </div>
      </div>

      {showImportExport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{importExportMode === "export" ? "导出配置" : "导入配置"}</h3>
              <button onClick={() => setShowImportExport(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {importExportMode === "export" ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">点击下方按钮复制配置，然后保存到文本文件中</p>
                <textarea
                  value={importExportText}
                  readOnly
                  className="w-full h-48 p-3 border rounded-lg text-xs font-mono bg-gray-50 resize-none"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" onClick={() => setShowImportExport(false)} className="bg-transparent">
                    关闭
                  </Button>
                  <Button onClick={handleCopyToClipboard} className="bg-rose-500 hover:bg-rose-600 text-white">
                    <Copy className="w-4 h-4 mr-1" />
                    复制到剪贴板
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">将之前导出的配置JSON粘贴到下方</p>
                <textarea
                  value={importExportText}
                  onChange={(e) => setImportExportText(e.target.value)}
                  placeholder='粘贴配置JSON内容，例如: {"boardSize": 48, ...}'
                  className="w-full h-36 p-3 border rounded-lg text-xs font-mono resize-none"
                />

                <div className="mt-3 space-y-2">
                  <label className="text-sm font-medium">导入到：</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importTarget"
                        value="current"
                        checked={importTarget === "current"}
                        onChange={() => setImportTarget("current")}
                        className="text-rose-500"
                      />
                      <span className="text-sm">当前房间</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importTarget"
                        value="default"
                        checked={importTarget === "default"}
                        onChange={() => setImportTarget("default")}
                        className="text-rose-500"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        默认配置
                      </span>
                    </label>
                  </div>
                </div>

                {importTarget === "default" && (
                  <div className="mt-3">
                    <label className="text-sm font-medium mb-1 block">管理员密码：</label>
                    <Input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="请输入管理员密码"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">保存为默认配置后，新创建的房间将使用此配置</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowImportExport(false)} className="bg-transparent">
                    取消
                  </Button>
                  <Button
                    onClick={handlePasteAndImport}
                    disabled={
                      !importExportText.trim() || isSubmitting || (importTarget === "default" && !adminPassword.trim())
                    }
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        保存中...
                      </span>
                    ) : (
                      <>
                        <ClipboardPaste className="w-4 h-4 mr-1" />
                        {importTarget === "default" ? "保存为默认配置" : "导入配置"}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
