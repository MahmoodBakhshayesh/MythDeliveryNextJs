/**
 * Mirrors MythDeliveryWebApi role gates (JWT + persisted roles).
 * Admin cannot use driver self-service; Supervisor + driver-only can.
 */

export function normalizedRoleSet(roles: readonly string[]): Set<string> {
  return new Set(roles.map((r) => String(r).trim().toLowerCase()).filter(Boolean));
}

export function isDriverOnlyAccount(roles: readonly string[]): boolean {
  const s = normalizedRoleSet(roles);
  if (s.has("admin") || s.has("supervisor") || s.has("user") || s.has("manager"))
    return false;
  return s.has("driver");
}

/**
 * Shell layout tier: admin, org staff (supervisor / user), or DC-only manager (API scopes lists; nav hides manager provisioning).
 */
export type FleetShellTier = "admin" | "supervisor" | "manager";

export function getFleetShellTier(roles: readonly string[]): FleetShellTier | null {
  const s = normalizedRoleSet(roles);
  if (s.has("admin")) return "admin";
  if (s.has("supervisor") || s.has("user")) return "supervisor";
  if (s.has("manager")) return "manager";
  return null;
}

/** True when the account is a distribution-center manager without broader org-staff roles. */
export function isManagerOnlyFleetAccount(roles: readonly string[]): boolean {
  return getFleetShellTier(roles) === "manager";
}

/** Supervisors (and admins) can create manager accounts; generic org `User` staff cannot. */
export function canProvisionManagers(roles: readonly string[]): boolean {
  const s = normalizedRoleSet(roles);
  if (s.has("admin")) return true;
  return s.has("supervisor");
}

/** Fleet management UI (organizations, drivers CRUD, plans, …). */
export function canFleetOperations(roles: readonly string[]): boolean {
  const s = normalizedRoleSet(roles);
  if (s.has("admin")) return true;
  if (isDriverOnlyAccount(roles)) return false;
  return s.has("supervisor") || s.has("user") || s.has("manager");
}

/** Driver portal APIs (/api/driver-portal/*). */
export function canDriverSelfService(roles: readonly string[]): boolean {
  const s = normalizedRoleSet(roles);
  if (s.has("admin")) return false;
  if (s.has("supervisor")) return true;
  return isDriverOnlyAccount(roles);
}

/**
 * `/driver` self-service only — excludes `/drivers` (fleet CRUD), since
 * `"/drivers".startsWith("/driver")` is otherwise true.
 */
export function isDriverPortalPath(pathname: string): boolean {
  const p = pathname.split("?")[0] ?? "";
  return p === "/driver" || p.startsWith("/driver/");
}

/** Where to send the user immediately after login. */
export function getPostLoginRoute(roles: readonly string[]): string {
  if (isManagerOnlyFleetAccount(roles)) return "/dashboard";
  if (canFleetOperations(roles)) return "/dashboard";
  if (canDriverSelfService(roles)) return "/driver";
  return "/dashboard";
}
