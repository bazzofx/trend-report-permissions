"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getPermissionGroup, getAllPermissionGroups, isPermissionEnabled } from "@/utils/permission-groups"
import { ChartDownloadButton } from "@/components/chart-download-button"
import { generateChartId } from "@/utils/chart-utils"
import React from "react"

interface RolePermissionVisualizerProps {
  data: any[]
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

export const RolePermissionVisualizer = React.memo(function RolePermissionVisualizer({
  data,
}: RolePermissionVisualizerProps) {
  const [activeView, setActiveView] = useState<"byRole" | "byFeature">("byRole")
  const [chartId, setChartId] = useState("")

  // Generate chart ID on component mount
  useEffect(() => {
    setChartId(generateChartId("role-permission-chart"))
  }, [])

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []

    if (activeView === "byRole") {
      // Group by role
      const roleMap = new Map<string, Map<string, number>>()

      // Initialize with all permission groups set to 0
      const permissionGroups = getAllPermissionGroups()

      data.forEach((item) => {
        // Skip items with missing required properties
        if (!item || !item.RoleName || !item.Permission) return

        const roleName = item.RoleName
        const permissionGroup = getPermissionGroup(item.Permission)
        const isEnabled = isPermissionEnabled(item.Value)

        if (!roleMap.has(roleName)) {
          const groupCounts = new Map<string, number>()
          permissionGroups.forEach((group) => groupCounts.set(group, 0))
          roleMap.set(roleName, groupCounts)
        }

        if (isEnabled) {
          const currentCount = roleMap.get(roleName)!.get(permissionGroup) || 0
          roleMap.get(roleName)!.set(permissionGroup, currentCount + 1)
        }
      })

      // Convert to array format for Recharts
      return Array.from(roleMap.entries()).map(([role, groupCounts]) => {
        const result: any = { name: role }
        Array.from(groupCounts.entries()).forEach(([group, count]) => {
          result[group] = count
        })
        return result
      })
    } else {
      // Group by feature for the selected role
      const featureMap = new Map<string, Map<string, number>>()

      // Initialize with all permission groups set to 0
      const permissionGroups = getAllPermissionGroups()

      data.forEach((item) => {
        // Skip items with missing required properties
        if (!item || !item.Feature || !item.Permission) return

        const feature = item.Feature
        const permissionGroup = getPermissionGroup(item.Permission)
        const isEnabled = isPermissionEnabled(item.Value)

        if (!featureMap.has(feature)) {
          const groupCounts = new Map<string, number>()
          permissionGroups.forEach((group) => groupCounts.set(group, 0))
          featureMap.set(feature, groupCounts)
        }

        if (isEnabled) {
          const currentCount = featureMap.get(feature)!.get(permissionGroup) || 0
          featureMap.get(feature)!.set(permissionGroup, currentCount + 1)
        }
      })

      // Convert to array format for Recharts
      return Array.from(featureMap.entries()).map(([feature, groupCounts]) => {
        const result: any = { name: feature }
        Array.from(groupCounts.entries()).forEach(([group, count]) => {
          result[group] = count
        })
        return result
      })
    }
  }, [data, activeView])

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
      <div className="flex justify-between items-center">
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as "byRole" | "byFeature")}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="byRole">By Role</TabsTrigger>
            <TabsTrigger value="byFeature">By Feature</TabsTrigger>
          </TabsList>
        </Tabs>
        <ChartDownloadButton
          chartId={chartId}
          fileName={`permissions-${activeView === "byRole" ? "by-role" : "by-feature"}`}
          size="icon"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div id={chartId} className="h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData} layout="vertical" margin={{ top: 20, right: 30, left: 150, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [`${value} permissions`, name]}
                  labelFormatter={(label) => `${activeView === "byRole" ? "Role" : "Feature"}: ${label}`}
                />
                <Legend />
                {getAllPermissionGroups().map((group) => (
                  <Bar
                    key={group}
                    dataKey={group}
                    stackId="a"
                    fill={GROUP_COLORS[group as keyof typeof GROUP_COLORS] || "#777777"}
                    name={`${group} Permissions`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
