/** API-aligned (camelCase). */

export type ManagerResponseDto = {
  id: string;
  organizationId: string;
  distributionCenterId: string;
  distributionCenterName: string;
  appUserId: string;
  userName: string;
  email?: string | null;
  displayName?: string | null;
};

export type AddManagerBody = {
  organizationId: string;
  distributionCenterId: string;
  userName: string;
  /** Optional; when set must be globally unique. */
  email?: string | null;
  password: string;
  passwordConfirm: string;
  displayName?: string | null;
  phone?: string | null;
};
