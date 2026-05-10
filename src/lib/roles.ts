/**
 * Mirrors MythDeliveryWebApi role gates (JWT + persisted roles).
 * Admin cannot use driver self-service; Supervisor + driver-only can.
 */

export function normalizedRoleSet(roles: readonly string[]): Set<string> {
  return new Set(roles.map((r) => String(r).trim().toLowerCase()).filter(Boolean));
}

export function isDriverOnlyAccount(roles: readonly string[]): boolean {
  const s = normalizedRoleSet(roles);
  if (s.has("admin") || s.has("supervisor") || s.has("user")) return false;
  return s.has("driver");
}

/** Fleet management UI (organizations, drivers CRUD, plans, …). */
export function canFleetOperations(roles: readonly string[]): boolean {
  const s = normalizedRoleSet(roles);
  if (s.has("admin")) return true;
  if (isDriverOnlyAccount(roles)) return false;
  return s.has("supervisor") || s.has("user");
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
  if (canFleetOperations(roles)) return "/dashboard";
  if (canDriverSelfService(roles)) return "/driver";
  return "/dashboard";
}
