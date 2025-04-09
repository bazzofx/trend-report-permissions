"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { getPermissionGroup, getAllPermissionGroups, isPermissionEnabled } from "@/utils/permission-groups"
import { ChartDownloadButton } from "@/components/chart-download-button"
import { generateChartId } from "@/utils/chart-utils"
import React from "react"

interface PermissionGroupSummaryProps {
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

export const PermissionGroupSummary = React.memo(function PermissionGroupSummary({
  data,
}: PermissionGroupSummaryProps) {
  // Generate unique IDs for each chart
  const [chartIds, setChartIds] = useState({
    pieChart: "",
    barChart: "",
    topPermissions: "",
    roleFeatureMapping: "",
  })

  // Generate chart IDs on component mount
  useEffect(() => {
    setChartIds({
      pieChart: generateChartId("pie-chart"),
      barChart: generateChartId("bar-chart"),
      topPermissions: generateChartId("top-permissions"),
      roleFeatureMapping: generateChartId("role-feature-mapping"),
    })
  }, [])

  const permissionGroups = useMemo(() => {
    const initialGroups = []

    if (data && data.length > 0) {
      // Count permissions by group
      const groupCounts = new Map<string, number>()

      // Initialize all permission groups with 0
      getAllPermissionGroups().forEach((group) => groupCounts.set(group, 0))

      // Count enabled permissions by group
      data.forEach((item) => {
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
      initialGroups.push(
        ...Array.from(groupCounts.entries())
          .filter(([_, count]) => count > 0) // Only include groups with permissions
          .map(([group, count]) => ({
            name: group,
            value: count,
          })),
      )
    }
    return initialGroups
  }, [data])

  const permissionDistribution = useMemo(() => {
    const initialDistribution = []

    if (data && data.length > 0) {
      // Count total permissions and enabled permissions
      const permissionCounts = new Map<string, { total: number; enabled: number }>()

      data.forEach((item) => {
        // Skip items with missing required properties
        if (!item || !item.Permission) return

        const permission = item.Permission
        const isEnabled = isPermissionEnabled(item.Value)

        if (!permissionCounts.has(permission)) {
          permissionCounts.set(permission, { total: 0, enabled: 0 })
        }

        const current = permissionCounts.get(permission)!
        current.total += 1
        if (isEnabled) {
          current.enabled += 1
        }
      })

      // Convert to array and sort by enabled count
      initialDistribution.push(
        ...Array.from(permissionCounts.entries())
          .map(([permission, counts]) => ({
            name: permission,
            group: getPermissionGroup(permission),
            enabled: counts.enabled,
            disabled: counts.total - counts.enabled,
          }))
          .sort((a, b) => b.enabled - a.enabled)
          .slice(0, 15), // Top 15 most enabled permissions
      )
    }
    return initialDistribution
  }, [data])

  const roleFeatureMappingData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group by role and feature
    const roleFeatureMap = new Map<string, Map<string, Map<string, number>>>()

    data.forEach((item) => {
      if (!item || !item.RoleName || !item.Feature || !item.Permission) return

      const roleName = item.RoleName
      const feature = item.Feature
      const permissionGroup = getPermissionGroup(item.Permission)
      const isEnabled = isPermissionEnabled(item.Value)

      if (!roleFeatureMap.has(roleName)) {
        roleFeatureMap.set(roleName, new Map())
      }

      const featureMap = roleFeatureMap.get(roleName)!
      if (!featureMap.has(feature)) {
        featureMap.set(feature, new Map())
        getAllPermissionGroups().forEach((group) => {
          featureMap.get(feature)!.set(group, 0)
        })
      }

      if (isEnabled) {
        const currentCount = featureMap.get(feature)!.get(permissionGroup) || 0
        featureMap.get(feature)!.set(permissionGroup, currentCount + 1)
      }
    })

    // Convert to array format for Recharts
    // Take top 15 role-feature combinations with most permissions
    const result: any[] = []

    roleFeatureMap.forEach((featureMap, roleName) => {
      featureMap.forEach((permissionCounts, feature) => {
        const totalPermissions = Array.from(permissionCounts.values()).reduce((sum, count) => sum + count, 0)
        if (totalPermissions > 0) {
          const entry: any = {
            name: `${roleName} - ${feature}`,
            role: roleName,
            feature: feature,
          }

          permissionCounts.forEach((count, group) => {
            entry[group] = count
          })

          result.push(entry)
        }
      })
    })

    return result
      .sort((a, b) => {
        // First sort by role
        if (a.role !== b.role) return a.role.localeCompare(b.role)
        // Then by total permissions (descending)
        const aTotal = getAllPermissionGroups().reduce((sum, group) => sum + (a[group] || 0), 0)
        const bTotal = getAllPermissionGroups().reduce((sum, group) => sum + (b[group] || 0), 0)
        return bTotal - aTotal
      })
      .slice(0, 20) // Limit to top 20 for readability
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No data available for visualization.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Group Overview</TabsTrigger>
          <TabsTrigger value="topPermissions">Top Permissions</TabsTrigger>
          <TabsTrigger value="roleFeatureMapping">Role-Feature Access</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Permission Group Distribution</CardTitle>
                <ChartDownloadButton chartId={chartIds.pieChart} fileName="permission-group-distribution" size="icon" />
              </CardHeader>
              <CardContent>
                <div id={chartIds.pieChart} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={permissionGroups}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {permissionGroups.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={GROUP_COLORS[entry.name as keyof typeof GROUP_COLORS] || "#777777"}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} permissions`, "Count"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Permission Group Counts</CardTitle>
                <ChartDownloadButton chartId={chartIds.barChart} fileName="permission-group-counts" size="icon" />
              </CardHeader>
              <CardContent>
                <div id={chartIds.barChart} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={permissionGroups}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip formatter={(value) => [`${value} permissions`, "Count"]} />
                      <Bar dataKey="value" name="Permission Count">
                        {permissionGroups.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={GROUP_COLORS[entry.name as keyof typeof GROUP_COLORS] || "#777777"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topPermissions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Top 15 Most Used Permissions</CardTitle>
              <ChartDownloadButton chartId={chartIds.topPermissions} fileName="top-permissions" size="icon" />
            </CardHeader>
            <CardContent>
              <div id={chartIds.topPermissions} className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={permissionDistribution}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="enabled" stackId="a" name="Enabled" fill="#4ade80" />
                    <Bar dataKey="disabled" stackId="a" name="Disabled" fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="roleFeatureMapping">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Role-Feature Permission Mapping</CardTitle>
                <CardDescription>Visualize which features provide permissions to each role</CardDescription>
              </div>
              <ChartDownloadButton chartId={chartIds.roleFeatureMapping} fileName="role-feature-mapping" size="icon" />
            </CardHeader>
            <CardContent>
              <div id={chartIds.roleFeatureMapping} className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={roleFeatureMappingData}
                    layout="vertical"
                    margin={{ top: 20, right: 0, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={550} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [`${value} permissions`, name]}
                      labelFormatter={(label) => `${label}`}
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
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  This chart shows the top 20 role-feature combinations with the most permissions, grouped by permission
                  type.
                </p>
                <p className="mt-1">
                  Use this visualization to understand which features provide what types of access to each role.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Permission Group Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(GROUP_COLORS).map(([group, color]) => (
              <div key={group} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="font-medium">{group}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Permissions are grouped based on their names and functionality:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <span className="font-medium">View:</span> Permissions related to viewing or reading data
              </li>
              <li>
                <span className="font-medium">Edit:</span> Permissions related to editing, modifying, or configuring
              </li>
              <li>
                <span className="font-medium">Export:</span> Permissions related to exporting or downloading data
              </li>
              <li>
                <span className="font-medium">Manage:</span> Permissions related to managing resources or users
              </li>
              <li>
                <span className="font-medium">Full Access:</span> Permissions granting extensive control or critical
                operations
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
