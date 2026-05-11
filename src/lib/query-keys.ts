export const queryKeys = {
  organizations: ["organizations"] as const,
  organization: (id: string) => ["organizations", id] as const,
  profile: ["users", "me"] as const,
  vehicles: (orgId: string) => ["vehicles", orgId] as const,
  storages: (orgId: string) => ["storages", orgId] as const,
  drivers: (orgId: string) => ["drivers", orgId] as const,
  driverVehicleAssignments: (orgId: string) =>
    ["driver-vehicle-assignments", orgId] as const,
  packages: (orgId?: string) => ["packages", orgId ?? "all"] as const,
  planningWindows: (orgId: string) => ["planning-windows", orgId] as const,
  planningWindow: (id: string) => ["planning-window", id] as const,
  workPlans: (orgId: string) => ["work-plans", orgId] as const,
  deliveryStops: (orgId: string, pw?: string) =>
    ["delivery-stops", orgId, pw ?? "all"] as const,
  routes: (pwId: string) => ["routes", pwId] as const,
  users: ["users"] as const,
  roles: ["roles"] as const,
  driverPortalProfile: ["driver-portal", "profile"] as const,
  driverPortalFleetAssignments: ["driver-portal", "fleet-assignments"] as const,
  driverPortalPersonalVehicles: ["driver-portal", "personal-vehicles"] as const,
  driverPortalPlanningWindows: ["driver-portal", "planning-windows"] as const,
  driverPortalRoutes: (planningWindowId: string) =>
    ["driver-portal", "routes", planningWindowId] as const,
  driverPortalHandledPackages: (planningWindowId: string) =>
    ["driver-portal", "handled-packages", planningWindowId] as const,
};
