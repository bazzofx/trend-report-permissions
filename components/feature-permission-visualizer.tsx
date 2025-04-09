"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "recharts"
import { getPermissionGroup, getAllPermissionGroups, isPermissionEnabled } from "@/utils/permission-groups"
import { ChartDownloadButton } from "@/components/chart-download-button"
import { generateChartId } from "@/utils/chart-utils"
import React from "react"

interface FeaturePermissionVisualizerProps {
  data: any[]
  onGroupClick?: (group: string, role: string) => void
}

// Color palette for permission groups
const GROUP_COLORS = {
  View: "#4ade80", // green
  Edit: "#f97316", // orange
  Export: "#3b82f6", // blue
  Manage: "#8b5cf6", // purple
  FullAccess: "#ef4444", // red
  Other: "#94a3b8", // slate
}

export const FeaturePermissionVisualizer = React.memo(function FeaturePermissionVisualizer({
  data,
  onGroupClick,
}: FeaturePermissionVisualizerProps) {
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")
  const [chartId, setChartId] = useState("")

  // Generate chart ID on component mount
  useEffect(() => {
    setChartId(generateChartId("feature-permission-chart"))
  }, [])

  const uniqueRoles = useMemo(() => {
    if (!data || data.length === 0) return []
    return Array.from(new Set(data.filter((item) => item && item.RoleName).map((item) => item.RoleName)))
  }, [data])

  useEffect(() => {
    if (uniqueRoles.length > 0 && !selectedRole) {
      setSelectedRole(uniqueRoles[0])
    }
  }, [uniqueRoles, selectedRole])

  const processedData = useMemo(() => {
    if (!data || data.length === 0 || !selectedRole) return []

    // Filter data for the selected role
    const roleData = data.filter((item) => item && item.RoleName === selectedRole)

    // Group permissions by permission group
    const groupCounts = new Map<string, number>()

    // Initialize all permission groups with 0
    getAllPermissionGroups().forEach((group) => groupCounts.set(group, 0))

    // Count enabled permissions by group
    roleData.forEach((item) => {
      // Skip items with missing required properties
      if (!item || !item.Permission) return

      const permissionGroup = getPermissionGroup(item.Permission)
      const isEnabled = isPermissionEnabled(item.Value)

      if (isEnabled) {
        const currentCount = groupCounts.get(permissionGroup) || 0
        groupCounts.set(permissionGroup, currentCount + 1)
      }
    })

    // Convert to array format for Recharts
    return Array.from(groupCounts.entries())
      .filter(([_, count]) => count > 0) // Only include groups with permissions
      .map(([group, count]) => ({
        name: group,
        value: count,
      }))
  }, [data, selectedRole])

  if (!data || data.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No data available for visualization.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {uniqueRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/3">
          <Select value={chartType} onValueChange={(value) => setChartType(value as "bar" | "pie")}>
            <SelectTrigger>
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/3 flex justify-end">
          <ChartDownloadButton
            chartId={chartId}
            fileName={`${selectedRole}-permissions-${chartType}-chart`}
            size="icon"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div id={chartId} className="h-[500px] w-full">
            {processedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} permissions`, "Count"]} />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Permission Count"
                      onClick={(data) => onGroupClick && onGroupClick(data.name, selectedRole)}
                      cursor="pointer"
                    >
                      {processedData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={GROUP_COLORS[entry.name as keyof typeof GROUP_COLORS] || "#777777"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={processedData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={180}
                      fill="#8884d8"
                      dataKey="value"
                      onClick={(data) => onGroupClick && onGroupClick(data.name, selectedRole)}
                      cursor="pointer"
                    >
                      {processedData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={GROUP_COLORS[entry.name as keyof typeof GROUP_COLORS] || "#777777"}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value} permissions`, props.payload.name]} />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No permission data available for this role</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
