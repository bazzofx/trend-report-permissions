// Map permissions to their logical groups
export const permissionGroups = {
  View: [
    "view",
    "viewNsr",
    "trsview",
    "phsview",
    "viewModels",
    "viewExceptions",
    "viewCustomModels",
    "viewProgressiveRCA",
    "viewAndExport",
    "viewMXDRSettings",
    "viewRequestList",
    "viewReportList",
    "viewReports",
    "viewPage",
    "viewCustomScript",
    "viewConnectors",
    "viewSGInventory",
    "viewSGDetail",
    "viewZTSA",
    "viewZTSARule",
    "viewIAM",
    "viewSWGCfg",
    "viewZTNACfg",
    "viewAgent",
    "viewandexecute",
    "view_data_lineage",
    "linkToDDIView",
    "view-sms-devices",
    "view-sms",
    "view-vulnerability-overview",
    "view-recommended-filters",
    "view-distribution-tasks",
    "view-distribution-tasks-status",
    "view-action-sets",
    "view-profiles",
    "view-filter-configuration-tasks-status",
    "view-vns-status",
    "view-task-status",
    "viewInventory",
    "viewDetectionLog",
    "viewPolicy",
    "viewRiskyApp",
    "viewAccountsAndApiKey",
    "viewRoles",
    "viewAlertNotifications",
    "viewFilterSearch",
    "viewConsoleSettings",
    "viewLicense",
    "viewHypersensitiveMode",
    "viewRemoteSupportSetting",
    "viewCompanyProfile",
    "viewDefaultDR",
    "viewDefaultDVASS",
    "viewSensorSettings",
    "viewProxy",
    "viewPatternSettings",
    "viewSensorPolicies",
    "viewUpdatePolicies",
    "checkVASO",
  ],
  Edit: [
    "edit",
    "setting",
    "modifyExceptions",
    "updateAutomatedResponseSettings",
    "updateCaseStatus",
    "saveProgressiveExecutionProfile",
    "updateRequestStatus",
    "updateMXDRSettings",
    "updateConnectors",
    "configSG",
    "modifyActivation",
    "action",
    "settings",
    "config",
    "configure",
    "modify-distribution-policy-search",
    "modify-approval-request",
    "modify-get-started",
    "modify-distribution-policy",
    "modify-filter-configuration",
    "modify-vns-install",
    "modify-vns-uninstall",
    "modify-simulations",
    "updateSSOSettings",
    "updateAccountSettings",
    "updateHypersensitiveMode",
    "updateRemoteSupportSetting",
    "updateCloudAccountSettings",
    "configNsr",
  ],
  Export: [
    "export",
    "exportResults",
    "exportSearchCreteria",
    "downloadReport",
    "downloadResults",
    "downloadReports",
    "downloadCustomScript",
    "download",
    "exportAndDownload",
    "exportEndpoints",
    "export_data_lineage",
    "downloadMetadata",
  ],
  Manage: [
    "manage",
    "manageADAccount",
    "manageIAM",
    "manageAgent",
    "manageUserAndGroup",
    "managePolicy",
    "manageRiskyApp",
    "manageManagedAppsAndSettings",
    "deleteSG",
    "installSG",
    "connectDisconnectSensor",
    "connectDisconnectProducts",
    "performDeviceRemoteActions",
    "installAgent",
    "removeAgents",
    "grantPermissions",
    "enableDisableAccount",
    "enableDisable2FA",
    "assignLicense",
    "uploadMetadata",
    "uploadReport",
    "uploadIntelligenceReport",
    "createApprovalRequest",
  ],
  FullAccess: [
    "fullAccess",
    "fullTriage",
    "execute",
    "startRemoteShell",
    "remoteShell",
    "collectFile",
    "deleteMessage",
    "isolateEndpoint",
    "quarantineRestoreMessage",
    "terminateProcess",
    "addToBlockList",
    "runScript",
    "submitToSandbox",
    "collectNetworkFile",
    "runTMIK",
    "revokeAccess",
    "isolateContainer",
    "terminateContainer",
    "malwareScan",
    "approveActions",
    "addToRestrictedGroup",
    "runOsquery",
    "runYaraRules",
    "submitObject",
    "thirdPartySweeping",
    "activate",
    "scan",
    "autoRegisterCluster",
    "overrideSensorPolicies",
    "pauseAndResumeUpdates",
    "permissionForInsurance",
    "addExceptionList",
  ],
}

// Function to determine the group for a permission
export function getPermissionGroup(permission: string | undefined | null): string {
  // Handle undefined or null permissions
  if (permission === undefined || permission === null) {
    return "Other"
  }

  // First check for exact matches
  for (const [group, permissions] of Object.entries(permissionGroups)) {
    if (permissions.includes(permission)) {
      return group
    }
  }

  // Then check for partial matches based on keywords
  try {
    const lowerPermission = permission.toLowerCase()

    if (lowerPermission.includes("view")) return "View"
    if (lowerPermission.includes("edit") || lowerPermission.includes("modify")) return "Edit"
    if (lowerPermission.includes("download") || lowerPermission.includes("export")) return "Export"
    if (lowerPermission.includes("manage")) return "Manage"
  } catch (error) {
    console.error("Error processing permission:", permission, error)
    return "Other"
  }

  // Default to Other if no match found
  return "Other"
}

// Function to get all unique permission groups
export function getAllPermissionGroups(): string[] {
  return [...Object.keys(permissionGroups), "Other"]
}

// Function to check if a permission value indicates it's enabled
export function isPermissionEnabled(value: string | undefined | null): boolean {
  if (value === undefined || value === null) {
    return false
  }
  return value === "1" || value.toLowerCase() === "true"
}
