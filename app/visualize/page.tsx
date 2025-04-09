"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Download, PieChart, Table2, Users, Layers, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { RolePermissionVisualizer } from "@/components/role-permission-visualizer"
import { FeaturePermissionVisualizer } from "@/components/feature-permission-visualizer"
import { PermissionGroupSummary } from "@/components/permission-group-summary"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getPermissionGroup, isPermissionEnabled } from "@/utils/permission-groups"
import { downloadChartAsImage } from "@/utils/chart-utils"

type CSVMeta = {
  filename: string
  rowCount: number
  columnCount: number
  headers: string[]
}

export default function VisualizePage() {
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvMeta, setCsvMeta] = useState<CSVMeta | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [uniqueRoles, setUniqueRoles] = useState<string[]>([])
  const [uniqueFeatures, setUniqueFeatures] = useState<string[]>([])
  const [selectedPermissionGroup, setSelectedPermissionGroup] = useState<{ group: string; role: string } | null>(null)
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Load initial data
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem("csvData")
      const storedMeta = sessionStorage.getItem("csvMeta")

      if (!storedData || !storedMeta) {
        router.push("/")
        return
      }

      const parsedData = JSON.parse(storedData)
      const parsedMeta = JSON.parse(storedMeta)

      setCsvData(parsedData)
      setCsvMeta(parsedMeta)

      // Extract unique roles and features
      const roles = Array.from(new Set(parsedData.map((item: any) => item.RoleName)))
      const features = Array.from(new Set(parsedData.map((item: any) => item.Feature)))

      setUniqueRoles(roles as string[])
      setUniqueFeatures(features as string[])

      // Initialize filtered data
      setFilteredData(parsedData)
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Could not load the CSV data. Please try uploading again.",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [router, toast])

  // Memoize the filtered data calculation
  const memoizedFilteredData = useMemo(() => {
    if (csvData.length === 0) return []
    return selectedRole === "all" ? csvData : csvData.filter((item) => item.RoleName === selectedRole)
  }, [selectedRole, csvData])

  // Update filtered data with animation effect
  useEffect(() => {
    if (csvData.length === 0) return

    setIsRefreshing(true)

    // Small timeout to show the refresh animation
    const timer = setTimeout(() => {
      setFilteredData(memoizedFilteredData)
      setIsRefreshing(false)

      // Reset selected permission group when role changes
      setSelectedPermissionGroup(null)
    }, 300)

    return () => clearTimeout(timer)
  }, [memoizedFilteredData, csvData.length])

  const handleRoleChange = useCallback((role: string) => {
    setSelectedRole(role)
  }, [])

  const handleDownloadChart = async () => {
    setIsDownloading(true)
    try {
      const chartElement = document.getElementById("chart-container")
      if (chartElement) {
        await downloadChartAsImage("chart-container", `${csvMeta?.filename.replace(".csv", "") || "permissions"}-chart`)
      } else {
        toast({
          title: "Chart not found",
          description: "The chart element could not be found for download.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error downloading chart:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading the chart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRefreshData = useCallback(() => {
    setIsRefreshing(true)

    setTimeout(() => {
      const newFilteredData =
        selectedRole === "all" ? csvData : csvData.filter((item) => item.RoleName === selectedRole)

      setFilteredData(newFilteredData)
      setIsRefreshing(false)

      toast({
        title: "Data refreshed",
        description: `Showing data for ${selectedRole === "all" ? "all roles" : `role: ${selectedRole}`}`,
      })
    }, 500)
  }, [selectedRole, csvData, toast])

  if (!csvMeta) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-red-500">{csvMeta.filename}</h1>
        </div>
        <Button variant="outline" onClick={handleDownloadChart} disabled={isDownloading}>
          <Download className={`mr-2 h-4 w-4 ${isDownloading ? "animate-pulse" : ""}`} />
          {isDownloading ? "Downloading..." : "Download Chart"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniqueRoles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniqueFeatures.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Array.from(new Set(csvData.map((item) => item.Permission))).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{csvMeta.rowCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter by Role</CardTitle>
            <CardDescription>Select a role to filter the visualizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="flex-shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="sr-only">Refresh data</span>
              </Button>
            </div>

            {selectedRole !== "all" && (
              <div className="mt-4 p-2 bg-red-500/10 rounded-md border border-red-500/20">
                <p className="text-sm text-red-400">
                  Currently showing data for:{" "}
                  <Badge variant="outline" className="ml-1 font-mono">
                    {selectedRole}
                  </Badge>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="role-permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="role-permissions">
            <Users className="h-4 w-4 mr-2" />
            Role Permissions
          </TabsTrigger>
          <TabsTrigger value="feature-permissions">
            <Layers className="h-4 w-4 mr-2" />
            Feature Permissions
          </TabsTrigger>
          <TabsTrigger value="permission-summary">
            <PieChart className="h-4 w-4 mr-2" />
            Permission Groups
          </TabsTrigger>
          <TabsTrigger value="data-table">
            <Table2 className="h-4 w-4 mr-2" />
            Data Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="role-permissions">
          <Card>
            <CardHeader>
              <CardTitle>Role Permission Analysis</CardTitle>
              <CardDescription>Visualize permissions by role and permission group</CardDescription>
            </CardHeader>
            <CardContent id="chart-container" className="min-h-[500px]">
              {isRefreshing ? (
                <div className="flex items-center justify-center h-[500px]">
                  <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                </div>
              ) : (
                <RolePermissionVisualizer data={filteredData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feature-permissions">
          <Card>
            <CardHeader>
              <CardTitle>Feature Permission Analysis</CardTitle>
              <CardDescription>Visualize permissions by feature and permission group</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[500px]">
              <div className="space-y-6">
                {isRefreshing ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                  </div>
                ) : (
                  <>
                    <FeaturePermissionVisualizer
                      data={filteredData}
                      onGroupClick={(group, role) => {
                        setSelectedPermissionGroup({ group, role })
                      }}
                    />

                    {selectedPermissionGroup && (
                      <Card className="border-dashed">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">
                            {selectedPermissionGroup.group} Permissions for {selectedPermissionGroup.role}
                          </CardTitle>
                          <CardDescription>
                            All permissions in the {selectedPermissionGroup.group} group for this role
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2">
                            {filteredData
                              .filter(
                                (item) =>
                                  item.RoleName === selectedPermissionGroup.role &&
                                  getPermissionGroup(item.Permission) === selectedPermissionGroup.group &&
                                  isPermissionEnabled(item.Value),
                              )
                              .map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{item.Feature}</Badge>
                                    <span className="font-medium">{item.Permission}</span>
                                  </div>
                                  <Badge>{isPermissionEnabled(item.Value) ? "Enabled" : "Disabled"}</Badge>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permission-summary">
          <Card>
            <CardHeader>
              <CardTitle>Permission Group Summary</CardTitle>
              <CardDescription>Summary of permission groups across roles and features</CardDescription>
            </CardHeader>
            <CardContent>
              {isRefreshing ? (
                <div className="flex items-center justify-center h-[500px]">
                  <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                </div>
              ) : (
                <PermissionGroupSummary data={filteredData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-table">
          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
              <CardDescription>View and filter your CSV data</CardDescription>
            </CardHeader>
            <CardContent>
              {isRefreshing ? (
                <div className="flex items-center justify-center h-[500px]">
                  <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                </div>
              ) : (
                <DataTable data={filteredData} headers={csvMeta.headers} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
