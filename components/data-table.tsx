"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Search } from "lucide-react"
import { getPermissionGroup, isPermissionEnabled } from "@/utils/permission-groups"
import { useDebounce } from "@/hooks/use-debounce"

interface DataTableProps {
  data: any[]
  headers: string[]
}

// Color mapping for permission groups
const GROUP_COLORS = {
  View: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Edit: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Export: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Manage: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  FullAccess: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Other: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
}

export function DataTable({ data, headers }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const filteredData = data.filter((row) => {
    if (!debouncedSearchTerm.trim()) return true // Show all data when search is empty

    // Search across all columns
    return headers.some((header) => {
      const value = row[header]

      // Handle different data types
      if (value === null || value === undefined) return false

      // Convert to string and do case-insensitive comparison
      const stringValue = String(value).toLowerCase()
      const search = debouncedSearchTerm.toLowerCase()

      // Check if the value contains the search term
      return stringValue.includes(search)
    })
  })

  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  }, [filteredData, currentPage, rowsPerPage])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)

  const handleDownloadCSV = () => {
    const csvContent = [
      headers.join(","),
      ...filteredData.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Handle values that might contain commas
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`
            }
            return value || ""
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "filtered_data.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to render permission group badge
  const renderPermissionCell = (row: any) => {
    if (!row || !row.Permission) return "N/A"

    const permissionGroup = getPermissionGroup(row.Permission)

    return (
      <div className="flex items-center gap-2">
        <span>{row.Permission}</span>
        <Badge
          variant="outline"
          className={GROUP_COLORS[permissionGroup as keyof typeof GROUP_COLORS] || GROUP_COLORS.Other}
        >
          {permissionGroup}
        </Badge>
      </div>
    )
  }

  // Function to render value cell with enabled/disabled status
  const renderValueCell = (value: string) => {
    if (value === undefined || value === null) return "N/A"

    const enabled = isPermissionEnabled(value)
    return <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Enabled" : "Disabled"}</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset to first page when searching
            }}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={handleDownloadCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header) => (
                    <TableCell key={`${rowIndex}-${header}`}>
                      {header === "Permission"
                        ? renderPermissionCell(row)
                        : header === "Value"
                          ? renderValueCell(row[header])
                          : row[header] || ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)}{" "}
            of {filteredData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
