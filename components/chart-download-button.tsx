"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { downloadChartAsImage } from "@/utils/chart-utils"
import { useState } from "react"

interface ChartDownloadButtonProps {
  chartId: string
  fileName: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ChartDownloadButton({
  chartId,
  fileName,
  variant = "outline",
  size = "sm",
  className = "",
}: ChartDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadChartAsImage(chartId, fileName)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
      title="Download chart as image"
    >
      <Download className={`h-4 w-4 ${size !== "icon" ? "mr-2" : ""} ${isDownloading ? "animate-pulse" : ""}`} />
      {size !== "icon" && (isDownloading ? "Downloading..." : "Download")}
    </Button>
  )
}
