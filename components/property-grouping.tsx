"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface PropertyGroupingProps {
  data: any[]
  selectedHeaders: string[]
}

type PropertyGroup = {
  key: string
  headers: string[]
}

export function PropertyGrouping({ data, selectedHeaders }: PropertyGroupingProps) {
  const [propertyGroups, setPropertyGroups] = useState<PropertyGroup[]>([])

  useEffect(() => {
    if (data.length === 0) return

    // Function to extract property keys from JSON-like strings
    const extractPropertyKeys = (value: string): string[] => {
      if (typeof value !== "string" || !value.startsWith("@{") || !value.endsWith("}")) {
        return []
      }

      const cleanValue = value.substring(2, value.length - 1)
      const properties = cleanValue.split(";").map((prop) => prop.trim())

      return properties.filter((prop) => prop.includes("=")).map((prop) => prop.split("=")[0].trim())
    }

    // Map headers to their property keys
    const headerPropertyMap: Record<string, Set<string>> = {}

    // Use selected headers if available, otherwise use all headers
    const headersToAnalyze = selectedHeaders.length > 0 ? selectedHeaders : Object.keys(data[0] || {})

    headersToAnalyze.forEach((header) => {
      headerPropertyMap[header] = new Set<string>()

      // Sample up to 50 rows to identify property keys
      const sampleSize = Math.min(50, data.length)
      for (let i = 0; i < sampleSize; i++) {
        const row = data[i]
        if (!row[header]) continue

        const propertyKeys = extractPropertyKeys(row[header])
        propertyKeys.forEach((key) => headerPropertyMap[header].add(key))
      }
    })

    // Group headers by common property keys
    const keyHeaderMap: Record<string, string[]> = {}

    Object.entries(headerPropertyMap).forEach(([header, keys]) => {
      Array.from(keys).forEach((key) => {
        if (!keyHeaderMap[key]) {
          keyHeaderMap[key] = []
        }
        keyHeaderMap[key].push(header)
      })
    })

    // Convert to array of property groups
    const groups = Object.entries(keyHeaderMap)
      .filter(([_, headers]) => headers.length > 1) // Only include groups with multiple headers
      .map(([key, headers]) => ({
        key,
        headers,
      }))
      .sort((a, b) => b.headers.length - a.headers.length) // Sort by number of headers

    setPropertyGroups(groups)
  }, [data, selectedHeaders])

  if (propertyGroups.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No property groups found. Try selecting different headers or upload a file with JSON-like data.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {propertyGroups.map((group) => (
        <Card key={group.key}>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium">Property: {group.key}</h3>
                <Badge variant="outline">{group.headers.length} headers</Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {group.headers.map((header) => (
                  <Badge key={header} variant="secondary">
                    {header}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
