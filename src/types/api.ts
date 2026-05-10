export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type UserLoginResponse = {
  username: string;
  email?: string | null;
  phoneNumber?: string | null;
  roles: string[];
  token: TokenResponse;
};

export type OrganizationResponse = {
  id: string;
  name: string;
};

/** Admin user directory row from GET /api/users */
export type UserDirectoryEntry = {
  id: string;
  userName: string;
  email?: string | null;
  emailConfirmed: boolean;
  phoneNumber?: string | null;
  displayName?: string | null;
  roles: string[];
  isLockedOut: boolean;
};

export type RoleOption = {
  id: string;
  name: string;
};

export type UserProfileResponse = {
  id: string;
  userName: string;
  email?: string | null;
  emailConfirmed: boolean;
  phoneNumber?: string | null;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  roles: string[];
};
