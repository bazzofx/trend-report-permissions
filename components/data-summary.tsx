"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface DataSummaryProps {
  data: any[]
  selectedHeaders: string[]
}

type SummaryStats = {
  header: string
  count: number
  uniqueValues: number
  mostCommon: { value: string; count: number }
  propertyStats: {
    key: string
    values: { value: string; count: number }[]
  }[]
}

export function DataSummary({ data, selectedHeaders }: DataSummaryProps) {
  const [summaryStats, setSummaryStats] = useState<SummaryStats[]>([])

  useEffect(() => {
    if (data.length === 0 || selectedHeaders.length === 0) return

    const calculateStats = () => {
      return selectedHeaders.map((header) => {
        // Count total non-empty values
        const nonEmptyValues = data.filter(
          (row) => row[header] !== undefined && row[header] !== null && row[header] !== "",
        )
        const count = nonEmptyValues.length

        // Count unique values
        const uniqueValuesSet = new Set(data.map((row) => row[header]))
        const uniqueValues = uniqueValuesSet.size

        // Find most common value
        const valueCounts: Record<string, number> = {}
        data.forEach((row) => {
          const value = String(row[header] || "")
          valueCounts[value] = (valueCounts[value] || 0) + 1
        })

        let mostCommonValue = ""
        let mostCommonCount = 0
        Object.entries(valueCounts).forEach(([value, count]) => {
          if (count > mostCommonCount) {
            mostCommonValue = value
            mostCommonCount = count
          }
        })

        // Analyze JSON-like properties
        const propertyStats: {
          key: string
          values: { value: string; count: number }[]
        }[] = []

        // Check if values are JSON-like
        const jsonLikeValues = data.filter(
          (row) => typeof row[header] === "string" && row[header].startsWith("@{") && row[header].endsWith("}"),
        )

        if (jsonLikeValues.length > 0) {
          // Extract property keys
          const propertyKeys = new Set<string>()

          jsonLikeValues.forEach((row) => {
            const value = row[header] as string
            const cleanValue = value.substring(2, value.length - 1)
            const properties = cleanValue.split(";").map((prop) => prop.trim())

            properties.forEach((prop) => {
              if (prop.includes("=")) {
                const key = prop.split("=")[0].trim()
                propertyKeys.add(key)
              }
            })
          })

          // For each property key, count values
          Array.from(propertyKeys).forEach((key) => {
            const valueStats: Record<string, number> = {}

            jsonLikeValues.forEach((row) => {
              const value = row[header] as string
              const cleanValue = value.substring(2, value.length - 1)
              const properties = cleanValue.split(";").map((prop) => prop.trim())

              let propertyValue = "N/A"
              properties.forEach((prop) => {
                if (prop.startsWith(`${key}=`)) {
                  propertyValue = prop.split("=")[1].trim()
                }
              })

              valueStats[propertyValue] = (valueStats[propertyValue] || 0) + 1
            })

            const sortedValues = Object.entries(valueStats)
              .map(([value, count]) => ({ value, count }))
              .sort((a, b) => b.count - a.count)

            propertyStats.push({
              key,
              values: sortedValues.slice(0, 5), // Top 5 values
            })
          })
        }

        return {
          header,
          count,
          uniqueValues,
          mostCommon: {
            value: mostCommonValue,
            count: mostCommonCount,
          },
          propertyStats,
        }
      })
    }

    setSummaryStats(calculateStats())
  }, [data, selectedHeaders])

  if (selectedHeaders.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please select at least one header to view summary statistics.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {summaryStats.map((stats) => (
        <Card key={stats.header}>
          <CardHeader>
            <CardTitle>{stats.header}</CardTitle>
            <CardDescription>
              {stats.count} values, {stats.uniqueValues} unique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Most Common Value</h4>
                <div className="bg-muted p-2 rounded-md">
                  <p className="font-mono text-sm">
                    {stats.mostCommon.value || "(empty)"} - {stats.mostCommon.count} occurrences
                  </p>
                </div>
              </div>

              {stats.propertyStats.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Property Analysis</h4>
                  <div className="space-y-4">
                    {stats.propertyStats.map((propertyStat) => (
                      <div key={propertyStat.key}>
                        <h5 className="text-sm font-medium mb-1">Property: {propertyStat.key}</h5>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Value</TableHead>
                              <TableHead>Count</TableHead>
                              <TableHead>Percentage</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {propertyStat.values.map((value, index) => (
                              <TableRow key={index}>
                                <TableCell>{value.value}</TableCell>
                                <TableCell>{value.count}</TableCell>
                                <TableCell>{((value.count / stats.count) * 100).toFixed(1)}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
