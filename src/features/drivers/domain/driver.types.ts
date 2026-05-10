export type DriverResponse = {
  id: string;
  organizationId: string;
  appUserId?: string | null;
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive: boolean;
};

export type AddDriverBody = {
  organizationId: string;
  appUserId?: string | null;
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive?: boolean;
};

export type UpdateDriverBody = {
  appUserId?: string | null;
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive: boolean;
};
