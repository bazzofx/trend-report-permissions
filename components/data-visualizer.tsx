"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface DataVisualizerProps {
  data: any[]
  selectedHeaders: string[]
  chartType?: "bar" | "pie" | "line"
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f", "#ffbb28", "#ff8042"]

export function DataVisualizer({ data, selectedHeaders, chartType = "bar" }: DataVisualizerProps) {
  const [activeChart, setActiveChart] = useState<"bar" | "pie" | "line">(chartType)
  const [primaryHeader, setPrimaryHeader] = useState<string>("")
  const [processedData, setProcessedData] = useState<any[]>([])
  const [propertyKey, setPropertyKey] = useState<string>("view")
  const [availablePropertyKeys, setAvailablePropertyKeys] = useState<string[]>([])

  useEffect(() => {
    if (selectedHeaders.length > 0 && !primaryHeader) {
      setPrimaryHeader(selectedHeaders[0])
    }
  }, [selectedHeaders, primaryHeader])

  useEffect(() => {
    if (!primaryHeader || data.length === 0) return

    // Extract all possible property keys from the JSON-like data
    const extractPropertyKeys = () => {
      const keys = new Set<string>()

      data.forEach((row) => {
        const value = row[primaryHeader]
        if (typeof value === "string" && value.startsWith("@{") && value.endsWith("}")) {
          // Parse the JSON-like string
          const cleanValue = value.substring(2, value.length - 1)
          const properties = cleanValue.split(";").map((prop) => prop.trim())

          properties.forEach((prop) => {
            if (prop.includes("=")) {
              const key = prop.split("=")[0].trim()
              keys.add(key)
            }
          })
        }
      })

      return Array.from(keys)
    }

    const keys = extractPropertyKeys()
    setAvailablePropertyKeys(keys)

    if (keys.length > 0 && !propertyKey) {
      setPropertyKey(keys[0])
    }

    // Process data for visualization
    const processData = () => {
      if (activeChart === "pie") {
        return processPieChartData()
      } else {
        return processBarOrLineChartData()
      }
    }

    const processPieChartData = () => {
      const valueCount: Record<string, number> = {}

      data.forEach((row) => {
        const value = row[primaryHeader]
        if (typeof value === "string" && value.startsWith("@{") && value.endsWith("}")) {
          // Parse the JSON-like string
          const cleanValue = value.substring(2, value.length - 1)
          const properties = cleanValue.split(";").map((prop) => prop.trim())

          let propertyValue = "N/A"
          properties.forEach((prop) => {
            if (prop.startsWith(`${propertyKey}=`)) {
              propertyValue = prop.split("=")[1].trim()
            }
          })

          valueCount[propertyValue] = (valueCount[propertyValue] || 0) + 1
        } else {
          const displayValue = value || "N/A"
          valueCount[displayValue] = (valueCount[displayValue] || 0) + 1
        }
      })

      return Object.entries(valueCount).map(([name, value]) => ({ name, value }))
    }

    const processBarOrLineChartData = () => {
      const result: any[] = []

      // For each row in the data
      data.slice(0, 20).forEach((row, index) => {
        const item: any = { name: row.Name || `Item ${index + 1}` }

        // For each selected header
        selectedHeaders.forEach((header) => {
          const value = row[header]

          if (typeof value === "string" && value.startsWith("@{") && value.endsWith("}")) {
            // Parse the JSON-like string
            const cleanValue = value.substring(2, value.length - 1)
            const properties = cleanValue.split(";").map((prop) => prop.trim())

            let propertyValue = "N/A"
            properties.forEach((prop) => {
              if (prop.startsWith(`${propertyKey}=`)) {
                propertyValue = prop.split("=")[1].trim()
              }
            })

            item[header] = propertyValue === "1" ? 1 : propertyValue === "0" ? 0 : propertyValue
          } else {
            item[header] = value
          }
        })

        result.push(item)
      })

      return result
    }

    setProcessedData(processData())
  }, [data, selectedHeaders, primaryHeader, activeChart, propertyKey])

  if (selectedHeaders.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please select at least one header to visualize data.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chart Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeChart}
              onValueChange={(value) => setActiveChart(value as "bar" | "pie" | "line")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                <TabsTrigger value="line">Line Chart</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Primary Header</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={primaryHeader} onValueChange={setPrimaryHeader}>
              <SelectTrigger>
                <SelectValue placeholder="Select a header" />
              </SelectTrigger>
              <SelectContent>
                {selectedHeaders.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {availablePropertyKeys.length > 0 && (
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Property Key</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={propertyKey} onValueChange={setPropertyKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property key" />
                </SelectTrigger>
                <SelectContent>
                  {availablePropertyKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="h-[500px] w-full">
        {processedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === "bar" ? (
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedHeaders.map((header, index) => (
                  <Bar key={header} dataKey={header} fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            ) : activeChart === "pie" ? (
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedHeaders.map((header, index) => (
                  <Line
                    key={header}
                    type="monotone"
                    dataKey={header}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No data available for visualization</p>
          </div>
        )}
      </div>
    </div>
  )
}
