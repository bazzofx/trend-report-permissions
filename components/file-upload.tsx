"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileUp, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import Papa from "papaparse"

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  const router = useRouter()

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const processFile = useCallback(
    (file: File) => {
      setIsUploading(true)

      // Simulate progress
      let interval: NodeJS.Timeout
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          clearInterval(interval)
          setUploadProgress(100)

          if (results.errors.length > 0) {
            toast({
              title: "Error parsing CSV",
              description: results.errors[0].message,
              variant: "destructive",
            })
            setIsUploading(false)
            setUploadProgress(0)
            return
          }

          // Store the parsed data in sessionStorage
          try {
            // Clean up the data - trim whitespace from headers and values
            const cleanData = results.data.map((row: any) => {
              const cleanRow: any = {}
              Object.keys(row).forEach((key) => {
                const cleanKey = key.trim().replace(/^["']|["']$/g, "")
                const value = typeof row[key] === "string" ? row[key].trim().replace(/^["']|["']$/g, "") : row[key]
                cleanRow[cleanKey] = value
              })
              return cleanRow
            })

            // Get clean headers
            const headers = results.meta.fields?.map((header) => header.trim().replace(/^["']|["']$/g, "")) || []

            sessionStorage.setItem("csvData", JSON.stringify(cleanData))
            sessionStorage.setItem(
              "csvMeta",
              JSON.stringify({
                filename: file.name,
                rowCount: cleanData.length,
                columnCount: headers.length,
                headers: headers,
              }),
            )

            // Navigate to visualization page
            setTimeout(() => {
              router.push("/visualize")
            }, 500)
          } catch (error) {
            toast({
              title: "Error storing data",
              description: "The CSV file might be too large for browser storage",
              variant: "destructive",
            })
            setIsUploading(false)
            setUploadProgress(0)
          }
        },
        error: (error) => {
          if (interval) clearInterval(interval)
          toast({
            title: "Error parsing CSV",
            description: error.message,
            variant: "destructive",
          })
          setIsUploading(false)
          setUploadProgress(0)
        },
      })
    },
    [router, toast],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          processFile(file)
        } else {
          toast({
            title: "Invalid file type",
            description: "Please upload a CSV file",
            variant: "destructive",
          })
        }
      }
    },
    [processFile, toast],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          processFile(file)
        } else {
          toast({
            title: "Invalid file type",
            description: "Please upload a CSV file",
            variant: "destructive",
          })
        }
      }
    },
    [processFile, toast],
  )

  return (
    <div className="w-full">
      {isUploading ? (
        <Card className="p-6 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm">
          <h3 className="text-lg font-medium mb-4 text-red-400">Processing your CSV file...</h3>
          <Progress value={uploadProgress} className="w-full mb-4 bg-gray-700">
            <div className="h-full bg-red-500" style={{ width: `${uploadProgress}%` }} />
          </Progress>
          <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
        </Card>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer backdrop-blur-sm ${
            isDragging
              ? "border-red-500 bg-red-500/10 border-red-glow"
              : "border-muted-foreground/25 hover:border-red-500/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <div className="flex flex-col items-center justify-center gap-4">
            {isDragging ? <FileUp className="h-12 w-12 text-red-500" /> : <Upload className="h-12 w-12 text-red-400" />}
            <div className="flex flex-col space-y-1 text-center">
              <p className="text-lg font-medium text-red-400">Drag and drop your CSV file here, or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports CSV files up to 10MB</p>
            </div>
            <Button variant="outline" className="mt-2 border-red-500/30 text-red-400 btn-red-glow">
              <FileQuestion className="mr-2 h-4 w-4" />
              Select CSV File
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
