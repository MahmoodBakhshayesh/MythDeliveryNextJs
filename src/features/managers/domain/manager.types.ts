/** API-aligned (camelCase). */

export type ManagerResponseDto = {
  id: string;
  organizationId: string;
  distributionCenterId: string;
  distributionCenterName: string;
  appUserId: string;
  email: string;
  displayName?: string | null;
};

export type AddManagerBody = {
  organizationId: string;
  distributionCenterId: string;
  email: string;
  userName?: string | null;
  password: string;
  passwordConfirm: string;
  displayName?: string | null;
  phone?: string | null;
};
